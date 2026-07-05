import { CheckCircle2, AlertTriangle, History as HistoryIcon, MapPin } from 'lucide-react'
import { useStore } from '../store.jsx'
import { AppHeader, TabBar } from '../components/ui.jsx'

function fmt(ts) {
  const d = new Date(ts)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  if (sameDay) return `Today · ${time}`
  const yest = new Date(now); yest.setDate(now.getDate() - 1)
  if (d.toDateString() === yest.toDateString()) return `Yesterday · ${time}`
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ` · ${time}`
}

export default function HistoryScreen() {
  const { state } = useStore()
  const items = state.history

  return (
    <>
      <AppHeader title="History" showBack={false} />
      <div className="screen" style={{ paddingTop: 4 }}>
        <p className="lead">A record of your alerts and system tests.</p>

        {items.length === 0 ? (
          <div className="empty">
            <div className="empty-ico"><HistoryIcon size={28} /></div>
            <div className="empty-title">Nothing here yet</div>
            <div>Your alerts and tests will appear here.</div>
          </div>
        ) : (
          <div className="list">
            {items.map((it) => {
              const ok = it.result === 'success'
              return (
                <div key={it.id} className="row" style={{ alignItems: 'flex-start' }}>
                  <span style={{ marginTop: 2, color: ok ? 'var(--success)' : 'var(--warning)' }}>
                    {ok ? <CheckCircle2 size={22} /> : <AlertTriangle size={22} />}
                  </span>
                  <div className="row-main">
                    <div className="row-title">
                      {it.type === 'test' ? 'System test' : 'Emergency alert'}
                    </div>
                    <div className="row-sub">{fmt(it.at)} · {it.trigger}</div>
                    <div className="row-sub" style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                      <MapPin size={12} /> {it.location}
                    </div>
                  </div>
                  <span className={`pill ${ok ? 'pill--ok' : 'pill--warn'}`}>
                    {it.delivered}/{it.total}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
      <TabBar active="history" />
    </>
  )
}
