import { useState } from 'react'
import { Radio, Check, ChevronRight, Bluetooth as BtIcon, AlertTriangle, Home } from 'lucide-react'
import { useStore } from '../store.jsx'
import { useRouter } from '../router.jsx'
import { AppHeader, Banner, TabBar } from '../components/ui.jsx'
import { bleSupported, connectBle } from '../devices/ble.js'
import { unregisterConnection, fireTrigger } from '../devices/manager.js'

export default function Bluetooth() {
  const { state, update } = useStore()
  const { navigate } = useRouter()
  const bt = state.bluetooth
  const paired = bt.paired
  const [scanning, setScanning] = useState(false)
  const [advanced, setAdvanced] = useState(false)
  const [error, setError] = useState('')

  const supported = bleSupported()
  const hasFilter = !!(bt.namePrefix || bt.serviceUuid)

  function setBt(patch) {
    update((s) => ({ ...s, bluetooth: { ...s.bluetooth, ...patch } }))
  }

  async function scan() {
    setError('')
    if (!supported) {
      setError('This browser can’t pair Bluetooth. Try Chrome, or use a demo button below.')
      return
    }
    setScanning(true)
    try {
      const r = await connectBle({
        namePrefix: bt.namePrefix || undefined,
        service: bt.serviceUuid || undefined,
        characteristic: bt.characteristicUuid || undefined,
      })
      setBt({ deviceName: r.deviceName, paired: true })
    } catch (e) {
      if (e.code === 'UNSUPPORTED') setError('This browser can’t pair Bluetooth. Try Chrome, or use a demo button below.')
      else if (e.name === 'NotFoundError') setError('No device chosen. If the list was empty, your button may not be advertising — or clear the filter below to see all devices.')
      else setError('Couldn’t pair. Check the Service UUID / name filter below, or use a demo button.')
    } finally {
      setScanning(false)
    }
  }

  function pairDemo() {
    setError('')
    setBt({ deviceName: 'Demo button', paired: true })
  }

  function unpair() {
    unregisterConnection('bluetooth')
    setBt({ deviceName: '', paired: false })
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
                <div className="row-title">{bt.deviceName}</div>
                <div className="row-sub">Connected</div>
              </div>
              <span className="pill pill--ok"><Check size={14} /> Paired</span>
            </div>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/home')}>
              <Home size={18} /> Done — go to Home
            </button>
            <button className="btn btn-secondary" style={{ marginTop: 12 }} onClick={() => fireTrigger('bluetooth', { deviceName: bt.deviceName })}>Send a test press</button>
            <button className="btn btn-ghost" style={{ marginTop: 10, color: 'var(--text-muted)' }} onClick={unpair}>Remove device</button>
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
              <div>
                {scanning
                  ? 'Hold your button near the phone.'
                  : hasFilter
                    ? 'Only your OpenSOS button will appear in the list.'
                    : 'Put your button in pairing mode, then scan.'}
              </div>
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
              <p className="hint" style={{ marginTop: 0 }}>
                Set your button’s details to show <strong>only it</strong> when scanning.
                Leave blank to list every nearby device (useful for testing).
              </p>
              <div className="field">
                <label htmlFor="bt-name">Device name starts with</label>
                <input id="bt-name" className="input" placeholder="e.g. OpenSOS"
                  value={bt.namePrefix} onChange={(e) => setBt({ namePrefix: e.target.value })} />
              </div>
              <div className="field">
                <label htmlFor="bt-svc">Service UUID</label>
                <input id="bt-svc" className="input" style={{ fontFamily: 'monospace', fontSize: 13 }}
                  placeholder="0000fe59-0000-1000-8000-00805f9b34fb"
                  value={bt.serviceUuid} onChange={(e) => setBt({ serviceUuid: e.target.value.trim() })} />
              </div>
              <div className="field">
                <label htmlFor="bt-chr">Characteristic UUID <span className="muted">(for live press)</span></label>
                <input id="bt-chr" className="input" style={{ fontFamily: 'monospace', fontSize: 13 }}
                  placeholder="8ec90003-f315-4f60-9fb8-838830daea50"
                  value={bt.characteristicUuid} onChange={(e) => setBt({ characteristicUuid: e.target.value.trim() })} />
              </div>
              {hasFilter && (
                <button className="btn btn-ghost" style={{ color: 'var(--text-muted)' }}
                  onClick={() => setBt({ namePrefix: '', serviceUuid: '', characteristicUuid: '' })}>
                  Clear filter (show all devices)
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      <TabBar active="trigger" />
    </>
  )
}
