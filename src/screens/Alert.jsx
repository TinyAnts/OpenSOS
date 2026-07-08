import { useEffect, useRef, useState } from 'react'
import { MapPin, Check, X, CheckCircle2, AlertTriangle, RefreshCw, Home as HomeIcon } from 'lucide-react'
import { useRouter } from '../router.jsx'
import { useStore } from '../store.jsx'
import { sendAlert, getMockLocation } from '../mock/service.js'
import { initials } from '../components/ui.jsx'

export default function Alert() {
  const { navigate, params } = useRouter()
  const { state, addHistory } = useStore()
  const contacts = state.contacts.length ? state.contacts : [{ id: 'demo', name: 'Trusted Contact', phone: '' }]
  const isTest = params.mode === 'test'
  const preview = params.view // 'progress' | 'success' | 'partial'

  const [phase, setPhase] = useState('progress') // progress | result
  const [contactStatus, setContactStatus] = useState({}) // id -> 'ok' | 'fail'
  const [locLabel, setLocLabel] = useState('')
  const [stage, setStage] = useState('locating')
  const [result, setResult] = useState(null)
  const loggedRef = useRef(false)

  useEffect(() => {
    // Preview freezes — no live run.
    if (preview === 'progress') {
      setPhase('progress'); setStage('sending')
      setContactStatus({ [contacts[0]?.id]: 'ok' })
      return
    }
    if (preview === 'success' || preview === 'partial') {
      const forced = preview
      const results = contacts.map((c, i) => ({ contact: c, ok: forced === 'success' ? true : i !== contacts.length - 1 }))
      const delivered = results.filter((r) => r.ok).length
      setResult({ outcome: forced, delivered, total: contacts.length, results, location: getMockLocation() })
      setPhase('result')
      return
    }

    let alive = true
    sendAlert({
      contacts,
      forceOutcome: undefined,
      shareLocation: state.settings.shareLocation,
      onStep: (s) => {
        if (!alive) return
        if (s.stage === 'locating') setStage('locating')
        if (s.stage === 'sending') { setStage('sending'); if (s.location) setLocLabel(s.location.label) }
        if (s.stage === 'contact') setContactStatus((cs) => ({ ...cs, [s.contact.id]: s.ok ? 'ok' : 'fail' }))
      },
    }).then((r) => {
      if (!alive) return
      setResult(r)
      setPhase('result')
      if (!loggedRef.current) {
        loggedRef.current = true
        addHistory({
          type: isTest ? 'test' : 'alert',
          result: r.outcome,
          delivered: r.delivered,
          total: r.total,
          trigger: state.trigger === 'hold' ? 'Held SOS button' : state.trigger === 'bluetooth' ? 'Bluetooth button' : 'Webhook',
          location: r.location.label,
        })
      }
    })
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (phase === 'result' && result) {
    return <Result result={result} isTest={isTest} navigate={navigate} />
  }

  return (
    <div className="screen">
      <div style={{ paddingTop: 12 }}>
        <h2 className="title">{isTest ? 'Testing system' : 'Sending alert'}</h2>
        <p className="lead">{isTest ? 'Checking everything works — no one is alerted.' : 'Reaching your contacts now. Stay where you are if you can.'}</p>
      </div>

      <div className="steps">
        <div className={`step ${stage === 'locating' ? 'active' : ''}`}>
          <span className="step-ico">
            {stage === 'locating' ? <span className="spinner" /> : <StepDone />}
          </span>
          <div className="step-main">
            <div className="step-title">Getting your location</div>
            <div className="step-sub">{stage === 'locating' ? 'Please wait…' : (locLabel || 'Location ready')}</div>
          </div>
        </div>

        {contacts.map((c) => {
          const st = contactStatus[c.id]
          return (
            <div key={c.id} className={`step ${!st && stage !== 'locating' ? 'active' : ''} ${stage === 'locating' ? 'pending' : ''}`}>
              <span className="step-ico">
                {st === 'ok' ? <IconBadge tone="ok"><Check size={15} /></IconBadge>
                  : st === 'fail' ? <IconBadge tone="err"><X size={15} /></IconBadge>
                  : stage === 'locating' ? <Dot /> : <span className="spinner" />}
              </span>
              <div className="step-main">
                <div className="step-title">{c.name}</div>
                <div className="step-sub">
                  {st === 'ok' ? 'Alert delivered' : st === 'fail' ? 'Could not reach' : stage === 'locating' ? 'Waiting' : 'Sending…'}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Result({ result, isTest, navigate }) {
  const ok = result.outcome === 'success'
  const failed = result.results.filter((r) => !r.ok)
  return (
    <div className="screen">
      <div className="result-hero">
        <div className={`result-badge ${ok ? 'ok' : 'warn'}`}>
          {ok ? <CheckCircle2 size={46} /> : <AlertTriangle size={44} />}
        </div>
        <h2 className="title" style={{ margin: 0 }}>
          {isTest ? (ok ? 'Test successful' : 'Test finished') : ok ? 'Alert sent' : 'Partially sent'}
        </h2>
        <p className="lead" style={{ margin: '2px 0 0' }}>
          {ok
            ? `All ${result.total} contacts were reached.`
            : `${result.delivered} of ${result.total} contacts reached. Some could not be notified.`}
        </p>
      </div>

      <div className="card" style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 16 }}>
        <span style={{ color: 'var(--primary)' }}><MapPin size={22} /></span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 15 }}>{result.location.real ? 'Location shared' : 'Location'}</div>
          <div className="hint" style={{ margin: 0 }}>{result.location.label}</div>
          {result.location.mapsUrl && (
            <a href={result.location.mapsUrl} target="_blank" rel="noreferrer"
               style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary)' }}>Open in Maps</a>
          )}
        </div>
      </div>

      <div className="section-label" style={{ marginTop: 22 }}>Delivery</div>
      <div className="list">
        {result.results.map(({ contact, ok }) => (
          <div key={contact.id} className="row">
            <div className="avatar">{initials(contact.name)}</div>
            <div className="row-main">
              <div className="row-title">{contact.name}</div>
              <div className="row-sub">{contact.phone || 'Contact'}</div>
            </div>
            {ok
              ? <span className="pill pill--ok"><Check size={14} /> Delivered</span>
              : <span className="pill pill--err"><X size={14} /> Failed</span>}
          </div>
        ))}
      </div>

      <div className="mt-auto" style={{ paddingTop: 24 }}>
        <div className="stack">
          {!ok && failed.length > 0 && (
            <button className="btn btn-secondary" onClick={() => navigate('/alert')}>
              <RefreshCw size={18} /> Retry failed contacts
            </button>
          )}
          <button className="btn btn-primary" onClick={() => navigate('/home')}>
            <HomeIcon size={18} /> Done
          </button>
        </div>
      </div>
    </div>
  )
}

function StepDone() { return <IconBadge tone="ok"><Check size={15} /></IconBadge> }
function IconBadge({ tone, children }) {
  const bg = tone === 'ok' ? 'var(--success)' : tone === 'err' ? 'var(--danger)' : 'var(--border-strong)'
  return <span style={{ width: 24, height: 24, borderRadius: 999, background: bg, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{children}</span>
}
function Dot() { return <span style={{ width: 12, height: 12, borderRadius: 999, background: 'var(--border-strong)', display: 'inline-block' }} /> }
