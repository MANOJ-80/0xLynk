# 0xLynk

0xLynk is a browser-native, privacy-first file transfer system built on WebRTC DataChannels.

- Payload bytes stay peer-to-peer (backend only handles signaling).
- Ephemeral 6-digit room sessions with reconnect support.
- Streaming transfer reliability with verification, retries, and telemetry.

## What is implemented

### Core transfer

- Sender/receiver browser modes with room-based pairing.
- Multi-file transfer over WebRTC DataChannel.
- Chunked binary transport with configurable chunk size (`Auto`, `16 KB` to `256 KB`).
- In-session controls: start, pause, resume, cancel.
- Receiver-side SHA-256 verification before file is marked verified.
- Missing chunk recovery via `chunk_nack` + resend flow.

### Security and session controls

- Optional room passphrase.
- Optional room username/password join gate.
- Join rate limiting per IP.
- Session TTL expiry + periodic cleanup.
- Reconnect tokens per role with reconnect grace timeout.
- WebSocket heartbeat and max signaling message size guard.

### Network and resilience

- STUN default + TURN fallback support.
- Runtime ICE configuration from server (`/config`) with client-side TURN override fields.
- Auto WebSocket reconnect with jittered backoff.
- Peer recovery and renegotiation when channel drops.
- Adaptive flow-control profile based on RTT/path (direct vs relay).

### Product UI/UX

- Premium dashboard-style interface with Night/Day themes (theme persisted in local storage).
- Session, connection, transfer, telemetry, and activity log sections.
- Drag-and-drop + file picker staging.
- Real-time transfer telemetry: speed, RTT, path, buffer usage.
- Optional save-folder streaming (File System Access API capable browsers).
- Responsive layout + reduced-motion support.

## Repository structure

- `apps/signaling-server/` - WebSocket signaling + static web server.
- `apps/web/public/` - Browser app (`index.html`, `styles.css`, `app.js`).
- `docs/` - PRD, protocol docs, deployment notes, implementation plan.
- `scripts/` - smoke tests, benchmark model, showcase capture utilities.

## Tech stack

- Backend: Node.js, `ws`.
- Frontend: HTML/CSS/Vanilla JS (served statically by backend).
- Realtime transport: WebSocket signaling + WebRTC DataChannel.
- Tooling: Docker, Playwright.

## Quick start (local)

1. Install dependencies:

```bash
npm install
```

2. Start server (dev watch mode):

```bash
npm run start:signaling
```

3. Open app:

```text
http://localhost:8080
```

4. Verify health endpoint:

```bash
curl http://localhost:8080/health
```

## Production start (local)

```bash
npm run start:signaling:prod
```

## Usage flow

1. On sender tab/device:
   - Keep `Send files` mode.
   - Click `Create room code`.
   - Share code with receiver.

2. On receiver tab/device:
   - Switch to `Receive files`.
   - Enter 6-digit room code.
   - If room is protected, enter passphrase and/or username/password.
   - Click `Join`.

3. On sender:
   - Stage files (drag-drop or browse).
   - Choose chunk size (`Auto` recommended).
   - Click `Start`.

4. Receiver:
   - Transfer auto-accepts.
   - Files are verified (SHA-256).
   - Download verified files (or stream to selected folder if supported).

## NPM scripts (root)

- `npm run start:signaling` - run signaling server in watch mode.
- `npm run start:signaling:prod` - run signaling server in prod mode.
- `npm run test:smoke` - protocol + auth + reconnect smoke test.
- `npm run test:browser-transfer` - Playwright sender/receiver browser smoke transfer.
- `npm run benchmark:transfer` - transfer model benchmark by chunk/profile.
- `npm run showcase:capture` - capture screenshots + optional GIF.
- `npm run docker:up` - build and run app container.
- `npm run docker:up:detached` - detached container run.
- `npm run docker:down` - stop compose stack.
- `npm run docker:logs` - follow app logs.
- `npm run demo:share` - app + Cloudflare quick tunnel for temporary public demo URL.
- `npm run demo:down` - stop demo share stack.

## Diagnostics endpoints

- `GET /health` - status, uptime, active sessions, signaling counters.
- `GET /config` - effective ICE config + runtime limits.
- `GET /metrics` - signaling/session metrics and error counters.

## Environment variables

Copy `.env.example` to `.env` and customize as needed.

Core:

- `PORT` (default `8080`)
- `SESSION_TTL_MS` (default `600000` in server; `10800000` in compose/env template)
- `CLEANUP_INTERVAL_MS` (default `15000`)
- `RECONNECT_GRACE_MS` (default `30000`)
- `MAX_JOIN_ATTEMPTS_PER_MINUTE` (default `30`)
- `MAX_SIGNAL_MESSAGE_BYTES` (default `65536`)
- `MAX_PASSPHRASE_LENGTH` (default `128`)
- `MAX_JOIN_AUTH_USERNAME_LENGTH` (default `64`)
- `MAX_JOIN_AUTH_PASSWORD_LENGTH` (default `128`)
- `WS_HEARTBEAT_INTERVAL_MS` (default `30000`)

ICE/TURN:

- `ICE_SERVERS_JSON` (optional full ICE JSON array override)
- `TURN_URLS` (optional comma-separated TURN URLs)
- `TURN_USERNAME` (optional)
- `TURN_CREDENTIAL` (optional)

## Docker

Run full stack:

```bash
npm run docker:up
```

Detached:

```bash
npm run docker:up:detached
```

Stop:

```bash
npm run docker:down
```

Logs:

```bash
npm run docker:logs
```

Open `http://localhost:8080`.

## Public demo sharing (temporary URL)

```bash
npm run demo:share
```

This runs app + `cloudflared` and prints a `trycloudflare.com` URL in logs.

Stop:

```bash
npm run demo:down
```

## Render deployment

This repo includes `render.yaml` for Blueprint deploy.

1. Push repo to GitHub.
2. Render -> `New +` -> `Blueprint`.
3. Select repo and deploy.
4. Set TURN env vars on Render if needed for strict NAT/corporate networks.

## Testing

Signaling protocol smoke test:

```bash
npm run test:smoke
```

Browser transfer smoke test (requires Playwright setup):

```bash
npm run test:browser-transfer
```

If Chromium is not installed yet:

```bash
npx playwright install chromium
```

## Showcase capture

Capture desktop/mobile screenshots and optional GIF from running app:

```bash
npm run showcase:capture -- --url http://localhost:8080
```

Output goes to `showcase/generated/`.
If `ffmpeg` exists, a GIF preview is generated.

## Protocol docs

- Signaling protocol: `docs/signaling-protocol.md`
- Product PRD: `docs/0xlynk-prd.md`
- Implementation plan: `docs/implementation-plan.md`
- Free deployment guide: `docs/deployment-free.md`

## Notes

- 0xLynk signaling server does not transport or persist file payload bytes.
- TURN is strongly recommended for hostile NAT/firewall environments.
- Session reconnect metadata is stored locally in browser storage for in-session recovery.
