import { useState, useRef } from 'react'
import {
  Box, Button, TextField, Typography, Paper, Grid, CircularProgress,
  Alert, IconButton, Stack, Snackbar, Chip, Divider, useTheme, useMediaQuery
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate'
import CloseIcon from '@mui/icons-material/Close'
import { Template } from '../types'
import { uploadTemplate, updateTemplate } from '../utils/api'
import { useTemplates } from '../hooks/useTemplates'
import FieldEditor from '../components/FieldEditor'
import TemplatePreview from '../components/TemplatePreview'

function makeFakeTemplate(name: string, imageUrl: string, fields: Template['fields']): Template {
  return { id: '__preview__', name: name || 'Preview', filename: '', imageUrl, fields, createdAt: '' }
}

// ── Shared editor layout: preview left, fields right ──────────────────────────
interface EditorPanelProps {
  imageUrl: string
  templateName: string
  onNameChange: (v: string) => void
  fields: Template['fields']
  onFieldsChange: (f: Template['fields']) => void
  actions: React.ReactNode
  error?: string | null
}

function EditorPanel({ imageUrl, templateName, onNameChange, fields, onFieldsChange, actions, error }: EditorPanelProps) {
  const fakeTemplate = makeFakeTemplate(templateName, imageUrl, fields)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  return (
    <Grid container spacing={0} sx={{ minHeight: 0 }}>
      {/* LEFT — live preview */}
      <Grid
        item
        xs={12}
        md={6}
        sx={{
          p: { xs: 2, md: 3 },
          borderRight: { md: '1px solid' },
          borderBottom: { xs: '1px solid', md: 'none' },
          borderColor: 'divider',
          bgcolor: '#f0f0f0',
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}
      >
        <Typography variant="caption" color="text.secondary" fontWeight={600} letterSpacing={0.5} textTransform="uppercase">
          Live Preview
        </Typography>
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'flex-start' }}>
          <TemplatePreview template={fakeTemplate} />
        </Box>
      </Grid>

      {/* RIGHT — name + field editor + actions */}
      <Grid
        item
        xs={12}
        md={6}
        sx={{
          p: { xs: 2, md: 3 },
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          maxHeight: { md: '80vh' },
          overflowY: { md: 'auto' },
        }}
      >
        <TextField
          label="Template Name"
          value={templateName}
          onChange={e => onNameChange(e.target.value)}
          fullWidth
          size="small"
          placeholder="e.g. Wedding Invite 2024"
        />

        <FieldEditor fields={fields} onChange={onFieldsChange} imageWidth={800} imageHeight={600} />

        {error && <Alert severity="error">{error}</Alert>}

        <Box sx={{ pt: 1 }}>{actions}</Box>
      </Grid>
    </Grid>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const { templates, loading, error: listError, reload, remove } = useTemplates()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  // Upload state
  const [uploading, setUploading] = useState(false)
  const [uploadErr, setUploadErr] = useState<string | null>(null)
  const [snack, setSnack] = useState('')
  const [name, setName] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [fields, setFields] = useState<Template['fields']>([])
  const fileRef = useRef<HTMLInputElement>(null)

  // Edit state — null = list view, Template = editing that template
  const [editing, setEditing] = useState<Template | null>(null)
  const [editFields, setEditFields] = useState<Template['fields']>([])
  const [editName, setEditName] = useState('')
  const [saving, setSaving] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(f)
    setPreviewUrl(URL.createObjectURL(f))
    setUploadErr(null)
  }

  const handleUpload = async () => {
    if (!file || !name.trim()) { setUploadErr('Please provide a name and choose an image.'); return }
    setUploading(true); setUploadErr(null)
    try {
      await uploadTemplate(name.trim(), file, fields)
      setName(''); setFile(null)
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null); setFields([])
      if (fileRef.current) fileRef.current.value = ''
      await reload()
      setSnack('Template uploaded!')
    } catch { setUploadErr('Upload failed. Is the server running on port 3001?') }
    finally { setUploading(false) }
  }

  const openEdit = (t: Template) => {
    setEditing(t)
    setEditFields(JSON.parse(JSON.stringify(t.fields)))
    setEditName(t.name)
  }

  const closeEdit = () => setEditing(null)

  const handleSaveEdit = async () => {
    if (!editing) return
    setSaving(true)
    try {
      await updateTemplate(editing.id, { name: editName, fields: editFields })
      await reload(); setEditing(null); setSnack('Template updated!')
    } catch { setSnack('Save failed.') }
    finally { setSaving(false) }
  }

  // ── Edit view (full page replacement) ──
  if (editing) {
    return (
      <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, maxWidth: 1400, mx: 'auto' }}>
        <Box display="flex" alignItems="center" gap={1} mb={3}>
          <IconButton onClick={closeEdit} size="small"><CloseIcon /></IconButton>
          <Typography variant="h5" fontWeight={700}>Editing: {editing.name}</Typography>
        </Box>

        <Paper sx={{ border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
          <EditorPanel
            imageUrl={editing.imageUrl}
            templateName={editName}
            onNameChange={setEditName}
            fields={editFields}
            onFieldsChange={setEditFields}
            actions={
              <Stack direction="row" spacing={1.5}>
                <Button variant="outlined" onClick={closeEdit} fullWidth={isMobile}>Cancel</Button>
                <Button
                  variant="contained"
                  onClick={handleSaveEdit}
                  disabled={saving}
                  startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
                  fullWidth={isMobile}
                >
                  {saving ? 'Saving…' : 'Save Changes'}
                </Button>
              </Stack>
            }
          />
        </Paper>
      </Box>
    )
  }

  // ── Main list + upload view ──
  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, maxWidth: 1400, mx: 'auto' }}>
      <Typography variant="h4" fontWeight={800} gutterBottom sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' } }}>
        Admin — Template Manager
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Upload invitation templates and define where text fields appear on the image.
      </Typography>

      {/* ── Upload section ── */}
      <Paper sx={{ mb: 4, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <Box sx={{ px: { xs: 2, md: 3 }, pt: { xs: 2, md: 3 }, pb: 1.5 }}>
          <Typography variant="h6" fontWeight={700} gutterBottom>Upload New Template</Typography>

          {/* File picker row */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
            <Box>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileChange}
                id="img-upload"
              />
              <label htmlFor="img-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<AddPhotoAlternateIcon />}
                  fullWidth={isMobile}
                >
                  {file ? file.name.slice(0, 28) + (file.name.length > 28 ? '…' : '') : 'Choose Image'}
                </Button>
              </label>
            </Box>
            {file && (
              <Typography variant="caption" color="success.main" fontWeight={600}>
                ✓ Image selected
              </Typography>
            )}
          </Stack>
        </Box>

        <Divider />

        {/* Side-by-side editor — only shown once an image is chosen */}
        {previewUrl ? (
          <EditorPanel
            imageUrl={previewUrl}
            templateName={name}
            onNameChange={setName}
            fields={fields}
            onFieldsChange={setFields}
            error={uploadErr}
            actions={
              <Button
                variant="contained"
                size="large"
                startIcon={uploading ? <CircularProgress size={18} color="inherit" /> : <CloudUploadIcon />}
                onClick={handleUpload}
                disabled={uploading || !name.trim()}
                fullWidth={isMobile}
                sx={{ px: 4 }}
              >
                {uploading ? 'Uploading…' : 'Upload Template'}
              </Button>
            }
          />
        ) : (
          <Box sx={{ p: { xs: 2, md: 3 }, pt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Choose an image above to start placing text fields.
            </Typography>
          </Box>
        )}
      </Paper>

      {/* ── Saved templates list ── */}
      <Typography variant="h6" fontWeight={700} gutterBottom>
        Saved Templates ({templates.length})
      </Typography>
      {listError && <Alert severity="error" sx={{ mb: 2 }}>{listError}</Alert>}

      {loading ? (
        <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
      ) : templates.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', border: '2px dashed', borderColor: 'divider' }}>
          <Typography color="text.secondary">No templates yet. Upload one above.</Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {templates.map(t => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={t.id}>
              <Paper
                variant="outlined"
                sx={{ overflow: 'hidden', transition: 'box-shadow .2s', '&:hover': { boxShadow: 4 } }}
              >
                <Box sx={{ position: 'relative', bgcolor: '#f5f5f5' }}>
                  <Box
                    component="img"
                    src={t.imageUrl}
                    alt={t.name}
                    sx={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }}
                  />
                  <Box sx={{ position: 'absolute', top: 6, right: 6, display: 'flex', gap: 0.5 }}>
                    <IconButton size="small" sx={{ bgcolor: 'white', boxShadow: 1 }} onClick={() => openEdit(t)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" sx={{ bgcolor: 'white', boxShadow: 1 }} onClick={() => remove(t.id)}>
                      <DeleteIcon fontSize="small" color="error" />
                    </IconButton>
                  </Box>
                </Box>
                <Box p={1.5}>
                  <Typography fontWeight={700} noWrap title={t.name}>{t.name}</Typography>
                  <Box display="flex" gap={0.5} mt={0.5} flexWrap="wrap">
                    {t.fields.map(f => <Chip key={f.id} label={f.label} size="small" variant="outlined" />)}
                    {t.fields.length === 0 && (
                      <Typography variant="caption" color="text.secondary">No fields</Typography>
                    )}
                  </Box>
                  <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                    {new Date(t.createdAt).toLocaleDateString()}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      <Snackbar
        open={!!snack}
        autoHideDuration={3000}
        onClose={() => setSnack('')}
        message={snack}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  )
}