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
