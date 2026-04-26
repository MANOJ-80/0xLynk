# Free Deployment Guide

This guide covers zero-cost deployment options for 0xLynk.

## Option 1: Temporary public demo URL (local machine)

Best for interviews, quick stakeholder review, and short-lived demos.

```bash
npm install
npm run demo:share
```

What this does:

- Starts app container (`app`) via Docker Compose.
- Starts `cloudflared` sidecar.
- Exposes app through a temporary `https://<random>.trycloudflare.com` URL.

Stop demo stack:

```bash
npm run demo:down
```

Limitations:

- URL rotates on every run.
- Availability depends on your machine and network uptime.
- Not intended for permanent production use.

## Option 2: Persistent always-free VM deployment

Use an always-free VPS tier (for example Oracle Cloud Always Free).

### Steps

1. Install Docker + Compose plugin on VM.
2. Clone this repository.
3. Configure environment:

```bash
cp .env.example .env
```

4. Start app:

```bash
npm run docker:up:detached
```

5. Verify:

```bash
curl http://localhost:8080/health
```

6. Put HTTPS reverse proxy in front (Caddy/Nginx) + attach domain DNS.

## Option 3: Render free-plan deployment

This repo includes `render.yaml` for Render Blueprint deploy.

1. Push repo to GitHub.
2. In Render: `New +` -> `Blueprint`.
3. Select repository and deploy.
4. Open generated `*.onrender.com` URL after first successful deploy.

Free-plan notes:

- Service can sleep on inactivity (cold starts expected).
- Large transfers are more stable when service is warm.

## TURN guidance (important)

Some strict NAT/corporate networks require TURN relay for reliable connectivity.

Set one of:

- `ICE_SERVERS_JSON` (full override), or
- `TURN_URLS`, `TURN_USERNAME`, `TURN_CREDENTIAL`.

Without TURN, peers behind restrictive networks may fail to establish transfer channels.

## Recommended runtime values for demos

- `SESSION_TTL_MS=10800000` (3 hours) for long sessions.
- Chunk size in UI: `Auto` (adaptive) or `32 KB` for stable general use.
