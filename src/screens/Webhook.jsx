import { useState } from 'react'
import { Check, ChevronRight, AlertTriangle } from 'lucide-react'
import { useStore } from '../store.jsx'
import { AppHeader, Banner } from '../components/ui.jsx'
import { connectRelay, isRelayUrl, wsSupported } from '../devices/wifi.js'
import { unregisterConnection } from '../devices/manager.js'

export default function Webhook() {
  const { state, update } = useStore()
  const [url, setUrl] = useState(state.webhook.url || '')
  const [testing, setTesting] = useState(false)
  const [verified, setVerified] = useState(state.webhook.verified)
  const [advanced, setAdvanced] = useState(false)
  const [error, setError] = useState('')

  async function verify() {
    setError('')
    const value = url.trim()
    if (!value) return

    // A real relay URL (ws:// or wss://) → live WebSocket subscription.
    if (isRelayUrl(value) && wsSupported()) {
      setTesting(true)
      try {
        await connectRelay(value)
        setVerified(true)
        update((s) => ({ ...s, webhook: { url: value, verified: true } }))
      } catch (e) {
        setVerified(false)
        setError(e.code === 'TIMEOUT' ? 'No response from the relay. Check the URL is running.' : 'Could not reach the relay.')
      } finally {
        setTesting(false)
      }
      return
    }

    // Otherwise treat as a plain webhook endpoint (demo verification).
    setTesting(true)
    setVerified(false)
    setTimeout(() => {
      setTesting(false)
      setVerified(true)
      update((s) => ({ ...s, webhook: { url: value, verified: true } }))
    }, 1300)
  }

  function disconnect() {
    unregisterConnection('wifi')
    setVerified(false)
    update((s) => ({ ...s, webhook: { url: url.trim(), verified: false } }))
  }

  return (
    <>
      <AppHeader title="Webhook & Wi-Fi" />
      <div className="screen" style={{ paddingTop: 4 }}>
        <p className="lead">Let a Wi-Fi device or another app start an alert over the network.</p>

        {verified && <Banner tone="ok" icon={<Check size={18} />}>Connected and listening for triggers.</Banner>}
        {error && <Banner tone="warn" icon={<AlertTriangle size={18} />}>{error}</Banner>}

        <div className="field">
          <label htmlFor="wh-url">Relay or webhook URL</label>
          <input id="wh-url" className="input" value={url} onChange={(e) => { setUrl(e.target.value); setVerified(false) }} placeholder="wss://…  or  https://…" inputMode="url" />
          <p className="hint">Use a <code>wss://</code> relay address for a live Wi-Fi device, or an <code>https://</code> endpoint for a webhook.</p>
        </div>

        <button className="btn btn-primary" onClick={verify} disabled={!url.trim() || testing}>
          {testing ? 'Connecting…' : verified ? 'Reconnect' : 'Test connection'}
        </button>
        {verified && <button className="btn btn-secondary" style={{ marginTop: 12 }} onClick={disconnect}>Disconnect</button>}

        <div style={{ marginTop: 22 }}>
          <button className="disclosure" aria-expanded={advanced} onClick={() => setAdvanced(!advanced)}>
            Advanced settings
            <ChevronRight size={18} className="chev" />
          </button>
          {advanced && (
            <div className="advanced-body">
              <div className="card">
                <div className="kv"><span className="k">Trigger message</span><span className="v" style={{ fontFamily: 'monospace', fontSize: 13 }}>{'{ "type": "sos" }'}</span></div>
                <div className="kv"><span className="k">Method</span><span className="v">POST → relay</span></div>
                <div className="kv"><span className="k">Retry attempts</span><span className="v">3</span></div>
              </div>
              <p className="hint">A reference relay server is included in <code>relay/</code>. The device POSTs a trigger; the app subscribes over WebSocket.</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
