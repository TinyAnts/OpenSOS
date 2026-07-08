# OpenSOS relay (Wi-Fi trigger)

A tiny, dependency-free WebSocket relay so a remote Wi-Fi/cellular SOS device can
trigger the app. One-way: **device → relay → app**.

## Run it

```bash
TOKEN=changeme PORT=8787 node relay/server.mjs
```

## Connect the app

In the app: **Trigger → Webhook / Wi-Fi**, enter the relay URL and press
**Test connection**:

```
ws://localhost:8787/subscribe?token=changeme
```

When it opens, the app shows “Connected and listening for triggers.”

## Fire from the device

The embedded device sends an HTTP POST when its button is pressed:

```bash
curl -X POST "http://localhost:8787/trigger?token=changeme" \
     -H "Content-Type: application/json" \
     -d '{"deviceId":"unit-1"}'
```

The app immediately starts the SOS countdown, exactly as if you held the
on-screen button.

## Notes
- Use `wss://` (TLS) and a strong token in production; put the relay behind a
  host the device and phone can both reach.
- Payload the app reacts to: `{ "type": "sos" }` (the relay adds this wrapper).

## Deploy to Render (always-on, free)

This repo includes a Render Blueprint (`render.yaml`), so deploying is almost
one click.

1. Push the repo to GitHub (you already have it at github.com/TinyAnts/OpenSOS).
2. Go to https://render.com, sign in with GitHub.
3. **New +  →  Blueprint**, pick the **OpenSOS** repo, click **Apply**.
   Render reads `render.yaml`, creates the `opensos-relay` web service, and
   generates a random `TOKEN` for you.
4. When it goes live you get a URL like `https://opensos-relay.onrender.com`.
5. Find your token: service → **Environment** → copy the `TOKEN` value.
6. In the app (**Trigger → Webhook & Wi-Fi**) enter, using your URL + token:

   ```
   wss://opensos-relay.onrender.com/subscribe?token=YOUR_TOKEN
   ```

   Press **Test connection** → "Connected and listening for triggers."
7. Fire a test the way the device will:

   ```bash
   curl -X POST "https://opensos-relay.onrender.com/trigger?token=YOUR_TOKEN" \
        -H "Content-Type: application/json" -d '{"deviceId":"unit-1"}'
   ```

   The app starts the SOS countdown.

### Free-tier note
Render's free service **sleeps after ~15 min idle** and takes ~30–60s to wake.
Fine for demos; for real emergency use, switch the plan to a paid always-on
instance (or move the relay to Cloudflare Workers, which never sleep).
