import { useEffect, useState, useCallback } from 'react'

// Minimal hash router: #/route?a=b — enables deep links for previews.
function parse() {
  const hash = window.location.hash.replace(/^#/, '') || '/welcome'
  const [path, qs] = hash.split('?')
  const params = Object.fromEntries(new URLSearchParams(qs || ''))
  return { path: path || '/welcome', params }
}

export function useRouter() {
  const [route, setRoute] = useState(parse)

  useEffect(() => {
    const on = () => setRoute(parse())
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])

  const navigate = useCallback((path, params) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : ''
    window.location.hash = path + qs
  }, [])

  const back = useCallback(() => {
    if (window.history.length > 1) window.history.back()
    else window.location.hash = '/home'
  }, [])

  return { ...route, navigate, back }
}
