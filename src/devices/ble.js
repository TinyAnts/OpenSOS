// Web Bluetooth transport for a local BLE SOS button (one-way: device -> app).
// Requires a secure context (https or localhost) and a user gesture to pair.
import { fireTrigger, registerConnection, unregisterConnection } from './manager.js'

export function bleSupported() {
  return typeof navigator !== 'undefined' && !!navigator.bluetooth
}

// service/characteristic: optional GATT UUIDs for the device's "button pressed"
// notification. If omitted, we still pair, but the app owner must supply the
// device's real UUIDs to receive live press events.
export async function connectBle({ service, characteristic } = {}) {
  if (!bleSupported()) {
    const err = new Error('unsupported')
    err.code = 'UNSUPPORTED'
    throw err
  }

  const filters = service
    ? { filters: [{ services: [service] }], optionalServices: [service] }
    : { acceptAllDevices: true, optionalServices: service ? [service] : [] }

  const device = await navigator.bluetooth.requestDevice(filters)
  const gatt = await device.gatt.connect()
  const deviceName = device.name || 'SOS Button'

  let notifyChar = null
  if (service && characteristic) {
    const svc = await gatt.getPrimaryService(service)
    notifyChar = await svc.getCharacteristic(characteristic)
    await notifyChar.startNotifications()
    notifyChar.addEventListener('characteristicvaluechanged', () => fireTrigger('bluetooth', { deviceName }))
  }

  const onDisconnect = () => unregisterConnection('bluetooth')
  device.addEventListener('gattserverdisconnected', onDisconnect)

  registerConnection('bluetooth', {
    meta: { deviceName, liveTriggers: !!notifyChar },
    disconnect: () => {
      try { if (notifyChar) notifyChar.stopNotifications() } catch {}
      try { device.removeEventListener('gattserverdisconnected', onDisconnect) } catch {}
      try { if (device.gatt.connected) device.gatt.disconnect() } catch {}
    },
  })

  return { deviceName, liveTriggers: !!notifyChar }
}
