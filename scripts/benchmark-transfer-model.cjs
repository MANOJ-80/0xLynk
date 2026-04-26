const sizes = [16 * 1024, 32 * 1024, 64 * 1024, 128 * 1024, 256 * 1024];
const fileSize = Number(process.argv[2] || 1024 * 1024 * 1024);

function formatBytes(bytes) {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(unit === 0 ? 0 : 2)} ${units[unit]}`;
}

function estimate({ chunkSize, rttMs, maxBufferedBytes }) {
  const chunks = Math.ceil(fileSize / chunkSize);
  const windowChunks = Math.max(1, Math.floor(maxBufferedBytes / chunkSize));
  const windows = Math.ceil(chunks / windowChunks);
  return {
    chunkSize,
    chunks,
    windowChunks,
    controlCycles: windows,
    estimatedControlWaitMs: windows * rttMs
  };
}

const profiles = [
  { name: "fast-direct", rttMs: 40, maxBufferedBytes: 12 * 1024 * 1024 },
  { name: "balanced", rttMs: 100, maxBufferedBytes: 8 * 1024 * 1024 },
  { name: "relay-or-slow", rttMs: 220, maxBufferedBytes: 2 * 1024 * 1024 }
];

console.log(`File size: ${formatBytes(fileSize)}`);
for (const profile of profiles) {
  console.log(`\n${profile.name} rtt=${profile.rttMs}ms window=${formatBytes(profile.maxBufferedBytes)}`);
  for (const chunkSize of sizes) {
    const row = estimate({ ...profile, chunkSize });
    console.log(
      `${formatBytes(chunkSize).padStart(9)} chunks=${String(row.chunks).padStart(7)} `
      + `windowChunks=${String(row.windowChunks).padStart(4)} `
      + `controlWait≈${String(Math.round(row.estimatedControlWaitMs)).padStart(7)}ms`
    );
  }
}
