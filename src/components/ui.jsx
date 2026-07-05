import { ChevronLeft, ShieldCheck, Users, Radio, History, Settings as SettingsIcon } from 'lucide-react'
import { useRouter } from '../router.jsx'

export function AppHeader({ title, showBack = true, right = null }) {
  const { back } = useRouter()
  return (
    <div className="app-header">
      {showBack && (
        <button className="back" onClick={back} aria-label="Back">
          <ChevronLeft size={24} />
        </button>
      )}
      {!showBack && !title && <Brand />}
      {title && <h1>{title}</h1>}
      <div style={{ marginLeft: 'auto' }}>{right}</div>
    </div>
  )
}

export function Brand() {
  return (
    <span className="brand">
      <span className="dot"><ShieldCheck size={20} /></span>
      OpenSOS
    </span>
  )
}

export function TabBar({ active }) {
  const { navigate } = useRouter()
  const tabs = [
    { key: 'home', label: 'Home', icon: ShieldCheck, path: '/home' },
    { key: 'contacts', label: 'Contacts', icon: Users, path: '/contacts' },
    { key: 'trigger', label: 'Trigger', icon: Radio, path: '/trigger' },
    { key: 'history', label: 'History', icon: History, path: '/history' },
    { key: 'settings', label: 'Settings', icon: SettingsIcon, path: '/settings' },
  ]
  return (
    <nav className="tabbar" aria-label="Primary">
      {tabs.map((t) => (
        <button
          key={t.key}
          className={active === t.key ? 'active' : ''}
          aria-current={active === t.key ? 'page' : undefined}
          onClick={() => navigate(t.path)}
        >
          <t.icon size={21} strokeWidth={active === t.key ? 2.4 : 2} />
          {t.label}
        </button>
      ))}
    </nav>
  )
}

export function Pill({ tone = 'default', children }) {
  const cls = tone === 'ok' ? 'pill pill--ok' : tone === 'warn' ? 'pill pill--warn' : tone === 'err' ? 'pill pill--err' : 'pill'
  return <span className={cls}><span className="pdot" />{children}</span>
}

export function Banner({ tone = 'info', icon = null, children }) {
  return (
    <div className={`banner banner--${tone}`}>
      {icon && <span className="b-ico">{icon}</span>}
      <div>{children}</div>
    </div>
  )
}

export function Switch({ checked, onChange, label }) {
  return (
    <label className="switch" aria-label={label}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="track" />
    </label>
  )
}

export function initials(name) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('')
}
