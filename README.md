# 0xLynk

0xLynk is a privacy-first browser file sharing project.

This repository now includes an end-to-end MVP slice of 0xShare:

- WebSocket signaling server for room-code pairing and SDP/ICE relay.
- Browser client with sender/receiver modes.
- WebRTC DataChannel file transfer with chunking, pause/resume/cancel.
- SHA-256 integrity verification on receiver before download.
- Room safety controls: optional passphrase and optional username/password gate on join.

## Current structure

- `docs/` - product and implementation documents.
- `apps/signaling-server/` - lightweight WebSocket signaling backend for WebRTC setup.
- `apps/web/public/` - browser app (HTML/CSS/JS) served by the backend.

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

## Environment variables

- `PORT` (default `8080`)
- `SESSION_TTL_MS` (default `600000`)
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
