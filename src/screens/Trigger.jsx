import { Hand, Radio, Webhook as WebhookIcon, Check, ChevronRight } from 'lucide-react'
import { useRouter } from '../router.jsx'
import { useStore } from '../store.jsx'
import { AppHeader, TabBar } from '../components/ui.jsx'

export default function Trigger() {
  const { navigate } = useRouter()
  const { state, update } = useStore()
  const trigger = state.trigger

  function choose(value) {
    update({ trigger: value })
  }

  const options = [
    { value: 'hold', icon: <Hand size={22} />, title: 'Press & hold', sub: 'Hold the on-screen SOS button', ready: true, setup: null },
    { value: 'bluetooth', icon: <Radio size={22} />, title: 'Bluetooth button', sub: state.bluetooth.paired ? `Paired · ${state.bluetooth.deviceName}` : 'Not paired yet', ready: state.bluetooth.paired, setup: '/trigger/bluetooth' },
    { value: 'webhook', icon: <WebhookIcon size={22} />, title: 'Webhook / Wi-Fi', sub: state.webhook.verified ? 'Verified' : 'Not set up yet', ready: state.webhook.verified, setup: '/trigger/webhook' },
  ]

  return (
    <>
      <AppHeader title="Trigger" showBack={false} />
      <div className="screen" style={{ paddingTop: 4 }}>
        <p className="lead">Choose how you start an emergency alert.</p>
        <div className="stack">
          {options.map((o) => {
            const selected = trigger === o.value
            return (
              <div key={o.value}>
                <button type="button" className={`choice ${selected ? 'selected' : ''}`} onClick={() => choose(o.value)} aria-pressed={selected}>
                  <span className="ch-ico">{o.icon}</span>
                  <span className="ch-main">
                    <span className="ch-title">{o.title}</span>
                    <span className="ch-sub">{o.sub}</span>
                  </span>
                  {selected && <span className="ch-check"><Check size={20} /></span>}
                </button>
                {selected && o.setup && (
                  <button className="row" style={{ width: '100%', marginTop: 8, cursor: 'pointer', textAlign: 'left', background: 'var(--surface)' }} onClick={() => navigate(o.setup)}>
                    <div className="row-main">
                      <div className="row-title">{o.ready ? 'Manage setup' : 'Set up now'}</div>
                      <div className="row-sub">{o.value === 'bluetooth' ? 'Pair your device' : 'Connect relay or webhook'}</div>
                    </div>
                    <ChevronRight size={18} className="muted" />
                  </button>
                )}
              </div>
            )
          })}
        </div>

        <p className="hint" style={{ marginTop: 18 }}>
          You can switch triggers anytime. Press &amp; hold always works as a fallback.
        </p>
      </div>
      <TabBar active="trigger" />
    </>
  )
}
