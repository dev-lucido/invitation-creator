import express from 'express'
import cors from 'cors'
import multer from 'multer'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001
const IS_PROD = process.env.NODE_ENV === 'production'

// ── Paths ──────────────────────────────────────────────────────────────────────
// In production on Railway, use /tmp for writable storage (dist is read-only)
const DATA_DIR   = IS_PROD
  ? path.join('/tmp', 'invitation-data')
  : path.join(__dirname, '..', 'public')

const TEMPLATES_DIR  = path.join(DATA_DIR, 'templates')
const METADATA_FILE  = path.join(DATA_DIR, 'templates.json')
const DIST_DIR       = path.join(__dirname, '..', 'dist')

// Ensure writable directories exist
if (!fs.existsSync(TEMPLATES_DIR)) fs.mkdirSync(TEMPLATES_DIR, { recursive: true })
if (!fs.existsSync(METADATA_FILE)) fs.writeFileSync(METADATA_FILE, '[]', 'utf-8')

// ── Startup log ───────────────────────────────────────────────────────────────
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log(`  InviteForge Server`)
console.log(`  Mode      : ${IS_PROD ? 'production' : 'development'}`)
console.log(`  Port      : ${PORT}`)
console.log(`  Data dir  : ${DATA_DIR}`)
console.log(`  Dist dir  : ${DIST_DIR}`)
console.log(`  Dist exists: ${fs.existsSync(DIST_DIR)}`)
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

// ── Middleware ─────────────────────────────────────────────────────────────────
app.use(cors())
app.use(express.json())

// Serve uploaded template images
app.use('/templates', express.static(TEMPLATES_DIR))

// ── Health check (Railway uses this to confirm the app is up) ─────────────────
app.get('/health', (_req, res) => {
  const distOk = fs.existsSync(DIST_DIR)
  const dataOk = fs.existsSync(TEMPLATES_DIR)
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    mode: IS_PROD ? 'production' : 'development',
    port: PORT,
    dist_exists: distOk,
    data_dir_exists: dataOk,
    template_count: readMeta().length,
  })
})

// ── Multer (file uploads) ──────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, TEMPLATES_DIR),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    cb(null, unique + path.extname(file.originalname))
  },
})
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } })

// ── Metadata helpers ───────────────────────────────────────────────────────────
function readMeta() {
  try { return JSON.parse(fs.readFileSync(METADATA_FILE, 'utf-8')) }
  catch { return [] }
}
function writeMeta(data) {
  fs.writeFileSync(METADATA_FILE, JSON.stringify(data, null, 2), 'utf-8')
}

// ── API routes ─────────────────────────────────────────────────────────────────
app.get('/api/templates', (_req, res) => {
  res.json(readMeta())
})

app.post('/api/templates', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image uploaded' })
  const { name, fields } = req.body
  if (!name) return res.status(400).json({ error: 'Template name required' })
  let parsedFields = []
  try { parsedFields = JSON.parse(fields || '[]') }
  catch { return res.status(400).json({ error: 'Invalid fields JSON' }) }

  const template = {
    id: `tpl_${Date.now()}`,
    name,
    filename: req.file.filename,
    imageUrl: `/templates/${req.file.filename}`,
    fields: parsedFields,
    createdAt: new Date().toISOString(),
  }
  const meta = readMeta()
  meta.push(template)
  writeMeta(meta)
  console.log(`[upload] New template: "${name}" (${req.file.filename})`)
  res.json(template)
})

app.put('/api/templates/:id', (req, res) => {
  const meta = readMeta()
  const idx = meta.findIndex(t => t.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'Template not found' })
  const { name, fields } = req.body
  if (name) meta[idx].name = name
  if (fields) meta[idx].fields = fields
  writeMeta(meta)
  console.log(`[update] Template "${meta[idx].name}"`)
  res.json(meta[idx])
})

app.delete('/api/templates/:id', (req, res) => {
  const meta = readMeta()
  const idx = meta.findIndex(t => t.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'Template not found' })
  const template = meta[idx]
  const filePath = path.join(TEMPLATES_DIR, template.filename)
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
  meta.splice(idx, 1)
  writeMeta(meta)
  console.log(`[delete] Template "${template.name}"`)
  res.json({ success: true })
})

// ── Serve React frontend (production only) ─────────────────────────────────────
// This MUST come after all API routes
if (IS_PROD && fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR))
  app.get('*', (_req, res) => {
    res.sendFile(path.join(DIST_DIR, 'index.html'))
  })
  console.log('  Serving React frontend from dist/')
} else if (IS_PROD) {
  console.warn('  WARNING: dist/ not found — frontend will not be served!')
  app.get('*', (_req, res) => {
    res.status(503).send(`
      <h2>Build output missing</h2>
      <p>dist/ directory not found at: ${DIST_DIR}</p>
      <p>Make sure the build command runs before start.</p>
      <p><a href="/health">/health</a></p>
    `)
  })
}

// ── Start ──────────────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✅ Server listening on 0.0.0.0:${PORT}`)
  if (IS_PROD) console.log(`   Visit: https://your-app.railway.app`)
  else         console.log(`   Visit: http://localhost:${PORT}`)
  console.log(`   Health: http://localhost:${PORT}/health`)
})