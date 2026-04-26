import crypto from "node:crypto";
import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { WebSocket, WebSocketServer } from "ws";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WEB_ROOT = path.resolve(__dirname, "../../web/public");

const PORT = Number(process.env.PORT || 8080);
const SESSION_TTL_MS = Number(process.env.SESSION_TTL_MS || 10 * 60 * 1000);
const CLEANUP_INTERVAL_MS = Number(process.env.CLEANUP_INTERVAL_MS || 15 * 1000);
const MAX_JOIN_ATTEMPTS_PER_MINUTE = Number(process.env.MAX_JOIN_ATTEMPTS_PER_MINUTE || 30);
const RECONNECT_GRACE_MS = Number(process.env.RECONNECT_GRACE_MS || 30 * 1000);
const MAX_SIGNAL_MESSAGE_BYTES = Number(process.env.MAX_SIGNAL_MESSAGE_BYTES || 65_536);
const MAX_PASSPHRASE_LENGTH = Number(process.env.MAX_PASSPHRASE_LENGTH || 128);
const MAX_JOIN_AUTH_USERNAME_LENGTH = Number(process.env.MAX_JOIN_AUTH_USERNAME_LENGTH || 64);
const MAX_JOIN_AUTH_PASSWORD_LENGTH = Number(process.env.MAX_JOIN_AUTH_PASSWORD_LENGTH || 128);
const WS_HEARTBEAT_INTERVAL_MS = Number(process.env.WS_HEARTBEAT_INTERVAL_MS || 30 * 1000);
const ICE_SERVERS_JSON = process.env.ICE_SERVERS_JSON || "";
const TURN_URLS = process.env.TURN_URLS || "";
const TURN_USERNAME = process.env.TURN_USERNAME || "";
const TURN_CREDENTIAL = process.env.TURN_CREDENTIAL || "";

const sessions = new Map();
const clients = new Map();
const joinAttempts = new Map();

const CONTENT_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon"
};

function now() {
  return Date.now();
}

const metrics = {
  startedAt: now(),
  wsConnections: 0,
  wsMessages: 0,
  sessionsCreated: 0,
  sessionsJoined: 0,
  sessionReconnects: 0,
  sessionsClosed: 0,
  sessionsExpired: 0,
  passphraseProtectedSessions: 0,
  joinAuthProtectedSessions: 0,
  signalRelays: 0,
  turnRelayCandidates: 0,
  errors: {}
};

function markError(code) {
  metrics.errors[code] = (metrics.errors[code] || 0) + 1;
}

function parseConfiguredIceServers() {
  if (ICE_SERVERS_JSON.trim()) {
    try {
      const parsed = JSON.parse(ICE_SERVERS_JSON);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch {
      // fall through to assembled config
    }
  }

  const servers = [{ urls: "stun:stun.l.google.com:19302" }];
  const turnUrls = TURN_URLS.split(",").map((item) => item.trim()).filter(Boolean);
  if (turnUrls.length > 0) {
    servers.push({
      urls: turnUrls.length === 1 ? turnUrls[0] : turnUrls,
      username: TURN_USERNAME || undefined,
      credential: TURN_CREDENTIAL || undefined
    });
  }

  return servers;
}

const configuredIceServers = parseConfiguredIceServers();

function randomToken() {
  return crypto.randomBytes(18).toString("base64url");
}

function normalizePassphrase(raw) {
  if (raw === undefined || raw === null) {
    return "";
  }

  const passphrase = String(raw);
  if (passphrase.length > MAX_PASSPHRASE_LENGTH) {
    throw new Error("passphrase_too_long");
  }

  return passphrase;
}

function hashPassphraseAsync(passphrase, salt) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(passphrase, salt, 64, (error, key) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(key.toString("base64url"));
    });
  });
}

async function createPassphraseRecordAsync(passphrase) {
  if (!passphrase) {
    return {
      passphraseSalt: null,
      passphraseHash: null
    };
  }

  const passphraseSalt = crypto.randomBytes(16).toString("base64url");
  const passphraseHash = await hashPassphraseAsync(passphrase, passphraseSalt);
  return {
    passphraseSalt,
    passphraseHash
  };
}

function normalizeJoinAuth(rawJoinAuth) {
  if (rawJoinAuth === undefined || rawJoinAuth === null) {
    return {
      username: "",
      password: ""
    };
  }

  const username = String(rawJoinAuth.username || "").trim();
  const password = String(rawJoinAuth.password || "");

  if (username.length > MAX_JOIN_AUTH_USERNAME_LENGTH || password.length > MAX_JOIN_AUTH_PASSWORD_LENGTH) {
    throw new Error("join_auth_too_long");
  }

  if ((username && !password) || (!username && password)) {
    throw new Error("join_auth_incomplete");
  }

  return {
    username,
    password
  };
}

async function createJoinAuthRecordAsync(joinAuth) {
  if (!joinAuth.username || !joinAuth.password) {
    return {
      joinAuthUsername: null,
      joinAuthPasswordSalt: null,
      joinAuthPasswordHash: null
    };
  }

  const joinAuthPasswordSalt = crypto.randomBytes(16).toString("base64url");
  const joinAuthPasswordHash = await hashPassphraseAsync(joinAuth.password, joinAuthPasswordSalt);
  return {
    joinAuthUsername: joinAuth.username,
    joinAuthPasswordSalt,
    joinAuthPasswordHash
  };
}

async function verifyJoinAuth(session, rawJoinAuth) {
  if (!session.joinAuthUsername || !session.joinAuthPasswordSalt || !session.joinAuthPasswordHash) {
    return true;
  }

  let joinAuth;
  try {
    joinAuth = normalizeJoinAuth(rawJoinAuth);
  } catch {
    return false;
  }

  if (!joinAuth.username || !joinAuth.password || joinAuth.username !== session.joinAuthUsername) {
    return false;
  }

  const providedHash = await hashPassphraseAsync(joinAuth.password, session.joinAuthPasswordSalt);
  const left = Buffer.from(providedHash);
  const right = Buffer.from(session.joinAuthPasswordHash);
  if (left.length !== right.length) {
    return false;
  }
  return crypto.timingSafeEqual(left, right);
}

async function verifyPassphrase(session, passphrase) {
  if (!session.passphraseHash || !session.passphraseSalt) {
    return true;
  }

  const providedHash = await hashPassphraseAsync(passphrase, session.passphraseSalt);
  const left = Buffer.from(providedHash);
  const right = Buffer.from(session.passphraseHash);
  if (left.length !== right.length) {
    return false;
  }
  return crypto.timingSafeEqual(left, right);
}

function sendJson(ws, payload) {
  if (ws.readyState !== WebSocket.OPEN) {
    return;
  }
  ws.send(JSON.stringify(payload));
}

function createClient(ws, req) {
  const id = crypto.randomUUID();
  const forwarded = req.headers["x-forwarded-for"];
  const ip = typeof forwarded === "string" ? forwarded.split(",")[0].trim() : req.socket.remoteAddress || "unknown";
  const client = {
    id,
    ip,
    ws,
    isAlive: true,
    messageQueue: Promise.resolve(),
    sessionCode: null,
    role: null,
    token: null
  };
  clients.set(id, client);
  return client;
}

function fail(client, code, message) {
  markError(code);
  sendJson(client.ws, {
    type: "error",
    code,
    message
  });
}

function getRoleState(session, role) {
  return role === "sender" ? session.sender : session.receiver;
}

function getPeerRole(role) {
  return role === "sender" ? "receiver" : "sender";
}

function getPeerClient(session, role) {
  const peerState = getRoleState(session, getPeerRole(role));
  if (!peerState.clientId) {
    return null;
  }
  return clients.get(peerState.clientId) || null;
}

function generateRoomCode() {
  for (let i = 0; i < 30; i += 1) {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const existing = sessions.get(code);
    if (!existing || existing.expiresAt <= now()) {
      return code;
    }
  }
  throw new Error("room_code_generation_failed");
}

function enforceJoinRateLimit(client) {
  const current = now();
  const record = joinAttempts.get(client.ip);

  if (!record || current - record.windowStart >= 60_000) {
    joinAttempts.set(client.ip, {
      windowStart: current,
      count: 1
    });
    return true;
  }

  if (record.count >= MAX_JOIN_ATTEMPTS_PER_MINUTE) {
    return false;
  }

  record.count += 1;
  return true;
}

function bindClientToRole(client, session, role, token) {
  const roleState = getRoleState(session, role);
  roleState.clientId = client.id;
  roleState.disconnectedAt = null;

  client.sessionCode = session.code;
  client.role = role;
  client.token = token;
}

function detachClient(client) {
  client.sessionCode = null;
  client.role = null;
  client.token = null;
}

function closeSession(session, reason = "session_closed") {
  metrics.sessionsClosed += 1;
  ["sender", "receiver"].forEach((role) => {
    const participant = getRoleState(session, role);
    if (!participant.clientId) {
      return;
    }
    const client = clients.get(participant.clientId);
    if (!client) {
      return;
    }
    detachClient(client);
    sendJson(client.ws, {
      type: "session_closed",
      code: session.code,
      reason
    });
  });

  sessions.delete(session.code);
}

function handleDisconnect(client, reason = "peer_disconnected") {
  if (!client.sessionCode || !client.role) {
    detachClient(client);
    return;
  }

  const session = sessions.get(client.sessionCode);
  if (!session) {
    detachClient(client);
    return;
  }

  const roleState = getRoleState(session, client.role);
  if (roleState.clientId === client.id) {
    roleState.clientId = null;
    roleState.disconnectedAt = now();
  }

  const peer = getPeerClient(session, client.role);
  if (peer) {
    sendJson(peer.ws, {
      type: "peer_left",
      code: session.code,
      reason,
      role: client.role
    });
  }

  detachClient(client);
}

async function handleCreateSession(client, rawPassphrase, rawJoinAuth) {
  if (client.sessionCode) {
    fail(client, "already_in_session", "Leave current session before creating a new one.");
    return;
  }

  const code = generateRoomCode();
  const senderToken = randomToken();
  let passphrase = "";
  try {
    passphrase = normalizePassphrase(rawPassphrase);
  } catch {
    fail(client, "invalid_passphrase", `Passphrase exceeds ${MAX_PASSPHRASE_LENGTH} characters.`);
    return;
  }

  const passphraseRecord = await createPassphraseRecordAsync(passphrase);
  let joinAuth;
  try {
    joinAuth = normalizeJoinAuth(rawJoinAuth);
  } catch {
    fail(
      client,
      "invalid_join_auth",
      `Join auth must include username and password together. Limits: username ${MAX_JOIN_AUTH_USERNAME_LENGTH}, password ${MAX_JOIN_AUTH_PASSWORD_LENGTH}.`
    );
    return;
  }
  const joinAuthRecord = await createJoinAuthRecordAsync(joinAuth);
  const session = {
    code,
    createdAt: now(),
    expiresAt: now() + SESSION_TTL_MS,
    passphraseSalt: passphraseRecord.passphraseSalt,
    passphraseHash: passphraseRecord.passphraseHash,
    joinAuthUsername: joinAuthRecord.joinAuthUsername,
    joinAuthPasswordSalt: joinAuthRecord.joinAuthPasswordSalt,
    joinAuthPasswordHash: joinAuthRecord.joinAuthPasswordHash,
    sender: {
      token: senderToken,
      clientId: null,
      disconnectedAt: null
    },
    receiver: {
      token: null,
      clientId: null,
      disconnectedAt: null
    }
  };

  sessions.set(code, session);
  bindClientToRole(client, session, "sender", senderToken);
  metrics.sessionsCreated += 1;
  if (session.passphraseHash) {
    metrics.passphraseProtectedSessions += 1;
  }
  if (session.joinAuthPasswordHash) {
    metrics.joinAuthProtectedSessions += 1;
  }

  sendJson(client.ws, {
    type: "session_created",
    code,
    role: "sender",
    token: senderToken,
    requiresPassphrase: Boolean(session.passphraseHash),
    requiresJoinAuth: Boolean(session.joinAuthPasswordHash),
    peerConnected: false,
    expiresAt: session.expiresAt
  });
}

async function handleJoinSession(client, rawCode, rawPassphrase, rawJoinAuth) {
  if (!enforceJoinRateLimit(client)) {
    fail(client, "rate_limited", "Too many join attempts. Try again shortly.");
    return;
  }

  if (client.sessionCode) {
    fail(client, "already_in_session", "Leave current session before joining another one.");
    return;
  }

  const code = String(rawCode || "").trim();
  if (!/^\d{6}$/.test(code)) {
    fail(client, "invalid_room_code", "Room code must be a 6-digit number.");
    return;
  }

  const session = sessions.get(code);
  if (!session || session.expiresAt <= now()) {
    fail(client, "session_not_found", "Session was not found or has expired.");
    return;
  }

  let passphrase = "";
  try {
    passphrase = normalizePassphrase(rawPassphrase);
  } catch {
    fail(client, "invalid_passphrase", `Passphrase exceeds ${MAX_PASSPHRASE_LENGTH} characters.`);
    return;
  }

  let joinAuth;
  try {
    joinAuth = normalizeJoinAuth(rawJoinAuth);
  } catch {
    fail(
      client,
      "invalid_join_auth",
      `Join auth must include username and password together. Limits: username ${MAX_JOIN_AUTH_USERNAME_LENGTH}, password ${MAX_JOIN_AUTH_PASSWORD_LENGTH}.`
    );
    return;
  }

  if (!(await verifyPassphrase(session, passphrase))) {
    fail(client, "invalid_passphrase", "Room passphrase is incorrect.");
    return;
  }

  const joinAuthMissingForProtectedRoom = Boolean(
    session.joinAuthPasswordHash
    && (!joinAuth.username || !joinAuth.password)
  );
  if (joinAuthMissingForProtectedRoom) {
    fail(client, "join_auth_required", "Room username/password is required for this room.");
    return;
  }

  if (!(await verifyJoinAuth(session, joinAuth))) {
    fail(client, "invalid_join_auth", "Room username/password is incorrect.");
    return;
  }

  if (session.receiver.clientId || session.receiver.token) {
    fail(client, "session_full", "Session already has two participants.");
    return;
  }

  const receiverToken = randomToken();
  session.receiver.token = receiverToken;
  bindClientToRole(client, session, "receiver", receiverToken);
  metrics.sessionsJoined += 1;

  sendJson(client.ws, {
    type: "session_joined",
    code,
    role: "receiver",
    token: receiverToken,
    requiresPassphrase: Boolean(session.passphraseHash),
    requiresJoinAuth: Boolean(session.joinAuthPasswordHash),
    peerConnected: Boolean(session.sender.clientId),
    expiresAt: session.expiresAt
  });

  const sender = getPeerClient(session, "receiver");
  if (sender) {
    sendJson(sender.ws, {
      type: "peer_joined",
      code
    });
  }
}

function handleReconnectSession(client, message) {
  if (client.sessionCode) {
    fail(client, "already_in_session", "Leave current session before reconnecting.");
    return;
  }

  const code = String(message.code || "").trim();
  const token = String(message.token || "").trim();

  if (!/^\d{6}$/.test(code) || !token) {
    fail(client, "invalid_reconnect_payload", "Reconnect requires valid code and token.");
    return;
  }

  const session = sessions.get(code);
  if (!session || session.expiresAt <= now()) {
    fail(client, "session_not_found", "Session no longer exists.");
    return;
  }

  let role = null;
  if (session.sender.token === token) {
    role = "sender";
  }
  if (session.receiver.token === token) {
    role = "receiver";
  }

  if (!role) {
    fail(client, "invalid_reconnect_token", "Reconnect token is invalid.");
    return;
  }

  const roleState = getRoleState(session, role);
  if (roleState.clientId && roleState.clientId !== client.id) {
    fail(client, "role_already_connected", "This role is already connected.");
    return;
  }

  bindClientToRole(client, session, role, token);
  metrics.sessionReconnects += 1;

  sendJson(client.ws, {
    type: "session_reconnected",
    code,
    role,
    token,
    requiresPassphrase: Boolean(session.passphraseHash),
    requiresJoinAuth: Boolean(session.joinAuthPasswordHash),
    peerConnected: Boolean(getPeerClient(session, role)),
    expiresAt: session.expiresAt
  });

  const peer = getPeerClient(session, role);
  if (peer) {
    sendJson(peer.ws, {
      type: "peer_reconnected",
      code,
      role
    });
  }
}

function handleSignal(client, message) {
  if (!client.sessionCode || !client.role) {
    fail(client, "not_in_session", "Create or join a session first.");
    return;
  }

  if (!["offer", "answer", "ice-candidate"].includes(message.signalType)) {
    fail(client, "invalid_signal_type", "signalType must be offer, answer, or ice-candidate.");
    return;
  }

  const session = sessions.get(client.sessionCode);
  if (!session) {
    fail(client, "session_not_found", "Session no longer exists.");
    return;
  }

  const peer = getPeerClient(session, client.role);
  if (!peer) {
    fail(client, "peer_unavailable", "Peer is not connected yet.");
    return;
  }

  if (message.signalType === "ice-candidate") {
    const candidate = String(message.payload?.candidate || "");
    if (candidate.includes(" typ relay ")) {
      metrics.turnRelayCandidates += 1;
    }
  }

  metrics.signalRelays += 1;

  sendJson(peer.ws, {
    type: "signal",
    code: session.code,
    signalType: message.signalType,
    payload: message.payload,
    from: client.role
  });
}

function handleLeaveSession(client) {
  if (!client.sessionCode || !client.role) {
    fail(client, "not_in_session", "Not currently in a session.");
    return;
  }

  const session = sessions.get(client.sessionCode);
  if (!session) {
    detachClient(client);
    return;
  }

  closeSession(session, "client_left");
}

async function handleMessage(client, raw) {
  let message;
  try {
    message = JSON.parse(raw.toString());
  } catch {
    fail(client, "invalid_json", "Message must be valid JSON.");
    return;
  }

  switch (message.type) {
    case "create_session":
      await handleCreateSession(client, message.passphrase, message.joinAuth);
      break;
    case "join_session":
      await handleJoinSession(client, message.code, message.passphrase, message.joinAuth);
      break;
    case "reconnect_session":
      handleReconnectSession(client, message);
      break;
    case "signal":
      handleSignal(client, message);
      break;
    case "leave_session":
      handleLeaveSession(client);
      break;
    case "ping":
      sendJson(client.ws, {
        type: "pong",
        ts: now()
      });
      break;
    default:
      fail(client, "unknown_message_type", "Unsupported message type.");
  }
}

function runCleanup() {
  const current = now();

  sessions.forEach((session) => {
    if (session.expiresAt <= current) {
      ["sender", "receiver"].forEach((role) => {
        const roleState = getRoleState(session, role);
        if (!roleState.clientId) {
          return;
        }
        const client = clients.get(roleState.clientId);
        if (!client) {
          return;
        }
        detachClient(client);
        sendJson(client.ws, {
          type: "session_expired",
          code: session.code
        });
      });
      sessions.delete(session.code);
      metrics.sessionsExpired += 1;
      return;
    }

    const senderTimedOut = session.sender.disconnectedAt && current - session.sender.disconnectedAt > RECONNECT_GRACE_MS;
    const receiverTimedOut = session.receiver.disconnectedAt && current - session.receiver.disconnectedAt > RECONNECT_GRACE_MS;

    if (senderTimedOut || receiverTimedOut) {
      closeSession(session, "reconnect_timeout");
    }
  });

  joinAttempts.forEach((record, ip) => {
    if (current - record.windowStart >= 2 * 60_000) {
      joinAttempts.delete(ip);
    }
  });
}

async function serveStatic(req, res) {
  const parsed = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  let pathname = decodeURIComponent(parsed.pathname);
  if (pathname === "/") {
    pathname = "/index.html";
  }

  const requestedPath = path.resolve(WEB_ROOT, `.${pathname}`);
  if (!requestedPath.startsWith(WEB_ROOT)) {
    res.writeHead(403, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "forbidden" }));
    return;
  }

  try {
    const content = await fs.readFile(requestedPath);
    const ext = path.extname(requestedPath).toLowerCase();
    const contentType = CONTENT_TYPES[ext] || "application/octet-stream";
    res.writeHead(200, {
      "Content-Type": contentType,
      "Cache-Control": "no-store"
    });
    res.end(content);
  } catch {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "not_found" }));
  }
}

const server = http.createServer(async (req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "ok",
        ts: now(),
        uptimeMs: now() - metrics.startedAt,
        sessions: sessions.size,
        passphraseProtectedSessions: metrics.passphraseProtectedSessions,
        joinAuthProtectedSessions: metrics.joinAuthProtectedSessions,
        wsConnections: metrics.wsConnections,
        signalRelays: metrics.signalRelays,
        turnRelayCandidates: metrics.turnRelayCandidates
      })
    );
    return;
  }

  if (req.url === "/config") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        iceServers: configuredIceServers,
        reconnectGraceMs: RECONNECT_GRACE_MS,
        maxPassphraseLength: MAX_PASSPHRASE_LENGTH,
        maxJoinAuthUsernameLength: MAX_JOIN_AUTH_USERNAME_LENGTH,
        maxJoinAuthPasswordLength: MAX_JOIN_AUTH_PASSWORD_LENGTH,
        maxSignalMessageBytes: MAX_SIGNAL_MESSAGE_BYTES
      })
    );
    return;
  }

  if (req.url === "/metrics") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        sessionsActive: sessions.size,
        ...metrics
      })
    );
    return;
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "method_not_allowed" }));
    return;
  }

  await serveStatic(req, res);
});

const wss = new WebSocketServer({ server });

wss.on("connection", (ws, req) => {
  const client = createClient(ws, req);
  metrics.wsConnections += 1;

  sendJson(ws, {
    type: "connected",
    clientId: client.id
  });

  ws.on("message", (raw) => {
    metrics.wsMessages += 1;
    if (raw.length > MAX_SIGNAL_MESSAGE_BYTES) {
      fail(client, "message_too_large", "Message exceeds max allowed size.");
      return;
    }
    client.messageQueue = client.messageQueue
      .then(() => handleMessage(client, raw))
      .catch((error) => {
        markError("internal_error");
        console.error("[0xLynk] message handler failed", error);
        fail(client, "internal_error", "Message could not be processed.");
      });
  });

  ws.on("pong", () => {
    client.isAlive = true;
  });

  ws.on("close", () => {
    handleDisconnect(client, "peer_disconnected");
    clients.delete(client.id);
  });
});

setInterval(runCleanup, CLEANUP_INTERVAL_MS);

const heartbeatTimer = setInterval(() => {
  clients.forEach((client) => {
    if (client.ws.readyState !== WebSocket.OPEN) {
      return;
    }
    if (!client.isAlive) {
      client.ws.terminate();
      return;
    }
    client.isAlive = false;
    client.ws.ping();
  });
}, WS_HEARTBEAT_INTERVAL_MS);

wss.on("close", () => {
  clearInterval(heartbeatTimer);
});

server.listen(PORT, () => {
  console.log(`[0xLynk] server listening on :${PORT}`);
});
