import { useEffect, useState, useRef } from 'react'
import { X } from 'lucide-react'
import { useRouter } from '../router.jsx'
import { useStore } from '../store.jsx'

export default function Countdown() {
  const { navigate, params, back } = useRouter()
  const { state } = useStore()
  const total = state.settings.countdownSeconds || 10
  const frozen = params.frozen === '1'
  const [remaining, setRemaining] = useState(frozen ? Math.min(7, total) : total)
  const timer = useRef(null)

  const isTest = params.mode === 'test'

  useEffect(() => {
    if (frozen) return
    timer.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(timer.current)
          navigate('/alert', isTest ? { mode: 'test' } : {})
          return 0
        }
        return r - 1
      })
    }, 1000)
    return () => clearInterval(timer.current)
  }, [frozen, navigate, isTest])

  const R = 108
  const C = 2 * Math.PI * R
  const pct = remaining / total
  const dash = C * pct

  return (
    <div className="countdown-screen">
      <p className="section-label" style={{ color: 'var(--danger)' }}>
        {isTest ? 'Test in progress' : 'Sending SOS in'}
      </p>
      <div className="count-ring">
        <svg width="240" height="240" viewBox="0 0 240 240" aria-hidden="true">
          <circle cx="120" cy="120" r={R} fill="none" stroke="var(--border)" strokeWidth="10" />
          <circle cx="120" cy="120" r={R} fill="none" stroke="var(--danger)" strokeWidth="10"
            strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C - dash}
            style={{ transition: frozen ? 'none' : 'stroke-dashoffset 1s linear' }} />
        </svg>
        <div className="count-num">
          <span className="n">{remaining}</span>
          <span className="lbl">seconds</span>
        </div>
      </div>

      <p className="lead" style={{ maxWidth: 300, marginBottom: 20 }}>
        {isTest
          ? 'This is a test. Your contacts will not be alerted.'
          : 'Your contacts are about to be alerted with your location.'}
      </p>

      <div className="stack" style={{ width: '100%', maxWidth: 340 }}>
        <button className="btn btn-danger" style={{ minHeight: 60 }} onClick={() => navigate('/alert', isTest ? { mode: 'test' } : {})}>
          Send now
        </button>
        <button className="btn btn-secondary" onClick={back}>
          <X size={18} /> Cancel
        </button>
      </div>
    </div>
  )
}
