# Signaling Protocol (v0)

All messages are JSON over WebSocket.

## Client to server

- `create_session`
  - Example: `{ "type": "create_session", "passphrase": "optional", "joinAuth": { "username": "optional", "password": "optional" } }`
- `join_session`
  - Example: `{ "type": "join_session", "code": "123456", "passphrase": "optional", "joinAuth": { "username": "optional", "password": "optional" } }`
- `reconnect_session`
  - Example: `{ "type": "reconnect_session", "code": "123456", "token": "..." }`
- `signal`
  - Example: `{ "type": "signal", "signalType": "offer", "payload": { ... } }`
  - `signalType`: `offer` | `answer` | `ice-candidate`
- `leave_session`
  - Example: `{ "type": "leave_session" }`
- `ping`
  - Example: `{ "type": "ping" }`

## Server to client

- `connected`: `{ type, clientId }`
- `session_created`: `{ type, code, role, token, expiresAt, requiresPassphrase, requiresJoinAuth, peerConnected }`
- `session_joined`: `{ type, code, role, token, expiresAt, requiresPassphrase, requiresJoinAuth, peerConnected }`
- `session_reconnected`: `{ type, code, role, token, expiresAt, requiresPassphrase, requiresJoinAuth, peerConnected }`
- `peer_joined`: `{ type, code }`
- `peer_reconnected`: `{ type, code, role }`
- `peer_left`: `{ type, code, reason, role }`
- `signal`: `{ type, signalType, payload, from }`
- `session_closed`: `{ type, code, reason }`
- `session_expired`: `{ type, code }`
- `pong`: `{ type, ts }`
- `error`: `{ type, code, message }`
  - common codes include:
    - `invalid_passphrase`
    - `join_auth_required`
    - `invalid_join_auth`
    - `session_not_found`
    - `session_full`
    - `rate_limited`
    - `invalid_room_code`
    - `invalid_reconnect_token`
    - `role_already_connected`
    - `message_too_large`

## Rules

- Signaling relays metadata only (SDP/ICE). File bytes are not allowed.
- Each room supports exactly two peers.
- Room codes are 6-digit numeric strings.
- Expired sessions cannot be joined.
- Reconnects are role-token based and must occur before reconnect grace timeout.

## HTTP endpoints

- `GET /health`: service status + high-level counters.
- `GET /config`: ICE server configuration for browser clients.
  - also includes `maxPassphraseLength`, `maxJoinAuthUsernameLength`, `maxJoinAuthPasswordLength`.
- `GET /metrics`: signaling/session counters for observability.

## DataChannel control protocol (MVP)

Control messages are JSON sent over the DataChannel with `channel: "control"`.

- `transfer_offer`: sender proposes files list + chunk settings.
- `transfer_accept`: receiver accepts proposed transfer.
- `transfer_pause` / `transfer_resume` / `transfer_cancel`.
- `file_begin`: metadata for one file.
- `file_complete`: sender indicates last chunk has been sent.
- `chunk_nack`: receiver requests resend for missing chunks.
- `file_verified`: receiver returns SHA-256 verification result.
- `transfer_complete`: sender indicates all files completed.

Current flow detail:

- Sender sends `transfer_offer` with `transferId`, `chunkSize`, and file descriptors.
- Receiver accepts using `transfer_accept`.
- Sender streams chunk frames and emits `file_complete` with SHA-256 digest.
- Receiver either:
  - responds with `chunk_nack` for missing pieces, or
  - responds with `file_verified` (`ok: true|false`) after verification.
- Sender completes with `transfer_complete` after all files are verified.

Binary chunk frames are sent as ArrayBuffer with the header:

- Byte `0`: frame type (`1` for file chunk)
- Bytes `1-4`: `fileId` (uint32)
- Bytes `5-8`: `chunkIndex` (uint32)
- Bytes `9-12`: payload length (uint32)
- Bytes `13...`: payload bytes
