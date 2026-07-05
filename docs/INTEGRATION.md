# Embedded SOS device — integration plan

OpenSOS is designed to accept a hardware SOS trigger. Today the app ships with
two trigger types that are the natural attach points for a physical device:

- **Bluetooth button** (`src/screens/Bluetooth.jsx`) — pair → `bluetooth.paired`
- **Webhook** (`src/screens/Webhook.jsx`) — verify URL → `webhook.verified`

Both are currently **mocked**. Wiring a real device means replacing the mock
pairing/verification with a real transport, then calling the existing alert flow.

## The single hook to call
When the device fires, the app should do exactly what the on-screen button does:

    navigate('/countdown')   // then the existing countdown → sendAlert() flow runs

So the device layer only needs to (a) establish a connection, (b) report
connected/ready state into the store, and (c) emit a "trigger" event.

## Where the real code goes
Create `src/devices/<transport>.js` exposing:

    connect(options)      -> Promise<{ ok, deviceName }>
    onTrigger(callback)   -> subscribe to button-press events
    getStatus()           -> 'connected' | 'disconnected'

Then, in the chosen trigger screen, replace the mock scan/verify with this
module, and store `{ paired/verified: true, deviceName }` on success. Add a small
listener near the app root that calls `navigate('/countdown')` on `onTrigger`.

## Candidate transports (pick per hardware)
| Transport | Browser API | Range | Notes |
|-----------|-------------|-------|-------|
| BLE button | Web Bluetooth | ~10 m, local | Chrome/Edge; needs https or localhost + user gesture. Best fit for the existing "Bluetooth button" trigger. |
| USB / wired | Web Serial | cable | Chrome/Edge; simple + reliable for a tethered device. |
| Wi‑Fi / cellular | WebSocket or MQTT-over-WS | remote | Device → broker/relay → app subscribes. Needs a small always-on relay; fits the "Webhook" trigger. |

## Open questions to resolve before building
1. What radio/interface does the device use (BLE, USB, Wi‑Fi, LTE)?
2. Local-only or remote/anywhere trigger?
3. One-way (device → app) or also app → device (e.g. acknowledge / LED / siren)?
4. Any existing firmware/protocol, or is that ours to define too?

---

## Decision (current): BLE + Wi-Fi, one-way

**Implemented scaffolding**
- `src/devices/manager.js` — global trigger bus; app subscribes in `App.jsx`
  and starts the countdown on any device trigger.
- `src/devices/ble.js` — Web Bluetooth. `Trigger → Bluetooth button → Scan`
  runs a real pairing prompt in Chrome/Edge (falls back to the demo flow where
  Web Bluetooth is unavailable). Supply the device's GATT service +
  characteristic UUIDs to receive live button-press events.
- `src/devices/wifi.js` — subscribes to a relay over WebSocket. `Trigger →
  Webhook / Wi-Fi`, enter a `wss://…/subscribe?token=…` URL.
- `relay/server.mjs` — reference relay (see `relay/README.md`).

**What still needs the real hardware**
- BLE live triggers need the device's actual GATT UUIDs (pairing works today
  without them).
- Point the device firmware at the relay's `POST /trigger` endpoint.
