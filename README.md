# OpenSOS

A calm, minimalist personal emergency‑alert app. Press and hold one button to
notify your trusted contacts and share your location. Runs entirely in **mock
mode** — no messages are ever actually sent, so it is safe to demo.

## Highlights

- Single, unmistakable **SOS** button with press‑and‑hold to prevent accidents
- Cancellable countdown before an alert is sent
- Live delivery progress, plus success and partial‑failure result screens
- Contacts, trigger selection (press‑and‑hold / Bluetooth button / webhook),
  event history, and settings
- Advanced/technical details (BLE UUIDs, webhook config, diagnostics) are hidden
  behind explicit “Advanced settings” / “Technical compatibility” disclosures
- Light and dark themes, mobile‑first responsive layout, reduced‑motion support

## Getting started

```bash
npm install
npm run dev -- --host 0.0.0.0     # http://localhost:5173
```

The app opens on the Welcome screen. Complete the short onboarding to reach the
home dashboard.

### Preview any screen directly

Routing is hash‑based, so screens can be deep‑linked. Append `?demo=1` to load
seeded demo data:

```
http://localhost:5173/?demo=1#/home
http://localhost:5173/?demo=1#/alert?view=partial
```

## Screenshots

Generate the full gallery (mobile, tablet, desktop) with Playwright:

```bash
npm run preview:screenshots        # builds, then captures every screen
```

Output is written to `preview/<viewport>/` and can be browsed via
`preview/index.html`.

> The screenshot script needs Playwright’s Chromium once:
> `npx playwright install chromium`

## Project layout

```
src/
  App.jsx            route table
  router.jsx         tiny hash router
  store.jsx          app state (persisted to localStorage) + demo data
  styles.css         design tokens + component styles
  mock/service.js    simulated alert delivery
  components/ui.jsx   shared UI (header, tab bar, pills, switch)
  screens/           one file per screen
scripts/screenshots.mjs   Playwright capture + gallery source data
preview/             generated screenshots and index.html gallery
```

## Documentation
- `docs/DEPLOY.md` — hosting the app (free, GitHub Pages) and the relay.
- `docs/SECURITY.md` — prototype security, protecting the relay from abuse/DDoS.
- `docs/INTEGRATION.md` — connecting the embedded BLE / Wi-Fi SOS device.
- `relay/README.md` — running the reference Wi-Fi relay.

## Publish to GitHub
This project is already a git repository with an initial commit and a GitHub
Pages deploy workflow (`.github/workflows/deploy.yml`).

Using the GitHub CLI (easiest):

```bash
gh repo create opensos --public --source=. --remote=origin --push
```

Or manually — create an empty repo on github.com, then:

```bash
git remote add origin https://github.com/<you>/opensos.git
git branch -M main
git push -u origin main
```

Then enable Pages: **Settings → Pages → Source: GitHub Actions**. The app builds
and deploys automatically on every push to `main`.

> Note: this is a research prototype. It will be published alongside a paper.

## License
MIT — see `LICENSE`.
