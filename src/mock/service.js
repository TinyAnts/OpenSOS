// Alert service.
//  - Location is REAL (device GPS via Geolocation API, with graceful fallback).
//  - Delivery: if a relay is configured (from the Wi-Fi setup URL) and contacts
//    have email addresses, the relay sends real emails via Resend. Otherwise it
//    stays a safe simulation (nothing is sent).

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

export function getMockLocation() {
  return { lat: 37.7749, lng: -122.4194, accuracy: null, label: 'Sample location (GPS unavailable)', real: false }
}

function coordsLabel(lat, lng, accuracy) {
  const acc = accuracy ? ` (±${Math.round(accuracy)} m)` : ''
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}${acc}`
}

export function getLocation({ shareLocation = true } = {}) {
  return new Promise((resolve) => {
    if (!shareLocation) { resolve({ lat: null, lng: null, accuracy: null, label: 'Location not shared', real: false }); return }
    if (typeof navigator === 'undefined' || !navigator.geolocation) { resolve(getMockLocation()); return }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords
        resolve({ lat: latitude, lng: longitude, accuracy, label: coordsLabel(latitude, longitude, accuracy), mapsUrl: `https://maps.google.com/?q=${latitude},${longitude}`, real: true })
      },
      () => resolve(getMockLocation()),
      { enableHighAccuracy: true, timeout: 9000, maximumAge: 15000 }
    )
  })
}

// Derive the relay's https base + token from the wss subscribe URL the user
// entered on the Wi-Fi screen (e.g. wss://host/subscribe?token=XYZ).
export function relayFromWebhook(url) {
  try {
    const u = new URL((url || '').trim())
    if (u.protocol !== 'wss:' && u.protocol !== 'ws:') return null
    return { base: (u.protocol === 'wss:' ? 'https:' : 'http:') + '//' + u.host, token: u.searchParams.get('token') || '' }
  } catch { return null }
}

export async function sendAlert({ contacts, onStep, forceOutcome, shareLocation = true, relayUrl = '', test = false }) {
  onStep && onStep({ stage: 'locating', label: 'Getting your location' })
  const loc = await getLocation({ shareLocation })
  onStep && onStep({ stage: 'sending', label: 'Alerting your contacts', location: loc })

  // Real email delivery via the relay, when configured and contacts have emails.
  const relay = relayFromWebhook(relayUrl)
  const anyEmail = contacts.some((c) => c.email)
  let resultMap = null
  let channel = 'mock'
  let emailConfigured = false

  if (!forceOutcome && relay && anyEmail) {
    channel = 'email'
    try {
      const res = await fetch(`${relay.base}/alert?token=${encodeURIComponent(relay.token)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contacts: contacts.map((c) => ({ name: c.name, email: c.email || null })),
          location: { label: loc.label, mapsUrl: loc.mapsUrl || '' },
          test,
        }),
      })
      const data = await res.json()
      emailConfigured = !!data.configured
      resultMap = {}
      for (const r of data.results || []) resultMap[r.email || `__${r.name}`] = r.ok
    } catch {
      resultMap = {} // relay unreachable -> mark all failed (honest)
    }
  }

  const results = []
  for (let i = 0; i < contacts.length; i++) {
    const c = contacts[i]
    await wait(500)
    let ok
    if (resultMap) ok = !!(c.email && resultMap[c.email])
    else if (forceOutcome === 'partial') ok = i !== contacts.length - 1
    else ok = true // simulated success (no relay/email configured)
    results.push({ contact: c, ok })
    onStep && onStep({ stage: 'contact', index: i, contact: c, ok })
  }

  const delivered = results.filter((r) => r.ok).length
  const total = contacts.length
  const outcome = delivered === total ? 'success' : delivered === 0 ? 'failed' : 'partial'
  onStep && onStep({ stage: 'done', outcome, delivered, total, results, location: loc })
  return { outcome, delivered, total, results, location: loc, channel, emailConfigured }
}
