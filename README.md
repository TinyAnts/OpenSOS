# OpenSOS

**A free, installable, cross-platform web app for personal emergency alerting.**
Press and hold one button to notify the people you trust and share your live
location — from any modern phone or computer, with no app store, no hardware,
and no subscription.

Live demo: **https://tinyants.github.io/OpenSOS/**

OpenSOS is a Progressive Web App (PWA): it installs to the home screen, launches
full-screen like a native app, and keeps working offline after first load. It is
designed to be usable by older adults and people who are unwell — a single
obvious action, large touch targets, high-contrast text, calm colour usage, and
light/dark themes.

## What it does

- **One-press SOS** — a large press-and-hold button with a cancellable countdown
  to prevent accidental alerts.
- **Real location** — alerts include the user's GPS coordinates and a Google Maps
  link (respects a "share location" setting).
- **Email alerts to contacts** — trusted contacts are notified by email through a
  small, token-secured relay. Works on every device, including iPhone.
- **Universal Wi-Fi trigger** — an external device or another app can raise an
  alert through the relay over a WebSocket; this works in **any browser**.
- **Optional Bluetooth button** *(Android / desktop Chromium only)* — pair a
  physical BLE button as an extra trigger.
- **Local-first privacy** — contacts and history live in the browser; no accounts,
  no server database.
- **Event history**, **light/dark**, **reduced-motion**, offline support.

## Cross-platform reach

Every core capability — on-screen SOS, the Wi-Fi trigger, GPS location, email
delivery, installability, and offline use — works on Android, iOS, and desktop
browsers alike. Only the optional Bluetooth button depends on Web Bluetooth and
is therefore limited to Chromium-based platforms (Android / desktop). See the
paper in [`paper/`](paper/) for the full analysis and figures.

## Getting started

```bash
npm install
npm run dev -- --host 0.0.0.0     # http://localhost:5173
```

Complete the short onboarding to reach the home dashboard. Routing is hash-based,
so any screen can be deep-linked; append `?demo=1` for seeded demo data:

```
http://localhost:5173/?demo=1#/home
http://localhost:5173/?demo=1#/alert?view=partial
```

## Triggers

| Channel | How it works | Platform reach |
|---|---|---|
| Press & hold | Hold the on-screen SOS button; a cancellable countdown then sends | All devices/browsers |
| Wi-Fi relay | An external device/app sends a token-authenticated request to the relay; the app receives it over a WebSocket | All devices/browsers (incl. iOS) |
| Bluetooth button (optional) | A paired BLE peripheral fires the alert | Android / desktop Chromium |

## Real alerts (email + GPS)

The relay (in [`relay/`](relay/)) both forwards Wi-Fi triggers and sends contact
emails via [Resend](https://resend.com). Deploy it free on Render and set the
`RESEND_API_KEY` (and shared `TOKEN`) as environment variables; the API key never
touches the browser. Full steps: [`relay/README.md`](relay/README.md) and
[`docs/DEPLOY.md`](docs/DEPLOY.md).

## Screenshots

```bash
npm run preview:screenshots        # builds, then captures every screen
```

Output is written to `preview/<viewport>/` and browsable via `preview/index.html`.
(Needs Playwright's Chromium once: `npx playwright install chromium`.)

## Deploy

The repo includes a GitHub Pages workflow (`.github/workflows/deploy.yml`); every
push to `main` builds and publishes automatically. Enable it under
**Settings → Pages → Source: GitHub Actions**. The Wi-Fi/email relay deploys free
on Render via the included `render.yaml` blueprint.

## Research paper & figures

The `paper/` folder contains the manuscript and a reproducible figure pipeline:

- [`paper/OpenSOS_paper.docx`](paper/OpenSOS_paper.docx) — the paper.
- [`paper/OpenSOS_figures.ipynb`](paper/OpenSOS_figures.ipynb) — a Jupyter
  notebook that regenerates **every figure** (charts, architecture diagram, and
  app-screenshot montages). Edit the data block and *Run All*.
- `paper/figures/` — the generated figures; `paper/screens/` — the app
  screenshots used by the montages.

See [`paper/README.md`](paper/README.md) for how to run the notebook.

## Project layout

```
src/                 React app (screens, router, store, devices, styles)
relay/               reference Wi-Fi/email relay (Node, no deps)
public/              PWA manifest, service worker, icons
scripts/             screenshot capture + standalone build
docs/                DEPLOY, SECURITY, INTEGRATION
paper/               manuscript + figure-generating notebook
.github/workflows/   GitHub Pages deploy
```

## Documentation

- `docs/DEPLOY.md` — hosting the app (free, GitHub Pages) and the relay.
- `docs/SECURITY.md` — prototype security; protecting the relay from abuse.
- `docs/INTEGRATION.md` — connecting an embedded BLE / Wi-Fi SOS device.
- `relay/README.md` — running the relay and enabling email alerts.

## Disclaimer

OpenSOS is a research prototype, **not a certified medical device**. In demo mode
no messages are sent; email is delivered only when the relay is configured with a
provider key.

## License

MIT — see `LICENSE`.
