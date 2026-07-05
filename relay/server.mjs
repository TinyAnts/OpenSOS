// OpenSOS reference relay (one-way: device -> relay -> app).
//
// The embedded Wi-Fi device POSTs a trigger; the app subscribes over WebSocket
// and receives it in real time. Same shared token gates both sides.
//
//   node relay/server.mjs            # PORT=8787 TOKEN=changeme
//
// Device fires:   POST /trigger?token=changeme   body: {"deviceId":"unit-1"}
// App subscribes: ws://<host>:8787/subscribe?token=changeme
//
// Uses only Node built-ins — no dependencies.
import { createServer } from 'node:http'
import { createHash, randomUUID } from 'node:crypto'

const PORT = process.env.PORT || 8787
const TOKEN = process.env.TOKEN || 'changeme'
const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11' // WebSocket magic string

const clients = new Set()

function tokenOf(url) {
  return new URL(url, 'http://x').searchParams.get('token')
}

function broadcast(obj) {
  const frame = encodeFrame(JSON.stringify(obj))
  for (const sock of clients) { try { sock.write(frame) } catch {} }
}

// Minimal RFC6455 text-frame encoder (server->client, unmasked).
function encodeFrame(str) {
  const payload = Buffer.from(str)
  const len = payload.length
  let header
  if (len < 126) header = Buffer.from([0x81, len])
  else if (len < 65536) { header = Buffer.alloc(4); header[0] = 0x81; header[1] = 126; header.writeUInt16BE(len, 2) }
  else { header = Buffer.alloc(10); header[0] = 0x81; header[1] = 127; header.writeBigUInt64BE(BigInt(len), 2) }
  return Buffer.concat([header, payload])
}

const server = createServer((req, res) => {
  if (req.method === 'POST' && req.url.startsWith('/trigger')) {
    if (tokenOf(req.url) !== TOKEN) { res.writeHead(401); return res.end('unauthorized') }
    let body = ''
    req.on('data', (c) => { body += c })
    req.on('end', () => {
      let data = {}
      try { data = JSON.parse(body || '{}') } catch {}
      broadcast({ type: 'sos', deviceId: data.deviceId || 'device', at: Date.now(), id: randomUUID() })
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ ok: true, delivered: clients.size }))
    })
    return
  }
  if (req.url.startsWith('/health')) { res.writeHead(200); return res.end('ok') }
  res.writeHead(404); res.end('not found')
})

// WebSocket upgrade for subscribers.
server.on('upgrade', (req, socket) => {
  if (!req.url.startsWith('/subscribe') || tokenOf(req.url) !== TOKEN) {
    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n'); return socket.destroy()
  }
  const key = req.headers['sec-websocket-key']
  const accept = createHash('sha1').update(key + GUID).digest('base64')
  socket.write(
    'HTTP/1.1 101 Switching Protocols\r\n' +
    'Upgrade: websocket\r\nConnection: Upgrade\r\n' +
    `Sec-WebSocket-Accept: ${accept}\r\n\r\n`
  )
  clients.add(socket)
  socket.on('close', () => clients.delete(socket))
  socket.on('error', () => clients.delete(socket))
})

server.listen(PORT, () => {
  console.log(`OpenSOS relay on http://localhost:${PORT}  (token: ${TOKEN})`)
  console.log(`  device  -> POST http://localhost:${PORT}/trigger?token=${TOKEN}`)
  console.log(`  app     -> ws://localhost:${PORT}/subscribe?token=${TOKEN}`)
})
