# 0xLynk Implementation Plan

## Current state (implemented)

- Room-code session lifecycle with 6-digit codes, TTL expiration, and cleanup.
- Signaling relay for WebRTC `offer`, `answer`, and `ice-candidate`.
- Optional room protection:
  - passphrase
  - username/password join gate
- Abuse controls:
  - join-rate limiting per IP
  - max signaling message size
- Role-token reconnect within reconnect grace window.
- WebSocket heartbeat and stale connection cleanup.
- Browser sender/receiver UX served by signaling backend.
- DataChannel transfer protocol with:
  - transfer offer/accept
  - pause/resume/cancel
  - per-file begin/complete
  - missing-chunk retry (`chunk_nack`)
  - receiver verification acknowledgments (`file_verified`)
- Receiver-side streaming SHA-256 verification before completed status.
- Transfer telemetry: speed, RTT, path (direct/relay), buffered amount.
- Runtime observability endpoints: `/health`, `/config`, `/metrics`.
- Deployment paths:
  - local/dev
  - Docker
  - temporary public demo via Cloudflare quick tunnel
  - Render free-plan blueprint

## Architecture snapshot

- Single Node.js process for HTTP static hosting + WebSocket signaling.
- Browser-only transfer plane over WebRTC DataChannel.
- Signaling plane is metadata-only (no payload bytes).
- Optional TURN integration via environment and UI override fields.

## Verified operational coverage

- Automated signaling smoke test validates:
  - health/config/metrics reachability
  - create/join
  - offer/answer relay
  - reconnect flow
  - passphrase and join-auth enforcement
- Automated browser smoke transfer validates:
  - sender/receiver end-to-end transfer
  - verified receiver completion

## Priority next work

### P0 reliability

- Add deterministic integration tests for transfer edge cases:
  - repeated channel flaps
  - reconnect during active transfer
  - chunk_nack retry exhaustion
  - hash mismatch and user recovery flow
- Add graceful partial-state cleanup for abrupt browser process termination.

### P1 hardening

- Add optional persistent transfer resume metadata across full page refresh.
- Add configurable transfer policies (max file size, max file count).
- Add basic abuse telemetry aggregation/export for ops review.

### P2 productization

- Improve receive UX for large files (folder write capability guidance/fallback messaging).
- Add richer diagnostics panel/export for support workflows.
- Add optional room audit event stream for self-hosted operators.
