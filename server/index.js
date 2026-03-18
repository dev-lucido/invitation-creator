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

// Paths
const PUBLIC_DIR = path.join(__dirname, '..', 'public')
const TEMPLATES_DIR = path.join(PUBLIC_DIR, 'templates')
const METADATA_FILE = path.join(PUBLIC_DIR, 'templates.json')

// Ensure directories exist
if (!fs.existsSync(TEMPLATES_DIR)) fs.mkdirSync(TEMPLATES_DIR, { recursive: true })
if (!fs.existsSync(METADATA_FILE)) fs.writeFileSync(METADATA_FILE, JSON.stringify([]))

app.use(cors())
app.use(express.json())
app.use('/templates', express.static(TEMPLATES_DIR))

// Multer storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, TEMPLATES_DIR),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    cb(null, unique + path.extname(file.originalname))
  },
})
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } })

// Read metadata helper
function readMeta() {
  try { return JSON.parse(fs.readFileSync(METADATA_FILE, 'utf-8')) }
  catch { return [] }
}
function writeMeta(data) {
  fs.writeFileSync(METADATA_FILE, JSON.stringify(data, null, 2))
}

// GET all templates
app.get('/api/templates', (_req, res) => {
  res.json(readMeta())
})

// POST upload new template
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

  res.json(template)
})

// PUT update template fields
app.put('/api/templates/:id', (req, res) => {
  const meta = readMeta()
  const idx = meta.findIndex(t => t.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'Template not found' })

  const { name, fields } = req.body
  if (name) meta[idx].name = name
  if (fields) meta[idx].fields = fields

  writeMeta(meta)
  res.json(meta[idx])
})

// DELETE template
app.delete('/api/templates/:id', (req, res) => {
  const meta = readMeta()
  const idx = meta.findIndex(t => t.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'Template not found' })

  const template = meta[idx]
  const filePath = path.join(TEMPLATES_DIR, template.filename)
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath)

  meta.splice(idx, 1)
  writeMeta(meta)
  res.json({ success: true })
})

// Serve built frontend in production
// if (process.env.NODE_ENV === 'production') {
//   app.use(express.static(path.join(__dirname, '..', 'dist')))
//   app.get('*', (_req, res) => {
//     res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'))
//   })
// }

// Serve built frontend
const distPath = path.join(__dirname, '..', 'dist')
app.use(express.static(distPath))
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

app.listen(PORT, () => {
  console.log(`✅ API server running at http://localhost:${PORT}`)
})
