# Deploying OpenSOS

There are two separate pieces:

1. **The app** — a static site (HTML/JS/CSS). Cheapest possible: **free**.
2. **The relay** — a tiny always-on WebSocket server, only needed for the
   Wi-Fi device trigger. Needs a host that can run a process. Also has a free tier.

You do **not** need to buy a domain. Every option below gives you a working
https URL out of the box. A custom domain is optional polish you can add later.

## 1. Host the app (free) — GitHub Pages
The repo already includes `.github/workflows/deploy.yml`.

1. Push the repo to GitHub (see the main README).
2. On GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Every push to `main` builds and publishes to
   `https://<your-user>.github.io/<repo>/`.

That's it — no server, no cost, https included. Because the app stores data in
the browser and needs no backend, Pages is a perfect fit.

Equivalent free alternatives (pick one, all zero-config for a Vite app):
**Cloudflare Pages**, **Netlify**, **Vercel**. Cloudflare Pages is a good choice
if you also want Cloudflare's free DDoS/bot protection in front (see SECURITY.md).

Simplest of all with no hosting at all: the single-file `opensos.html` runs by
double-clicking — great for demos, not a public URL.

## 2. Host the relay (only for the Wi-Fi device)
The relay must stay running, so Pages can't host it. Cheap/free options:

| Host | Cost | Notes |
|------|------|-------|
| **Render** | Free tier | Easiest. Deploy `relay/server.mjs` as a Web Service (`node relay/server.mjs`). Free instances sleep when idle. |
| **Railway / Fly.io** | ~free–$5/mo | Always-on small instances; good WebSocket support. |
| **Cloudflare Workers + Durable Objects** | Free tier | Rewrite the relay as a Worker; best DDoS story, always warm. |
| **$4–6/mo VPS** (Hetzner, DigitalOcean) | cheapest paid | Full control; run behind Cloudflare. |

For a prototype, **Render's free tier** is the least-effort path. Set the
`TOKEN` environment variable to a long random string and use the `wss://` URL it
gives you in the app's *Webhook & Wi-Fi* screen.

## Custom domain (optional)
Any registrar (Cloudflare Registrar is at-cost, ~$10/yr) → point DNS at Pages or
your relay host. Not required for the paper or a demo.
