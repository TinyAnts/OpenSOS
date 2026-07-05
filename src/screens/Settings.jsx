import { useState } from 'react'
import { Sun, Moon, Monitor, ChevronRight, RotateCcw } from 'lucide-react'
import { useStore } from '../store.jsx'
import { AppHeader, TabBar, Switch } from '../components/ui.jsx'

export default function Settings() {
  const { state, setSettings, reset } = useStore()
  const s = state.settings
  const [tech, setTech] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)

  const themes = [
    { value: 'system', label: 'System', icon: <Monitor size={18} /> },
    { value: 'light', label: 'Light', icon: <Sun size={18} /> },
    { value: 'dark', label: 'Dark', icon: <Moon size={18} /> },
  ]

  return (
    <>
      <AppHeader title="Settings" showBack={false} />
      <div className="screen" style={{ paddingTop: 4 }}>

        <div className="section-label">Appearance</div>
        <div className="btn-row" role="group" aria-label="Theme">
          {themes.map((t) => (
            <button key={t.value}
              className={`btn ${s.theme === t.value ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flexDirection: 'column', gap: 4, minHeight: 66, fontSize: 13 }}
              onClick={() => setSettings({ theme: t.value })}
              aria-pressed={s.theme === t.value}>
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        <div className="section-label" style={{ marginTop: 24 }}>Alert</div>
        <div className="stack">
          <div className="row">
            <div className="row-main">
              <div className="row-title">Countdown before sending</div>
              <div className="row-sub">Time to cancel an accidental alert</div>
            </div>
            <select className="select" style={{ width: 'auto', minHeight: 44 }} value={s.countdownSeconds}
              onChange={(e) => setSettings({ countdownSeconds: Number(e.target.value) })}>
              <option value={5}>5s</option>
              <option value={10}>10s</option>
              <option value={15}>15s</option>
              <option value={30}>30s</option>
            </select>
          </div>
          <div className="row">
            <div className="row-main">
              <div className="row-title">Share location</div>
              <div className="row-sub">Include your position in the alert</div>
            </div>
            <Switch checked={s.shareLocation} onChange={(v) => setSettings({ shareLocation: v })} label="Share location" />
          </div>
          <div className="row">
            <div className="row-main">
              <div className="row-title">Sound siren on alert</div>
              <div className="row-sub">Play a loud alarm when SOS is sent</div>
            </div>
            <Switch checked={s.sirenOnAlert} onChange={(v) => setSettings({ sirenOnAlert: v })} label="Sound siren" />
          </div>
        </div>

        <div className="section-label" style={{ marginTop: 24 }}>About</div>
        <div className="card">
          <div className="kv"><span className="k">Version</span><span className="v">1.0.0</span></div>
          <div className="kv"><span className="k">Mode</span><span className="v">Demo (mock)</span></div>
        </div>

        <div style={{ marginTop: 16 }}>
          <button className="disclosure" aria-expanded={tech} onClick={() => setTech(!tech)}>
            Technical compatibility
            <ChevronRight size={18} className="chev" />
          </button>
          {tech && (
            <div className="advanced-body">
              <div className="card">
                <div className="kv"><span className="k">Bluetooth (Web BLE)</span><span className="v">{'bluetooth' in navigator ? 'Supported' : 'Not available'}</span></div>
                <div className="kv"><span className="k">Geolocation</span><span className="v">{'geolocation' in navigator ? 'Supported' : 'Not available'}</span></div>
                <div className="kv"><span className="k">Notifications</span><span className="v">{'Notification' in window ? 'Supported' : 'Not available'}</span></div>
                <div className="kv"><span className="k">Service worker</span><span className="v">{'serviceWorker' in navigator ? 'Supported' : 'Not available'}</span></div>
              </div>
              <p className="hint">These diagnostics help when troubleshooting a device. Ordinary use never requires them.</p>
            </div>
          )}
        </div>

        <div className="divider" />
        {!confirmReset ? (
          <button className="btn btn-ghost" style={{ color: 'var(--danger)' }} onClick={() => setConfirmReset(true)}>
            <RotateCcw size={18} /> Reset app data
          </button>
        ) : (
          <div className="card" style={{ borderColor: 'var(--danger)' }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Reset all data?</div>
            <p className="hint" style={{ marginTop: 0 }}>This clears contacts, history, and settings on this device.</p>
            <div className="btn-row">
              <button className="btn btn-secondary" onClick={() => setConfirmReset(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => { reset(); setConfirmReset(false); window.location.hash = '/welcome' }}>Reset</button>
            </div>
          </div>
        )}
      </div>
      <TabBar active="settings" />
    </>
  )
}
