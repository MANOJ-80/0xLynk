# 0xLynk Signaling Server

WebSocket signaling service for 0xLynk room pairing and WebRTC SDP/ICE exchange.

## Implemented capabilities

- 6-digit room creation and join flow.
- Exactly two peers per room (`sender`, `receiver`).
- Signal relay for `offer`, `answer`, `ice-candidate`.
- Session TTL expiration + periodic cleanup.
- Reconnect by role token within configurable grace window.
- Optional room protection:
  - passphrase
  - username/password join gate
- Per-IP join rate limiting.
- WebSocket heartbeat + stale client termination.
- Max signaling message size enforcement.
- Metrics counters for sessions, relays, TURN relay candidates, and error codes.
- Static serving of the browser client from `apps/web/public/`.

## Security model

- This server relays signaling metadata only.
- File payload bytes are never relayed or stored by signaling.

## Run

From repo root:

```bash
npm install
npm run start:signaling
```

Production mode:

```bash
npm run start:signaling:prod
```

## HTTP endpoints

- `GET /health` - status, uptime, active session snapshot.
- `GET /config` - effective ICE config + runtime limits.
- `GET /metrics` - runtime counters and error metrics.
- `GET /` - serves web client.

## Environment variables

- `PORT` (default `8080`)
- `SESSION_TTL_MS` (default `600000`)
- `CLEANUP_INTERVAL_MS` (default `15000`)
- `RECONNECT_GRACE_MS` (default `30000`)
- `MAX_JOIN_ATTEMPTS_PER_MINUTE` (default `30`)
- `MAX_SIGNAL_MESSAGE_BYTES` (default `65536`)
- `MAX_PASSPHRASE_LENGTH` (default `128`)
- `MAX_JOIN_AUTH_USERNAME_LENGTH` (default `64`)
- `MAX_JOIN_AUTH_PASSWORD_LENGTH` (default `128`)
- `WS_HEARTBEAT_INTERVAL_MS` (default `30000`)
- `ICE_SERVERS_JSON` (optional full ICE JSON override)
- `TURN_URLS` (optional, comma-separated)
- `TURN_USERNAME` (optional)
- `TURN_CREDENTIAL` (optional)

## Protocol

See `docs/signaling-protocol.md`.

## Smoke test

From repo root:

```bash
npm run test:smoke
```

## Docker

Run app container:

```bash
npm run docker:up
```

Temporary public demo URL (Cloudflare quick tunnel):

```bash
npm run demo:share
```
