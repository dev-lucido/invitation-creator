// src/pages/AdminPage.tsx

import { useState, useRef } from 'react'
import {
  Box, Button, TextField, Typography, Paper, Grid, CircularProgress,
  Alert, IconButton, Stack, Snackbar, Chip, Divider, useTheme, useMediaQuery, Tabs, Tab
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate'
import CloseIcon from '@mui/icons-material/Close'
import { Template, Language, LANGUAGES, TextField as TF } from '../types'
import { uploadTemplate, updateTemplate } from '../utils/api'
import { useTemplates } from '../hooks/useTemplates'
import FieldEditor from '../components/FieldEditor'
import TemplatePreview from '../components/TemplatePreview'

// const FLAG: Record<Language, string> = { English: '🇬🇧', Sinhala: '🇱🇰', Tamil: '🇮🇳' }

function makeFakeTemplate(name: string, imageUrl: string, fields: TF[]): Template {
  return { id: '__preview__', name: name || 'Preview', filename: '', imageUrl, variants: [], fields, createdAt: '' }
}

// ── Per-language image uploader (unchanged) ────────────────────────────────────
interface LangImagesProps {
  langFiles: Partial<Record<Language, File>>
  langPreviews: Partial<Record<Language, string>>
  onChange: (lang: Language, file: File, previewUrl: string) => void
  idPrefix?: string   // ← add this
}

function LangImageUploader({ langFiles, langPreviews, onChange, idPrefix = 'img' }: LangImagesProps) {
  const handleFile = (lang: Language, e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    onChange(lang, f, URL.createObjectURL(f))
  }
  return (
    <Box>
      <Typography variant="subtitle2" fontWeight={700} gutterBottom>Images per Language</Typography>
      <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>
        Upload a separate image for each language. At least one is required.
      </Typography>
      <Grid container spacing={2}>
        {LANGUAGES.map(lang => (
          <Grid item xs={12} sm={4} key={lang}>
            <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center' }}>
              <Typography variant="caption" fontWeight={700} display="block" mb={1}>{lang}</Typography>
              {langPreviews[lang] ? (
                <Box component="img" src={langPreviews[lang]} alt={lang}
                  sx={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: 1, display: 'block', mb: 1 }} />
              ) : (
                <Box sx={{ width: '100%', height: 80, bgcolor: '#f5f5f5', borderRadius: 1, mb: 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="caption" color="text.disabled">No image</Typography>
                </Box>
              )}
              <input
                type="file" accept="image/*" style={{ display: 'none' }}
                id={`${idPrefix}-${lang}`}          // ← use prefixed id
                onChange={e => handleFile(lang, e)}
              />
              <label htmlFor={`${idPrefix}-${lang}`}>   {/* ← match */}
                <Button variant="outlined" component="span" size="small"
                  startIcon={<AddPhotoAlternateIcon />} fullWidth>
                  {langFiles[lang] ? 'Change' : 'Upload'}
                </Button>
              </label>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}

// ── Per-language field tabs ────────────────────────────────────────────────────
interface LangFieldEditorProps {
  availableLangs: Language[]    // languages that have an image
  langFields: Partial<Record<Language, TF[]>>
  onChange: (lang: Language, fields: TF[]) => void
}

function LangFieldEditor({ availableLangs, langFields, onChange }: LangFieldEditorProps) {
  const [activeTab, setActiveTab] = useState(0)

  // Clamp activeTab if availableLangs shrinks
  const safeTab = Math.min(activeTab, Math.max(0, availableLangs.length - 1))
  const activeLang = availableLangs[safeTab]

  if (availableLangs.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" align="center" py={2}>
        Upload at least one language image to configure fields.
      </Typography>
    )
  }

  return (
    <Box>
      <Typography variant="subtitle1" fontWeight={700} gutterBottom>Text Fields</Typography>
      <Typography variant="caption" color="text.secondary" display="block" mb={1}>
        Each language can have independent field positions and styles.
      </Typography>
      <Tabs
        value={safeTab}                              // ← use safeTab, not activeTab
        onChange={(_, v) => setActiveTab(v)}
        sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
        variant="scrollable"
        scrollButtons="auto"
      >
        {availableLangs.map((lang, i) => (
          <Tab
            key={lang}
            label={`${lang}`}
            value={i}
            sx={{ minWidth: 100 }}
          />
        ))}
      </Tabs>
      {/* Key on activeLang forces FieldEditor to fully remount when language switches,
          so its internal `expanded` state doesn't bleed across languages */}
      <FieldEditor
        key={activeLang}
        fields={langFields[activeLang] ?? []}
        onChange={fields => onChange(activeLang, fields)}
        imageWidth={800}
        imageHeight={600}
      />
    </Box>
  )
}

// ── Editor panel ───────────────────────────────────────────────────────────────
interface EditorPanelProps {
  previewImageUrl: string
  templateName: string
  onNameChange: (v: string) => void
  langFields: Partial<Record<Language, TF[]>>
  onLangFieldsChange: (lang: Language, fields: TF[]) => void
  availableLangs: Language[]
  activePreviewLang: Language | null
  onPreviewLang: (l: Language) => void
  langFiles: Partial<Record<Language, File>>
  langPreviews: Partial<Record<Language, string>>
  onLangImage: (lang: Language, file: File, url: string) => void
  actions: React.ReactNode
  error?: string | null
}

function EditorPanel({
  previewImageUrl, templateName, onNameChange,
  langFields, onLangFieldsChange, availableLangs,
  activePreviewLang, onPreviewLang,
  langFiles, langPreviews, onLangImage,
  actions, error,
}: EditorPanelProps) {
  // Build a fake template for the preview using the active language's fields
  const previewFields = (activePreviewLang && langFields[activePreviewLang]) ?? []
  const fakeTemplate = makeFakeTemplate(templateName, previewImageUrl, previewFields)

  return (
    <Grid container spacing={0} sx={{ minHeight: 0 }}>
      {/* LEFT — live preview */}
      <Grid item xs={12} md={6} sx={{
        p: { xs: 2, md: 3 },
        borderRight: { md: '1px solid' },
        borderBottom: { xs: '1px solid', md: 'none' },
        borderColor: 'divider',
        bgcolor: '#f0f0f0',
      }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
          <Typography variant="caption" color="text.secondary" fontWeight={600}
            letterSpacing={0.5} textTransform="uppercase">
            Live Preview
          </Typography>
          <Stack direction="row" spacing={0.5}>
            {availableLangs.map(l => (
              <Chip key={l} label={`${l}`} size="small"
                onClick={() => onPreviewLang(l)}
                color={activePreviewLang === l ? 'primary' : 'default'}
                variant={activePreviewLang === l ? 'filled' : 'outlined'}
                sx={{ cursor: 'pointer' }} />
            ))}
          </Stack>
        </Stack>
        <TemplatePreview template={fakeTemplate} />
      </Grid>

      {/* RIGHT — fields + lang images + actions */}
      <Grid item xs={12} md={6} sx={{
        p: { xs: 2, md: 3 }, display: 'flex', flexDirection: 'column', gap: 2,
        maxHeight: { md: '85vh' }, overflowY: { md: 'auto' },
      }}>
        <TextField label="Template Name" value={templateName}
          onChange={e => onNameChange(e.target.value)} fullWidth size="small"
          placeholder="e.g. Wedding Invite 2024" />

        <LangImageUploader  idPrefix="edit-img" langFiles={langFiles} langPreviews={langPreviews} onChange={onLangImage} />

        <Divider />

        <LangFieldEditor
          availableLangs={availableLangs}
          langFields={langFields}
          onChange={onLangFieldsChange}
        />

        {error && <Alert severity="error">{error}</Alert>}
        <Box pt={1}>{actions}</Box>
      </Grid>
    </Grid>
  )
}

// ── Main admin page ────────────────────────────────────────────────────────────
export default function AdminPage() {
  const { templates, loading, error: listError, reload, remove } = useTemplates()
  const isMobile = useMediaQuery(useTheme().breakpoints.down('md'))

  // Upload state
  const [uploading, setUploading]       = useState(false)
  const [uploadErr, setUploadErr]       = useState<string | null>(null)
  const [snack, setSnack]               = useState('')
  const [name, setName]                 = useState('')
  const [langFiles, setLangFiles]       = useState<Partial<Record<Language, File>>>({})
  const [langPreviews, setLangPreviews] = useState<Partial<Record<Language, string>>>({})
  const [langFields, setLangFields]     = useState<Partial<Record<Language, TF[]>>>({})
  const [previewLang, setPreviewLang]   = useState<Language | null>(null)

  // Edit state
  const [editing, setEditing]               = useState<Template | null>(null)
  const [editName, setEditName]             = useState('')
  const [editLangFiles, setEditLangFiles]   = useState<Partial<Record<Language, File>>>({})
  const [editLangPreviews, setEditLangPreviews] = useState<Partial<Record<Language, string>>>({})
  const [editLangFields, setEditLangFields] = useState<Partial<Record<Language, TF[]>>>({})
  const [editPreviewLang, setEditPreviewLang] = useState<Language | null>(null)
  const [saving, setSaving]                 = useState(false)

  // Derive available languages (those with an uploaded image)
  const uploadAvailableLangs = LANGUAGES.filter(l => langPreviews[l])
  const editAvailableLangs   = LANGUAGES.filter(l => editLangPreviews[l])

  const handleLangImage = (
    fileSetter: React.Dispatch<React.SetStateAction<Partial<Record<Language, File>>>>,
    previewSetter: React.Dispatch<React.SetStateAction<Partial<Record<Language, string>>>>,
    prevPreviews: Partial<Record<Language, string>>,
    previewLangSetter: React.Dispatch<React.SetStateAction<Language | null>>,
    fieldsSetter: React.Dispatch<React.SetStateAction<Partial<Record<Language, TF[]>>>>,
  ) => (lang: Language, file: File, url: string) => {
    if (prevPreviews[lang]) URL.revokeObjectURL(prevPreviews[lang]!)
    fileSetter(p => ({ ...p, [lang]: file }))
    previewSetter(p => ({ ...p, [lang]: url }))
    previewLangSetter(lang)
    // Auto-initialise empty fields array for new language
    fieldsSetter(p => p[lang] !== undefined ? p : { ...p, [lang]: [] })
  }

  const handleUpload = async () => {
    if (!name.trim() || Object.keys(langFiles).length === 0) {
      setUploadErr('Please provide a name and at least one language image.')
      return
    }
    setUploading(true); setUploadErr(null)
    try {
      // Use first language's fields as the legacy fallback
      const firstLang = uploadAvailableLangs[0]
      const fallback = (firstLang && langFields[firstLang]) ?? []
      await uploadTemplate(name.trim(), langFiles, langFields, fallback)
      setName('')
      Object.values(langPreviews).forEach(u => u && URL.revokeObjectURL(u))
      setLangFiles({}); setLangPreviews({}); setLangFields({}); setPreviewLang(null)
      await reload()
      setSnack('Template uploaded!')
    } catch { setUploadErr('Upload failed. Is the server running?') }
    finally { setUploading(false) }
  }

  const openEdit = (t: Template) => {
    setEditing(t)
    setEditName(t.name)
    setEditLangFiles({})
    const previews: Partial<Record<Language, string>> = {}
    const fields: Partial<Record<Language, TF[]>> = {}
    for (const v of (t.variants || [])) {
      previews[v.lang as Language] = v.imageUrl
      fields[v.lang as Language] = v.fields ? JSON.parse(JSON.stringify(v.fields)) : []
    }
    setEditLangPreviews(previews)
    setEditLangFields(fields)
    setEditPreviewLang((t.variants?.[0]?.lang as Language) || null)
  }

  const handleSaveEdit = async () => {
    if (!editing) return
    setSaving(true)
    try {
      const firstLang = editAvailableLangs[0]
      const fallback = (firstLang && editLangFields[firstLang]) ?? editing.fields
      await updateTemplate(editing.id, {
        name: editName,
        fallbackFields: fallback,
        langFields: editLangFields,
        langImages: editLangFiles,
      })
      await reload(); setEditing(null); setSnack('Template updated!')
    } catch { setSnack('Save failed.') }
    finally { setSaving(false) }
  }

  const uploadPreviewUrl = previewLang
    ? (langPreviews[previewLang] ?? Object.values(langPreviews)[0] ?? '')
    : (Object.values(langPreviews)[0] ?? '')

  const editPreviewUrl = editPreviewLang
    ? (editLangPreviews[editPreviewLang] ?? Object.values(editLangPreviews)[0] ?? editing?.imageUrl ?? '')
    : (Object.values(editLangPreviews)[0] ?? editing?.imageUrl ?? '')

  // ── Edit view ──
  if (editing) {
    return (
      <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, maxWidth: 1400, mx: 'auto' }}>
        <Box display="flex" alignItems="center" gap={1} mb={3}>
          <IconButton onClick={() => setEditing(null)} size="small"><CloseIcon /></IconButton>
          <Typography variant="h5" fontWeight={700}>Editing: {editing.name}</Typography>
        </Box>
        <Paper sx={{ border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
          <EditorPanel
            previewImageUrl={editPreviewUrl}
            templateName={editName}
            onNameChange={setEditName}
            langFields={editLangFields}
            onLangFieldsChange={(lang, fields) => setEditLangFields(p => ({ ...p, [lang]: fields }))}
            availableLangs={editAvailableLangs}
            activePreviewLang={editPreviewLang}
            onPreviewLang={setEditPreviewLang}
            langFiles={editLangFiles}
            langPreviews={editLangPreviews}
            onLangImage={handleLangImage(setEditLangFiles, setEditLangPreviews, editLangPreviews, setEditPreviewLang, setEditLangFields)}
            actions={
              <Stack direction="row" spacing={1.5}>
                <Button variant="outlined" onClick={() => setEditing(null)} fullWidth={isMobile}>Cancel</Button>
                <Button variant="contained" onClick={handleSaveEdit} disabled={saving} fullWidth={isMobile}
                  startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}>
                  {saving ? 'Saving…' : 'Save Changes'}
                </Button>
              </Stack>
            }
          />
        </Paper>
      </Box>
    )
  }

  // ── Main view ──
  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, maxWidth: 1400, mx: 'auto' }}>
      <Typography variant="h4" fontWeight={800} gutterBottom sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' } }}>
        Template Manager
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Upload invitation templates with per-language images and independent text field positions.
      </Typography>

      <Paper sx={{ mb: 4, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <Box sx={{ px: { xs: 2, md: 3 }, pt: { xs: 2, md: 3 }, pb: 1.5 }}>
          <Typography variant="h6" fontWeight={700}>Upload New Template</Typography>
        </Box>
        <Divider />
        {uploadPreviewUrl ? (
          <EditorPanel
            previewImageUrl={uploadPreviewUrl}
            templateName={name}
            onNameChange={setName}
            langFields={langFields}
            onLangFieldsChange={(lang, fields) => setLangFields(p => ({ ...p, [lang]: fields }))}
            availableLangs={uploadAvailableLangs}
            activePreviewLang={previewLang}
            onPreviewLang={setPreviewLang}
            langFiles={langFiles}
            langPreviews={langPreviews}
            onLangImage={handleLangImage(setLangFiles, setLangPreviews, langPreviews, setPreviewLang, setLangFields)}
            error={uploadErr}
            actions={
              <Button variant="contained" size="large"
                startIcon={uploading ? <CircularProgress size={18} color="inherit" /> : <CloudUploadIcon />}
                onClick={handleUpload} disabled={uploading || !name.trim()} fullWidth={isMobile} sx={{ px: 4 }}>
                {uploading ? 'Uploading…' : 'Upload Template'}
              </Button>
            }
          />
        ) : (
          <Box sx={{ p: { xs: 2, md: 3 } }}>
            <LangImageUploader idPrefix="upload-img" langFiles={langFiles} langPreviews={langPreviews}
              onChange={handleLangImage(setLangFiles, setLangPreviews, langPreviews, setPreviewLang, setLangFields)} />
            {uploadErr && <Alert severity="error" sx={{ mt: 2 }}>{uploadErr}</Alert>}
          </Box>
        )}
      </Paper>

      <Typography variant="h6" fontWeight={700} gutterBottom>Saved Templates ({templates.length})</Typography>
      {listError && <Alert severity="error" sx={{ mb: 2 }}>{listError}</Alert>}

      {loading ? (
        <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
      ) : templates.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', border: '2px dashed', borderColor: 'divider' }}>
          <Typography color="text.secondary">No templates yet.</Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {templates.map(t => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={t.id}>
              <Paper variant="outlined" sx={{ overflow: 'hidden', transition: 'box-shadow .2s', '&:hover': { boxShadow: 4 } }}>
                <Box sx={{ position: 'relative', bgcolor: '#f5f5f5' }}>
                  <Box component="img" src={t.imageUrl} alt={t.name}
                    sx={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }} />
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
                    {(t.variants || []).map(v => (
                      <Chip key={v.lang} label={`${v.lang}`} size="small" variant="outlined" />
                    ))}
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

      <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack('')}
        message={snack} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} />
    </Box>
  )
}