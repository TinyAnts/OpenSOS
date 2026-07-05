// Generates preview screenshots of every important screen at three viewport
// sizes using Playwright, served from the production build.
//
//   npm run build                 # produce dist/
//   npm run preview:screenshots   # capture all viewports
//   node scripts/screenshots.mjs mobile   # capture just one viewport
//
// Serves the built app with a tiny static server (no extra deps). Set
// DIST=/path to serve a build from a custom folder.
import { chromium } from 'playwright'
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { existsSync, mkdirSync } from 'node:fs'
import { dirname, resolve, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const dist = process.env.DIST ? resolve(process.env.DIST) : resolve(root, 'dist')

if (!existsSync(resolve(dist, 'index.html'))) {
  console.error(`No build found at ${dist}. Run "npm run build" first.`)
  process.exit(1)
}

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.json': 'application/json', '.png': 'image/png',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2',
}

const VIEWPORTS = {
  mobile: { width: 390, height: 844 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1440, height: 900 },
}

const SCREENS = [
  { name: '01-welcome', url: '#/welcome', demo: false },
  { name: '02-onboarding', url: '#/onboarding', demo: false },
  { name: '03-home', url: '#/home', demo: true },
  { name: '04-countdown', url: '#/countdown?frozen=1', demo: true },
  { name: '05-alert-progress', url: '#/alert?view=progress', demo: true },
  { name: '06-alert-success', url: '#/alert?view=success', demo: true },
  { name: '07-alert-partial', url: '#/alert?view=partial', demo: true },
  { name: '08-contacts', url: '#/contacts', demo: true },
  { name: '09-trigger', url: '#/trigger', demo: true },
  { name: '10-bluetooth', url: '#/trigger/bluetooth', demo: true },
  { name: '11-webhook', url: '#/trigger/webhook', demo: true },
  { name: '12-history', url: '#/history', demo: true },
  { name: '13-settings', url: '#/settings', demo: true },
]

const argVp = process.argv[2]
const targets = argVp && VIEWPORTS[argVp] ? [argVp] : Object.keys(VIEWPORTS)

function startServer() {
  const server = createServer(async (req, res) => {
    try {
      let path = decodeURIComponent(req.url.split('?')[0])
      if (path === '/' || !extname(path)) path = '/index.html'
      const file = resolve(dist, '.' + path)
      const body = await readFile(file)
      res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' })
      res.end(body)
    } catch {
      try {
        const body = await readFile(resolve(dist, 'index.html'))
        res.writeHead(200, { 'Content-Type': 'text/html' })
        res.end(body)
      } catch {
        res.writeHead(404); res.end('not found')
      }
    }
  })
  return new Promise((r) => server.listen(0, '127.0.0.1', () => r(server)))
}

async function main() {
  const server = await startServer()
  const { port } = server.address()
  const base = `http://127.0.0.1:${port}`
  console.log('Serving build at', base)

  const browser = await chromium.launch()
  const problems = []

  for (const vp of targets) {
    const size = VIEWPORTS[vp]
    const outDir = resolve(root, 'preview', vp)
    mkdirSync(outDir, { recursive: true })

    const context = await browser.newContext({ viewport: size, deviceScaleFactor: 2 })
    const page = await context.newPage()
    const consoleErrors = []
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })
    page.on('pageerror', (e) => consoleErrors.push('pageerror: ' + e.message))

    await page.goto(`${base}/?demo=1#/home`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(600)

    for (const s of SCREENS) {
      if (!s.demo) {
        await page.goto(`${base}/`, { waitUntil: 'domcontentloaded' })
        await page.evaluate(() => localStorage.clear())
        await page.evaluate(() => { window.__demoSeeded = false })
      }
      const url = s.demo ? `${base}/?demo=1${s.url}` : `${base}/${s.url}`
      const resp = await page.goto(url, { waitUntil: 'networkidle' })
      if (resp && resp.status() >= 400) problems.push(`${vp}/${s.name}: HTTP ${resp.status()}`)
      await page.waitForSelector('.app', { timeout: 5000 })
        .catch(() => problems.push(`${vp}/${s.name}: .app not found`))
      await page.waitForTimeout(500)
      await page.screenshot({ path: resolve(outDir, `${s.name}.png`), fullPage: true })
      console.log(`  ok ${vp}/${s.name}.png`)

      if (!s.demo) {
        await page.goto(`${base}/?demo=1#/home`, { waitUntil: 'networkidle' })
        await page.waitForTimeout(400)
      }
    }

    if (consoleErrors.length) problems.push(`${vp}: console errors -> ${consoleErrors.join(' | ')}`)
    await context.close()
  }

  await browser.close()
  server.close()

  if (problems.length) {
    console.error('\nISSUES FOUND:')
    for (const p of problems) console.error('  - ' + p)
    process.exitCode = 1
  } else {
    console.log('\nAll screenshots captured with no console errors.')
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
