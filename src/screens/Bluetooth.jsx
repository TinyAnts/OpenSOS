import { useState } from 'react'
import { Radio, Check, ChevronRight, Bluetooth as BtIcon, AlertTriangle } from 'lucide-react'
import { useStore } from '../store.jsx'
import { AppHeader, Banner } from '../components/ui.jsx'
import { bleSupported, connectBle } from '../devices/ble.js'
import { unregisterConnection } from '../devices/manager.js'

export default function Bluetooth() {
  const { state, update } = useStore()
  const paired = state.bluetooth.paired
  const [scanning, setScanning] = useState(false)
  const [advanced, setAdvanced] = useState(false)
  const [error, setError] = useState('')

  const supported = bleSupported()

  async function scan() {
    setError('')
    if (!supported) {
      setError('This browser can’t pair Bluetooth. Try Chrome, or use a demo button below.')
      return
    }
    setScanning(true)
    try {
      // Live button-press events require the device's GATT UUIDs; without them
      // we still pair so the device shows as connected.
      const r = await connectBle({})
      update((s) => ({ ...s, bluetooth: { deviceName: r.deviceName, paired: true } }))
    } catch (e) {
      if (e.code === 'UNSUPPORTED') setError('This browser can’t pair Bluetooth. Try Chrome, or use a demo button below.')
      else setError('No button found. Make sure it’s in pairing mode — or use a demo button below.')
    } finally {
      setScanning(false)
    }
  }

  function pairDemo() {
    setError('')
    update((s) => ({ ...s, bluetooth: { deviceName: 'Demo button', paired: true } }))
  }

  function unpair() {
    unregisterConnection('bluetooth')
    update((s) => ({ ...s, bluetooth: { deviceName: '', paired: false } }))
  }

  return (
    <>
      <AppHeader title="Bluetooth button" />
      <div className="screen" style={{ paddingTop: 4 }}>
        <p className="lead">Pair a physical button so you can trigger SOS without unlocking your phone.</p>

        {paired ? (
          <>
            <Banner tone="ok" icon={<Check size={18} />}>Your button is paired and ready.</Banner>
            <div className="row">
              <div className="avatar" style={{ color: 'var(--primary)' }}><Radio size={20} /></div>
              <div className="row-main">
                <div className="row-title">{state.bluetooth.deviceName}</div>
                <div className="row-sub">Connected</div>
              </div>
              <span className="pill pill--ok"><Check size={14} /> Paired</span>
            </div>
            <button className="btn btn-secondary" style={{ marginTop: 16 }} onClick={unpair}>Remove device</button>
          </>
        ) : (
          <>
            {!supported && (
              <Banner tone="warn" icon={<AlertTriangle size={18} />}>
                This browser can’t pair Bluetooth. Chrome works best. You can still use a demo button below.
              </Banner>
            )}
            {error && <Banner tone="warn" icon={<AlertTriangle size={18} />}>{error}</Banner>}

            <div className="empty" style={{ padding: '28px 20px' }}>
              <div className="empty-ico" style={{ color: scanning ? 'var(--primary)' : undefined }}>
                {scanning ? <span className="spinner" /> : <BtIcon size={28} />}
              </div>
              <div className="empty-title">{scanning ? 'Searching…' : 'No device paired'}</div>
              <div>{scanning ? 'Hold your button near the phone.' : 'Put your button in pairing mode, then scan.'}</div>
            </div>

            <div className="mt-auto" style={{ paddingTop: 16 }}>
              <button className="btn btn-primary" onClick={scan} disabled={scanning}>
                {scanning ? 'Scanning…' : 'Scan for devices'}
              </button>
              <button className="btn btn-ghost" style={{ marginTop: 10, color: 'var(--text-muted)' }} onClick={pairDemo}>
                No button yet? Use a demo one
              </button>
            </div>
          </>
        )}

        <div style={{ marginTop: 22 }}>
          <button className="disclosure" aria-expanded={advanced} onClick={() => setAdvanced(!advanced)}>
            Advanced settings
            <ChevronRight size={18} className="chev" />
          </button>
          {advanced && (
            <div className="advanced-body">
              <div className="card">
                <div className="kv"><span className="k">Service UUID</span><span className="v" style={{ fontFamily: 'monospace', fontSize: 13 }}>0000fe59-…</span></div>
                <div className="kv"><span className="k">Characteristic</span><span className="v" style={{ fontFamily: 'monospace', fontSize: 13 }}>8ec90003-…</span></div>
                <div className="kv"><span className="k">Auto-reconnect</span><span className="v">On</span></div>
              </div>
              <p className="hint">Set your device’s GATT UUIDs here to receive live button-press events. Values rarely need changing otherwise.</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
