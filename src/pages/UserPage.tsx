import { useState } from 'react'
import {
  Box, Button, Typography, Paper, Grid, CircularProgress,
  Alert, TextField, Stack, Divider, Stepper, Step, StepLabel,
  Chip, Snackbar, useMediaQuery, useTheme, MobileStepper,
  IconButton
} from '@mui/material'
import DownloadIcon from '@mui/icons-material/Download'
import ImageIcon from '@mui/icons-material/Image'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import { Template, FieldValues } from '../types'
import { useTemplates } from '../hooks/useTemplates'
import TemplatePreview from '../components/TemplatePreview'
import { renderInvitation, downloadBlob } from '../utils/canvas'

const STEPS = ['Choose Template', 'Fill In Details', 'Download']

export default function UserPage() {
  const { templates, loading, error } = useTemplates()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const [step, setStep] = useState(0)
  const [selected, setSelected] = useState<Template | null>(null)
  const [values, setValues] = useState<FieldValues>({})
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState<string | null>(null)
  const [snack, setSnack] = useState('')

  const handleSelectTemplate = (t: Template) => {
    setSelected(t)
    setValues({})
    setStep(1)
  }

  const handleGenerate = async () => {
    if (!selected) return
    setGenerating(true)
    setGenError(null)
    try {
      const blob = await renderInvitation(selected, values)
      downloadBlob(blob, `invitation-${Date.now()}.png`)
      setStep(2)
      setSnack('Invitation downloaded!')
    } catch (e) {
      setGenError('Failed to generate image. Please try again.')
      console.error(e)
    } finally {
      setGenerating(false)
    }
  }

  const reset = () => { setStep(0); setSelected(null); setValues({}); setGenError(null) }

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, maxWidth: 1100, mx: 'auto' }}>
      <Typography
        variant="h4"
        fontWeight={800}
        gutterBottom
        sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' } }}
      >
        Create Your Invitation
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Pick a template, fill in your details, and download your personalized invitation.
      </Typography>

      {/* Stepper — desktop */}
      {!isMobile && (
        <Stepper activeStep={step} sx={{ mb: 4 }}>
          {STEPS.map(label => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
        </Stepper>
      )}

      {/* Stepper — mobile */}
      {isMobile && step < 2 && (
        <Box mb={2}>
          <Typography variant="caption" color="text.secondary">
            Step {step + 1} of {STEPS.length}: <b>{STEPS[step]}</b>
          </Typography>
          <MobileStepper
            variant="dots"
            steps={STEPS.length}
            position="static"
            activeStep={step}
            nextButton={null}
            backButton={null}
            sx={{ p: 0, mt: 0.5, bgcolor: 'transparent' }}
          />
        </Box>
      )}

      {/* ── STEP 0: Choose Template ── */}
      {step === 0 && (
        <>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {loading ? (
            <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>
          ) : templates.length === 0 ? (
            <Paper sx={{ p: { xs: 4, md: 6 }, textAlign: 'center', border: '2px dashed', borderColor: 'divider' }}>
              <ImageIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
              <Typography color="text.secondary">
                No templates available yet. Ask an admin to upload some.
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={2}>
              {templates.map(t => (
                <Grid item xs={12} sm={6} md={4} key={t.id}>
                  <Paper
                    variant="outlined"
                    onClick={() => handleSelectTemplate(t)}
                    sx={{
                      overflow: 'hidden',
                      cursor: 'pointer',
                      transition: 'all .2s',
                      '&:hover': {
                        boxShadow: 6,
                        transform: 'translateY(-3px)',
                        borderColor: 'primary.main',
                      },
                      '&:active': { transform: 'translateY(0)' },
                    }}
                  >
                    <Box
                      component="img"
                      src={t.imageUrl}
                      alt={t.name}
                      sx={{ width: '100%', height: { xs: 140, sm: 180 }, objectFit: 'cover', display: 'block' }}
                    />
                    <Box p={2}>
                      <Typography fontWeight={700} gutterBottom noWrap title={t.name}>
                        {t.name}
                      </Typography>
                      <Box display="flex" gap={0.5} flexWrap="wrap">
                        {t.fields.map(f => <Chip key={f.id} label={f.label} size="small" />)}
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}

      {/* ── STEP 1: Fill in details ── */}
      {step === 1 && selected && (
        <>
          {/* Back button (mobile always, desktop optional) */}
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={reset}
            sx={{ mb: 2 }}
            size="small"
          >
            Back to Templates
          </Button>

          <Grid container spacing={3} alignItems="flex-start">
            {/* Preview — full width on mobile, 7/12 on desktop */}
            <Grid item xs={12} md={7}>
              <Paper variant="outlined" sx={{ p: { xs: 1.5, md: 2 } }}>
                <Typography variant="subtitle2" gutterBottom color="text.secondary">
                  Live Preview
                </Typography>
                <TemplatePreview template={selected} values={values} />
              </Paper>
            </Grid>

            {/* Form */}
            <Grid item xs={12} md={5}>
              <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
                <Typography variant="h6" fontWeight={700} gutterBottom noWrap>
                  {selected.name}
                </Typography>
                <Divider sx={{ mb: 2 }} />

                {selected.fields.length === 0 ? (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    This template has no text fields. You can download it as-is.
                  </Alert>
                ) : (
                  <Stack spacing={2}>
                    {selected.fields.map(field => (
                      <TextField
                        key={field.id}
                        label={field.label}
                        value={values[field.key] || ''}
                        onChange={e => setValues(v => ({ ...v, [field.key]: e.target.value }))}
                        fullWidth
                        size="small"
                        multiline={field.maxWidth > 60}
                        rows={field.maxWidth > 60 ? 2 : 1}
                      />
                    ))}
                  </Stack>
                )}

                {genError && <Alert severity="error" sx={{ mt: 2 }}>{genError}</Alert>}

                <Stack spacing={1.5} mt={3}>
                  <Button
                    variant="contained"
                    size="large"
                    fullWidth
                    startIcon={
                      generating
                        ? <CircularProgress size={18} color="inherit" />
                        : <DownloadIcon />
                    }
                    onClick={handleGenerate}
                    disabled={generating}
                  >
                    {generating ? 'Generating…' : 'Generate & Download'}
                  </Button>
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </>
      )}

      {/* ── STEP 2: Done ── */}
      {step === 2 && (
        <Paper sx={{ p: { xs: 3, md: 6 }, textAlign: 'center' }}>
          <CheckCircleOutlineIcon sx={{ fontSize: 56, color: 'success.main', mb: 1 }} />
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Your Invitation is Ready!
          </Typography>
          <Typography color="text.secondary" mb={3}>
            The image has been downloaded to your device.
          </Typography>

          {selected && (
            <Box mb={3} mx="auto" sx={{ maxWidth: { xs: '100%', sm: 400 } }}>
              <TemplatePreview template={selected} values={values} />
            </Box>
          )}

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            justifyContent="center"
          >
            <Button
              variant="contained"
              onClick={() => { if (selected) { setStep(1); setGenError(null) } }}
              fullWidth={isMobile}
            >
              Edit This Invitation
            </Button>
            <Button variant="outlined" onClick={reset} fullWidth={isMobile}>
              Start Over
            </Button>
          </Stack>
        </Paper>
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