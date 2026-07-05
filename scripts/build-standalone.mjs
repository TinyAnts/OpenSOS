// Bundles the whole app into ONE self-contained HTML file that runs with no
// server (double-click to open in any modern browser). Output: opensos.html
import { build } from 'esbuild'
import { writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outFile = process.env.OUT || resolve(root, 'opensos.html')

const result = await build({
  entryPoints: [resolve(root, 'src/main.jsx')],
  bundle: true,
  format: 'iife',
  jsx: 'automatic',
  minify: true,
  write: false,
  loader: { '.js': 'jsx' },
  define: { 'process.env.NODE_ENV': '"production"' },
  outdir: resolve(root, '.standalone-tmp'),
})

let js = '', css = ''
for (const f of result.outputFiles) {
  if (f.path.endsWith('.css')) css += f.text
  else if (f.path.endsWith('.js')) js += f.text
}

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<meta name="theme-color" content="#ffffff" />
<title>OpenSOS</title>
<style>${css}</style>
</head>
<body>
<div id="root"></div>
<script>${js}</script>
</body>
</html>
`
writeFileSync(outFile, html)
console.log('wrote', outFile, '(' + Math.round(html.length / 1024) + ' KB)')
