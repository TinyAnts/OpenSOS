import { useState } from 'react'
import { MapPin, Hand, Radio, Webhook as WebhookIcon, Check } from 'lucide-react'
import { useRouter } from '../router.jsx'
import { useStore } from '../store.jsx'

export default function Onboarding() {
  const { navigate } = useRouter()
  const { addContact, update, state } = useStore()
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [locAllowed, setLocAllowed] = useState(true)
  const [trigger, setTrigger] = useState('hold')

  const steps = ['Contact', 'Location', 'Trigger']

  function next() {
    if (step === 0) {
      if (name.trim() && phone.trim()) {
        addContact({ name: name.trim(), phone: phone.trim(), relation: '' })
      }
      setStep(1)
    } else if (step === 1) {
      update((s) => ({ ...s, location: { enabled: locAllowed, label: locAllowed ? 'Location on' : 'Location off' } }))
      setStep(2)
    } else {
      update((s) => ({ ...s, trigger, onboarded: true }))
      navigate('/home')
    }
  }

  function back() {
    if (step === 0) navigate('/welcome')
    else setStep(step - 1)
  }

  const canContinue = step !== 0 || (name.trim() && phone.trim())

  return (
    <div className="screen">
      <div className="progress-dots" aria-label={`Step ${step + 1} of 3`}>
        {steps.map((_, i) => <span key={i} className={i <= step ? 'on' : ''} />)}
      </div>

      {step === 0 && (
        <>
          <h2 className="title">Add a trusted contact</h2>
          <p className="lead">This person will be alerted when you trigger an SOS.</p>
          <div className="field">
            <label htmlFor="ob-name">Name</label>
            <input id="ob-name" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Priya Sharma" />
          </div>
          <div className="field">
            <label htmlFor="ob-phone">Phone number</label>
            <input id="ob-phone" className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. +1 415 555 0132" inputMode="tel" />
          </div>
          <p className="hint">You can add more contacts later.</p>
        </>
      )}

      {step === 1 && (
        <>
          <h2 className="title">Share your location</h2>
          <p className="lead">When you send an alert, your contacts receive your current location.</p>
          <div className="card" style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <span style={{ color: 'var(--primary)' }}><MapPin size={26} /></span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>Use my location</div>
              <div className="hint" style={{ margin: 0 }}>Recommended for faster help.</div>
            </div>
            <label className="switch" aria-label="Use my location">
              <input type="checkbox" checked={locAllowed} onChange={(e) => setLocAllowed(e.target.checked)} />
              <span className="track" />
            </label>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <h2 className="title">Choose how to trigger SOS</h2>
          <p className="lead">Pick the method that suits you. You can change it anytime.</p>
          <div className="stack">
            <TriggerChoice icon={<Hand size={22} />} title="Press & hold" sub="Hold the on-screen SOS button" value="hold" trigger={trigger} setTrigger={setTrigger} />
            <TriggerChoice icon={<Radio size={22} />} title="Bluetooth button" sub="Use a paired physical button" value="bluetooth" trigger={trigger} setTrigger={setTrigger} />
            <TriggerChoice icon={<WebhookIcon size={22} />} title="Webhook" sub="Trigger from another app or device" value="webhook" trigger={trigger} setTrigger={setTrigger} />
          </div>
        </>
      )}

      <div className="mt-auto" style={{ paddingTop: 24 }}>
        <div className="btn-row">
          <button className="btn btn-secondary" onClick={back}>Back</button>
          <button className="btn btn-primary" onClick={next} disabled={!canContinue}>
            {step === 2 ? 'Finish' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  )
}

function TriggerChoice({ icon, title, sub, value, trigger, setTrigger }) {
  const selected = trigger === value
  return (
    <button type="button" className={`choice ${selected ? 'selected' : ''}`} onClick={() => setTrigger(value)} aria-pressed={selected}>
      <span className="ch-ico">{icon}</span>
      <span className="ch-main">
        <span className="ch-title">{title}</span>
        <span className="ch-sub">{sub}</span>
      </span>
      {selected && <span className="ch-check"><Check size={20} /></span>}
    </button>
  )
}
