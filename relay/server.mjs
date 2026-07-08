// OpenSOS reference relay.
//   1) Wi-Fi trigger: device POST /trigger  ->  broadcast to subscribed apps (WebSocket).
//   2) Email alerts:  app  POST /alert      ->  send emails to contacts via Resend.
//
//   node relay/server.mjs
//   env: TOKEN (shared secret), RESEND_API_KEY (for email), MAIL_FROM (optional)
//
// Uses only Node built-ins + global fetch (Node 18+). No dependencies.
import { createServer } from 'node:http'
import { createHash, randomUUID } from 'node:crypto'

const PORT = process.env.PORT || 8787
const TOKEN = process.env.TOKEN || 'changeme'
const RESEND_API_KEY = process.env.RESEND_API_KEY || ''
const MAIL_FROM = process.env.MAIL_FROM || 'OpenSOS <onboarding@resend.dev>'
const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11' // WebSocket magic string

const clients = new Set()
const tokenOf = (url) => new URL(url, 'http://x').searchParams.get('token')

function encodeFrame(str) {
  const payload = Buffer.from(str)
  const len = payload.length
  let header
  if (len < 126) header = Buffer.from([0x81, len])
  else if (len < 65536) { header = Buffer.alloc(4); header[0] = 0x81; header[1] = 126; header.writeUInt16BE(len, 2) }
  else { header = Buffer.alloc(10); header[0] = 0x81; header[1] = 127; header.writeBigUInt64BE(BigInt(len), 2) }
  return Buffer.concat([header, payload])
}
function broadcast(obj) {
  const frame = encodeFrame(JSON.stringify(obj))
  for (const sock of clients) { try { sock.write(frame) } catch {} }
}
function readBody(req) {
  return new Promise((resolve) => {
    let b = ''; req.on('data', (c) => { b += c }); req.on('end', () => { try { resolve(JSON.parse(b || '{}')) } catch { resolve({}) } })
  })
}
function send(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
  res.end(JSON.stringify(obj))
}

async function sendEmail(to, subject, text) {
  if (!RESEND_API_KEY) return { ok: false, error: 'email-not-configured' }
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: MAIL_FROM, to: [to], subject, text }),
    })
    if (r.ok) return { ok: true }
    const detail = await r.text().catch(() => '')
    return { ok: false, error: `resend-${r.status}`, detail }
  } catch (e) {
    return { ok: false, error: 'network', detail: String(e) }
  }
}

const server = createServer(async (req, res) => {
  if (req.method === 'OPTIONS') { // CORS preflight for the browser app
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    })
    return res.end()
  }

  if (req.url.startsWith('/health')) return send(res, 200, { ok: true, email: !!RESEND_API_KEY })

  // Device fires a trigger -> notify subscribed apps.
  if (req.method === 'POST' && req.url.startsWith('/trigger')) {
    if (tokenOf(req.url) !== TOKEN) return send(res, 401, { ok: false, error: 'unauthorized' })
    const data = await readBody(req)
    broadcast({ type: 'sos', deviceId: data.deviceId || 'device', at: Date.now(), id: randomUUID() })
    return send(res, 200, { ok: true, delivered: clients.size })
  }

  // App asks the relay to email the contacts.
  if (req.method === 'POST' && req.url.startsWith('/alert')) {
    if (tokenOf(req.url) !== TOKEN) return send(res, 401, { ok: false, error: 'unauthorized' })
    const data = await readBody(req)
    const contacts = Array.isArray(data.contacts) ? data.contacts : []
    const loc = data.location || {}
    const isTest = !!data.test
    const when = new Date().toLocaleString()
    const results = []
    for (const c of contacts) {
      if (!c.email) { results.push({ name: c.name, email: null, ok: false, error: 'no-email' }); continue }
      const subject = isTest ? 'OpenSOS — test alert (no action needed)' : `SOS alert — someone needs help`
      const lines = [
        isTest ? 'This is a TEST from OpenSOS. No action is needed.' : 'An OpenSOS emergency alert was triggered.',
        '',
        `Hi ${c.name || 'there'},`,
        isTest
          ? 'This is only a test to confirm alerts reach you.'
          : 'You are listed as an emergency contact. The person may need help.',
        '',
        loc.label ? `Location: ${loc.label}` : 'Location: not shared',
        loc.mapsUrl ? `Map: ${loc.mapsUrl}` : '',
        '',
        `Time: ${when}`,
        'Sent by OpenSOS.',
      ].filter(Boolean)
      const r = await sendEmail(c.email, subject, lines.join('\n'))
      results.push({ name: c.name, email: c.email, ok: r.ok, error: r.error })
    }
    return send(res, 200, {
      ok: true,
      configured: !!RESEND_API_KEY,
      delivered: results.filter((r) => r.ok).length,
      total: contacts.length,
      results,
    })
  }

  res.writeHead(404); res.end('not found')
})

server.on('upgrade', (req, socket) => {
  if (!req.url.startsWith('/subscribe') || tokenOf(req.url) !== TOKEN) {
    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n'); return socket.destroy()
  }
  const key = req.headers['sec-websocket-key']
  const accept = createHash('sha1').update(key + GUID).digest('base64')
  socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n' + `Sec-WebSocket-Accept: ${accept}\r\n\r\n`)
  clients.add(socket)
  socket.on('close', () => clients.delete(socket))
  socket.on('error', () => clients.delete(socket))
})

server.listen(PORT, () => {
  console.log(`OpenSOS relay on http://localhost:${PORT}  (token: ${TOKEN})  email: ${RESEND_API_KEY ? 'on' : 'off'}`)
})
