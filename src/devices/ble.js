// Web Bluetooth transport for a local BLE SOS button (one-way: device -> app).
// Requires a secure context (https/localhost), a user gesture, and a Chromium
// browser (Chrome/Edge/Android). Not available in Safari/iOS or Firefox.
import { fireTrigger, registerConnection, unregisterConnection } from './manager.js'

export function bleSupported() {
  return typeof navigator !== 'undefined' && !!navigator.bluetooth
}

// filter options:
//   namePrefix   – only show devices whose name starts with this (e.g. "OpenSOS")
//   service      – only show devices advertising this GATT service UUID
//   characteristic – notify characteristic for live button-press events
// If both namePrefix and service are blank, we fall back to acceptAllDevices
// (shows everything nearby — useful for testing without real hardware).
export async function connectBle({ service, characteristic, namePrefix } = {}) {
  if (!bleSupported()) { const e = new Error('unsupported'); e.code = 'UNSUPPORTED'; throw e }

  const filters = []
  if (service) filters.push({ services: [service] })
  if (namePrefix) filters.push({ namePrefix })

  const options = filters.length
    ? { filters, optionalServices: service ? [service] : [] }
    : { acceptAllDevices: true, optionalServices: service ? [service] : [] }

  const device = await navigator.bluetooth.requestDevice(options)
  const deviceName = device.name || 'Bluetooth device'

  let connected = false
  let notifyChar = null
  try {
    const gatt = await device.gatt.connect()
    connected = true
    if (service && characteristic) {
      const svc = await gatt.getPrimaryService(service)
      notifyChar = await svc.getCharacteristic(characteristic)
      await notifyChar.startNotifications()
      notifyChar.addEventListener('characteristicvaluechanged', () => fireTrigger('bluetooth', { deviceName }))
    }
  } catch {
    // Selected but wouldn't open a GATT link — still counts as paired for testing.
  }

  const onDisconnect = () => unregisterConnection('bluetooth')
  try { device.addEventListener('gattserverdisconnected', onDisconnect) } catch {}

  registerConnection('bluetooth', {
    meta: { deviceName, connected, liveTriggers: !!notifyChar },
    disconnect: () => {
      try { if (notifyChar) notifyChar.stopNotifications() } catch {}
      try { device.removeEventListener('gattserverdisconnected', onDisconnect) } catch {}
      try { if (device.gatt && device.gatt.connected) device.gatt.disconnect() } catch {}
    },
  })

  return { deviceName, connected, liveTriggers: !!notifyChar }
}
