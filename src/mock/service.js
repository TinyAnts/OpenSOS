// Alert service. Delivery to contacts is simulated (safe demo), but location
// is REAL: it reads the device GPS via the browser Geolocation API, with a
// graceful fallback to a placeholder if permission is denied or unavailable.

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

// Placeholder used only when real location isn't available/allowed.
export function getMockLocation() {
  return { lat: 37.7749, lng: -122.4194, accuracy: null, label: 'Sample location (GPS unavailable)', real: false }
}

function coordsLabel(lat, lng, accuracy) {
  const acc = accuracy ? ` (±${Math.round(accuracy)} m)` : ''
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}${acc}`
}

// Reads the device's real location. Resolves to a location object either way.
export function getLocation({ shareLocation = true } = {}) {
  return new Promise((resolve) => {
    if (!shareLocation) {
      resolve({ lat: null, lng: null, accuracy: null, label: 'Location not shared', real: false })
      return
    }
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve(getMockLocation())
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords
        resolve({
          lat: latitude,
          lng: longitude,
          accuracy,
          label: coordsLabel(latitude, longitude, accuracy),
          mapsUrl: `https://maps.google.com/?q=${latitude},${longitude}`,
          real: true,
        })
      },
      () => resolve(getMockLocation()), // denied / error / timeout
      { enableHighAccuracy: true, timeout: 9000, maximumAge: 15000 }
    )
  })
}

// forceOutcome: undefined | 'success' | 'partial' — lets previews show each state.
export async function sendAlert({ contacts, onStep, forceOutcome, shareLocation = true }) {
  const results = []
  onStep && onStep({ stage: 'locating', label: 'Getting your location' })
  const loc = await getLocation({ shareLocation })

  onStep && onStep({ stage: 'sending', label: 'Alerting your contacts', location: loc })
  for (let i = 0; i < contacts.length; i++) {
    const c = contacts[i]
    await wait(550)
    let ok = true
    if (forceOutcome === 'partial') {
      ok = i !== contacts.length - 1
    } else if (forceOutcome === 'success') {
      ok = true
    }
    results.push({ contact: c, ok })
    onStep && onStep({ stage: 'contact', index: i, contact: c, ok })
  }

  const delivered = results.filter((r) => r.ok).length
  const total = contacts.length
  const outcome = delivered === total ? 'success' : delivered === 0 ? 'failed' : 'partial'
  onStep && onStep({ stage: 'done', outcome, delivered, total, results, location: loc })
  return { outcome, delivered, total, results, location: loc }
}
