import { useEffect, useRef, useState } from 'react'
import { Users, MapPin, Radio, Wifi, WifiOff, CheckCircle2, AlertTriangle, ChevronRight } from 'lucide-react'
import { useRouter } from '../router.jsx'
import { useStore, readiness } from '../store.jsx'
import { AppHeader, TabBar } from '../components/ui.jsx'

const HOLD_MS = 1200

export default function Home() {
  const { navigate } = useRouter()
  const { state } = useStore()
  const { ready, checks } = readiness(state)

  const [progress, setProgress] = useState(0)
  const holding = useRef(false)
  const raf = useRef(null)
  const startedAt = useRef(0)

  const triggerLabel = state.trigger === 'hold' ? 'Press & hold' : state.trigger === 'bluetooth' ? 'Bluetooth button' : 'Webhook'

  // Nudge the user to finish setting up a trigger they chose but haven't connected.
  const needsBt = state.trigger === 'bluetooth' && !state.bluetooth.paired
  const needsWh = state.trigger === 'webhook' && !state.webhook.verified
  const setup = needsBt
    ? { title: 'Pair your Bluetooth button', sub: 'Connect it to trigger SOS with one press.', cta: 'Pair now', to: '/trigger/bluetooth', icon: <Radio size={20} /> }
    : needsWh
    ? { title: 'Finish Wi-Fi setup', sub: 'Connect your relay to trigger SOS over the network.', cta: 'Set up', to: '/trigger/webhook', icon: <Wifi size={20} /> }
    : null

  useEffect(() => () => cancelAnimationFrame(raf.current), [])

  function beginHold() {
    if (!ready) return
    holding.current = true
    startedAt.current = performance.now()
    const tick = (now) => {
      if (!holding.current) return
      const p = Math.min(100, ((now - startedAt.current) / HOLD_MS) * 100)
      setProgress(p)
      if (p >= 100) {
        holding.current = false
        setProgress(0)
        navigate('/countdown')
        return
      }
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
  }

  function endHold() {
    holding.current = false
    cancelAnimationFrame(raf.current)
    setProgress(0)
  }

  return (
    <>
      <AppHeader showBack={false} />
      <div className="screen" style={{ paddingTop: 8 }}>
        <div className={`home-status ${ready ? 'ready' : 'notready'}`}>
          <span className="ico">{ready ? <CheckCircle2 size={19} /> : <AlertTriangle size={19} />}</span>
          {ready ? 'System ready' : 'Setup needed'}
        </div>

        {setup && (
          <button className="pair-prompt" onClick={() => navigate(setup.to)}>
            <span className="pp-ico">{setup.icon}</span>
            <span className="pp-main">
              <span className="pp-title">{setup.title}</span>
              <span className="pp-sub">{setup.sub}</span>
            </span>
            <span className="pp-cta">{setup.cta}<ChevronRight size={16} /></span>
          </button>
        )}

        <div className="sos-wrap">
          <button
            className="sos-btn"
            disabled={!ready}
            style={{ '--p': progress }}
            onPointerDown={beginHold}
            onPointerUp={endHold}
            onPointerLeave={endHold}
            onPointerCancel={endHold}
            aria-label="Send SOS — press and hold"
          >
            {progress > 0 && <span className="sos-hold-fill" />}
            <span className="sos-label">SOS</span>
            <span className="sos-sub">HOLD</span>
          </button>
          <p className="sos-instruction">
            {ready ? 'Press and hold for emergency' : 'Finish setup to enable SOS'}
          </p>
        </div>

        <div className="status-grid">
          <StatusTile ok={checks.contacts} icon={<Users size={18} />} label="Contacts"
            value={state.contacts.length ? `${state.contacts.length} added` : 'None'} />
          <StatusTile ok={checks.location} icon={<MapPin size={18} />} label="Location"
            value={checks.location ? 'On' : 'Off'} />
          <StatusTile ok={checks.trigger} icon={<Radio size={18} />} label="Trigger" value={triggerLabel} />
          <StatusTile ok={checks.network} icon={checks.network ? <Wifi size={18} /> : <WifiOff size={18} />} label="Network"
            value={checks.network ? 'Online' : 'Offline'} />
        </div>

        <div style={{ marginTop: 16 }}>
          <button className="btn btn-secondary" onClick={() => navigate('/countdown', { mode: 'test' })}>
            Test system
          </button>
        </div>
      </div>
      <TabBar active="home" />
    </>
  )
}

function StatusTile({ ok, icon, label, value }) {
  return (
    <div className="status-tile">
      <span className="st-ico">{icon}</span>
      <div className="st-main">
        <div className="st-label">{label}</div>
        <div className="st-val">
          <span className={`dotmark ${ok ? 'ok' : 'warn'}`} />
          {value}
        </div>
      </div>
    </div>
  )
}
