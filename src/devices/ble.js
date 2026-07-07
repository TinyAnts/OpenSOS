// Web Bluetooth transport for a local BLE SOS button (one-way: device -> app).
// Requires a secure context (https or localhost), a user gesture to pair, and a
// browser that supports Web Bluetooth (Chrome / Edge; not Brave-Android/Safari).
import { fireTrigger, registerConnection, unregisterConnection } from './manager.js'

export function bleSupported() {
  return typeof navigator !== 'undefined' && !!navigator.bluetooth
}

// Pair with a device. For TESTING we accept ANY nearby BLE device — simply
// choosing one from the browser's picker counts as paired, even if the device
// refuses a data (GATT) connection. Pass { service, characteristic } later to
// subscribe to real button-press notifications from the finished hardware.
export async function connectBle({ service, characteristic } = {}) {
  if (!bleSupported()) {
    const err = new Error('unsupported'); err.code = 'UNSUPPORTED'; throw err
  }

  const options = service
    ? { filters: [{ services: [service] }], optionalServices: [service] }
    : { acceptAllDevices: true, optionalServices: service ? [service] : [] }

  // Throws only if the user dismisses the picker without choosing (NotFoundError).
  const device = await navigator.bluetooth.requestDevice(options)
  const deviceName = device.name || 'Bluetooth device'

  // Best-effort data connection — not required just to test pairing.
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
    // Device selected but wouldn't open a GATT link (common for phones,
    // earbuds, beacons). Still counts as paired for testing.
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
