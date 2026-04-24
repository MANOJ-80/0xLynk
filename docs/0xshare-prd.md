# 0xShare Product PRD

## Product Description

- 0xShare is a browser-based peer-to-peer file transfer product that lets two users send files directly between devices using WebRTC DataChannels.
- A lightweight signaling server is used only for session setup (SDP/ICE exchange) and never stores or reads file content.
- Users connect with a short room code, transfer files in chunks with progress visibility, and verify integrity after transfer.
- The product is designed for privacy-first, install-free sharing across laptop and mobile browsers.

## Problem Statement

- Existing transfer options often require app installation, account login, platform lock-in, or server-side file upload.
- Users need a quick way to transfer files across devices (including cross-OS) from the browser, especially on restricted machines.
- Privacy-conscious users want architecture where backend services are technically incapable of accessing file payloads.

## Goals

- Enable direct browser-to-browser file transfer with no backend file storage.
- Provide reliable transfer experience across common NAT/firewall scenarios using STUN-first and TURN fallback.
- Offer transparent transfer controls: start, pause, resume, cancel, and progress tracking.
- Ensure trust through integrity verification and clear security behavior.
- Keep onboarding friction minimal with one-time room codes.

## Non-Goals

- Competing with native ecosystem apps (Quick Share, Nearby Share, AirDrop) on deep OS integration.
- Persistent cloud storage, file history, or long-term link sharing.
- Enterprise collaboration features (permissions hierarchy, team workspaces, DLP suite) in initial scope.
- Guaranteed high throughput under all network conditions.

## Target Users

- Students and developers transferring files between personal devices.
- Users on locked-down/public systems where app installs are not possible.
- Privacy-aware users who prefer direct transfer over third-party storage.
- Interview/demo audiences evaluating networking/system design skills.

## Primary Use Cases

- Laptop to mobile transfer without cable or app install.
- Mobile to laptop transfer over browser in same or different networks.
- Quick ad-hoc transfer between friends/teammates using temporary room code.
- Sensitive document transfer where server-side file storage must be avoided.

## Core User Flow

- Sender opens app, creates session, receives 6-digit room code.
- Receiver opens app, enters room code, joins session.
- Peers exchange SDP + ICE via signaling and establish WebRTC connection.
- Sender selects file(s), transfer begins with chunked stream and progress updates.
- Receiver validates file integrity hash and saves file locally.
- Session expires automatically after completion or inactivity.

## Functional Requirements

### Session Pairing

- Generate short room code with expiration.
- Join session via code with basic collision and reuse protection.
- Show connection state: waiting, connecting, connected, failed.

### Signaling

- WebSocket-based exchange of offers, answers, and ICE candidates.
- No file bytes through signaling channel.
- Reconnect and retry signaling when transient failures occur.

### Transfer Engine

- Chunked file transfer over WebRTC DataChannel.
- Configurable chunk size and flow control.
- Pause/resume/cancel support.
- Progress UI per file and overall session.

### Reliability

- Retry failed chunks where possible.
- Handle disconnect and partial transfer state cleanly.
- Optional resumable transfer metadata support.

### Security and Privacy

- Transport encryption via WebRTC (DTLS/SRTP stack).
- Integrity check using final SHA-256 hash.
- Backend does not persist file payloads.

### NAT Traversal

- ICE with STUN candidates by default.
- TURN relay fallback when direct P2P path fails.

### Cross-Device Support

- Works on modern desktop and mobile browsers.
- Graceful handling of background/foreground app behavior on mobile.

## Non-Functional Requirements

- Performance: smooth transfer UX for medium/large files under stable network conditions.
- Availability: signaling service handles concurrent lightweight sessions.
- Scalability: horizontally scalable stateless signaling layer.
- Security: rate limiting and abuse controls on signaling endpoints.
- Observability: logs for session lifecycle, connection failures, TURN usage rate.
- Usability: join-to-transfer flow should require minimal clicks and no account creation.

## Data and Privacy Requirements

- No server-side storage of transferred files.
- Minimal metadata retention (session id, status, timestamps, non-sensitive diagnostics).
- Automatic session cleanup after inactivity/expiry.
- No permanent user profile requirement.

## Success Metrics

- Session connection success rate.
- P2P direct success rate vs TURN fallback rate.
- Transfer completion rate.
- Median setup time (room join to transfer start).
- Median transfer failure recovery rate (resume/retry effectiveness).
- User-reported trust/clarity around privacy behavior.

## Risks and Mitigations

- Strict NAT/firewall failures: mitigate with TURN fallback.
- Mobile background interruptions: show warnings and recovery UX.
- Abuse/spam of room codes: add rate limiting and session TTL.
- Overclaiming privacy: clearly document metadata vs payload handling.
- Large memory pressure: enforce back-pressure with bufferedAmount thresholds.

## MVP Definition

- Room-code pairing, WebRTC data channel transfer, progress UI, pause/resume, hash verification, STUN support, basic signaling hardening.
- TURN fallback, resumable state persistence, and diagnostics dashboard can be included as advanced scope depending on resources.

## Locked MVP Decisions (Initial)

- TURN fallback is treated as MVP-required for reliability.
- Room code format remains 6-digit numeric with strict TTL and rate limiting.
- Resume support in MVP is in-session only (no persistence across page refresh).
- Integrity check covers corruption detection; sender identity authenticity is out of scope for MVP.

## MVP Status Snapshot

- Implemented: room-code signaling, WebRTC setup relay, browser sender/receiver UI.
- Implemented: chunked DataChannel transfer with per-file/overall progress.
- Implemented: pause/resume/cancel controls.
- Implemented: receiver-side SHA-256 verification before file download.
- Implemented: reconnect token flow for transient signaling disconnects.
- Implemented: health/config/metrics endpoints for runtime diagnostics.
