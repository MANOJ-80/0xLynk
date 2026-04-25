# 0xShare by 0xLynk

0xShare is a privacy-first browser file transfer product by 0xLynk.

This repository includes an end-to-end MVP of 0xShare:

- WebSocket signaling server for room-code pairing and SDP/ICE relay.
- Browser client with sender/receiver modes.
- WebRTC DataChannel file transfer with chunking, pause/resume/cancel.
- SHA-256 integrity verification on receiver before download.
- Room safety controls: optional passphrase and optional username/password gate on join.

## Current structure

- `docs/` - product and implementation documents.
- `apps/signaling-server/` - lightweight WebSocket signaling backend for WebRTC setup.
- `apps/web/public/` - browser app (HTML/CSS/JS) served by the backend.

## Product UI highlights

- Premium dual-theme interface (Night + Day), with saved user preference.
- Brand-locked iconography and wordmark system using inline SVG symbols.
- Rich transfer micro-interactions (active/success/error panel glow, animated progress, status pills).
- Mobile-optimized layout with accessible reduced-motion fallback.

## Quick start

1. Install dependencies:

```bash
npm install
```

2. Run signaling server:

```bash
npm run start:signaling
```

3. Server health check:

```bash
curl http://localhost:8080/health
```

4. Open the app:

```text
http://localhost:8080
```

5. Use it:

- On device A, choose `Send files`, click `Create room code`.
- On device B, choose `Receive files`, enter code, click `Join`.
- On sender, select file(s), click `Start`.
- After verification, receiver can download each file.

## Docker (one command run)

```bash
npm run docker:up
```

Then open:

```text
http://localhost:8080
```

Stop containers:

```bash
npm run docker:down
```

Detached run + logs:

```bash
npm run docker:up:detached
npm run docker:logs
```

## Free Demo Sharing (public URL)

Quickest free way to share a live demo from your machine:

```bash
npm run demo:share
```

Then read the Cloudflare tunnel URL from logs (looks like `https://<random>.trycloudflare.com`).

Stop demo stack:

```bash
npm run demo:down
```

Notes:

- This is best for quick demos and reviews.
- URL rotates each time you restart the tunnel.
- Performance/reliability depends on your local network.

## Free Production-style Deployment

For stable always-free hosting, use an always-free VPS (Oracle Cloud free tier works well):

1. Install Docker + Docker Compose on VM.
2. Clone this repo and copy env template:

```bash
cp .env.example .env
```

3. Start service:

```bash
npm run docker:up:detached
```

4. Point your domain to VM and put HTTPS reverse proxy in front (Caddy/Nginx).

For strict NAT/corporate networks, add TURN (`TURN_URLS`, `TURN_USERNAME`, `TURN_CREDENTIAL`) in `.env`.

## Render Free Plan Deployment

This repo includes `render.yaml` for Blueprint deployment.

1. Push this repo to GitHub.
2. In Render dashboard, click `New +` -> `Blueprint`.
3. Select this repository and apply the blueprint.
4. Wait for first deploy, then open the generated `*.onrender.com` URL.

Free plan notes:

- Service sleeps on inactivity (cold starts are normal).
- Large transfers are best while service stays warm.
- Set TURN env vars in Render dashboard for better connectivity in strict networks.

## Environment variables

- `PORT` (default `8080`)
- `SESSION_TTL_MS` (default `600000`)
- `SESSION_TTL_MS` (default `10800000` in Docker compose for longer demos)
- `CLEANUP_INTERVAL_MS` (default `15000`)
- `MAX_JOIN_ATTEMPTS_PER_MINUTE` (default `30`)
- `RECONNECT_GRACE_MS` (default `30000`)
- `MAX_SIGNAL_MESSAGE_BYTES` (default `65536`)
- `MAX_PASSPHRASE_LENGTH` (default `128`)
- `MAX_JOIN_AUTH_USERNAME_LENGTH` (default `64`)
- `MAX_JOIN_AUTH_PASSWORD_LENGTH` (default `128`)
- `ICE_SERVERS_JSON` (optional full JSON for ICE server list)
- `TURN_URLS` (optional comma-separated turn URLs)
- `TURN_USERNAME` (optional)
- `TURN_CREDENTIAL` (optional)

Tip: copy `.env.example` to `.env` before running docker if you want explicit settings.

## Notes

- Signaling never stores or relays file payload bytes.
- TURN is configurable in client advanced options (provide your TURN server details).
- Session reconnect uses per-role reconnect tokens stored in browser localStorage.
- Sender can optionally require both a room passphrase and a room username/password pair before join.

## Diagnostics

- `GET /health` returns status + runtime counters.
- `GET /config` returns effective ICE configuration for clients.
- `GET /metrics` returns session/signaling counters for observability.

## Smoke test

```bash
npm run test:smoke
```

This runs a basic health/config/signaling/reconnect flow against a temporary local port.

## Showcase capture (screenshots + optional GIF)

Generate portfolio/demo assets from a live local app using Playwright:

1. Make sure the app is running:

```bash
npm run start:signaling:prod
```

2. In another terminal, capture assets:

```bash
npm run showcase:capture -- --url http://localhost:8080
```

Output:

- Screenshots written to `showcase/generated/`.
- Frame captures written to `showcase/generated/frames/`.
- If `ffmpeg` is installed, GIF preview generated at `showcase/generated/showcase-preview.gif`.
