# Self-hosted TURN

TURN is the reliability fallback for strict NAT, carrier-grade NAT, hotel Wi-Fi, school/corporate firewalls, and networks that block direct peer-to-peer UDP.

0xLynk works without TURN when WebRTC can find a direct path through STUN. When it cannot, a TURN server relays encrypted WebRTC traffic. That relay sees packet flow and bandwidth usage, but file contents remain protected by WebRTC DTLS.

## Minimal coturn Docker Compose

```yaml
services:
  coturn:
    image: coturn/coturn:4.6
    restart: unless-stopped
    network_mode: host
    command:
      - --listening-port=3478
      - --fingerprint
      - --lt-cred-mech
      - --user=0xlynk:change-this-password
      - --realm=0xlynk
      - --no-multicast-peers
      - --no-cli
      - --min-port=49160
      - --max-port=49200
```

Open firewall ports:

- `3478/udp`
- `3478/tcp`
- relay UDP range, for example `49160-49200/udp`

For a public VM, set DNS such as `turn.example.com` to the VM IP.

## 0xLynk environment

```bash
TURN_URLS=turn:turn.example.com:3478?transport=udp,turn:turn.example.com:3478?transport=tcp
TURN_USERNAME=0xlynk
TURN_CREDENTIAL=change-this-password
```

Restart 0xLynk after setting the variables. The browser can also override TURN in the Advanced ICE/TURN section.

## Free hosting notes

- Oracle Cloud Always Free or another always-free VM can run coturn for personal demos.
- Public TURN credentials should not be published in a public repo.
- Keep relay port ranges small for demos, then widen them if you expect concurrent transfers.
- Bandwidth is the real cost. TURN relays file bytes when direct P2P fails.

## Diagnostics

In 0xLynk, check:

- `Path`: `direct` means no TURN relay is being used.
- `Path`: `relay` means TURN is active.
- `/metrics`: `turnRelayCandidates` increments when relay ICE candidates are observed.
