const STORAGE_KEY = "0xlynk.session.v1";
const THEME_STORAGE_KEY = "0xlynk.theme.v1";
const DEFAULT_THEME = "night";
const THEMES = {
  night: { label: "Night", iconHref: "#icon-moon" },
  day: { label: "Day", iconHref: "#icon-sun" }
};
const FALLBACK_ICE_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }];
const MAX_BUFFERED_BYTES = 8 * 1024 * 1024;
const BUFFERED_LOW_WATERMARK = 4 * 1024 * 1024;
const CHUNK_HEADER_SIZE = 13;
const HASH_READ_CHUNK_BYTES = 4 * 1024 * 1024;
const SHA256_INIT = [
  0x6a09e667,
  0xbb67ae85,
  0x3c6ef372,
  0xa54ff53a,
  0x510e527f,
  0x9b05688c,
  0x1f83d9ab,
  0x5be0cd19
];
const SHA256_K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5,
  0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
  0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
  0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
  0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
  0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
  0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5,
  0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
  0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
]);
const WS_BASE_RECONNECT_DELAY_MS = 700;
const WS_MAX_RECONNECT_DELAY_MS = 12_000;
const WS_RECONNECT_JITTER_MS = 250;
const PEER_RECOVERY_DELAY_MS = 1800;
const PEER_RECOVERY_MIN_INTERVAL_MS = 7000;
const MAX_CHUNK_SEND_RETRIES = 3;
const DEFAULT_CHUNK_SIZE = 32 * 1024;
const MAX_DC_FLAPS_WINDOW_MS = 30_000;
const MAX_DC_FLAPS_BEFORE_FAIL = 4;
const TRANSFER_RENDER_MIN_INTERVAL_MS = 120;

const els = {
  modeSender: document.getElementById("mode-sender"),
  modeReceiver: document.getElementById("mode-receiver"),
  createSession: document.getElementById("create-session"),
  createPassphrase: document.getElementById("create-passphrase"),
  createJoinAuthUsername: document.getElementById("create-join-auth-username"),
  createJoinAuthPassword: document.getElementById("create-join-auth-password"),
  joinSession: document.getElementById("join-session"),
  joinCode: document.getElementById("join-code"),
  joinPassphrase: document.getElementById("join-passphrase"),
  joinAuthUsername: document.getElementById("join-auth-username"),
  joinAuthPassword: document.getElementById("join-auth-password"),
  leaveSession: document.getElementById("leave-session"),
  statusBanner: document.getElementById("status-banner"),
  statusBannerText: document.getElementById("status-banner-text"),
  roomCode: document.getElementById("room-code"),
  roleLabel: document.getElementById("role-label"),
  expiresLabel: document.getElementById("expires-label"),
  sessionState: document.getElementById("session-state"),
  wsState: document.getElementById("ws-state"),
  peerState: document.getElementById("peer-state"),
  rtcState: document.getElementById("rtc-state"),
  dcState: document.getElementById("dc-state"),
  transferState: document.getElementById("transfer-state"),
  senderControls: document.getElementById("sender-controls"),
  receiverControls: document.getElementById("receiver-controls"),
  senderTransfer: document.getElementById("sender-transfer"),
  receiverTransfer: document.getElementById("receiver-transfer"),
  fileInput: document.getElementById("file-input"),
  dropzone: document.getElementById("dropzone"),
  selectedFilesLabel: document.getElementById("selected-files-label"),
  selectedFilesList: document.getElementById("selected-files-list"),
  browseFiles: document.getElementById("browse-files"),
  clearFiles: document.getElementById("clear-files"),
  chunkSize: document.getElementById("chunk-size"),
  startTransfer: document.getElementById("start-transfer"),
  pauseTransfer: document.getElementById("pause-transfer"),
  resumeTransfer: document.getElementById("resume-transfer"),
  cancelTransfer: document.getElementById("cancel-transfer"),
  overallProgressLabel: document.getElementById("overall-progress-label"),
  overallProgressBar: document.getElementById("overall-progress-bar"),
  overallBytes: document.getElementById("overall-bytes"),
  outgoingList: document.getElementById("outgoing-list"),
  incomingList: document.getElementById("incoming-list"),
  turnUrls: document.getElementById("turn-urls"),
  turnUsername: document.getElementById("turn-username"),
  turnCredential: document.getElementById("turn-credential"),
  clearLog: document.getElementById("clear-log"),
  reconnectNow: document.getElementById("reconnect-now"),
  logOutput: document.getElementById("log-output"),
  themeToggle: document.getElementById("theme-toggle"),
  themeToggleLabel: document.getElementById("theme-toggle-label"),
  themeToggleIcon: document.getElementById("theme-toggle-icon"),
  outgoingEmpty: document.getElementById("outgoing-empty"),
  incomingEmpty: document.getElementById("incoming-empty"),
  transferPanel: document.getElementById("transfer-panel")
};

const state = {
  mode: "sender",
  ws: null,
  wsConnected: false,
  wsReconnectTimer: null,
  wsReconnectTicker: null,
  wsReconnectAttempt: 0,
  wsReconnectAt: 0,
  wsNextReconnectDelayMs: 0,
  wsLastDisconnectReason: "",
  wsSuppressReconnect: false,
  dropzoneDragDepth: 0,
  selectedFiles: [],
  maxPassphraseLength: 128,
  maxJoinAuthUsernameLength: 64,
  maxJoinAuthPasswordLength: 128,
  peerRecoveryTimer: null,
  peerRecoveryInFlight: false,
  peerRecoveryLastAttemptAt: 0,
  dcFlapTimestamps: [],
  session: {
    code: null,
    role: null,
    token: null,
    expiresAt: null,
    requiresPassphrase: false,
    requiresJoinAuth: false
  },
  peerJoined: false,
  runtimeIceServers: [...FALLBACK_ICE_SERVERS],
  rtc: {
    pc: null,
    dc: null,
    makingOffer: false,
    ignoreOffer: false
  },
  transfer: {
    status: "idle",
    chunkSize: DEFAULT_CHUNK_SIZE,
    paused: false,
    cancelled: false,
    running: false,
    transferId: null,
    outgoing: [],
    outgoingTotalBytes: 0,
    outgoingSentBytes: 0,
    currentFileIndex: 0,
    currentChunkIndex: 0,
    renderTimer: null,
    lastRenderTs: 0,
    incoming: null,
    fileAckWaiters: new Map(),
    fileAckResults: new Map()
  },
  ui: {
    theme: "night",
    prefersReducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches
  }
};

function log(message, data) {
  const ts = new Date().toLocaleTimeString();
  const line = `[${ts}] ${message}${data ? ` ${JSON.stringify(data)}` : ""}`;
  els.logOutput.textContent = `${line}\n${els.logOutput.textContent}`.slice(0, 30_000);
}

function showStatusBanner(message, type = "warn", showReconnectAction = false) {
  els.statusBanner.classList.remove("hidden", "status-banner-ok", "status-banner-bad", "status-banner-muted");
  if (type === "ok") {
    els.statusBanner.classList.add("status-banner-ok");
  } else if (type === "bad") {
    els.statusBanner.classList.add("status-banner-bad");
  } else if (type === "muted") {
    els.statusBanner.classList.add("status-banner-muted");
  }
  els.statusBannerText.textContent = message;
  if (showReconnectAction) {
    els.reconnectNow.classList.remove("hidden");
  } else {
    els.reconnectNow.classList.add("hidden");
  }
}

function hideStatusBanner() {
  els.statusBanner.classList.add("hidden");
  els.reconnectNow.classList.add("hidden");
}

function setChip(el, label, type = "muted") {
  el.textContent = label;
  el.className = `chip ${type === "ok" ? "chip-ok" : type === "warn" ? "chip-warn" : type === "bad" ? "chip-bad" : "chip-muted"}`;
}

function readStoredTheme() {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved && Object.prototype.hasOwnProperty.call(THEMES, saved)) {
      return saved;
    }
  } catch {
    // no-op
  }
  return DEFAULT_THEME;
}

function applyTheme(theme, persist = true) {
  const nextTheme = Object.prototype.hasOwnProperty.call(THEMES, theme) ? theme : DEFAULT_THEME;
  state.ui.theme = nextTheme;
  document.body.dataset.theme = nextTheme;
  const themeMeta = THEMES[nextTheme];
  if (els.themeToggleLabel) {
    els.themeToggleLabel.textContent = themeMeta.label;
  }
  if (els.themeToggleIcon) {
    els.themeToggleIcon.setAttribute("href", themeMeta.iconHref);
  }
  if (persist) {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch {
      // no-op
    }
  }
}

function toggleTheme() {
  applyTheme(state.ui.theme === "night" ? "day" : "night");
}

function normalizeStatusClass(status) {
  return String(status || "idle").toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function updateTransferPanelVisualState(status) {
  if (!els.transferPanel) {
    return;
  }
  const activeStatuses = ["preparing", "hashing", "awaiting_accept", "awaiting_channel", "transferring", "receiving", "paused"];
  els.transferPanel.classList.toggle("transfer-panel-active", activeStatuses.includes(status));
  els.transferPanel.classList.toggle("transfer-panel-success", status === "completed");
  els.transferPanel.classList.toggle("transfer-panel-error", status === "failed" || status === "cancelled");
}

function updateTransferEmptyStates(outgoingCount, incomingCount) {
  if (els.outgoingEmpty) {
    els.outgoingEmpty.classList.toggle("hidden", outgoingCount > 0);
  }
  if (els.incomingEmpty) {
    els.incomingEmpty.classList.toggle("hidden", incomingCount > 0);
  }
}

function formatBytes(bytes) {
  if (!bytes) {
    return "0 B";
  }
  const units = ["B", "KB", "MB", "GB", "TB"];
  let n = bytes;
  let idx = 0;
  while (n >= 1024 && idx < units.length - 1) {
    n /= 1024;
    idx += 1;
  }
  return `${n.toFixed(idx === 0 ? 0 : 2)} ${units[idx]}`;
}

function formatPercent(value) {
  return `${Math.max(0, Math.min(100, value)).toFixed(1)}%`;
}

function formatExpiry(ts) {
  if (!ts) {
    return "-";
  }
  return new Date(ts).toLocaleTimeString();
}

function formatSecondsLeft(ms) {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  return `${seconds}s`;
}

function trimToLength(value, maxLength) {
  return String(value || "").slice(0, maxLength);
}

function normalizeJoinAuthInput(usernameRaw, passwordRaw) {
  const username = trimToLength(usernameRaw, state.maxJoinAuthUsernameLength).trim();
  const password = trimToLength(passwordRaw, state.maxJoinAuthPasswordLength);
  if ((username && !password) || (!username && password)) {
    throw new Error("join_auth_incomplete");
  }
  return { username, password };
}

function fileIdentityKey(file) {
  return `${file.name}::${file.size}::${file.lastModified}::${file.type || ""}`;
}

function mergeFiles(baseFiles, incomingFiles) {
  const merged = [];
  const seen = new Set();
  [...(baseFiles || []), ...(incomingFiles || [])].forEach((file) => {
    const key = fileIdentityKey(file);
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(file);
    }
  });
  return merged;
}

function setFileInputFiles(files) {
  if (!(window.DataTransfer && els.fileInput)) {
    return;
  }

  const dt = new DataTransfer();
  files.forEach((file) => dt.items.add(file));
  els.fileInput.files = dt.files;
}

function renderSelectedFilesList() {
  if (!els.selectedFilesList) {
    return;
  }

  if (!state.selectedFiles.length) {
    els.selectedFilesList.replaceChildren();
    return;
  }

  const items = state.selectedFiles.map((file) => {
    const li = document.createElement("li");
    li.className = "selected-file-item";

    const name = document.createElement("span");
    name.className = "selected-file-name";
    name.textContent = file.name;

    const meta = document.createElement("span");
    meta.className = "selected-file-size";
    meta.textContent = formatBytes(file.size);

    li.append(name, meta);
    return li;
  });

  els.selectedFilesList.replaceChildren(...items);
}

function updateDropzoneCopy() {
  const title = els.dropzone.querySelector(".dropzone-title");
  if (!title) {
    return;
  }

  const hasTouch = navigator.maxTouchPoints > 0;
  title.textContent = hasTouch ? "Tap to choose files" : "Drag files here";
}

function randomId() {
  return Math.random().toString(36).slice(2, 12);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function supportsSubtleCrypto() {
  return Boolean(window.crypto && window.crypto.subtle && typeof window.crypto.subtle.digest === "function");
}

function rightRotate(value, amount) {
  return (value >>> amount) | (value << (32 - amount));
}

function hashWordsToHex(hash) {
  return Array.from(hash).map((word) => word.toString(16).padStart(8, "0")).join("");
}

function createSha256State() {
  return {
    hash: new Uint32Array(SHA256_INIT),
    w: new Uint32Array(64),
    block: new Uint8Array(64),
    blockLength: 0,
    totalBytes: 0n
  };
}

function processSha256Block(state, bytes, offset = 0) {
  const { w, hash } = state;
  for (let i = 0; i < 16; i += 1) {
    const j = offset + i * 4;
    w[i] = ((bytes[j] << 24) | (bytes[j + 1] << 16) | (bytes[j + 2] << 8) | bytes[j + 3]) >>> 0;
  }
  for (let i = 16; i < 64; i += 1) {
    const s0 = rightRotate(w[i - 15], 7) ^ rightRotate(w[i - 15], 18) ^ (w[i - 15] >>> 3);
    const s1 = rightRotate(w[i - 2], 17) ^ rightRotate(w[i - 2], 19) ^ (w[i - 2] >>> 10);
    w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
  }

  let a = hash[0];
  let b = hash[1];
  let c = hash[2];
  let d = hash[3];
  let e = hash[4];
  let f = hash[5];
  let g = hash[6];
  let h = hash[7];

  for (let i = 0; i < 64; i += 1) {
    const s1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
    const ch = (e & f) ^ (~e & g);
    const temp1 = (h + s1 + ch + SHA256_K[i] + w[i]) >>> 0;
    const s0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
    const maj = (a & b) ^ (a & c) ^ (b & c);
    const temp2 = (s0 + maj) >>> 0;

    h = g;
    g = f;
    f = e;
    e = (d + temp1) >>> 0;
    d = c;
    c = b;
    b = a;
    a = (temp1 + temp2) >>> 0;
  }

  hash[0] = (hash[0] + a) >>> 0;
  hash[1] = (hash[1] + b) >>> 0;
  hash[2] = (hash[2] + c) >>> 0;
  hash[3] = (hash[3] + d) >>> 0;
  hash[4] = (hash[4] + e) >>> 0;
  hash[5] = (hash[5] + f) >>> 0;
  hash[6] = (hash[6] + g) >>> 0;
  hash[7] = (hash[7] + h) >>> 0;
}

function updateSha256State(state, chunk) {
  const bytes = chunk instanceof Uint8Array ? chunk : new Uint8Array(chunk);
  let offset = 0;
  state.totalBytes += BigInt(bytes.byteLength);

  if (state.blockLength > 0) {
    const needed = 64 - state.blockLength;
    const take = Math.min(needed, bytes.byteLength);
    state.block.set(bytes.subarray(0, take), state.blockLength);
    state.blockLength += take;
    offset = take;
    if (state.blockLength === 64) {
      processSha256Block(state, state.block, 0);
      state.blockLength = 0;
    }
  }

  while (offset + 64 <= bytes.byteLength) {
    processSha256Block(state, bytes, offset);
    offset += 64;
  }

  if (offset < bytes.byteLength) {
    const remain = bytes.subarray(offset);
    state.block.set(remain, 0);
    state.blockLength = remain.byteLength;
  }
}

function finalizeSha256State(state) {
  const bitLength = state.totalBytes * 8n;
  const totalPadLength = state.blockLength < 56 ? 64 : 128;
  const finalBlock = new Uint8Array(totalPadLength);
  finalBlock.set(state.block.subarray(0, state.blockLength), 0);
  finalBlock[state.blockLength] = 0x80;
  for (let i = 0; i < 8; i += 1) {
    finalBlock[totalPadLength - 1 - i] = Number((bitLength >> BigInt(i * 8)) & 0xffn);
  }

  processSha256Block(state, finalBlock, 0);
  if (totalPadLength === 128) {
    processSha256Block(state, finalBlock, 64);
  }

  return hashWordsToHex(state.hash);
}

function sha256HexFallbackFromArrayBuffer(buffer) {
  const state = createSha256State();
  updateSha256State(state, new Uint8Array(buffer));
  return finalizeSha256State(state);
}

async function sha256HexFromArrayBuffer(buffer) {
  if (supportsSubtleCrypto()) {
    const hash = await crypto.subtle.digest("SHA-256", buffer);
    return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  return sha256HexFallbackFromArrayBuffer(buffer);
}

async function sha256HexFromBlob(blob, onProgress) {
  if (blob && typeof blob.stream === "function") {
    const state = createSha256State();
    const reader = blob.stream().getReader();
    let processedBytes = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        if (!value || !value.byteLength) {
          continue;
        }
        updateSha256State(state, value);
        processedBytes += value.byteLength;
        if (typeof onProgress === "function") {
          onProgress(processedBytes, blob.size);
        }
      }
      return finalizeSha256State(state);
    } finally {
      reader.releaseLock();
    }
  }

  const state = createSha256State();
  let processedBytes = 0;
  for (let offset = 0; offset < blob.size; offset += HASH_READ_CHUNK_BYTES) {
    const end = Math.min(offset + HASH_READ_CHUNK_BYTES, blob.size);
    const chunk = await blob.slice(offset, end).arrayBuffer();
    updateSha256State(state, new Uint8Array(chunk));
    processedBytes = end;
    if (typeof onProgress === "function") {
      onProgress(processedBytes, blob.size);
    }
  }
  return finalizeSha256State(state);
}

function normalizeHashReadError(error) {
  const name = String(error?.name || "");
  if (name === "NotReadableError") {
    return "File became unreadable (moved, locked, or permission changed). Re-select the file and retry.";
  }
  if (name === "NotFoundError") {
    return "File is no longer available at the selected path. Re-select it and retry.";
  }
  if (name === "AbortError") {
    return "File read was interrupted. Please retry.";
  }
  return error?.message || "Failed to read selected file.";
}

function isTransferBusyStatus(status) {
  return ["preparing", "hashing", "awaiting_accept", "awaiting_channel", "transferring"].includes(status);
}

function scheduleTransferRender() {
  const nowTs = Date.now();
  if (state.transfer.lastRenderTs && nowTs - state.transfer.lastRenderTs < TRANSFER_RENDER_MIN_INTERVAL_MS) {
    if (state.transfer.renderTimer) {
      return;
    }
    const delay = TRANSFER_RENDER_MIN_INTERVAL_MS - (nowTs - state.transfer.lastRenderTs);
    state.transfer.renderTimer = setTimeout(() => {
      state.transfer.renderTimer = null;
      state.transfer.lastRenderTs = Date.now();
      renderTransfer();
    }, Math.max(0, delay));
    return;
  }

  state.transfer.lastRenderTs = nowTs;
  renderTransfer();
}

function recordDataChannelFlap() {
  const nowTs = Date.now();
  state.dcFlapTimestamps = [...state.dcFlapTimestamps, nowTs].filter((ts) => nowTs - ts <= MAX_DC_FLAPS_WINDOW_MS);
}

function tooManyDataChannelFlaps() {
  return state.dcFlapTimestamps.length >= MAX_DC_FLAPS_BEFORE_FAIL;
}

function persistSession() {
  if (!state.session.code || !state.session.token) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }

  const payload = {
    code: state.session.code,
    token: state.session.token,
    role: state.session.role,
    expiresAt: state.session.expiresAt
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function loadPersistedSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const data = JSON.parse(raw);
    if (!data || !data.code || !data.token || !data.expiresAt || data.expiresAt <= Date.now()) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function clearSessionState() {
  cancelPeerRecovery();
  state.peerRecoveryInFlight = false;
  state.peerRecoveryLastAttemptAt = 0;
  state.session = {
    code: null,
    role: null,
    token: null,
    expiresAt: null,
    requiresPassphrase: false,
    requiresJoinAuth: false
  };
  state.peerJoined = false;
  localStorage.removeItem(STORAGE_KEY);
  teardownPeerConnection();
  resetTransferState();
}

function resetTransferState() {
  if (state.transfer.renderTimer) {
    clearTimeout(state.transfer.renderTimer);
    state.transfer.renderTimer = null;
  }
  state.transfer.status = "idle";
  state.transfer.paused = false;
  state.transfer.cancelled = false;
  state.transfer.running = false;
  state.transfer.transferId = null;
  state.transfer.outgoing = [];
  state.transfer.outgoingTotalBytes = 0;
  state.transfer.outgoingSentBytes = 0;
  state.transfer.currentFileIndex = 0;
  state.transfer.currentChunkIndex = 0;
  state.transfer.lastRenderTs = 0;
  state.transfer.fileAckWaiters.forEach((waiter) => waiter.reject(new Error("transfer_reset")));
  state.transfer.fileAckWaiters.clear();
  state.transfer.fileAckResults.clear();
  state.dcFlapTimestamps = [];

  if (state.transfer.incoming?.files) {
    state.transfer.incoming.files.forEach((file) => {
      if (file.downloadUrl) {
        URL.revokeObjectURL(file.downloadUrl);
      }
    });
  }

  state.transfer.incoming = null;
  renderTransfer();
}

function sendWs(payload) {
  if (!state.ws || state.ws.readyState !== WebSocket.OPEN) {
    return false;
  }
  state.ws.send(JSON.stringify(payload));
  return true;
}

function buildWsUrl() {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}`;
}

function scheduleWsReconnect() {
  if (state.wsReconnectTimer) {
    return;
  }
  const jitter = Math.floor(Math.random() * WS_RECONNECT_JITTER_MS);
  const delay = Math.min(
    WS_MAX_RECONNECT_DELAY_MS,
    WS_BASE_RECONNECT_DELAY_MS + state.wsReconnectAttempt * 700 + jitter
  );
  state.wsReconnectAttempt += 1;
  state.wsNextReconnectDelayMs = delay;
  state.wsReconnectAt = Date.now() + delay;
  startReconnectTicker();
  state.wsReconnectTimer = setTimeout(() => {
    state.wsReconnectTimer = null;
    state.wsNextReconnectDelayMs = 0;
    state.wsReconnectAt = 0;
    stopReconnectTicker();
    connectSignaling();
  }, delay);
  renderStatusBanner();
}

function cancelWsReconnect() {
  stopReconnectTicker();
  if (!state.wsReconnectTimer) {
    state.wsNextReconnectDelayMs = 0;
    state.wsReconnectAt = 0;
    return;
  }
  clearTimeout(state.wsReconnectTimer);
  state.wsReconnectTimer = null;
  state.wsNextReconnectDelayMs = 0;
  state.wsReconnectAt = 0;
}

function startReconnectTicker() {
  if (state.wsReconnectTicker) {
    return;
  }
  state.wsReconnectTicker = setInterval(() => {
    if (!state.wsConnected) {
      renderConnection();
      renderStatusBanner();
    }
  }, 1000);
}

function stopReconnectTicker() {
  if (!state.wsReconnectTicker) {
    return;
  }
  clearInterval(state.wsReconnectTicker);
  state.wsReconnectTicker = null;
}

function cancelPeerRecovery() {
  if (!state.peerRecoveryTimer) {
    return;
  }
  clearTimeout(state.peerRecoveryTimer);
  state.peerRecoveryTimer = null;
}

function schedulePeerRecovery() {
  cancelPeerRecovery();
  if (!state.session.code || !state.peerJoined || state.session.role !== "sender") {
    return;
  }

  if (state.peerRecoveryInFlight) {
    return;
  }

  const nowTs = Date.now();
  if (state.peerRecoveryLastAttemptAt && nowTs - state.peerRecoveryLastAttemptAt < PEER_RECOVERY_MIN_INTERVAL_MS) {
    return;
  }

  state.peerRecoveryTimer = setTimeout(async () => {
    state.peerRecoveryTimer = null;
    if (!state.session.code || !state.peerJoined || state.session.role !== "sender") {
      return;
    }
    if (dataChannelReady()) {
      return;
    }

    log("Peer signaling restored, re-negotiating WebRTC");
    state.peerRecoveryInFlight = true;
    state.peerRecoveryLastAttemptAt = Date.now();
    try {
      teardownPeerConnection();
      await createAndSendOffer();
      renderAll();
    } finally {
      state.peerRecoveryInFlight = false;
    }
  }, PEER_RECOVERY_DELAY_MS);
}

function reconnectNow() {
  cancelWsReconnect();
  connectSignaling();
}

function connectSignaling() {
  if (state.ws && (state.ws.readyState === WebSocket.OPEN || state.ws.readyState === WebSocket.CONNECTING)) {
    return;
  }

  state.wsSuppressReconnect = false;
  state.wsLastDisconnectReason = "";
  const ws = new WebSocket(buildWsUrl());
  state.ws = ws;

  ws.addEventListener("open", () => {
    state.wsConnected = true;
    state.wsReconnectAttempt = 0;
    state.wsNextReconnectDelayMs = 0;
    state.wsReconnectAt = 0;
    stopReconnectTicker();
    renderConnection();
    renderStatusBanner();
    log("Signaling connected");

    const persisted = loadPersistedSession();
    if (persisted) {
      sendWs({ type: "reconnect_session", code: persisted.code, token: persisted.token });
      log("Attempting signaling reconnect", { code: persisted.code, role: persisted.role });
    }

    if (state.session.role === "sender" && state.peerJoined && !dataChannelReady()) {
      schedulePeerRecovery();
    }
  });

  ws.addEventListener("close", () => {
    state.wsConnected = false;
    state.wsLastDisconnectReason = "socket_closed";
    renderConnection();
    if (state.wsSuppressReconnect) {
      state.wsSuppressReconnect = false;
      return;
    }
    log("Signaling disconnected; scheduling reconnect");
    scheduleWsReconnect();
    renderAll();
  });

  ws.addEventListener("error", () => {
    state.wsConnected = false;
    state.wsLastDisconnectReason = "socket_error";
    renderConnection();
    renderStatusBanner();
  });

  ws.addEventListener("message", async (event) => {
    let msg;
    try {
      msg = JSON.parse(event.data);
    } catch {
      log("Invalid signaling JSON");
      return;
    }
    await handleSignalMessage(msg);
  });
}

function applyTurnFieldsFromIceServers(iceServers) {
  const turn = (iceServers || []).find((server) => {
    const urls = Array.isArray(server.urls) ? server.urls : [server.urls];
    return urls.some((url) => String(url || "").startsWith("turn:"));
  });

  if (!turn) {
    return;
  }

  const urls = Array.isArray(turn.urls) ? turn.urls : [turn.urls];
  els.turnUrls.value = urls.join(",");
  if (turn.username) {
    els.turnUsername.value = turn.username;
  }
  if (turn.credential) {
    els.turnCredential.value = turn.credential;
  }
}

async function loadServerConfig() {
  try {
    const response = await fetch("/config", { cache: "no-store" });
    if (!response.ok) {
      return;
    }

    const config = await response.json();
    if (Array.isArray(config.iceServers) && config.iceServers.length > 0) {
      state.runtimeIceServers = config.iceServers;
      applyTurnFieldsFromIceServers(config.iceServers);
    }

    if (Number.isFinite(config.maxPassphraseLength)) {
      state.maxPassphraseLength = config.maxPassphraseLength;
    }

    if (Number.isFinite(config.maxJoinAuthUsernameLength)) {
      state.maxJoinAuthUsernameLength = config.maxJoinAuthUsernameLength;
    }

    if (Number.isFinite(config.maxJoinAuthPasswordLength)) {
      state.maxJoinAuthPasswordLength = config.maxJoinAuthPasswordLength;
    }

    log("Loaded server config", {
      iceServers: state.runtimeIceServers.length,
      reconnectGraceMs: config.reconnectGraceMs
    });
  } catch {
    log("Using fallback ICE config");
  }
}

function buildIceServers() {
  const servers = [...(state.runtimeIceServers.length ? state.runtimeIceServers : FALLBACK_ICE_SERVERS)];
  const urlsRaw = els.turnUrls.value.trim();
  if (urlsRaw) {
    const withTurnRemoved = servers.filter((server) => {
      const urls = Array.isArray(server.urls) ? server.urls : [server.urls];
      return !urls.some((url) => String(url || "").startsWith("turn:"));
    });

    const urls = urlsRaw.split(",").map((item) => item.trim()).filter(Boolean);
    if (urls.length) {
      withTurnRemoved.push({
        urls,
        username: els.turnUsername.value.trim() || undefined,
        credential: els.turnCredential.value.trim() || undefined
      });
    }

    return withTurnRemoved;
  }

  return servers;
}

function setupDataChannel(dc) {
  state.rtc.dc = dc;
  dc.binaryType = "arraybuffer";

  dc.addEventListener("open", () => {
    state.dcFlapTimestamps = [];
    dc.bufferedAmountLowThreshold = BUFFERED_LOW_WATERMARK;
    log("DataChannel open");

    if (
      state.session.role === "sender"
      && state.transfer.status === "awaiting_channel"
      && !state.transfer.running
      && state.transfer.outgoing.length
      && !state.peerRecoveryInFlight
    ) {
      log("Resuming transfer after channel reopen");
      runOutgoingTransfer();
    }

    renderConnection();
    renderTransfer();
  });

  dc.addEventListener("close", () => {
    log("DataChannel closed");
    recordDataChannelFlap();
    if (state.session.role === "sender" && state.transfer.running) {
      if (tooManyDataChannelFlaps()) {
        state.transfer.status = "failed";
        state.transfer.running = false;
        showStatusBanner("Transfer stopped: unstable peer channel. Lower chunk size to 32 KB or 16 KB and restart with a new room.", "bad", false);
        log("Transfer stopped due to repeated DataChannel flaps", { flaps: state.dcFlapTimestamps.length });
        renderTransfer();
        return;
      }
      state.transfer.status = "awaiting_channel";
      if (!state.peerRecoveryInFlight) {
        schedulePeerRecovery();
      }
    }
    renderConnection();
    renderTransfer();
    renderStatusBanner();
  });

  dc.addEventListener("error", (event) => {
    log("DataChannel error", { message: event.message || "unknown" });
    if (
      state.session.role === "sender"
      && (state.transfer.running || state.transfer.status === "awaiting_accept")
      && !state.peerRecoveryInFlight
    ) {
      schedulePeerRecovery();
    }
    renderConnection();
    renderTransfer();
  });

  dc.addEventListener("message", (event) => {
    void handleDataChannelMessage(event.data);
  });
}

function ensurePeerConnection() {
  if (state.rtc.pc) {
    return state.rtc.pc;
  }

  const pc = new RTCPeerConnection({ iceServers: buildIceServers() });
  state.rtc.pc = pc;

  pc.addEventListener("icecandidate", (event) => {
    if (!event.candidate || !state.session.code) {
      return;
    }
    sendWs({
      type: "signal",
      signalType: "ice-candidate",
      payload: event.candidate
    });
  });

  pc.addEventListener("connectionstatechange", () => {
    renderConnection();
    renderTransfer();
    renderStatusBanner();
    if (["failed", "disconnected", "closed"].includes(pc.connectionState)) {
      log("Peer connection state", { state: pc.connectionState });
      if (state.session.role === "sender" && state.peerJoined && !state.transfer.running) {
        schedulePeerRecovery();
      }
    }
  });

  pc.addEventListener("datachannel", (event) => {
    setupDataChannel(event.channel);
  });

  renderConnection();
  return pc;
}

function teardownPeerConnection() {
  if (state.rtc.dc) {
    try {
      state.rtc.dc.close();
    } catch {
      // no-op
    }
  }
  if (state.rtc.pc) {
    try {
      state.rtc.pc.close();
    } catch {
      // no-op
    }
  }
  state.rtc = {
    pc: null,
    dc: null,
    makingOffer: false,
    ignoreOffer: false
  };
  renderConnection();
}

async function createAndSendOffer() {
  if (state.session.role !== "sender" || !state.peerJoined) {
    return;
  }

  if (!state.wsConnected || !state.session.code) {
    return;
  }

  const pc = ensurePeerConnection();
  if (!state.rtc.dc || state.rtc.dc.readyState === "closed") {
    setupDataChannel(pc.createDataChannel("file-transfer", { ordered: true }));
  }

  try {
    state.rtc.makingOffer = true;
    await pc.setLocalDescription(await pc.createOffer());
    sendWs({ type: "signal", signalType: "offer", payload: pc.localDescription });
    log("Offer sent");
  } finally {
    state.rtc.makingOffer = false;
  }
}

async function handleWebRtcSignal(signalType, payload, fromRole) {
  const pc = ensurePeerConnection();

  if (signalType === "offer") {
    const polite = state.session.role !== "sender";
    const offerCollision = state.rtc.makingOffer || pc.signalingState !== "stable";
    state.rtc.ignoreOffer = !polite && offerCollision;
    if (state.rtc.ignoreOffer) {
      log("Ignoring offer collision");
      return;
    }

    await pc.setRemoteDescription(payload);
    await pc.setLocalDescription(await pc.createAnswer());
    sendWs({ type: "signal", signalType: "answer", payload: pc.localDescription });
    log("Answer sent");
    return;
  }

  if (signalType === "answer") {
    await pc.setRemoteDescription(payload);
    log("Answer received", { from: fromRole });
    return;
  }

  if (signalType === "ice-candidate") {
    try {
      await pc.addIceCandidate(payload);
    } catch (error) {
      if (!state.rtc.ignoreOffer) {
        log("ICE add failed", { message: error.message });
      }
    }
  }
}

function dataChannelReady() {
  return Boolean(state.rtc.dc && state.rtc.dc.readyState === "open");
}

function sendControl(payload) {
  if (!dataChannelReady()) {
    throw new Error("datachannel_not_ready");
  }
  state.rtc.dc.send(JSON.stringify({ channel: "control", ...payload }));
}

function encodeChunkFrame(fileId, chunkIndex, payloadBuffer) {
  const payload = new Uint8Array(payloadBuffer);
  const frame = new ArrayBuffer(CHUNK_HEADER_SIZE + payload.byteLength);
  const view = new DataView(frame);
  view.setUint8(0, 1);
  view.setUint32(1, fileId);
  view.setUint32(5, chunkIndex);
  view.setUint32(9, payload.byteLength);
  new Uint8Array(frame, CHUNK_HEADER_SIZE).set(payload);
  return frame;
}

function decodeChunkFrame(buffer) {
  const view = new DataView(buffer);
  const frameType = view.getUint8(0);
  if (frameType !== 1) {
    return null;
  }
  const fileId = view.getUint32(1);
  const chunkIndex = view.getUint32(5);
  const payloadLen = view.getUint32(9);
  const end = CHUNK_HEADER_SIZE + payloadLen;
  if (buffer.byteLength < end) {
    return null;
  }
  const payload = buffer.slice(CHUNK_HEADER_SIZE, end);
  return { fileId, chunkIndex, payload };
}

async function waitForBufferedLowWatermark() {
  const dc = state.rtc.dc;
  if (!dc) {
    throw new Error("datachannel_closed");
  }
  if (dc.bufferedAmount <= MAX_BUFFERED_BYTES) {
    return;
  }
  await new Promise((resolve) => {
    const onLow = () => {
      dc.removeEventListener("bufferedamountlow", onLow);
      resolve();
    };
    dc.addEventListener("bufferedamountlow", onLow);
  });
}

async function waitWhilePausedOrCancelled() {
  while (state.transfer.paused && !state.transfer.cancelled) {
    await sleep(120);
  }
  if (state.transfer.cancelled) {
    throw new Error("transfer_cancelled");
  }
}

function findOutgoingFile(fileId) {
  return state.transfer.outgoing.find((file) => file.id === fileId) || null;
}

function buildOutgoingPlan(files, chunkSize) {
  const outgoing = Array.from(files).map((file, index) => ({
    id: index,
    file,
    name: file.name,
    size: file.size,
    type: file.type || "application/octet-stream",
    sha256: null,
    totalChunks: Math.ceil(file.size / chunkSize),
    sentBytes: 0,
    nextChunkIndex: 0,
    beginSent: false,
    status: "queued",
    error: null
  }));

  return {
    outgoing,
    totalBytes: outgoing.reduce((sum, file) => sum + file.size, 0)
  };
}

async function prepareOutgoingHashes() {
  state.transfer.status = "hashing";
  scheduleTransferRender();

  for (const fileRecord of state.transfer.outgoing) {
    try {
      fileRecord.status = "hashing";
      fileRecord.error = null;
      fileRecord.sentBytes = 0;
      scheduleTransferRender();
      fileRecord.sha256 = await sha256HexFromBlob(fileRecord.file, (processedBytes) => {
        fileRecord.sentBytes = processedBytes;
        scheduleTransferRender();
      });
      fileRecord.sentBytes = fileRecord.size;
      fileRecord.nextChunkIndex = 0;
      fileRecord.beginSent = false;
      fileRecord.status = "ready";
      scheduleTransferRender();
    } catch (error) {
      fileRecord.status = "failed";
      fileRecord.error = normalizeHashReadError(error);
      scheduleTransferRender();
      throw new Error(fileRecord.error);
    }
  }
}

async function sendChunk(fileRecord, chunkIndex, trackProgress = true) {
  const start = chunkIndex * state.transfer.chunkSize;
  const end = Math.min(start + state.transfer.chunkSize, fileRecord.size);
  const blob = fileRecord.file.slice(start, end);
  const payload = await blob.arrayBuffer();

  for (let attempt = 0; attempt <= MAX_CHUNK_SEND_RETRIES; attempt += 1) {
    await waitWhilePausedOrCancelled();
    if (!dataChannelReady()) {
      if (attempt === MAX_CHUNK_SEND_RETRIES) {
        throw new Error("datachannel_not_open");
      }
      await sleep(250 + attempt * 250);
      continue;
    }

    await waitForBufferedLowWatermark();
    try {
      state.rtc.dc.send(encodeChunkFrame(fileRecord.id, chunkIndex, payload));
      const sent = end - start;
      fileRecord.sentBytes = Math.max(fileRecord.sentBytes, end);
      if (trackProgress) {
        state.transfer.outgoingSentBytes = Math.min(state.transfer.outgoingTotalBytes, state.transfer.outgoingSentBytes + sent);
      }
      scheduleTransferRender();
      return;
    } catch (error) {
      if (attempt === MAX_CHUNK_SEND_RETRIES) {
        throw error;
      }
      await sleep(250 + attempt * 250);
    }
  }
}

function waitForFileAck(fileRecord) {
  const cached = state.transfer.fileAckResults.get(fileRecord.id);
  if (cached) {
    state.transfer.fileAckResults.delete(fileRecord.id);
    if (cached.ok) {
      return Promise.resolve(true);
    }
    return Promise.reject(new Error(cached.reason || "verification_failed"));
  }

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      state.transfer.fileAckWaiters.delete(fileRecord.id);
      reject(new Error(`file_ack_timeout:${fileRecord.name}`));
    }, 60_000);

    state.transfer.fileAckWaiters.set(fileRecord.id, {
      resolve: (value) => {
        clearTimeout(timeout);
        resolve(value);
      },
      reject: (error) => {
        clearTimeout(timeout);
        reject(error);
      }
    });
  });
}

async function resendMissingChunks(fileId, missingIndexes = []) {
  const fileRecord = findOutgoingFile(fileId);
  if (!fileRecord) {
    return;
  }
  fileRecord.status = "retrying";
  renderTransfer();
  for (const idx of missingIndexes.slice(0, 1000)) {
    if (!Number.isInteger(idx) || idx < 0 || idx >= fileRecord.totalChunks) {
      continue;
    }
    await sendChunk(fileRecord, idx, false);
  }
  sendControl({ type: "file_complete", transferId: state.transfer.transferId, fileId });
  fileRecord.status = "awaiting_verify";
  renderTransfer();
}

async function sendFile(fileRecord) {
  if (!fileRecord.beginSent) {
    fileRecord.status = "sending";
    fileRecord.sentBytes = 0;
    fileRecord.nextChunkIndex = 0;
    sendControl({
      type: "file_begin",
      transferId: state.transfer.transferId,
      fileId: fileRecord.id,
      name: fileRecord.name,
      size: fileRecord.size,
      mimeType: fileRecord.type,
      sha256: fileRecord.sha256,
      totalChunks: fileRecord.totalChunks,
      chunkSize: state.transfer.chunkSize
    });
    fileRecord.beginSent = true;
    scheduleTransferRender();
  } else {
    fileRecord.status = "sending";
    scheduleTransferRender();
  }

  for (let chunkIndex = fileRecord.nextChunkIndex || 0; chunkIndex < fileRecord.totalChunks; chunkIndex += 1) {
    await sendChunk(fileRecord, chunkIndex);
    fileRecord.nextChunkIndex = chunkIndex + 1;
    state.transfer.currentChunkIndex = fileRecord.nextChunkIndex;
  }

  const ackPromise = waitForFileAck(fileRecord);
  fileRecord.status = "awaiting_verify";
  state.transfer.currentChunkIndex = fileRecord.totalChunks;
  sendControl({ type: "file_complete", transferId: state.transfer.transferId, fileId: fileRecord.id });
  scheduleTransferRender();

  await ackPromise;
  fileRecord.status = "verified";
  scheduleTransferRender();
}

async function runOutgoingTransfer() {
  if (state.transfer.running) {
    return;
  }

  if (!dataChannelReady()) {
    if (state.session.role === "sender" && state.peerJoined) {
      schedulePeerRecovery();
    }
    state.transfer.status = "awaiting_channel";
    showStatusBanner("Waiting for peer channel to reopen before sending.", "warn", false);
    renderTransfer();
    return;
  }

  state.transfer.running = true;
  state.transfer.status = "transferring";
  scheduleTransferRender();

  try {
    for (let fileIndex = state.transfer.currentFileIndex || 0; fileIndex < state.transfer.outgoing.length; fileIndex += 1) {
      state.transfer.currentFileIndex = fileIndex;
      const fileRecord = state.transfer.outgoing[fileIndex];
      if (state.transfer.cancelled) {
        throw new Error("transfer_cancelled");
      }
      await sendFile(fileRecord);
      state.transfer.currentFileIndex = fileIndex + 1;
      state.transfer.currentChunkIndex = 0;
    }

    sendControl({ type: "transfer_complete", transferId: state.transfer.transferId });
    state.transfer.status = "completed";
    log("Transfer completed", { transferId: state.transfer.transferId });
  } catch (error) {
    if (error?.message === "datachannel_not_open" || error?.message?.includes("readyState is not 'open'")) {
      if (state.session.role === "sender" && state.peerJoined) {
        schedulePeerRecovery();
      }
      state.transfer.status = "awaiting_channel";
      showStatusBanner("Connection dropped mid-transfer. Auto-resume when channel reconnects.", "warn", false);
      log("Transfer paused awaiting channel reopen", {
        fileIndex: state.transfer.currentFileIndex,
        chunkIndex: state.transfer.currentChunkIndex
      });
    } else {
      state.transfer.status = state.transfer.cancelled ? "cancelled" : "failed";
      log("Transfer failed", { message: error.message });
    }
  } finally {
    state.transfer.running = false;
    scheduleTransferRender();
  }
}

function setIncomingTransfer(payload) {
  const filesMap = new Map();
  for (const file of payload.files || []) {
    filesMap.set(file.id, {
      id: file.id,
      name: file.name,
      size: file.size,
      mimeType: file.mimeType || "application/octet-stream",
      sha256: file.sha256,
      totalChunks: file.totalChunks,
      chunkSize: payload.chunkSize,
      receivedBytes: 0,
      chunks: new Array(file.totalChunks),
      status: "queued",
      downloadUrl: null,
      hash: null,
      error: null
    });
  }

  state.transfer.incoming = {
    transferId: payload.transferId,
    files: filesMap,
    order: (payload.files || []).map((file) => file.id),
    totalBytes: (payload.files || []).reduce((sum, file) => sum + file.size, 0),
    receivedBytes: 0,
    paused: false,
    cancelled: false
  };

  state.transfer.status = "receiving";
  renderTransfer();
}

async function verifyIncomingFile(fileRecord) {
  const missing = [];
  for (let idx = 0; idx < fileRecord.totalChunks; idx += 1) {
    if (!fileRecord.chunks[idx]) {
      missing.push(idx);
    }
  }

  if (missing.length) {
    fileRecord.status = "retry_requested";
    renderTransfer();
    sendControl({
      type: "chunk_nack",
      transferId: state.transfer.incoming.transferId,
      fileId: fileRecord.id,
      missing
    });
    return;
  }

  const blob = new Blob(fileRecord.chunks, { type: fileRecord.mimeType });
  const digest = await sha256HexFromBlob(blob);
  fileRecord.hash = digest;

  if (digest !== fileRecord.sha256) {
    fileRecord.status = "hash_mismatch";
    fileRecord.error = "SHA-256 verification failed";
    renderTransfer();
    sendControl({
      type: "file_verified",
      transferId: state.transfer.incoming.transferId,
      fileId: fileRecord.id,
      ok: false,
      reason: "hash_mismatch"
    });
    return;
  }

  fileRecord.downloadUrl = URL.createObjectURL(blob);
  fileRecord.chunks = [];
  fileRecord.status = "verified";
  renderTransfer();
  sendControl({
    type: "file_verified",
    transferId: state.transfer.incoming.transferId,
    fileId: fileRecord.id,
    ok: true
  });
}

async function handleIncomingChunk(buffer) {
  if (!state.transfer.incoming) {
    return;
  }
  const frame = decodeChunkFrame(buffer);
  if (!frame) {
    return;
  }

  const fileRecord = state.transfer.incoming.files.get(frame.fileId);
  if (!fileRecord || fileRecord.status === "verified") {
    return;
  }

  if (!fileRecord.chunks[frame.chunkIndex]) {
    const payloadCopy = frame.payload.slice(0);
    fileRecord.chunks[frame.chunkIndex] = payloadCopy;
    fileRecord.receivedBytes += payloadCopy.byteLength;
    state.transfer.incoming.receivedBytes += payloadCopy.byteLength;
    if (fileRecord.status === "queued" || fileRecord.status === "receiving_meta") {
      fileRecord.status = "receiving";
    }
    renderTransfer();
  }
}

async function handleDataControlMessage(message) {
  switch (message.type) {
    case "transfer_offer": {
      if (state.session.role !== "receiver") {
        return;
      }
      if (state.transfer.incoming && state.transfer.incoming.transferId === message.transferId) {
        return;
      }
      setIncomingTransfer(message);
      sendControl({ type: "transfer_accept", transferId: message.transferId });
      log("Transfer offer accepted", { transferId: message.transferId });
      break;
    }

    case "transfer_accept": {
      if (state.session.role !== "sender" || message.transferId !== state.transfer.transferId) {
        return;
      }
      if (state.transfer.running) {
        return;
      }
      log("Transfer accepted by receiver");
      runOutgoingTransfer();
      break;
    }

    case "transfer_pause": {
      if (state.transfer.incoming) {
        state.transfer.incoming.paused = true;
      }
      state.transfer.status = "paused";
      renderTransfer();
      break;
    }

    case "transfer_resume": {
      if (state.transfer.incoming) {
        state.transfer.incoming.paused = false;
      }
      state.transfer.status = "receiving";
      renderTransfer();
      break;
    }

    case "transfer_cancel": {
      state.transfer.status = "cancelled";
      state.transfer.cancelled = true;
      renderTransfer();
      break;
    }

    case "file_begin": {
      if (!state.transfer.incoming || message.transferId !== state.transfer.incoming.transferId) {
        return;
      }
      const fileRecord = state.transfer.incoming.files.get(message.fileId);
      if (!fileRecord) {
        return;
      }
      fileRecord.status = "receiving_meta";
      renderTransfer();
      break;
    }

    case "file_complete": {
      if (!state.transfer.incoming || message.transferId !== state.transfer.incoming.transferId) {
        return;
      }
      const fileRecord = state.transfer.incoming.files.get(message.fileId);
      if (!fileRecord) {
        return;
      }
      fileRecord.status = "verifying";
      renderTransfer();
      try {
        await verifyIncomingFile(fileRecord);
      } catch (error) {
        fileRecord.status = "hash_mismatch";
        fileRecord.error = `verification_error: ${error.message}`;
        renderTransfer();
        sendControl({
          type: "file_verified",
          transferId: state.transfer.incoming.transferId,
          fileId: fileRecord.id,
          ok: false,
          reason: "verification_error"
        });
      }
      break;
    }

    case "chunk_nack": {
      if (state.session.role !== "sender" || message.transferId !== state.transfer.transferId) {
        return;
      }
      await resendMissingChunks(message.fileId, message.missing || []);
      break;
    }

    case "file_verified": {
      if (state.session.role !== "sender" || message.transferId !== state.transfer.transferId) {
        return;
      }
      const waiter = state.transfer.fileAckWaiters.get(message.fileId);
      if (!waiter) {
        state.transfer.fileAckResults.set(message.fileId, {
          ok: Boolean(message.ok),
          reason: message.reason || "verification_failed"
        });
        return;
      }
      state.transfer.fileAckWaiters.delete(message.fileId);
      if (message.ok) {
        waiter.resolve(true);
      } else {
        waiter.reject(new Error(message.reason || "verification_failed"));
      }
      break;
    }

    case "transfer_complete": {
      if (state.session.role === "receiver") {
        state.transfer.status = "completed";
        renderTransfer();
      }
      break;
    }

    default:
      break;
  }
}

async function handleDataChannelMessage(data) {
  if (typeof data === "string") {
    let message;
    try {
      message = JSON.parse(data);
    } catch {
      return;
    }
    if (message.channel === "control") {
      await handleDataControlMessage(message);
    }
    return;
  }

  if (data instanceof Blob) {
    await handleIncomingChunk(await data.arrayBuffer());
    return;
  }

  if (data instanceof ArrayBuffer) {
    await handleIncomingChunk(data);
  }
}

async function handleSignalMessage(msg) {
  if (msg.type === "connected") {
    log("Connected to signaling", { clientId: msg.clientId });
    return;
  }

  if (msg.type === "error") {
    log(`Server error: ${msg.code}`, { message: msg.message });
    if (msg.code === "invalid_passphrase") {
      showStatusBanner("Wrong passphrase. Please verify and retry.", "bad", false);
    }
    if (msg.code === "invalid_join_auth" || msg.code === "join_auth_required") {
      showStatusBanner("Room username/password check failed. Verify both values and retry.", "bad", false);
    }
    if (msg.code === "session_not_found" || msg.code === "invalid_reconnect_token") {
      clearSessionState();
      renderAll();
    }
    return;
  }

  if (msg.type === "session_created" || msg.type === "session_joined" || msg.type === "session_reconnected") {
    state.session.code = msg.code;
    state.session.role = msg.role;
    state.session.token = msg.token;
    state.session.expiresAt = msg.expiresAt;
    state.session.requiresPassphrase = Boolean(msg.requiresPassphrase);
    state.session.requiresJoinAuth = Boolean(msg.requiresJoinAuth);
    state.mode = msg.role;
    persistSession();
    renderAll();
    log(`Session ${msg.type}`, { code: msg.code, role: msg.role });

    const peerConnected = Boolean(msg.peerConnected);
    state.peerJoined = peerConnected;
    if (msg.role === "sender") {
      if (peerConnected) {
        schedulePeerRecovery();
      }
    } else if (peerConnected) {
      ensurePeerConnection();
    }
    renderAll();
    return;
  }

  if (msg.type === "peer_joined" || msg.type === "peer_reconnected") {
    state.peerJoined = true;
    schedulePeerRecovery();
    renderConnection();
    log(msg.type, { code: msg.code });
    if (state.session.role === "sender") {
      await createAndSendOffer();
    }
    return;
  }

  if (msg.type === "peer_left") {
    cancelPeerRecovery();
    state.peerJoined = false;
    teardownPeerConnection();
    state.transfer.status = "idle";
    renderAll();
    log("Peer left", { reason: msg.reason });
    return;
  }

  if (msg.type === "session_closed" || msg.type === "session_expired") {
    log(msg.type, { code: msg.code, reason: msg.reason });
    if (msg.type === "session_expired") {
      showStatusBanner("Room expired after inactivity. Create or join a new room to continue.", "bad", false);
    }
    clearSessionState();
    renderAll();
    return;
  }

  if (msg.type === "signal") {
    await handleWebRtcSignal(msg.signalType, msg.payload, msg.from);
    return;
  }
}

function renderMode() {
  els.modeSender.classList.toggle("active", state.mode === "sender");
  els.modeReceiver.classList.toggle("active", state.mode === "receiver");
  document.body.dataset.mode = state.mode;

  const role = state.session.role || state.mode;
  const senderVisible = role === "sender";

  els.senderControls.classList.toggle("hidden", !senderVisible);
  els.receiverControls.classList.toggle("hidden", senderVisible);
  els.senderTransfer.classList.toggle("hidden", !senderVisible);
  els.receiverTransfer.classList.toggle("hidden", senderVisible);
}

function renderSession() {
  els.roomCode.textContent = state.session.code || "- - - - - -";
  const roleLabel = state.session.role || "none";
  const lockParts = [];
  if (state.session.requiresPassphrase) {
    lockParts.push("passphrase");
  }
  if (state.session.requiresJoinAuth) {
    lockParts.push("username/password");
  }
  els.roleLabel.textContent = lockParts.length ? `${roleLabel} (locked: ${lockParts.join(" + ")})` : roleLabel;
  els.expiresLabel.textContent = formatExpiry(state.session.expiresAt);

  if (!state.session.code) {
    setChip(els.sessionState, "idle", "muted");
    return;
  }
  if (!state.peerJoined) {
    setChip(els.sessionState, "waiting", "warn");
    return;
  }
  setChip(els.sessionState, "connected", "ok");
}

function renderStatusBanner() {
  if (!state.wsConnected) {
    const remainingMs = state.wsReconnectAt ? Math.max(0, state.wsReconnectAt - Date.now()) : 0;
    const retryText = state.wsReconnectAt ? ` Auto-retry in ${formatSecondsLeft(remainingMs)}.` : "";
    showStatusBanner(`Signaling disconnected.${retryText} Transfers pause until reconnect.`, "bad", true);
    return;
  }

  if (state.session.code && state.peerJoined && !dataChannelReady() && state.rtc.pc?.connectionState !== "connected") {
    showStatusBanner("Re-establishing peer connection. Keep this tab open.", "warn", false);
    return;
  }

  if (state.session.code && !state.peerJoined) {
    showStatusBanner("Waiting for peer to join this room.", "muted", false);
    return;
  }

  if (state.transfer.status === "paused") {
    showStatusBanner("Transfer paused. Tap resume when ready.", "warn", false);
    return;
  }

  if (state.transfer.status === "awaiting_accept") {
    showStatusBanner("Offer sent. Waiting for receiver confirmation.", "muted", false);
    return;
  }

  if (state.transfer.status === "awaiting_channel") {
    showStatusBanner("Transfer is waiting for WebRTC channel to reconnect.", "warn", false);
    return;
  }

  hideStatusBanner();
}

function updateSelectedFiles(fileListLike) {
  state.selectedFiles = Array.from(fileListLike || []);
  renderSelectedFilesList();
  if (state.selectedFiles.length === 0) {
    els.selectedFilesLabel.textContent = "No files selected";
    els.clearFiles.disabled = true;
    renderTransfer();
    return;
  }

  const total = state.selectedFiles.reduce((sum, file) => sum + file.size, 0);
  els.selectedFilesLabel.textContent = `${state.selectedFiles.length} file(s) selected - ${formatBytes(total)}`;
  els.clearFiles.disabled = false;
  renderTransfer();
}

function addSelectedFiles(filesToAdd) {
  const merged = mergeFiles(state.selectedFiles, Array.from(filesToAdd || []));
  setFileInputFiles(merged);
  updateSelectedFiles(merged);
}

function renderConnection() {
  if (state.wsConnected) {
    els.wsState.textContent = "connected";
  } else if (state.wsReconnectAt) {
    els.wsState.textContent = `retrying in ${formatSecondsLeft(state.wsReconnectAt - Date.now())}`;
  } else {
    els.wsState.textContent = "disconnected";
  }
  els.peerState.textContent = state.peerJoined ? "joined" : "not joined";

  const pcState = state.rtc.pc?.connectionState || "new";
  const dcState = state.rtc.dc?.readyState || "closed";
  els.dcState.textContent = dcState;

  if (pcState === "connected") {
    setChip(els.rtcState, "connected", "ok");
  } else if (pcState === "connecting" || pcState === "new") {
    setChip(els.rtcState, "connecting", "warn");
  } else {
    setChip(els.rtcState, pcState, "bad");
  }
}

function makeFileItem(file, incoming = false) {
  const li = document.createElement("li");
  li.className = "file-item";
  li.dataset.status = normalizeStatusClass(file.status);

  const progress = file.size > 0 ? (file.receivedBytes || file.sentBytes || 0) / file.size : 0;
  const progressPct = formatPercent(progress * 100);

  const status = file.error ? `${file.status} (${file.error})` : file.status;
  const statusTag = String(file.status || "idle").replace(/_/g, " ");

  li.innerHTML = `
    <div class="file-item-head">
      <span class="file-name">${file.name}</span>
      <span>${progressPct}</span>
    </div>
    <div class="tiny">${formatBytes(file.receivedBytes || file.sentBytes || 0)} / ${formatBytes(file.size)}</div>
    <div class="progress-track"><div class="progress-bar" style="width:${Math.min(progress * 100, 100)}%"></div></div>
    <div class="tiny"><span class="status-pill status-pill-${normalizeStatusClass(file.status)}">${statusTag}</span> ${status}</div>
  `;

  if (incoming && file.downloadUrl && file.status === "verified") {
    const actions = document.createElement("div");
    actions.className = "file-actions";

    const link = document.createElement("a");
    link.href = file.downloadUrl;
    link.download = file.name;
    link.textContent = "Download";
    actions.appendChild(link);

    li.appendChild(actions);
  }

  return li;
}

function renderTransfer() {
  const status = state.transfer.status;
  updateTransferPanelVisualState(status);
  if (status === "completed") {
    setChip(els.transferState, "completed", "ok");
  } else if (status === "failed" || status === "cancelled") {
    setChip(els.transferState, status, "bad");
  } else if (status === "transferring" || status === "receiving" || status === "hashing" || status === "paused" || status === "awaiting_channel" || status === "awaiting_accept") {
    setChip(els.transferState, status, "warn");
  } else {
    setChip(els.transferState, status, "muted");
  }

  const outgoingDone = state.transfer.outgoingSentBytes;
  const outgoingTotal = state.transfer.outgoingTotalBytes;
  const incomingDone = state.transfer.incoming?.receivedBytes || 0;
  const incomingTotal = state.transfer.incoming?.totalBytes || 0;

  const done = Math.max(outgoingDone, incomingDone);
  const total = Math.max(outgoingTotal, incomingTotal, 1);
  const progress = total > 0 ? (done / total) * 100 : 0;

  els.overallProgressBar.style.width = `${Math.min(progress, 100)}%`;
  els.overallProgressLabel.textContent = formatPercent(progress);
  els.overallBytes.textContent = `${formatBytes(done)} / ${formatBytes(total === 1 && done === 0 ? 0 : total)}`;

  els.outgoingList.replaceChildren(...state.transfer.outgoing.map((file) => makeFileItem(file)));

  const incomingList = [];
  if (state.transfer.incoming) {
    for (const id of state.transfer.incoming.order) {
      const file = state.transfer.incoming.files.get(id);
      if (file) {
        incomingList.push(makeFileItem(file, true));
      }
    }
  }
  els.incomingList.replaceChildren(...incomingList);
  updateTransferEmptyStates(state.transfer.outgoing.length, incomingList.length);

  const senderRole = (state.session.role || state.mode) === "sender";
  els.startTransfer.disabled = !senderRole || !dataChannelReady() || !state.selectedFiles.length || state.transfer.running || isTransferBusyStatus(status);
  els.pauseTransfer.disabled = !senderRole || !state.transfer.running || state.transfer.paused;
  els.resumeTransfer.disabled = !senderRole || !state.transfer.running || !state.transfer.paused;
  els.cancelTransfer.disabled = !state.transfer.running && status !== "receiving";
}

function renderAll() {
  renderMode();
  renderSession();
  renderConnection();
  renderTransfer();
  renderStatusBanner();
}

async function onCreateSession() {
  if (!state.wsConnected) {
    log("Cannot create session: signaling is offline");
    return;
  }

  const passphrase = els.createPassphrase.value;
  if (passphrase.length > state.maxPassphraseLength) {
    log(`Passphrase too long. Max ${state.maxPassphraseLength} chars.`);
    return;
  }

  let joinAuth;
  try {
    joinAuth = normalizeJoinAuthInput(els.createJoinAuthUsername.value, els.createJoinAuthPassword.value);
  } catch {
    log("Join auth requires both username and password, or neither");
    showStatusBanner("Set both room username and room password, or leave both empty.", "bad", false);
    return;
  }

  sendWs({ type: "create_session", passphrase, joinAuth });
}

async function onJoinSession() {
  const code = els.joinCode.value.replace(/\D/g, "").slice(0, 6);
  els.joinCode.value = code;
  if (code.length !== 6) {
    log("Room code must be 6 digits");
    return;
  }
  const passphrase = els.joinPassphrase.value;
  if (passphrase.length > state.maxPassphraseLength) {
    log(`Passphrase too long. Max ${state.maxPassphraseLength} chars.`);
    return;
  }

  let joinAuth;
  try {
    joinAuth = normalizeJoinAuthInput(els.joinAuthUsername.value, els.joinAuthPassword.value);
  } catch {
    log("Join auth requires both username and password, or neither");
    showStatusBanner("Enter both room username and room password to use room auth.", "bad", false);
    return;
  }

  sendWs({ type: "join_session", code, passphrase, joinAuth });
}

function onLeaveSession() {
  cancelWsReconnect();
  cancelPeerRecovery();
  if (state.session.code) {
    sendWs({ type: "leave_session" });
  }
  if (state.ws && state.ws.readyState === WebSocket.OPEN) {
    state.wsSuppressReconnect = true;
    state.ws.close();
  }
  clearSessionState();
  renderAll();
  connectSignaling();
}

async function onStartTransfer() {
  if (state.session.role !== "sender") {
    log("Only sender can start transfer");
    return;
  }
  if (!dataChannelReady()) {
    log("DataChannel is not open");
    return;
  }

  const files = state.selectedFiles;
  if (!files || files.length === 0) {
    log("Select one or more files first");
    return;
  }

  if (isTransferBusyStatus(state.transfer.status) || state.transfer.running) {
    log("Transfer already in progress or pending. Wait for current flow to finish.");
    return;
  }

  resetTransferState();

  state.transfer.chunkSize = Number(els.chunkSize.value || DEFAULT_CHUNK_SIZE);
  if (state.transfer.chunkSize > 64 * 1024) {
    log("Large chunks may destabilize long transfers. Recommended: 16-64 KB for multi-GB files.");
  }
  const plan = buildOutgoingPlan(files, state.transfer.chunkSize);
  state.transfer.outgoing = plan.outgoing;
  state.transfer.outgoingTotalBytes = plan.totalBytes;
  state.transfer.transferId = randomId();
  state.transfer.status = "preparing";
  renderTransfer();

  try {
    await prepareOutgoingHashes();
    sendControl({
      type: "transfer_offer",
      transferId: state.transfer.transferId,
      chunkSize: state.transfer.chunkSize,
      files: state.transfer.outgoing.map((file) => ({
        id: file.id,
        name: file.name,
        size: file.size,
        mimeType: file.type,
        sha256: file.sha256,
        totalChunks: file.totalChunks
      }))
    });
    state.transfer.status = "awaiting_accept";
    renderTransfer();
    log("Transfer offer sent", { files: state.transfer.outgoing.length, transferId: state.transfer.transferId });
  } catch (error) {
    state.transfer.status = "failed";
    const readable = normalizeHashReadError(error);
    showStatusBanner(readable, "bad", false);
    log("Transfer prepare failed", { message: readable });
    renderTransfer();
  }
}

function onPauseTransfer() {
  if (!state.transfer.running) {
    return;
  }
  state.transfer.paused = true;
  state.transfer.status = "paused";
  try {
    sendControl({ type: "transfer_pause", transferId: state.transfer.transferId });
  } catch {
    // no-op
  }
  renderTransfer();
}

function onResumeTransfer() {
  if (!state.transfer.running) {
    return;
  }
  state.transfer.paused = false;
  state.transfer.status = "transferring";
  try {
    sendControl({ type: "transfer_resume", transferId: state.transfer.transferId });
  } catch {
    // no-op
  }
  renderTransfer();
}

function onCancelTransfer() {
  state.transfer.cancelled = true;
  state.transfer.status = "cancelled";
  try {
    sendControl({ type: "transfer_cancel", transferId: state.transfer.transferId });
  } catch {
    // no-op
  }
  state.transfer.fileAckWaiters.forEach((waiter) => waiter.reject(new Error("transfer_cancelled")));
  state.transfer.fileAckWaiters.clear();
  renderTransfer();
}

function wireEvents() {
  els.themeToggle?.addEventListener("click", toggleTheme);

  els.modeSender.addEventListener("click", () => {
    state.mode = "sender";
    renderMode();
  });

  els.modeReceiver.addEventListener("click", () => {
    state.mode = "receiver";
    renderMode();
  });

  els.createSession.addEventListener("click", () => {
    void onCreateSession();
  });

  els.joinSession.addEventListener("click", () => {
    void onJoinSession();
  });

  els.joinCode.addEventListener("input", () => {
    els.joinCode.value = els.joinCode.value.replace(/\D/g, "").slice(0, 6);
  });

  els.createPassphrase.addEventListener("input", () => {
    if (els.createPassphrase.value.length > state.maxPassphraseLength) {
      els.createPassphrase.value = els.createPassphrase.value.slice(0, state.maxPassphraseLength);
    }
  });

  els.joinPassphrase.addEventListener("input", () => {
    if (els.joinPassphrase.value.length > state.maxPassphraseLength) {
      els.joinPassphrase.value = els.joinPassphrase.value.slice(0, state.maxPassphraseLength);
    }
  });

  [els.createJoinAuthUsername, els.joinAuthUsername].forEach((input) => {
    input.addEventListener("input", () => {
      input.value = trimToLength(input.value, state.maxJoinAuthUsernameLength);
    });
  });

  [els.createJoinAuthPassword, els.joinAuthPassword].forEach((input) => {
    input.addEventListener("input", () => {
      input.value = trimToLength(input.value, state.maxJoinAuthPasswordLength);
    });
  });

  els.leaveSession.addEventListener("click", onLeaveSession);

  els.dropzone.addEventListener("click", () => {
    els.fileInput.click();
  });

  els.browseFiles?.addEventListener("click", () => {
    els.fileInput.click();
  });

  els.dropzone.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      els.fileInput.click();
    }
  });

  els.fileInput.addEventListener("change", () => {
    addSelectedFiles(els.fileInput.files);
    els.fileInput.value = "";
  });

  els.dropzone.addEventListener("dragenter", (event) => {
    event.preventDefault();
    event.stopPropagation();
    state.dropzoneDragDepth += 1;
    els.dropzone.classList.add("dragover");
  });

  els.dropzone.addEventListener("dragover", (event) => {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "copy";
  });

  els.dropzone.addEventListener("dragleave", (event) => {
    event.preventDefault();
    event.stopPropagation();
    state.dropzoneDragDepth = Math.max(0, state.dropzoneDragDepth - 1);
    if (state.dropzoneDragDepth === 0) {
      els.dropzone.classList.remove("dragover");
    }
  });

  els.dropzone.addEventListener("drop", (event) => {
    event.preventDefault();
    event.stopPropagation();
    state.dropzoneDragDepth = 0;
    els.dropzone.classList.remove("dragover");

    const dropped = Array.from(event.dataTransfer?.files || []);
    if (!dropped.length) {
      return;
    }

    addSelectedFiles(dropped);
  });

  els.clearFiles.addEventListener("click", () => {
    state.selectedFiles = [];
    els.fileInput.value = "";
    updateSelectedFiles([]);
  });

  els.startTransfer.addEventListener("click", () => {
    void onStartTransfer();
  });

  els.pauseTransfer.addEventListener("click", onPauseTransfer);
  els.resumeTransfer.addEventListener("click", onResumeTransfer);
  els.cancelTransfer.addEventListener("click", onCancelTransfer);

  els.clearLog.addEventListener("click", () => {
    els.logOutput.textContent = "";
  });

  els.reconnectNow.addEventListener("click", reconnectNow);

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      return;
    }

    if (state.session.role === "sender" && state.transfer.running && !state.transfer.paused) {
      onPauseTransfer();
      log("Tab backgrounded: transfer paused for reliability");
    }
  });

  window.addEventListener("beforeunload", () => {
    if (state.session.code) {
      state.wsSuppressReconnect = true;
      sendWs({ type: "leave_session" });
    }
  });
}

async function boot() {
  applyTheme(readStoredTheme(), false);
  wireEvents();
  updateDropzoneCopy();
  updateSelectedFiles([]);
  if (els.chunkSize && !els.chunkSize.value) {
    els.chunkSize.value = String(DEFAULT_CHUNK_SIZE);
  }
  renderAll();
  await loadServerConfig();
  connectSignaling();
  log("0xLynk client ready");
}

void boot();
