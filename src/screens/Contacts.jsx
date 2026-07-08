import { Plus, Trash2, Users } from 'lucide-react'
import { useRouter } from '../router.jsx'
import { useStore } from '../store.jsx'
import { AppHeader, TabBar, initials } from '../components/ui.jsx'

export default function Contacts() {
  const { navigate } = useRouter()
  const { state, removeContact } = useStore()
  const contacts = state.contacts

  return (
    <>
      <AppHeader title="Contacts" showBack={false} />
      <div className="screen" style={{ paddingTop: 4 }}>
        <p className="lead">People who receive your alert when you trigger an SOS.</p>

        {contacts.length === 0 ? (
          <div className="empty">
            <div className="empty-ico"><Users size={28} /></div>
            <div className="empty-title">No contacts yet</div>
            <div>Add at least one person so OpenSOS can reach help.</div>
          </div>
        ) : (
          <div className="list">
            {contacts.map((c) => (
              <div key={c.id} className="row">
                <div className="avatar">{initials(c.name)}</div>
                <div className="row-main">
                  <div className="row-title">{c.name}</div>
                  <div className="row-sub">{c.email || c.phone}{c.relation ? ` · ${c.relation}` : ''}</div>
                </div>
                <button className="icon-btn" aria-label={`Remove ${c.name}`} onClick={() => removeContact(c.id)}>
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-auto" style={{ paddingTop: 20 }}>
          <button className="btn btn-primary" onClick={() => navigate('/contacts/new')}>
            <Plus size={18} /> Add contact
          </button>
        </div>
      </div>
      <TabBar active="contacts" />
    </>
  )
}
