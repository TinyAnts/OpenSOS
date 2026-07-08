import React from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import { StoreProvider } from './store.jsx'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <StoreProvider>
      <App />
    </StoreProvider>
  </React.StrictMode>
)

// Register the service worker (only when served over http/https, not file://).
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(() => {})
  })
}
