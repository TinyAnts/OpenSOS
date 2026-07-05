// Mock alert service. Simulates delivering an SOS alert to contacts.
// No real network calls are made — this is a safe, offline demo.

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

// Deterministic-ish location for the demo.
export function getMockLocation() {
  return { lat: 37.7749, lng: -122.4194, accuracy: 12, label: 'Market St, San Francisco' }
}

// forceOutcome: undefined | 'success' | 'partial' — lets previews show each state.
export async function sendAlert({ contacts, onStep, forceOutcome }) {
  const results = []
  onStep && onStep({ stage: 'locating', label: 'Getting your location' })
  await wait(700)
  const loc = getMockLocation()

  onStep && onStep({ stage: 'sending', label: 'Alerting your contacts', location: loc })
  for (let i = 0; i < contacts.length; i++) {
    const c = contacts[i]
    await wait(550)
    let ok = true
    if (forceOutcome === 'partial') {
      // Fail the last contact only.
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
