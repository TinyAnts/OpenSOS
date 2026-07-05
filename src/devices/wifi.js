// Wi-Fi / cloud transport: subscribe to a relay over WebSocket and trigger on an
// incoming SOS message (one-way: device -> relay -> app).
import { fireTrigger, registerConnection, unregisterConnection } from './manager.js'

export function wsSupported() {
  return typeof WebSocket !== 'undefined'
}

export function isRelayUrl(url) {
  return /^wss?:\/\//i.test((url || '').trim())
}

// Resolves when the socket opens (verified). Rejects on error/timeout.
export function connectRelay(url, { timeoutMs = 6000 } = {}) {
  return new Promise((resolve, reject) => {
    if (!wsSupported()) { const e = new Error('unsupported'); e.code = 'UNSUPPORTED'; return reject(e) }
    if (!isRelayUrl(url)) { const e = new Error('bad-url'); e.code = 'BAD_URL'; return reject(e) }

    let settled = false
    const ws = new WebSocket(url.trim())
    const timer = setTimeout(() => {
      if (settled) return
      settled = true
      try { ws.close() } catch {}
      const e = new Error('timeout'); e.code = 'TIMEOUT'; reject(e)
    }, timeoutMs)

    ws.addEventListener('open', () => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      registerConnection('wifi', {
        meta: { url: url.trim() },
        disconnect: () => { try { ws.close() } catch {} },
      })
      resolve({ url: url.trim() })
    })

    ws.addEventListener('message', (e) => {
      let m
      try { m = JSON.parse(e.data) } catch { m = null }
      if (m && (m.type === 'sos' || m.event === 'trigger')) {
        fireTrigger('wifi', { deviceId: m.deviceId })
      }
    })

    ws.addEventListener('close', () => unregisterConnection('wifi'))
    ws.addEventListener('error', () => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      const err = new Error('connect-failed'); err.code = 'CONNECT_FAILED'; reject(err)
    })
  })
}
