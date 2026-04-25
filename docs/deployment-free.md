# Free Deployment Guide

This guide covers two zero-cost deployment modes for 0xLynk.

## 1) Instant Public Demo URL (from your local machine)

Use this for quick sharing, interviews, and demos.

```bash
npm install
npm run demo:share
```

What happens:

- `app` service runs on Docker.
- `cloudflared` creates a temporary public URL.
- Tunnel logs print a URL like `https://<random>.trycloudflare.com`.

Stop:

```bash
npm run demo:down
```

Limitations:

- URL is temporary and changes each run.
- Availability depends on your laptop and network.

## 2) Always-Free VM Deployment (recommended for persistent demo)

Use an always-free VPS (e.g., Oracle Cloud Always Free).

### Steps

1. Install Docker and Compose plugin on VM.
2. Clone repository.
3. Configure env:

```bash
cp .env.example .env
```

4. Start service:

```bash
npm run docker:up:detached
```

5. Verify health:

```bash
curl http://localhost:8080/health
```

6. Expose with HTTPS via reverse proxy (Caddy/Nginx) and DNS.

## TURN (for stricter networks)

WebRTC file transfer can fail in some NAT/corporate networks without TURN.

Set these in `.env` when you have TURN server details:

- `TURN_URLS`
- `TURN_USERNAME`
- `TURN_CREDENTIAL`

If you already have full ICE config JSON, use `ICE_SERVERS_JSON` instead.

## Suggested demo defaults

- Keep `SESSION_TTL_MS=10800000` (3 hours) for long transfers.
- Keep chunk size at `32 KB` in UI for good speed/stability balance.
