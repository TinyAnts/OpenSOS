import { useEffect } from 'react'
import { useRouter } from './router.jsx'
import { useStore } from './store.jsx'
import { onDeviceTrigger } from './devices/manager.js'

import Welcome from './screens/Welcome.jsx'
import Onboarding from './screens/Onboarding.jsx'
import Home from './screens/Home.jsx'
import Countdown from './screens/Countdown.jsx'
import Alert from './screens/Alert.jsx'
import Contacts from './screens/Contacts.jsx'
import ContactForm from './screens/ContactForm.jsx'
import Trigger from './screens/Trigger.jsx'
import Bluetooth from './screens/Bluetooth.jsx'
import Webhook from './screens/Webhook.jsx'
import HistoryScreen from './screens/History.jsx'
import Settings from './screens/Settings.jsx'

export default function App() {
  const { path, params, navigate } = useRouter()
  const { state, seedDemo } = useStore()

  useEffect(() => {
    const q = new URLSearchParams(window.location.search)
    if (q.get('demo') === '1' && !window.__demoSeeded) {
      window.__demoSeeded = true
      seedDemo()
    }
  }, [seedDemo])

  useEffect(() => {
    const publicRoutes = ['/welcome', '/onboarding']
    const isDemo = new URLSearchParams(window.location.search).get('demo')
    if (!state.onboarded && !publicRoutes.includes(path) && !isDemo) {
      navigate('/welcome')
    }
  }, [path, state.onboarded, navigate])

  // A connected embedded SOS device (BLE or Wi-Fi relay) fires here.
  // Treat it exactly like pressing the on-screen SOS button.
  useEffect(() => onDeviceTrigger(() => {
    const h = window.location.hash
    if (!h.includes('/countdown') && !h.includes('/alert')) navigate('/countdown')
  }), [navigate])

  let screen
  switch (path) {
    case '/welcome': screen = <Welcome />; break
    case '/onboarding': screen = <Onboarding />; break
    case '/home': screen = <Home />; break
    case '/countdown': screen = <Countdown />; break
    case '/alert': screen = <Alert key={params.view || 'live'} />; break
    case '/contacts': screen = <Contacts />; break
    case '/contacts/new': screen = <ContactForm />; break
    case '/trigger': screen = <Trigger />; break
    case '/trigger/bluetooth': screen = <Bluetooth />; break
    case '/trigger/webhook': screen = <Webhook />; break
    case '/history': screen = <HistoryScreen />; break
    case '/settings': screen = <Settings />; break
    default: screen = <Home />
  }

  return <div className="app">{screen}</div>
}
