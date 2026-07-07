// Static file server for the built SPA + a tiny progress-sync API.
// Progress is stored per `key` (profileName:course) as JSON on the App Service's
// persistent /home volume, and merged latest-wins so devices never lose data.
import express from 'express'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DIST = join(__dirname, 'dist')
const DATA = process.env.MLXP_DATA || join(process.env.HOME || __dirname, 'mlxp-data', 'progress')
mkdirSync(DATA, { recursive: true })

const app = express()
app.disable('x-powered-by')
app.use(express.json({ limit: '8mb' }))

const safe = (k) => k.replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 120)
const fileFor = (key) => join(DATA, `${safe(key)}.json`)
const load = (key) => {
  try {
    const f = fileFor(key)
    return existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : {}
  } catch {
    return {}
  }
}

// union, latest-wins per item (by `last`, tie-break higher streak)
function merge(a, b) {
  const out = { ...a }
  for (const [id, s] of Object.entries(b || {})) {
    const cur = out[id]
    if (!s || typeof s.last !== 'number') continue
    if (!cur || s.last > cur.last || (s.last === cur.last && (s.streak ?? 0) > (cur.streak ?? 0))) out[id] = s
  }
  return out
}

app.get('/api/progress/:key', (req, res) => {
  res.json(load(req.params.key))
})

app.put('/api/progress/:key', (req, res) => {
  const incoming = (req.body && req.body.map) || {}
  const mode = req.body && req.body.mode
  const result = mode === 'replace' ? incoming : merge(load(req.params.key), incoming)
  try {
    writeFileSync(fileFor(req.params.key), JSON.stringify(result))
  } catch (e) {
    return res.status(500).json({ error: String(e) })
  }
  res.json(result)
})

app.use(express.static(DIST))
app.use((_req, res) => res.sendFile(join(DIST, 'index.html')))

const port = process.env.PORT || 8080
app.listen(port, () => console.log(`serving ${DIST} on :${port}`))
