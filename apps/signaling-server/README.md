# 0xShare Signaling Server

Lightweight WebSocket service for session pairing and WebRTC signaling.

## Features implemented

- Create and join 6-digit room-code sessions.
- Session TTL expiry and periodic cleanup.
- Offer/answer/ICE candidate relay between exactly two peers.
- Join attempt rate limiting per client IP.
- Session reconnect by role token with grace timeout.
- Optional join safety: room passphrase and room username/password check.
- No file payload handling.
- Serves browser client from `apps/web/public/`.

## Start

From repository root:

```bash
npm install
npm run start:signaling
```

## Protocol

See `docs/signaling-protocol.md`.

## Runtime behavior

- `GET /health` returns service status and active session count.
- `GET /` serves the 0xShare browser client.
- Room sessions expire by TTL.
- Temporary disconnects can recover via `reconnect_session` token within grace period.

## Docker demo run

From repository root:

```bash
npm run docker:up
```

Open `http://localhost:8080`.

For a temporary public URL (free demo share):

```bash
npm run demo:share
```

This starts `cloudflared` alongside app and prints a `trycloudflare.com` URL in logs.
