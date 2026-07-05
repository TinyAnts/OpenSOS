import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'

const KEY = 'opensos.state.v1'

function uid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36)
}

const DEFAULT_STATE = {
  onboarded: false,
  contacts: [],
  trigger: 'hold', // 'hold' | 'bluetooth' | 'webhook'
  bluetooth: { deviceName: '', paired: false },
  webhook: { url: '', verified: false },
  settings: {
    theme: 'system', // 'system' | 'light' | 'dark'
    countdownSeconds: 10,
    shareLocation: true,
    sirenOnAlert: false,
  },
  history: [],
  // runtime (not persisted meaningfully but harmless)
  location: { enabled: true, label: 'Location on' },
  network: { online: true },
}

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...DEFAULT_STATE }
    const parsed = JSON.parse(raw)
    return {
      ...DEFAULT_STATE,
      ...parsed,
      settings: { ...DEFAULT_STATE.settings, ...(parsed.settings || {}) },
      bluetooth: { ...DEFAULT_STATE.bluetooth, ...(parsed.bluetooth || {}) },
      webhook: { ...DEFAULT_STATE.webhook, ...(parsed.webhook || {}) },
    }
  } catch {
    return { ...DEFAULT_STATE }
  }
}

const StoreCtx = createContext(null)

export function StoreProvider({ children }) {
  const [state, setState] = useState(load)

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)) } catch {}
  }, [state])

  // Apply theme to <html>
  useEffect(() => {
    const t = state.settings.theme
    const sysDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    const dark = t === 'dark' || (t === 'system' && sysDark)
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
  }, [state.settings.theme])

  const update = useCallback((patch) => {
    setState((s) => (typeof patch === 'function' ? patch(s) : { ...s, ...patch }))
  }, [])

  const api = useMemo(() => ({
    state,
    update,
    setSettings: (patch) => setState((s) => ({ ...s, settings: { ...s.settings, ...patch } })),
    addContact: (c) => setState((s) => ({ ...s, contacts: [...s.contacts, { id: uid(), ...c }] })),
    removeContact: (id) => setState((s) => ({ ...s, contacts: s.contacts.filter((c) => c.id !== id) })),
    addHistory: (entry) => setState((s) => ({ ...s, history: [{ id: uid(), at: Date.now(), ...entry }, ...s.history] })),
    reset: () => setState({ ...DEFAULT_STATE }),
    seedDemo: () => setState(() => demoState()),
  }), [state, update])

  return <StoreCtx.Provider value={api}>{children}</StoreCtx.Provider>
}

export function useStore() {
  const ctx = useContext(StoreCtx)
  if (!ctx) throw new Error('useStore outside provider')
  return ctx
}

/* ---- system readiness ---- */
export function readiness(state) {
  const checks = {
    contacts: state.contacts.length > 0,
    location: state.location.enabled,
    network: state.network.online,
    trigger:
      state.trigger === 'hold' ||
      (state.trigger === 'bluetooth' && state.bluetooth.paired) ||
      (state.trigger === 'webhook' && state.webhook.verified),
  }
  const ready = Object.values(checks).every(Boolean)
  return { ready, checks }
}

/* ---- demo data for previews ---- */
export function demoState() {
  const now = Date.now()
  return {
    ...DEFAULT_STATE,
    onboarded: true,
    contacts: [
      { id: 'c1', name: 'Priya Sharma', phone: '+1 415 555 0132', relation: 'Sister' },
      { id: 'c2', name: 'Daniel Okafor', phone: '+1 415 555 0148', relation: 'Friend' },
      { id: 'c3', name: 'Mom', phone: '+1 408 555 0177', relation: 'Family' },
    ],
    trigger: 'bluetooth',
    bluetooth: { deviceName: 'OpenSOS Button', paired: true },
    webhook: { url: 'https://hooks.example.com/opensos/9f2a', verified: true },
    settings: { theme: 'system', countdownSeconds: 10, shareLocation: true, sirenOnAlert: false },
    history: [
      { id: 'h1', at: now - 1000 * 60 * 60 * 6, type: 'alert', result: 'success', delivered: 3, total: 3, trigger: 'Held SOS button', location: '37.7749, -122.4194' },
      { id: 'h2', at: now - 1000 * 60 * 60 * 30, type: 'test', result: 'success', delivered: 3, total: 3, trigger: 'Test system', location: '37.7749, -122.4194' },
      { id: 'h3', at: now - 1000 * 60 * 60 * 74, type: 'alert', result: 'partial', delivered: 2, total: 3, trigger: 'Bluetooth button', location: '37.3861, -122.0839' },
    ],
    location: { enabled: true, label: 'Location on' },
    network: { online: true },
  }
}
