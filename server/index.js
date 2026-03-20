import express from 'express'
import cors from 'cors'
import multer from 'multer'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import crypto from 'crypto'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = path.dirname(__filename)

const app     = express()
const PORT    = process.env.PORT || 3001
const IS_PROD = process.env.NODE_ENV === 'production'

// ── Credentials (set these in Railway environment variables) ───────────────────
// Admin: can view templates, upload, edit, delete
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'
// User: can only view templates and create invitations
const USER_USERNAME  = process.env.USER_USERNAME  || 'user'
const USER_PASSWORD  = process.env.USER_PASSWORD  || 'user123'

const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex')

if (!process.env.JWT_SECRET)   console.warn('  ⚠️  JWT_SECRET not set — sessions reset on restart!')
if (ADMIN_PASSWORD === 'admin123') console.warn('  ⚠️  Using default ADMIN_PASSWORD — change it in Railway env vars!')
if (USER_PASSWORD  === 'user123')  console.warn('  ⚠️  Using default USER_PASSWORD  — change it in Railway env vars!')

// ── Simple JWT (no library) ────────────────────────────────────────────────────
function b64url(str) {
  return Buffer.from(str).toString('base64')
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}
function signToken(payload) {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body   = b64url(JSON.stringify(payload))
  const sig    = crypto.createHmac('sha256', JWT_SECRET)
    .update(`${header}.${body}`).digest('base64')
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  return `${header}.${body}.${sig}`
}
function verifyToken(token) {
  try {
    const [header, body, sig] = token.split('.')
    const expected = crypto.createHmac('sha256', JWT_SECRET)
      .update(`${header}.${body}`).digest('base64')
      .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
    if (sig !== expected) return null
    const payload = JSON.parse(Buffer.from(body, 'base64').toString())
    if (payload.exp && Date.now() > payload.exp) return null
    return payload
  } catch { return null }
}

// ── Auth middleware ────────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
  const auth  = req.headers['authorization'] || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Not logged in' })
  const payload = verifyToken(token)
  if (!payload) return res.status(401).json({ error: 'Invalid or expired token' })
  req.authUser = payload
  next()
}
function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.authUser.role !== 'admin')
      return res.status(403).json({ error: 'Admin access required' })
    next()
  })
}

// ── Paths ──────────────────────────────────────────────────────────────────────
const DATA_DIR      = IS_PROD ? '/tmp/invitation-data' : path.join(__dirname, '..', 'public')
const TEMPLATES_DIR = path.join(DATA_DIR, 'templates')
const METADATA_FILE = path.join(DATA_DIR, 'templates.json')
const DIST_DIR      = path.join(__dirname, '..', 'dist')

if (!fs.existsSync(TEMPLATES_DIR)) fs.mkdirSync(TEMPLATES_DIR, { recursive: true })
if (!fs.existsSync(METADATA_FILE)) fs.writeFileSync(METADATA_FILE, '[]', 'utf-8')

// ── Startup log ────────────────────────────────────────────────────────────────
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('  InviteForge Server')
console.log(`  Mode        : ${IS_PROD ? 'production' : 'development'}`)
console.log(`  Port        : ${PORT}`)
console.log(`  Data dir    : ${DATA_DIR}`)
console.log(`  Dist exists : ${fs.existsSync(DIST_DIR)}`)
console.log(`  Admin user  : ${ADMIN_USERNAME}`)
console.log(`  User        : ${USER_USERNAME}`)
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

// ── Middleware ─────────────────────────────────────────────────────────────────
app.use(cors())
app.use(express.json())
app.use('/templates', express.static(TEMPLATES_DIR))

// ── Health check ───────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    mode: IS_PROD ? 'production' : 'development',
    port: PORT,
    dist_exists: fs.existsSync(DIST_DIR),
    template_count: readMeta().length,
  })
})

// ── Login ──────────────────────────────────────────────────────────────────────
app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {}
  if (!username || !password)
    return res.status(400).json({ error: 'Username and password required' })

  let role = null
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) role = 'admin'
  else if (username === USER_USERNAME && password === USER_PASSWORD) role = 'user'

  if (!role) {
    console.warn(`[auth] Failed login: "${username}"`)
    return res.status(401).json({ error: 'Invalid username or password' })
  }

  const token = signToken({
    role,
    username,
    iat: Date.now(),
    exp: Date.now() + 1000 * 60 * 60 * 24, // 24 hours
  })
  console.log(`[auth] Login OK: ${username} (${role})`)
  res.json({ token, username, role })
})

// ── Metadata helpers ───────────────────────────────────────────────────────────
function readMeta() {
  try { return JSON.parse(fs.readFileSync(METADATA_FILE, 'utf-8')) }
  catch { return [] }
}
function writeMeta(data) {
  fs.writeFileSync(METADATA_FILE, JSON.stringify(data, null, 2), 'utf-8')
}

// ── Multer ─────────────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, TEMPLATES_DIR),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    cb(null, unique + path.extname(file.originalname))
  },
})
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } })

// ── Templates API ──────────────────────────────────────────────────────────────
// GET — any logged-in user
app.get('/api/templates', requireAuth, (_req, res) => {
  res.json(readMeta())
})

// POST / PUT / DELETE — admin only
app.post('/api/templates', requireAdmin, upload.single('image'), (req, res) => {
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
  console.log(`[upload] "${name}"`)
  res.json(template)
})

app.put('/api/templates/:id', requireAdmin, (req, res) => {
  const meta = readMeta()
  const idx = meta.findIndex(t => t.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'Not found' })
  const { name, fields } = req.body
  if (name) meta[idx].name = name
  if (fields) meta[idx].fields = fields
  writeMeta(meta)
  res.json(meta[idx])
})

app.delete('/api/templates/:id', requireAdmin, (req, res) => {
  const meta = readMeta()
  const idx = meta.findIndex(t => t.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'Not found' })
  const { filename } = meta[idx]
  const filePath = path.join(TEMPLATES_DIR, filename)
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
  meta.splice(idx, 1)
  writeMeta(meta)
  res.json({ success: true })
})

// ── Serve React frontend ───────────────────────────────────────────────────────
if (IS_PROD && fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR))
  app.get('*', (_req, res) => res.sendFile(path.join(DIST_DIR, 'index.html')))
} else if (IS_PROD) {
  app.get('*', (_req, res) => res.status(503).send(
    `<h2>Build missing</h2><p>dist/ not found.</p><a href="/health">/health</a>`
  ))
}

// ── Start ──────────────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✅ Listening on 0.0.0.0:${PORT}`)
  console.log(`   Health: http://localhost:${PORT}/health\n`)
})