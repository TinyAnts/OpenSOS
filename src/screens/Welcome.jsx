import { ShieldCheck } from 'lucide-react'
import { useRouter } from '../router.jsx'

export default function Welcome() {
  const { navigate } = useRouter()
  return (
    <div className="screen screen--center">
      <div style={{ width: 88, height: 88, borderRadius: 24, background: 'var(--danger-soft)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
        <ShieldCheck size={44} />
      </div>
      <h2 className="title">OpenSOS</h2>
      <p className="lead" style={{ maxWidth: 320 }}>
        A calm, reliable way to alert the people you trust when you need help.
      </p>

      <div className="stack" style={{ width: '100%', maxWidth: 340, textAlign: 'left', marginBottom: 28 }}>
        <Point>Reach your emergency contacts in one press.</Point>
        <Point>Share your location automatically.</Point>
        <Point>Works with a phone hold, a button, or a webhook.</Point>
      </div>

      <div className="stack" style={{ width: '100%', maxWidth: 340 }}>
        <button className="btn btn-primary" onClick={() => navigate('/onboarding')}>Get started</button>
      </div>
      <p className="hint" style={{ marginTop: 16 }}>Demo mode — no messages are actually sent.</p>
    </div>
  )
}

function Point({ children }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
      <span style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--primary)', flexShrink: 0 }} />
      <span style={{ fontSize: 15 }}>{children}</span>
    </div>
  )
}
