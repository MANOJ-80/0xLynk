const STORAGE_KEY = "0xlynk.session.v1";
const THEME_STORAGE_KEY = "0xlynk.theme.v1";
const RECEIVE_POLICY_STORAGE_KEY = "0xlynk.receive-policy.v1";
const DEFAULT_THEME = "night";
const THEMES = {
  night: { label: "Night", iconHref: "#icon-moon" },
  day: { label: "Day", iconHref: "#icon-sun" }
};
const FALLBACK_ICE_SERVERS = [
  {
    urls: [
      "stun:stun.l.google.com:19302",
      "stun:stun.l.google.com:19305",
      "stun:stun4.l.google.com:19302",
      "stun:stun.nextcloud.com:3478",
      "stun:stun.nextcloud.com:443",
      "stun:stun.sipgate.net:3478"
    ]
  }
];
const RELAY_CHUNK_MAX_BYTES = 12 * 1024;
const DEFAULT_MAX_BUFFERED_BYTES = 8 * 1024 * 1024;
const DEFAULT_BUFFERED_LOW_WATERMARK = 4 * 1024 * 1024;
const CHUNK_HEADER_SIZE = 13;
const HASH_READ_CHUNK_BYTES = 4 * 1024 * 1024;
const TELEMETRY_INTERVAL_MS = 1000;
const FLOW_RTT_SLOW_MS = 180;
const FLOW_RTT_FAST_MS = 60;
const AUTO_CHUNK_SIZE = 32 * 1024;
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
const MANUAL_PAYLOAD_PREFIX = "0XL1.";
const MANUAL_ICE_GATHER_TIMEOUT_MS = 5500;
const MANUAL_QR_DENSE_CHARS = 2400;

const els = {
  modeSender: document.getElementById("mode-sender"),
  modeReceiver: document.getElementById("mode-receiver"),
  connectionRoom: document.getElementById("connection-room"),
  connectionManual: document.getElementById("connection-manual"),
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
  manualControls: document.getElementById("manual-controls"),
  manualSenderPanel: document.getElementById("manual-sender-panel"),
  manualReceiverPanel: document.getElementById("manual-receiver-panel"),
  manualRoleTitle: document.getElementById("manual-role-title"),
  manualStepChip: document.getElementById("manual-step-chip"),
  manualBusy: document.getElementById("manual-busy"),
  manualBusyText: document.getElementById("manual-busy-text"),
  manualCreateOffer: document.getElementById("manual-create-offer"),
  manualOfferOutput: document.getElementById("manual-offer-output"),
  manualOfferInput: document.getElementById("manual-offer-input"),
  manualAcceptOffer: document.getElementById("manual-accept-offer"),
  manualAnswerOutput: document.getElementById("manual-answer-output"),
  manualAnswerInput: document.getElementById("manual-answer-input"),
  manualAcceptAnswer: document.getElementById("manual-accept-answer"),
  manualCopyOffer: document.getElementById("manual-copy-offer"),
  manualCopyAnswer: document.getElementById("manual-copy-answer"),
  manualScanOffer: document.getElementById("manual-scan-offer"),
  manualScanAnswer: document.getElementById("manual-scan-answer"),
  manualScanner: document.getElementById("manual-scanner"),
  manualScannerVideo: document.getElementById("manual-scanner-video"),
  manualScannerStatus: document.getElementById("manual-scanner-status"),
  manualStopScan: document.getElementById("manual-stop-scan"),
  manualOfferQr: document.getElementById("manual-offer-qr"),
  manualAnswerQr: document.getElementById("manual-answer-qr"),
  manualStatus: document.getElementById("manual-status"),
  senderTransfer: document.getElementById("sender-transfer"),
  receiverTransfer: document.getElementById("receiver-transfer"),
  fileInput: document.getElementById("file-input"),
  dropzone: document.getElementById("dropzone"),
  selectedFilesLabel: document.getElementById("selected-files-label"),
  selectedFilesList: document.getElementById("selected-files-list"),
  browseFiles: document.getElementById("browse-files"),
  clearFiles: document.getElementById("clear-files"),
  chunkSize: document.getElementById("chunk-size"),
  chooseSaveDir: document.getElementById("choose-save-dir"),
  saveDirLabel: document.getElementById("save-dir-label"),
  receiveAutoAccept: document.getElementById("receive-auto-accept"),
  receiveMaxFileSize: document.getElementById("receive-max-file-size"),
  receiveMaxFileCount: document.getElementById("receive-max-file-count"),
  receivePendingOffer: document.getElementById("receive-pending-offer"),
  receivePendingSummary: document.getElementById("receive-pending-summary"),
  receiveAcceptOffer: document.getElementById("receive-accept-offer"),
  receiveRejectOffer: document.getElementById("receive-reject-offer"),
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
  transferPanel: document.getElementById("transfer-panel"),
  telemetrySpeed: document.getElementById("telemetry-speed"),
  telemetryRtt: document.getElementById("telemetry-rtt"),
  telemetryPath: document.getElementById("telemetry-path"),
  telemetryBuffer: document.getElementById("telemetry-buffer")
};

const state = {
  mode: "sender",
  connectionMode: "room",
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
  rtcFailureTimestamps: [],
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
  manual: {
    offerText: "",
    answerText: "",
    status: "idle",
    busy: false,
    scannerStream: null,
    scannerTimer: null,
    scannerTarget: null
  },
  receivePolicy: {
    autoAccept: true,
    maxFileSizeBytes: 0,
    maxFileCount: 0,
    pendingOffer: null
  },
  rtc: {
    pc: null,
    dc: null,
    makingOffer: false,
    ignoreOffer: false
  },
  transfer: {
    status: "idle",
    transport: "webrtc",
    chunkSize: DEFAULT_CHUNK_SIZE,
    adaptiveChunkSize: true,
    maxBufferedBytes: DEFAULT_MAX_BUFFERED_BYTES,
    lowWatermarkBytes: DEFAULT_BUFFERED_LOW_WATERMARK,
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
    telemetryTimer: null,
    messageQueue: Promise.resolve(),
    saveDirectoryHandle: null,
    incoming: null,
    fileAckWaiters: new Map(),
    fileAckResults: new Map(),
    telemetry: {
      startedAt: 0,
      completedAt: 0,
      lastSampleAt: 0,
      lastBytesDone: 0,
      currentBps: 0,
      averageBps: 0,
      bufferedAmount: 0,
      rttMs: null,
      availableOutgoingBps: null,
      path: "unknown",
      candidateType: "unknown",
      chunksSent: 0,
      chunksReceived: 0,
      retries: 0,
      diskWrites: 0
    }
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

function formatRate(bytesPerSecond) {
  if (!bytesPerSecond || bytesPerSecond < 1) {
    return "-";
  }
  return `${formatBytes(bytesPerSecond)}/s`;
}

function resetTelemetry() {
  state.transfer.telemetry = {
    startedAt: 0,
    completedAt: 0,
    lastSampleAt: 0,
    lastBytesDone: 0,
    currentBps: 0,
    averageBps: 0,
    bufferedAmount: 0,
    rttMs: null,
    availableOutgoingBps: null,
    path: "unknown",
    candidateType: "unknown",
    chunksSent: 0,
    chunksReceived: 0,
    retries: 0,
    diskWrites: 0
  };
}

function currentTransferBytesDone() {
  return Math.max(state.transfer.outgoingSentBytes, state.transfer.incoming?.receivedBytes || 0);
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
  return ["preparing", "awaiting_accept", "awaiting_channel", "transferring"].includes(status);
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
  stopTelemetry();
  if (state.transfer.renderTimer) {
    clearTimeout(state.transfer.renderTimer);
    state.transfer.renderTimer = null;
  }
  state.transfer.status = "idle";
  state.transfer.transport = "webrtc";
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
  state.transfer.messageQueue = Promise.resolve();
  state.transfer.maxBufferedBytes = DEFAULT_MAX_BUFFERED_BYTES;
  state.transfer.lowWatermarkBytes = DEFAULT_BUFFERED_LOW_WATERMARK;
  state.transfer.fileAckWaiters.forEach((waiter) => waiter.reject(new Error("transfer_reset")));
  state.transfer.fileAckWaiters.clear();
  state.transfer.fileAckResults.clear();
  state.receivePolicy.pendingOffer = null;
  state.rtcFailureTimestamps = [];
  state.dcFlapTimestamps = [];

  if (state.transfer.incoming?.files) {
    state.transfer.incoming.files.forEach((file) => {
      if (file.downloadUrl) {
        URL.revokeObjectURL(file.downloadUrl);
      }
      if (file.writer) {
        void file.writer.abort().catch(() => {});
      }
    });
  }

  state.transfer.incoming = null;
  resetTelemetry();
  renderTransfer();
}

function sendWs(payload) {
  if (!state.ws || state.ws.readyState !== WebSocket.OPEN) {
    return false;
  }
  state.ws.send(JSON.stringify(payload));
  return true;
}

function canUseRelayTransport() {
  if (isManualMode()) {
    return false;
  }
  return Boolean(state.wsConnected && state.session.code && state.peerJoined);
}

function markRtcFailure() {
  const nowTs = Date.now();
  state.rtcFailureTimestamps = state.rtcFailureTimestamps.filter((ts) => nowTs - ts <= 45_000);
  state.rtcFailureTimestamps.push(nowTs);
}

function shouldAutoFallbackToRelay() {
  return state.rtcFailureTimestamps.length >= 2 && canUseRelayTransport();
}

function uint8ToBase64(bytes) {
  let binary = "";
  const batch = 0x8000;
  for (let i = 0; i < bytes.length; i += batch) {
    const slice = bytes.subarray(i, i + batch);
    binary += String.fromCharCode(...slice);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function base64UrlEncode(bytes) {
  return uint8ToBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(text) {
  const normalized = String(text || "").replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return new Uint8Array(base64ToArrayBuffer(padded));
}

async function gzipText(text) {
  if (typeof CompressionStream !== "function") {
    return new TextEncoder().encode(text);
  }
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream("gzip"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function gunzipText(bytes) {
  if (typeof DecompressionStream !== "function") {
    return new TextDecoder().decode(bytes);
  }
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
  return new Response(stream).text();
}

async function encodeManualPayload(type, description) {
  const payload = {
    v: 1,
    type,
    description
  };
  const compressed = await gzipText(JSON.stringify(payload));
  return `${MANUAL_PAYLOAD_PREFIX}${base64UrlEncode(compressed)}`;
}

async function decodeManualPayload(rawText, expectedType) {
  const text = String(rawText || "").trim();
  if (!text.startsWith(MANUAL_PAYLOAD_PREFIX)) {
    throw new Error("manual_payload_format");
  }
  const bytes = base64UrlDecode(text.slice(MANUAL_PAYLOAD_PREFIX.length));
  const json = await gunzipText(bytes);
  const payload = JSON.parse(json);
  if (!payload || payload.v !== 1 || payload.type !== expectedType || !payload.description) {
    throw new Error("manual_payload_type");
  }
  return payload.description;
}

function waitForIceGatheringComplete(pc) {
  if (pc.iceGatheringState === "complete") {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) {
        return;
      }
      done = true;
      pc.removeEventListener("icegatheringstatechange", onStateChange);
      clearTimeout(timer);
      resolve();
    };
    const onStateChange = () => {
      if (pc.iceGatheringState === "complete") {
        finish();
      }
    };
    const timer = setTimeout(finish, MANUAL_ICE_GATHER_TIMEOUT_MS);
    pc.addEventListener("icegatheringstatechange", onStateChange);
  });
}

function resetManualOutputs() {
  stopManualScan();
  setManualBusy(false);
  state.manual.offerText = "";
  state.manual.answerText = "";
  if (els.manualOfferOutput) {
    els.manualOfferOutput.value = "";
  }
  if (els.manualAnswerOutput) {
    els.manualAnswerOutput.value = "";
  }
  renderManualQr(els.manualOfferQr, "");
  renderManualQr(els.manualAnswerQr, "");
}

function setManualStatus(message) {
  state.manual.status = message;
  if (els.manualStatus) {
    els.manualStatus.textContent = message;
  }
}

function setManualBusy(isBusy, message = "Gathering network candidates...") {
  state.manual.busy = Boolean(isBusy);
  if (els.manualBusy) {
    els.manualBusy.classList.toggle("hidden", !isBusy);
  }
  if (els.manualBusyText) {
    els.manualBusyText.textContent = message;
  }
  if (els.manualCreateOffer) {
    els.manualCreateOffer.disabled = state.manual.busy;
    els.manualCreateOffer.textContent = state.manual.busy && state.session.role === "sender" ? "Preparing offer..." : "Create offer";
  }
  if (els.manualAcceptOffer) {
    els.manualAcceptOffer.disabled = state.manual.busy;
    els.manualAcceptOffer.textContent = state.manual.busy && state.session.role === "receiver" ? "Preparing answer..." : "Create answer";
  }
}

function describeManualPayload(text) {
  if (!text) {
    return "";
  }
  if (text.length >= MANUAL_QR_DENSE_CHARS) {
    return " QR may be dense on low-end cameras; copy/paste is the fallback.";
  }
  return "";
}

function renderManualQr(canvas, text) {
  if (!canvas) {
    return;
  }
  if (!text) {
    canvas.classList.add("hidden");
    return;
  }
  if (!window.QRCode || typeof window.QRCode.toCanvas !== "function") {
    canvas.classList.add("hidden");
    return;
  }
  window.QRCode.toCanvas(canvas, text, {
    width: 220,
    margin: 1,
    errorCorrectionLevel: "M",
    color: {
      dark: "#0a0a0a",
      light: "#ffffff"
    }
  }, (error) => {
    canvas.classList.toggle("hidden", Boolean(error));
    if (error) {
      log("QR render failed", { message: error.message });
    }
  });
}

function stopManualScan() {
  if (state.manual.scannerTimer) {
    clearInterval(state.manual.scannerTimer);
    state.manual.scannerTimer = null;
  }
  if (state.manual.scannerStream) {
    state.manual.scannerStream.getTracks().forEach((track) => track.stop());
    state.manual.scannerStream = null;
  }
  state.manual.scannerTarget = null;
  if (els.manualScannerVideo) {
    els.manualScannerVideo.srcObject = null;
  }
  if (els.manualScanner) {
    els.manualScanner.classList.add("hidden");
  }
}

async function startManualScan(target) {
  stopManualScan();
  if (!("BarcodeDetector" in window)) {
    setManualStatus("QR scanning is not supported in this browser. Paste the QR text instead.");
    return;
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    setManualStatus("Camera access is not available. Paste the QR text instead.");
    return;
  }

  try {
    const detector = new BarcodeDetector({ formats: ["qr_code"] });
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "environment"
      },
      audio: false
    });
    state.manual.scannerStream = stream;
    state.manual.scannerTarget = target;
    els.manualScannerVideo.srcObject = stream;
    els.manualScanner.classList.remove("hidden");
    els.manualScannerStatus.textContent = `Scanning ${target} QR...`;
    await els.manualScannerVideo.play();

    state.manual.scannerTimer = setInterval(async () => {
      if (!state.manual.scannerStream || els.manualScannerVideo.readyState < 2) {
        return;
      }
      try {
        const codes = await detector.detect(els.manualScannerVideo);
        const value = String(codes[0]?.rawValue || "").trim();
        if (!value) {
          return;
        }
        if (!value.startsWith(MANUAL_PAYLOAD_PREFIX)) {
          els.manualScannerStatus.textContent = "QR found, but it is not a 0xLynk pairing code.";
          return;
        }
        if (target === "offer") {
          els.manualOfferInput.value = value;
        } else {
          els.manualAnswerInput.value = value;
        }
        stopManualScan();
        setManualStatus(`${target === "offer" ? "Offer" : "Answer"} QR scanned. Continue with the next pairing step.`);
      } catch {
        // Camera frames can fail transiently; keep scanning.
      }
    }, 350);
  } catch (error) {
    stopManualScan();
    const denied = error?.name === "NotAllowedError" || error?.name === "SecurityError";
    setManualStatus(denied ? "Camera permission denied. Paste the QR text instead." : "Could not start camera scanner. Paste the QR text instead.");
    log("Manual QR scan failed", { message: error.message || "unknown" });
  }
}

async function copyText(text, label) {
  if (!text) {
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    log(`${label} copied`);
  } catch {
    log(`Could not copy ${label.toLowerCase()}`);
  }
}

function isManualMode() {
  return state.connectionMode === "manual";
}

function sendRelay(relayType, payload) {
  if (!canUseRelayTransport()) {
    throw new Error("relay_not_ready");
  }
  const ok = sendWs({ type: "relay", relayType, payload });
  if (!ok) {
    throw new Error("relay_not_ready");
  }
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
  if (isManualMode()) {
    return;
  }
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
    state.transfer.transport = "webrtc";
    state.rtcFailureTimestamps = [];
    state.dcFlapTimestamps = [];
    applyFlowControlProfile();
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
    state.transfer.messageQueue = state.transfer.messageQueue
      .then(() => handleDataChannelMessage(event.data))
      .catch((error) => {
        log("DataChannel message handling failed", { message: error.message });
      });
  });
}

function ensurePeerConnection() {
  if (state.rtc.pc) {
    return state.rtc.pc;
  }

  const pc = new RTCPeerConnection({ iceServers: buildIceServers() });
  state.rtc.pc = pc;

  pc.addEventListener("icecandidate", (event) => {
    if (!event.candidate || !state.session.code || isManualMode()) {
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
      if (pc.connectionState === "failed") {
        markRtcFailure();
        if (isManualMode()) {
          showStatusBanner("Direct manual P2P failed. Try a fresh offer, use room mode, or configure TURN for strict NAT/firewall networks.", "bad", false);
          setManualStatus("Direct WebRTC failed. This usually means restrictive NAT/firewall; TURN is the reliable fallback.");
        }
      }
      if (shouldAutoFallbackToRelay()) {
        state.transfer.transport = "relay";
        showStatusBanner("Direct P2P failed on this network. Using relay fallback via signaling (slower).", "warn", false);
        log("Relay fallback enabled", { reason: "rtc_failed" });
      }
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

function enterManualSession(role) {
  cancelPeerRecovery();
  stopManualScan();
  state.connectionMode = "manual";
  state.mode = role;
  state.session = {
    code: "manual",
    role,
    token: null,
    expiresAt: null,
    requiresPassphrase: false,
    requiresJoinAuth: false
  };
  state.peerJoined = false;
  localStorage.removeItem(STORAGE_KEY);
  renderAll();
}

async function createManualOffer() {
  enterManualSession("sender");
  resetTransferState();
  resetManualOutputs();
  teardownPeerConnection();
  const pc = ensurePeerConnection();
  setupDataChannel(pc.createDataChannel("file-transfer", { ordered: true }));
  try {
    state.rtc.makingOffer = true;
    setManualBusy(true, "Gathering direct network candidates. This can take a few seconds.");
    setManualStatus("Preparing offer...");
    await pc.setLocalDescription(await pc.createOffer());
    await waitForIceGatheringComplete(pc);
    const encoded = await encodeManualPayload("offer", pc.localDescription);
    state.manual.offerText = encoded;
    els.manualOfferOutput.value = encoded;
    renderManualQr(els.manualOfferQr, encoded);
    setManualStatus(`Offer ready (${encoded.length} chars). Share the text or QR with the receiver, then paste their answer.${describeManualPayload(encoded)}`);
    log("Manual offer created", { chars: encoded.length });
  } catch (error) {
    setManualStatus("Could not create manual offer. Check browser WebRTC support and retry.");
    log("Manual offer failed", { message: error.message });
  } finally {
    state.rtc.makingOffer = false;
    setManualBusy(false);
    renderAll();
  }
}

async function createManualAnswer() {
  const rawOffer = els.manualOfferInput.value.trim();
  if (!rawOffer) {
    setManualStatus("Paste a sender offer before creating an answer.");
    return;
  }

  enterManualSession("receiver");
  resetTransferState();
  state.manual.answerText = "";
  els.manualAnswerOutput.value = "";
  renderManualQr(els.manualAnswerQr, "");
  teardownPeerConnection();
  const pc = ensurePeerConnection();
  try {
    setManualBusy(true, "Reading offer and gathering direct network candidates.");
    setManualStatus("Preparing answer...");
    const offer = await decodeManualPayload(rawOffer, "offer");
    await pc.setRemoteDescription(offer);
    await pc.setLocalDescription(await pc.createAnswer());
    await waitForIceGatheringComplete(pc);
    const encoded = await encodeManualPayload("answer", pc.localDescription);
    state.manual.answerText = encoded;
    els.manualAnswerOutput.value = encoded;
    renderManualQr(els.manualAnswerQr, encoded);
    state.peerJoined = true;
    setManualStatus(`Answer ready (${encoded.length} chars). Share it back to the sender and keep this tab open.${describeManualPayload(encoded)}`);
    log("Manual answer created", { chars: encoded.length });
  } catch (error) {
    setManualStatus("Could not read that offer. Ask the sender to create a fresh offer.");
    log("Manual answer failed", { message: error.message });
  } finally {
    setManualBusy(false);
    renderAll();
  }
}

async function acceptManualAnswer() {
  const rawAnswer = els.manualAnswerInput.value.trim();
  if (!rawAnswer) {
    setManualStatus("Paste the receiver answer before connecting.");
    return;
  }
  if (state.session.role !== "sender" || !state.rtc.pc) {
    setManualStatus("Create an offer first, then paste the receiver answer.");
    return;
  }

  try {
    setManualBusy(true, "Applying receiver answer.");
    setManualStatus("Applying receiver answer...");
    const answer = await decodeManualPayload(rawAnswer, "answer");
    await state.rtc.pc.setRemoteDescription(answer);
    state.peerJoined = true;
    setManualStatus("Manual peer connection started. Wait for the DataChannel to open.");
    log("Manual answer accepted");
  } catch (error) {
    setManualStatus("Could not read that answer. Ask the receiver to create a fresh answer.");
    log("Manual answer import failed", { message: error.message });
  } finally {
    setManualBusy(false);
    renderAll();
  }
}

function dataChannelReady() {
  return Boolean(state.rtc.dc && state.rtc.dc.readyState === "open");
}

function applyFlowControlProfile() {
  const telemetry = state.transfer.telemetry;
  const rtt = telemetry.rttMs || 0;
  const relay = telemetry.candidateType === "relay" || telemetry.path === "relay";
  let maxBufferedBytes = DEFAULT_MAX_BUFFERED_BYTES;
  let lowWatermarkBytes = DEFAULT_BUFFERED_LOW_WATERMARK;

  if (relay || rtt >= FLOW_RTT_SLOW_MS) {
    maxBufferedBytes = 2 * 1024 * 1024;
    lowWatermarkBytes = 512 * 1024;
  } else if (rtt > 0 && rtt <= FLOW_RTT_FAST_MS) {
    maxBufferedBytes = 12 * 1024 * 1024;
    lowWatermarkBytes = 6 * 1024 * 1024;
  }

  state.transfer.maxBufferedBytes = maxBufferedBytes;
  state.transfer.lowWatermarkBytes = lowWatermarkBytes;
  if (state.rtc.dc) {
    state.rtc.dc.bufferedAmountLowThreshold = lowWatermarkBytes;
  }
}

async function samplePeerStats() {
  const pc = state.rtc.pc;
  if (!pc || typeof pc.getStats !== "function") {
    return;
  }

  try {
    const report = await pc.getStats();
    let selectedPair = null;
    const localCandidates = new Map();
    const remoteCandidates = new Map();

    report.forEach((entry) => {
      if (entry.type === "local-candidate") {
        localCandidates.set(entry.id, entry);
      } else if (entry.type === "remote-candidate") {
        remoteCandidates.set(entry.id, entry);
      } else if (entry.type === "candidate-pair" && (entry.selected || entry.nominated) && entry.state === "succeeded") {
        selectedPair = entry;
      } else if (entry.type === "transport" && entry.selectedCandidatePairId) {
        selectedPair = report.get(entry.selectedCandidatePairId) || selectedPair;
      }
    });

    if (!selectedPair) {
      return;
    }

    const local = localCandidates.get(selectedPair.localCandidateId);
    const remote = remoteCandidates.get(selectedPair.remoteCandidateId);
    const candidateType = local?.candidateType || remote?.candidateType || "unknown";

    state.transfer.telemetry.rttMs = Number.isFinite(selectedPair.currentRoundTripTime)
      ? Math.round(selectedPair.currentRoundTripTime * 1000)
      : state.transfer.telemetry.rttMs;
    state.transfer.telemetry.availableOutgoingBps = Number.isFinite(selectedPair.availableOutgoingBitrate)
      ? selectedPair.availableOutgoingBitrate / 8
      : state.transfer.telemetry.availableOutgoingBps;
    state.transfer.telemetry.candidateType = candidateType;
    state.transfer.telemetry.path = candidateType === "relay" ? "relay" : candidateType === "unknown" ? "unknown" : "direct";
    applyFlowControlProfile();
  } catch {
    // Stats support varies by browser; telemetry is best-effort.
  }
}

function sampleTransferTelemetry() {
  const nowTs = Date.now();
  const telemetry = state.transfer.telemetry;
  const bytesDone = currentTransferBytesDone();
  const elapsedMs = telemetry.startedAt ? Math.max(1, nowTs - telemetry.startedAt) : 0;

  if (!telemetry.startedAt && (state.transfer.running || state.transfer.status === "receiving")) {
    telemetry.startedAt = nowTs;
  }

  if (telemetry.lastSampleAt) {
    const deltaMs = Math.max(1, nowTs - telemetry.lastSampleAt);
    const deltaBytes = Math.max(0, bytesDone - telemetry.lastBytesDone);
    telemetry.currentBps = (deltaBytes * 1000) / deltaMs;
  }

  telemetry.averageBps = elapsedMs ? (bytesDone * 1000) / elapsedMs : 0;
  telemetry.lastSampleAt = nowTs;
  telemetry.lastBytesDone = bytesDone;
  telemetry.bufferedAmount = state.rtc.dc?.bufferedAmount || 0;
  void samplePeerStats();
  scheduleTransferRender();
}

function startTelemetry() {
  if (state.transfer.telemetryTimer) {
    return;
  }
  state.transfer.telemetry.startedAt = state.transfer.telemetry.startedAt || Date.now();
  state.transfer.telemetry.lastSampleAt = Date.now();
  state.transfer.telemetry.lastBytesDone = currentTransferBytesDone();
  state.transfer.telemetryTimer = setInterval(sampleTransferTelemetry, TELEMETRY_INTERVAL_MS);
}

function stopTelemetry() {
  if (!state.transfer.telemetryTimer) {
    return;
  }
  clearInterval(state.transfer.telemetryTimer);
  state.transfer.telemetryTimer = null;
}

function sendControl(payload) {
  if (state.transfer.transport === "relay") {
    sendRelay("control", payload);
    return;
  }
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
  if (dc.bufferedAmount <= state.transfer.maxBufferedBytes) {
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
    hashState: createSha256State(),
    hashFinalized: false,
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

function chooseTransferChunkSize() {
  const raw = els.chunkSize.value;
  if (raw === "auto") {
    state.transfer.adaptiveChunkSize = true;
    return AUTO_CHUNK_SIZE;
  }

  const parsed = Number(raw || DEFAULT_CHUNK_SIZE);
  state.transfer.adaptiveChunkSize = false;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_CHUNK_SIZE;
}

function updateOutgoingHash(fileRecord, payload) {
  if (fileRecord.hashFinalized) {
    return;
  }
  updateSha256State(fileRecord.hashState, new Uint8Array(payload));
}

function finalizeOutgoingHash(fileRecord) {
  if (!fileRecord.hashFinalized) {
    fileRecord.sha256 = finalizeSha256State(fileRecord.hashState);
    fileRecord.hashFinalized = true;
  }
  return fileRecord.sha256;
}

function sanitizeFilename(name) {
  return String(name || "download.bin").replace(/[<>:"/\\|?*\x00-\x1f]/g, "_").slice(0, 180) || "download.bin";
}

function supportsSaveDirectory() {
  return typeof window.showDirectoryPicker === "function";
}

async function chooseSaveDirectory() {
  if (!supportsSaveDirectory()) {
    showStatusBanner("Save folder selection is not supported in this browser. Incoming files will stay in browser memory.", "muted", false);
    return;
  }

  try {
    state.transfer.saveDirectoryHandle = await window.showDirectoryPicker({ mode: "readwrite" });
    els.saveDirLabel.textContent = "Incoming files will stream directly to the selected folder.";
    log("Save folder selected");
  } catch (error) {
    if (error?.name !== "AbortError") {
      showStatusBanner("Could not select save folder. Incoming files will stay in browser memory.", "bad", false);
    }
  }
}

async function openIncomingWriter(fileRecord) {
  if (fileRecord.writer || !state.transfer.saveDirectoryHandle) {
    return;
  }

  try {
    const handle = await state.transfer.saveDirectoryHandle.getFileHandle(sanitizeFilename(fileRecord.name), { create: true });
    fileRecord.writer = await handle.createWritable({ keepExistingData: false });
    fileRecord.storage = "disk";
    fileRecord.fileHandle = handle;
  } catch (error) {
    fileRecord.storage = "memory";
    fileRecord.writer = null;
    log("Falling back to memory receive", { file: fileRecord.name, message: error.message });
  }
}

async function closeIncomingWriter(fileRecord) {
  if (!fileRecord.writer) {
    return;
  }
  await fileRecord.writer.close();
  fileRecord.writer = null;
}

function queueIncomingHash(fileRecord, chunkIndex, payload) {
  if (fileRecord.hashFinalized) {
    return;
  }
  fileRecord.pendingHashChunks.set(chunkIndex, payload);
  while (fileRecord.pendingHashChunks.has(fileRecord.nextHashChunkIndex)) {
    const nextPayload = fileRecord.pendingHashChunks.get(fileRecord.nextHashChunkIndex);
    fileRecord.pendingHashChunks.delete(fileRecord.nextHashChunkIndex);
    updateSha256State(fileRecord.hashState, new Uint8Array(nextPayload));
    fileRecord.nextHashChunkIndex += 1;
  }
}

async function sendChunk(fileRecord, chunkIndex, trackProgress = true) {
  const start = chunkIndex * state.transfer.chunkSize;
  const end = Math.min(start + state.transfer.chunkSize, fileRecord.size);
  const blob = fileRecord.file.slice(start, end);
  const payload = await blob.arrayBuffer();

  for (let attempt = 0; attempt <= MAX_CHUNK_SEND_RETRIES; attempt += 1) {
    await waitWhilePausedOrCancelled();
    if (state.transfer.transport !== "relay" && !dataChannelReady()) {
      if (attempt === MAX_CHUNK_SEND_RETRIES) {
        throw new Error("datachannel_not_open");
      }
      await sleep(250 + attempt * 250);
      continue;
    }

    if (state.transfer.transport !== "relay") {
      await waitForBufferedLowWatermark();
    }
    try {
      const chunkFrame = encodeChunkFrame(fileRecord.id, chunkIndex, payload);
      if (state.transfer.transport === "relay") {
        sendRelay("chunk", { frame: uint8ToBase64(new Uint8Array(chunkFrame)) });
      } else {
        state.rtc.dc.send(chunkFrame);
      }
      const sent = end - start;
      if (trackProgress) {
        updateOutgoingHash(fileRecord, payload);
      }
      fileRecord.sentBytes = Math.max(fileRecord.sentBytes, end);
      if (trackProgress) {
        state.transfer.outgoingSentBytes = Math.min(state.transfer.outgoingTotalBytes, state.transfer.outgoingSentBytes + sent);
      }
      state.transfer.telemetry.chunksSent += 1;
      scheduleTransferRender();
      return;
    } catch (error) {
      if (attempt === MAX_CHUNK_SEND_RETRIES) {
        throw error;
      }
      state.transfer.telemetry.retries += 1;
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
  sendControl({ type: "file_complete", transferId: state.transfer.transferId, fileId, sha256: fileRecord.sha256 });
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

  const sha256 = finalizeOutgoingHash(fileRecord);
  const ackPromise = waitForFileAck(fileRecord);
  fileRecord.status = "awaiting_verify";
  state.transfer.currentChunkIndex = fileRecord.totalChunks;
  sendControl({ type: "file_complete", transferId: state.transfer.transferId, fileId: fileRecord.id, sha256 });
  scheduleTransferRender();

  await ackPromise;
  fileRecord.status = "verified";
  scheduleTransferRender();
}

async function runOutgoingTransfer() {
  if (state.transfer.running) {
    return;
  }

  if (!dataChannelReady() && state.transfer.transport !== "relay") {
    if (state.session.role === "sender" && state.peerJoined) {
      schedulePeerRecovery();
    }
    if (canUseRelayTransport()) {
      state.transfer.transport = "relay";
      showStatusBanner("Direct channel unavailable. Falling back to signaling relay (slower).", "warn", false);
      log("Switched transfer transport", { transport: "relay", reason: "channel_not_ready" });
    } else {
      state.transfer.status = "awaiting_channel";
      showStatusBanner("Waiting for peer channel to reopen before sending.", "warn", false);
      renderTransfer();
      return;
    }
  }

  let resumeWithRelay = false;

  state.transfer.running = true;
  state.transfer.status = "transferring";
  startTelemetry();
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
    state.transfer.telemetry.completedAt = Date.now();
    sampleTransferTelemetry();
    stopTelemetry();
    log("Transfer completed", { transferId: state.transfer.transferId, transport: state.transfer.transport });
  } catch (error) {
    if (error?.message === "datachannel_not_open" || error?.message?.includes("readyState is not 'open'")) {
      if (canUseRelayTransport()) {
        state.transfer.transport = "relay";
        state.transfer.status = "transferring";
        resumeWithRelay = true;
        showStatusBanner("Direct P2P dropped. Continuing via signaling relay (slower).", "warn", false);
        log("Resuming transfer with relay fallback", {
          fileIndex: state.transfer.currentFileIndex,
          chunkIndex: state.transfer.currentChunkIndex
        });
      } else {
        if (state.session.role === "sender" && state.peerJoined) {
          schedulePeerRecovery();
        }
        state.transfer.status = "awaiting_channel";
        showStatusBanner("Connection dropped mid-transfer. Auto-resume when channel reconnects.", "warn", false);
        log("Transfer paused awaiting channel reopen", {
          fileIndex: state.transfer.currentFileIndex,
          chunkIndex: state.transfer.currentChunkIndex
        });
      }
    } else {
      state.transfer.status = state.transfer.cancelled ? "cancelled" : "failed";
      stopTelemetry();
      log("Transfer failed", { message: error.message });
    }
  } finally {
    state.transfer.running = false;
    renderTransfer();
    if (resumeWithRelay && !state.transfer.cancelled && state.transfer.status === "transferring") {
      queueMicrotask(() => {
        void runOutgoingTransfer();
      });
    } else {
      scheduleTransferRender();
    }
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
      sha256: file.sha256 || null,
      hashState: createSha256State(),
      hashFinalized: false,
      nextHashChunkIndex: 0,
      pendingHashChunks: new Map(),
      totalChunks: file.totalChunks,
      chunkSize: payload.chunkSize,
      receivedBytes: 0,
      chunks: new Array(file.totalChunks),
      receivedChunkBitmap: new Uint8Array(file.totalChunks),
      status: "queued",
      storage: state.transfer.saveDirectoryHandle ? "disk" : "memory",
      writer: null,
      fileHandle: null,
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
  resetTelemetry();
  startTelemetry();
  renderTransfer();
}

async function verifyIncomingFile(fileRecord) {
  const missing = [];
  for (let idx = 0; idx < fileRecord.totalChunks; idx += 1) {
    if (!fileRecord.receivedChunkBitmap[idx]) {
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

  if (!fileRecord.sha256 || fileRecord.nextHashChunkIndex !== fileRecord.totalChunks) {
    fileRecord.status = "retry_requested";
    renderTransfer();
    sendControl({
      type: "chunk_nack",
      transferId: state.transfer.incoming.transferId,
      fileId: fileRecord.id,
      missing: []
    });
    return;
  }

  await closeIncomingWriter(fileRecord);
  const digest = fileRecord.hashFinalized ? fileRecord.hash : finalizeSha256State(fileRecord.hashState);
  fileRecord.hashFinalized = true;
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

  if (fileRecord.storage === "memory") {
    const blob = new Blob(fileRecord.chunks, { type: fileRecord.mimeType });
    fileRecord.downloadUrl = URL.createObjectURL(blob);
  }
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

  if (!fileRecord.receivedChunkBitmap[frame.chunkIndex]) {
    const payloadCopy = frame.payload.slice(0);
    fileRecord.receivedChunkBitmap[frame.chunkIndex] = 1;
    queueIncomingHash(fileRecord, frame.chunkIndex, payloadCopy);
    if (fileRecord.storage === "disk") {
      await openIncomingWriter(fileRecord);
    }
    if (fileRecord.writer) {
      await fileRecord.writer.write({
        type: "write",
        position: frame.chunkIndex * fileRecord.chunkSize,
        data: payloadCopy
      });
      state.transfer.telemetry.diskWrites += 1;
    } else {
      fileRecord.storage = "memory";
      fileRecord.chunks[frame.chunkIndex] = payloadCopy;
    }
    fileRecord.receivedBytes += payloadCopy.byteLength;
    state.transfer.incoming.receivedBytes += payloadCopy.byteLength;
    state.transfer.telemetry.chunksReceived += 1;
    if (fileRecord.status === "queued" || fileRecord.status === "receiving_meta") {
      fileRecord.status = "receiving";
    }
    scheduleTransferRender();
  }
}

function readReceivePolicy() {
  const maxFileSizeMb = Number(els.receiveMaxFileSize?.value || 0);
  const maxFileCount = Number(els.receiveMaxFileCount?.value || 0);
  state.receivePolicy.autoAccept = Boolean(els.receiveAutoAccept?.checked);
  state.receivePolicy.maxFileSizeBytes = Number.isFinite(maxFileSizeMb) && maxFileSizeMb > 0
    ? maxFileSizeMb * 1024 * 1024
    : 0;
  state.receivePolicy.maxFileCount = Number.isFinite(maxFileCount) && maxFileCount > 0
    ? Math.floor(maxFileCount)
    : 0;
}

function persistReceivePolicy() {
  try {
    localStorage.setItem(RECEIVE_POLICY_STORAGE_KEY, JSON.stringify({
      autoAccept: state.receivePolicy.autoAccept,
      maxFileSizeMb: Number(els.receiveMaxFileSize?.value || 0) || 0,
      maxFileCount: Number(els.receiveMaxFileCount?.value || 0) || 0
    }));
  } catch {
    // no-op
  }
}

function loadReceivePolicy() {
  try {
    const raw = localStorage.getItem(RECEIVE_POLICY_STORAGE_KEY);
    if (!raw) {
      return;
    }
    const policy = JSON.parse(raw);
    if (els.receiveAutoAccept && typeof policy.autoAccept === "boolean") {
      els.receiveAutoAccept.checked = policy.autoAccept;
    }
    if (els.receiveMaxFileSize && Number.isFinite(Number(policy.maxFileSizeMb))) {
      els.receiveMaxFileSize.value = Number(policy.maxFileSizeMb) > 0 ? String(Number(policy.maxFileSizeMb)) : "";
    }
    if (els.receiveMaxFileCount && Number.isFinite(Number(policy.maxFileCount))) {
      els.receiveMaxFileCount.value = Number(policy.maxFileCount) > 0 ? String(Math.floor(Number(policy.maxFileCount))) : "";
    }
  } catch {
    // no-op
  }
}

function updateReceivePolicy() {
  readReceivePolicy();
  persistReceivePolicy();
}

function validateIncomingTransferOffer(message) {
  readReceivePolicy();
  const files = Array.isArray(message.files) ? message.files : [];
  if (!files.length) {
    return "empty_transfer";
  }
  if (state.receivePolicy.maxFileCount && files.length > state.receivePolicy.maxFileCount) {
    return "file_count_limit";
  }
  if (state.receivePolicy.maxFileSizeBytes) {
    const oversized = files.find((file) => Number(file.size || 0) > state.receivePolicy.maxFileSizeBytes);
    if (oversized) {
      return "file_size_limit";
    }
  }
  return "";
}

function acceptIncomingTransferOffer(message) {
  state.receivePolicy.pendingOffer = null;
  state.transfer.transport = message.transport === "relay" ? "relay" : "webrtc";
  setIncomingTransfer(message);
  sendControl({ type: "transfer_accept", transferId: message.transferId });
  log("Transfer offer accepted", { transferId: message.transferId, transport: state.transfer.transport });
  renderTransfer();
}

function rejectIncomingTransferOffer(reason = "receiver_rejected") {
  const pending = state.receivePolicy.pendingOffer;
  state.receivePolicy.pendingOffer = null;
  if (pending?.transferId) {
    try {
      sendControl({ type: "transfer_reject", transferId: pending.transferId, reason });
    } catch {
      // no-op
    }
  }
  state.transfer.status = "idle";
  log("Transfer offer rejected", { reason });
  renderTransfer();
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
      const rejectionReason = validateIncomingTransferOffer(message);
      if (rejectionReason) {
        sendControl({ type: "transfer_reject", transferId: message.transferId, reason: rejectionReason });
        log("Transfer offer rejected by receive policy", { reason: rejectionReason });
        return;
      }
      if (!state.receivePolicy.autoAccept) {
        state.receivePolicy.pendingOffer = message;
        state.transfer.status = "awaiting_accept";
        log("Transfer offer pending receiver approval", { transferId: message.transferId });
        renderTransfer();
        return;
      }
      acceptIncomingTransferOffer(message);
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

    case "transfer_reject": {
      if (state.session.role !== "sender" || message.transferId !== state.transfer.transferId) {
        return;
      }
      state.transfer.status = "failed";
      state.transfer.running = false;
      showStatusBanner(`Receiver rejected transfer: ${message.reason || "rejected"}`, "bad", false);
      log("Transfer rejected by receiver", { reason: message.reason || "rejected" });
      renderTransfer();
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
      stopTelemetry();
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
      if (message.sha256) {
        fileRecord.sha256 = message.sha256;
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
        state.transfer.telemetry.completedAt = Date.now();
        sampleTransferTelemetry();
        stopTelemetry();
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
    state.connectionMode = "room";
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

  if (msg.type === "relay") {
    if (msg.relayType === "control") {
      await handleDataControlMessage(msg.payload || {});
      return;
    }

    if (msg.relayType === "chunk") {
      const frameB64 = String(msg.payload?.frame || "");
      if (!frameB64) {
        return;
      }
      await handleIncomingChunk(base64ToArrayBuffer(frameB64));
    }
  }
}

function renderMode() {
  els.modeSender.classList.toggle("active", state.mode === "sender");
  els.modeReceiver.classList.toggle("active", state.mode === "receiver");
  els.connectionRoom.classList.toggle("active", state.connectionMode === "room");
  els.connectionManual.classList.toggle("active", state.connectionMode === "manual");
  document.body.dataset.mode = state.mode;
  document.body.dataset.connectionMode = state.connectionMode;

  const role = state.session.role || state.mode;
  const senderVisible = role === "sender";
  const manualVisible = state.connectionMode === "manual";

  els.senderControls.classList.toggle("hidden", !senderVisible || manualVisible);
  els.receiverControls.classList.toggle("hidden", senderVisible || manualVisible);
  els.manualControls.classList.toggle("hidden", !manualVisible);
  els.manualSenderPanel?.classList.toggle("hidden", !manualVisible || !senderVisible);
  els.manualReceiverPanel?.classList.toggle("hidden", !manualVisible || senderVisible);
  if (els.manualRoleTitle) {
    els.manualRoleTitle.textContent = senderVisible ? "Sender setup" : "Receiver setup";
  }
  if (els.manualStepChip) {
    els.manualStepChip.textContent = senderVisible ? "offer" : "answer";
  }
  els.senderTransfer.classList.toggle("hidden", !senderVisible);
  els.receiverTransfer.classList.toggle("hidden", senderVisible);
}

function renderSession() {
  els.roomCode.textContent = state.session.code === "manual" ? "MANUAL" : state.session.code || "- - - - - -";
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

  if (state.session.code === "manual") {
    if (dataChannelReady()) {
      setChip(els.sessionState, "manual connected", "ok");
    } else {
      setChip(els.sessionState, state.peerJoined ? "manual connecting" : "manual pairing", "warn");
    }
    return;
  }
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
  if (isManualMode()) {
    if (state.session.code && state.peerJoined && !dataChannelReady() && state.rtc.pc?.connectionState !== "connected") {
      showStatusBanner("Manual connection is negotiating. If it fails, create a fresh offer or use TURN.", "warn", false);
      return;
    }
    if (state.session.code && !state.peerJoined) {
      showStatusBanner("Manual mode: exchange one offer and one answer to connect.", "muted", false);
      return;
    }
    if (state.transfer.status === "awaiting_channel") {
      showStatusBanner("Manual transfer is waiting for the direct WebRTC channel.", "warn", false);
      return;
    }
    if (state.transfer.status === "paused") {
      showStatusBanner("Transfer paused. Tap resume when ready.", "warn", false);
      return;
    }
    hideStatusBanner();
    return;
  }

  if (!state.wsConnected) {
    const remainingMs = state.wsReconnectAt ? Math.max(0, state.wsReconnectAt - Date.now()) : 0;
    const retryText = state.wsReconnectAt ? ` Auto-retry in ${formatSecondsLeft(remainingMs)}.` : "";
    showStatusBanner(`Signaling disconnected.${retryText} Transfers pause until reconnect.`, "bad", true);
    return;
  }

  if (state.session.code && state.peerJoined && !dataChannelReady() && state.rtc.pc?.connectionState !== "connected") {
    if (state.transfer.transport === "relay" && canUseRelayTransport()) {
      showStatusBanner("Direct P2P unavailable. Using signaling relay fallback (slower).", "warn", false);
    } else {
      showStatusBanner("Re-establishing peer connection. Keep this tab open.", "warn", false);
    }
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
  if (isManualMode()) {
    els.wsState.textContent = "not used";
  } else if (state.wsConnected) {
    els.wsState.textContent = "connected";
  } else if (state.wsReconnectAt) {
    els.wsState.textContent = `retrying in ${formatSecondsLeft(state.wsReconnectAt - Date.now())}`;
  } else {
    els.wsState.textContent = "disconnected";
  }
  els.peerState.textContent = state.peerJoined ? "joined" : isManualMode() ? "exchange pending" : "not joined";

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
  const storageLabel = incoming && file.storage === "disk" ? "saved to folder" : "";

  const head = document.createElement("div");
  head.className = "file-item-head";

  const name = document.createElement("span");
  name.className = "file-name";
  name.textContent = file.name;
  head.appendChild(name);

  const pct = document.createElement("span");
  pct.textContent = progressPct;
  head.appendChild(pct);
  li.appendChild(head);

  const bytes = document.createElement("div");
  bytes.className = "tiny";
  bytes.textContent = `${formatBytes(file.receivedBytes || file.sentBytes || 0)} / ${formatBytes(file.size)}`;
  li.appendChild(bytes);

  const progressTrack = document.createElement("div");
  progressTrack.className = "progress-track";
  const progressBar = document.createElement("div");
  progressBar.className = "progress-bar";
  progressBar.style.width = `${Math.min(progress * 100, 100)}%`;
  progressTrack.appendChild(progressBar);
  li.appendChild(progressTrack);

  const statusLine = document.createElement("div");
  statusLine.className = "tiny";
  const pill = document.createElement("span");
  pill.className = `status-pill status-pill-${normalizeStatusClass(file.status)}`;
  pill.textContent = statusTag;
  statusLine.appendChild(pill);
  statusLine.append(` ${status}${storageLabel ? ` · ${storageLabel}` : ""}`);
  li.appendChild(statusLine);

  if (incoming && file.downloadUrl && file.status === "verified") {
    const actions = document.createElement("div");
    actions.className = "file-actions";

    const link = document.createElement("a");
    link.href = file.downloadUrl;
    link.download = file.name;
    link.textContent = "Download";
    actions.appendChild(link);

    li.appendChild(actions);
  } else if (incoming && file.storage === "disk" && file.status === "verified") {
    const actions = document.createElement("div");
    actions.className = "file-actions";
    const saved = document.createElement("span");
    saved.className = "tiny";
    saved.textContent = "Saved to selected folder";
    actions.appendChild(saved);
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

  const telemetry = state.transfer.telemetry;
  if (els.telemetrySpeed) {
    const average = telemetry.averageBps ? ` avg ${formatRate(telemetry.averageBps)}` : "";
    els.telemetrySpeed.textContent = `${formatRate(telemetry.currentBps)}${average}`;
  }
  if (els.telemetryRtt) {
    els.telemetryRtt.textContent = telemetry.rttMs === null ? "-" : `${telemetry.rttMs} ms`;
  }
  if (els.telemetryPath) {
    els.telemetryPath.textContent = telemetry.path === "unknown" ? "-" : telemetry.path;
  }
  if (els.telemetryBuffer) {
    els.telemetryBuffer.textContent = dataChannelReady()
      ? `${formatBytes(telemetry.bufferedAmount || state.rtc.dc.bufferedAmount)} / ${formatBytes(state.transfer.maxBufferedBytes)}`
      : "-";
  }
  if (els.saveDirLabel) {
    if (!supportsSaveDirectory()) {
      els.saveDirLabel.textContent = "Save folder selection is not supported in this browser.";
    } else if (state.transfer.saveDirectoryHandle) {
      els.saveDirLabel.textContent = "Incoming files will stream directly to the selected folder.";
    } else {
      els.saveDirLabel.textContent = "Files are kept in browser memory unless a save folder is selected.";
    }
  }
  if (els.receiveAutoAccept) {
    els.receiveAutoAccept.checked = state.receivePolicy.autoAccept;
  }
  if (els.receivePendingOffer) {
    const pending = state.receivePolicy.pendingOffer;
    els.receivePendingOffer.classList.toggle("hidden", !pending);
    if (pending && els.receivePendingSummary) {
      const totalBytes = (pending.files || []).reduce((sum, file) => sum + file.size, 0);
      els.receivePendingSummary.textContent = `${pending.files?.length || 0} file(s), ${formatBytes(totalBytes)} waiting for approval.`;
    }
  }

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
  const transportReady = dataChannelReady() || canUseRelayTransport();
  els.startTransfer.disabled = !senderRole || !transportReady || !state.selectedFiles.length || state.transfer.running || isTransferBusyStatus(status);
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
  if (state.session.code && !isManualMode()) {
    sendWs({ type: "leave_session" });
  }
  if (state.ws && state.ws.readyState === WebSocket.OPEN && !isManualMode()) {
    state.wsSuppressReconnect = true;
    state.ws.close();
  }
  clearSessionState();
  resetManualOutputs();
  setManualStatus("Manual mode works without the signaling server after this page loads. Exchange one offer and one answer.");
  renderAll();
  if (!state.wsConnected && state.connectionMode === "room") {
    connectSignaling();
  }
}

async function onStartTransfer() {
  if (state.session.role !== "sender") {
    log("Only sender can start transfer");
    return;
  }
  if (!dataChannelReady() && !canUseRelayTransport()) {
    log("Neither direct DataChannel nor relay path is available");
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

  state.transfer.transport = dataChannelReady() ? "webrtc" : "relay";

  state.transfer.chunkSize = chooseTransferChunkSize();
  if (state.transfer.transport === "relay" && state.transfer.chunkSize > RELAY_CHUNK_MAX_BYTES) {
    state.transfer.chunkSize = RELAY_CHUNK_MAX_BYTES;
    log("Relay fallback active: chunk size capped for signaling limit", { chunkSize: state.transfer.chunkSize });
  }
  if (state.transfer.chunkSize > 64 * 1024) {
    log("Large chunks may destabilize long transfers. Recommended: 16-64 KB for multi-GB files.");
  }
  const plan = buildOutgoingPlan(files, state.transfer.chunkSize);
  state.transfer.outgoing = plan.outgoing;
  state.transfer.outgoingTotalBytes = plan.totalBytes;
  state.transfer.transferId = randomId();
  state.transfer.status = "preparing";
  resetTelemetry();
  renderTransfer();

  try {
    sendControl({
      type: "transfer_offer",
      transferId: state.transfer.transferId,
      transport: state.transfer.transport,
      chunkSize: state.transfer.chunkSize,
      streamingHash: true,
      files: state.transfer.outgoing.map((file) => ({
        id: file.id,
        name: file.name,
        size: file.size,
        mimeType: file.type,
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
  stopTelemetry();
  try {
    sendControl({ type: "transfer_cancel", transferId: state.transfer.transferId });
  } catch {
    // no-op
  }
  state.transfer.fileAckWaiters.forEach((waiter) => waiter.reject(new Error("transfer_cancelled")));
  state.transfer.fileAckWaiters.clear();
  renderTransfer();
}

function setConnectionMode(mode) {
  if (state.connectionMode === mode) {
    renderAll();
    return;
  }

  if (state.session.code) {
    if (!isManualMode()) {
      sendWs({ type: "leave_session" });
    }
    clearSessionState();
  } else {
    teardownPeerConnection();
  }

  state.connectionMode = mode;
  resetManualOutputs();
  setManualStatus("Manual mode works without the signaling server after this page loads. Exchange one offer and one answer.");
  if (mode === "room" && !state.wsConnected) {
    connectSignaling();
  }
  renderAll();
}

function setUserMode(mode) {
  if (state.mode === mode && (!state.session.role || state.session.role === mode)) {
    renderMode();
    return;
  }
  if (isManualMode() && state.session.code) {
    clearSessionState();
    resetManualOutputs();
    setManualStatus("Manual mode works without the signaling server after this page loads. Exchange one offer and one answer.");
  }
  state.mode = mode;
  renderAll();
}

function wireEvents() {
  els.themeToggle?.addEventListener("click", toggleTheme);

  els.modeSender.addEventListener("click", () => {
    setUserMode("sender");
  });

  els.modeReceiver.addEventListener("click", () => {
    setUserMode("receiver");
  });

  els.connectionRoom.addEventListener("click", () => {
    setConnectionMode("room");
  });

  els.connectionManual.addEventListener("click", () => {
    setConnectionMode("manual");
  });

  els.createSession.addEventListener("click", () => {
    void onCreateSession();
  });

  els.manualCreateOffer.addEventListener("click", () => {
    void createManualOffer();
  });

  els.manualAcceptOffer.addEventListener("click", () => {
    void createManualAnswer();
  });

  els.manualAcceptAnswer.addEventListener("click", () => {
    void acceptManualAnswer();
  });

  els.manualCopyOffer.addEventListener("click", () => {
    void copyText(els.manualOfferOutput.value, "Manual offer");
  });

  els.manualCopyAnswer.addEventListener("click", () => {
    void copyText(els.manualAnswerOutput.value, "Manual answer");
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
  els.chooseSaveDir?.addEventListener("click", () => {
    void chooseSaveDirectory();
  });

  els.receiveAutoAccept?.addEventListener("change", updateReceivePolicy);
  els.receiveMaxFileSize?.addEventListener("input", updateReceivePolicy);
  els.receiveMaxFileCount?.addEventListener("input", updateReceivePolicy);
  els.receiveAcceptOffer?.addEventListener("click", () => {
    if (state.receivePolicy.pendingOffer) {
      acceptIncomingTransferOffer(state.receivePolicy.pendingOffer);
    }
  });
  els.receiveRejectOffer?.addEventListener("click", () => {
    rejectIncomingTransferOffer("receiver_rejected");
  });

  els.manualScanOffer?.addEventListener("click", () => {
    void startManualScan("offer");
  });

  els.manualScanAnswer?.addEventListener("click", () => {
    void startManualScan("answer");
  });

  els.manualStopScan?.addEventListener("click", stopManualScan);

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
    stopManualScan();
    if (state.session.code && !isManualMode()) {
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
  loadReceivePolicy();
  readReceivePolicy();
  if (els.chunkSize && !els.chunkSize.value) {
    els.chunkSize.value = String(DEFAULT_CHUNK_SIZE);
  }
  renderAll();
  await loadServerConfig();
  connectSignaling();
  log("0xLynk client ready");
}

void boot();
