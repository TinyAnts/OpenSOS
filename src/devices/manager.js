// Global device trigger bus + live connection registry.
// Device transports (BLE, Wi-Fi relay) register here and emit trigger events.
// The app subscribes once (see App.jsx) and starts the SOS countdown on trigger.
// One-way only: device -> app.

const listeners = new Set()
const connections = new Map() // key: 'bluetooth' | 'wifi' -> { disconnect, meta }

export function onDeviceTrigger(cb) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

// Called by a transport when the physical SOS button is pressed.
export function fireTrigger(source, extra = {}) {
  const evt = { source, at: Date.now(), ...extra }
  listeners.forEach((cb) => {
    try { cb(evt) } catch (e) { console.error('device trigger listener error', e) }
  })
}

export function registerConnection(key, conn) {
  // Replace any existing connection for this key.
  const prev = connections.get(key)
  if (prev && prev.disconnect) { try { prev.disconnect() } catch {} }
  connections.set(key, conn)
}

export function unregisterConnection(key) {
  const conn = connections.get(key)
  if (conn && conn.disconnect) { try { conn.disconnect() } catch {} }
  connections.delete(key)
}

export function isConnected(key) {
  return connections.has(key)
}

export function connectionMeta(key) {
  return connections.get(key)?.meta || null
}
