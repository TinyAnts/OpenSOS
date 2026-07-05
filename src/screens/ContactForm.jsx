import { useState } from 'react'
import { useRouter } from '../router.jsx'
import { useStore } from '../store.jsx'
import { AppHeader } from '../components/ui.jsx'

export default function ContactForm() {
  const { navigate, back } = useRouter()
  const { addContact } = useStore()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [relation, setRelation] = useState('')

  const valid = name.trim() && phone.trim()

  function save() {
    if (!valid) return
    addContact({ name: name.trim(), phone: phone.trim(), relation: relation.trim() })
    navigate('/contacts')
  }

  return (
    <>
      <AppHeader title="Add contact" />
      <div className="screen" style={{ paddingTop: 4 }}>
        <p className="lead">Add someone you trust to be alerted in an emergency.</p>
        <div className="field">
          <label htmlFor="c-name">Name</label>
          <input id="c-name" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
        </div>
        <div className="field">
          <label htmlFor="c-phone">Phone number</label>
          <input id="c-phone" className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 415 555 0132" inputMode="tel" />
        </div>
        <div className="field">
          <label htmlFor="c-rel">Relationship <span className="muted">(optional)</span></label>
          <input id="c-rel" className="input" value={relation} onChange={(e) => setRelation(e.target.value)} placeholder="e.g. Sister" />
        </div>

        <div className="mt-auto" style={{ paddingTop: 20 }}>
          <div className="btn-row">
            <button className="btn btn-secondary" onClick={back}>Cancel</button>
            <button className="btn btn-primary" onClick={save} disabled={!valid}>Save contact</button>
          </div>
        </div>
      </div>
    </>
  )
}
