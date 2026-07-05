# Security notes (prototype)

## Do you need login?
For the app itself: **no.** OpenSOS keeps all data (contacts, history, settings)
in the browser's `localStorage` on the user's own device. Nothing is uploaded,
so there is no account to protect and no server database to breach. This is the
right posture for a prototype and for the paper.

The one networked component is the **relay** (Wi-Fi trigger). It should not be
open to the public, because anyone who can reach it could fire a fake SOS.

## Protecting the relay from bots / abuse / DDoS
The relay already requires a shared **token** on both ends:

- Device → `POST /trigger?token=…`
- App → `ws://…/subscribe?token=…`

Requests with a wrong/missing token are rejected (`401`). Use a long random
token (e.g. `openssl rand -hex 24`) and set it via the `TOKEN` env var — never
commit it.

Layer these on for a public deployment:

1. **Put it behind Cloudflare (free).** This is the single biggest win: it
   absorbs volumetric DDoS, offers "Under Attack" mode, bot fighting, and free
   TLS. Point the relay's DNS at Cloudflare and enable proxying.
2. **Rate-limit `POST /trigger`.** A real button presses a few times a day;
   cap it (e.g. Cloudflare rule: N requests/min per IP, or add a small
   in-process limiter). This blocks trigger-spam.
3. **Use `wss://` (TLS) only** in production so the token isn't sent in clear.
4. **Rotate the token** if a device is lost; each device can carry its own token.
5. **Optional hardening:** allow-list device source IPs, add an HMAC signature on
   the trigger body, and keep the relay's only routes `/trigger` and `/subscribe`
   (it already 404s everything else).

## What is intentionally out of scope for the prototype
- User accounts / passwords (no server-side user data to guard).
- End-to-end encryption of alerts (mock mode sends nothing).
When the project moves past prototype, revisit these before handling real
contacts and real message delivery.
