// src/pages/UserPage.tsx

import { useState } from "react";
import {
  Box,
  Button,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  TextField,
  Stack,
  Divider,
  Stepper,
  Step,
  StepLabel,
  Chip,
  Snackbar,
  useMediaQuery,
  useTheme,
  MobileStepper,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import ImageIcon from "@mui/icons-material/Image";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import {
  Template,
  FieldValues,
  Language,
  getVariantUrl,
  getVariantFields,
} from "../types";
import { useTemplates } from "../hooks/useTemplates";
import TemplatePreview from "../components/TemplatePreview";
import LanguagePicker from "../components/LanguagePicker";
import { renderInvitation, downloadBlob } from "../utils/canvas";

const STEPS = [
  "Choose Template",
  "Select Language",
  "Fill In Details",
  "Download",
];

export default function UserPage() {
  const { templates, loading, error } = useTemplates();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<Template | null>(null);

  const [language, setLanguage] = useState<Language | null>(null);
  const [values, setValues] = useState<FieldValues>({});
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [snack, setSnack] = useState("");
  const activeFields =
    selected && language ? getVariantFields(selected, language) : [];
  const reset = () => {
    setStep(0);
    setSelected(null);
    setLanguage(null);
    setValues({});
    setGenError(null);
  };

  const handleSelectTemplate = (t: Template) => {
    setSelected(t);
    setLanguage(null);
    setValues({});
    setStep(1);
  };

  const handleSelectLanguage = (lang: Language) => {
    setLanguage(lang);
    setValues({});
    setStep(2);
  };

  const handleGenerate = async () => {
    if (!selected || !language) return;
    setGenerating(true);
    setGenError(null);
    try {
      // Build a template variant with the correct image for the chosen language
      const imageUrl = getVariantUrl(selected, language);
      const variantFields = getVariantFields(selected, language);
      const variantTemplate = { ...selected, imageUrl, fields: variantFields };
      const blob = await renderInvitation(variantTemplate, values);
      downloadBlob(blob, `invitation-${Date.now()}.png`);
      setStep(3);
      setSnack("Invitation downloaded!");
    } catch (e) {
      setGenError("Failed to generate image. Please try again.");
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  // Derive the active image URL and fields for preview
const previewImageUrl =
  selected && language ? getVariantUrl(selected, language) : selected?.imageUrl

const previewTemplate =
  selected && previewImageUrl
    ? {
        ...selected,
        imageUrl: previewImageUrl,
        fields: language ? getVariantFields(selected, language) : selected.fields,  // ← fix
      }
    : selected

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, maxWidth: 1100, mx: "auto" }}>
      <Typography
        variant="h4"
        fontWeight={800}
        gutterBottom
        sx={{ fontSize: { xs: "1.5rem", md: "2.125rem" } }}
      >
        Create Your Invitation
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Pick a template, choose your language, fill in your details, and
        download.
      </Typography>

      {/* Stepper — desktop */}
      {!isMobile && (
        <Stepper activeStep={step} sx={{ mb: 4 }}>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      )}
      {/* Stepper — mobile */}
      {isMobile && step < 3 && (
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
            sx={{ p: 0, mt: 0.5, bgcolor: "transparent" }}
          />
        </Box>
      )}

      {/* ── STEP 0: Choose Template ── */}
      {step === 0 && (
        <>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {loading ? (
            <Box display="flex" justifyContent="center" py={8}>
              <CircularProgress />
            </Box>
          ) : templates.length === 0 ? (
            <Paper
              sx={{
                p: { xs: 4, md: 6 },
                textAlign: "center",
                border: "2px dashed",
                borderColor: "divider",
              }}
            >
              <ImageIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
              <Typography color="text.secondary">
                No templates available yet.
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={2}>
              {templates.map((t) => (
                <Grid item xs={12} sm={6} md={4} key={t.id}>
                  <Paper
                    variant="outlined"
                    onClick={() => handleSelectTemplate(t)}
                    sx={{
                      overflow: "hidden",
                      cursor: "pointer",
                      transition: "all .2s",
                      "&:hover": {
                        boxShadow: 6,
                        transform: "translateY(-3px)",
                        borderColor: "primary.main",
                      },
                      "&:active": { transform: "translateY(0)" },
                    }}
                  >
                    <Box
                      component="img"
                      src={t.imageUrl}
                      alt={t.name}
                      sx={{
                        width: "100%",
                        height: { xs: 140, sm: 180 },
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                    <Box p={2}>
                      <Typography
                        fontWeight={700}
                        gutterBottom
                        noWrap
                        title={t.name}
                      >
                        {t.name}
                      </Typography>
                      <Box display="flex" gap={0.5} flexWrap="wrap">
                        {[
                          ...new Map(
                            (t.variants || []).map((v) => [v.lang, v]),
                          ).values(),
                        ].map((v) => (
                          <Chip
                            key={v.lang}
                            label={v.lang}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}

      {/* ── STEP 1: Select Language ── */}
      {step === 1 && selected && (
        <>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={reset}
            sx={{ mb: 3 }}
            size="small"
          >
            Back to Templates
          </Button>
          <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              {selected.name}
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <LanguagePicker
              template={selected}
              selected={language}
              onSelect={handleSelectLanguage}
            />
          </Paper>
        </>
      )}

      {/* ── STEP 2: Fill in details ── */}
      {step === 2 && selected && language && previewTemplate && (
        <>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => setStep(1)}
            sx={{ mb: 2 }}
            size="small"
          >
            Back to Language
          </Button>

          <Grid container spacing={3} alignItems="flex-start">
            <Grid item xs={12} md={7}>
              <Paper variant="outlined" sx={{ p: { xs: 1.5, md: 2 } }}>
                <Typography
                  variant="subtitle2"
                  gutterBottom
                  color="text.secondary"
                >
                  Live Preview — {language}
                </Typography>
                <TemplatePreview template={previewTemplate} values={values} />
              </Paper>
            </Grid>

            <Grid item xs={12} md={5}>
              <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
                <Typography variant="h6" fontWeight={700} gutterBottom noWrap>
                  {selected.name}
                </Typography>
                <Chip label={language} size="small" sx={{ mb: 2 }} />
                <Divider sx={{ mb: 2 }} />

                {activeFields.length === 0 ? (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    No text fields. Download as-is.
                  </Alert>
                ) : (
                  <Stack spacing={2}>
                    {activeFields.map((field) => (
                      <TextField
                        key={field.id}
                        label={field.label}
                        value={values[field.key] || ""}
                        onChange={(e) =>
                          setValues((v) => ({
                            ...v,
                            [field.key]: e.target.value,
                          }))
                        }
                        fullWidth
                        size="small"
                        multiline={field.maxWidth > 60}
                        rows={field.maxWidth > 60 ? 2 : 1}
                      />
                    ))}
                  </Stack>
                )}

                {genError && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    {genError}
                  </Alert>
                )}

                <Box mt={3}>
                  <Button
                    variant="contained"
                    size="large"
                    fullWidth
                    startIcon={
                      generating ? (
                        <CircularProgress size={18} color="inherit" />
                      ) : (
                        <DownloadIcon />
                      )
                    }
                    onClick={handleGenerate}
                    disabled={generating}
                  >
                    {generating ? "Generating…" : "Generate & Download"}
                  </Button>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </>
      )}

      {/* ── STEP 3: Done ── */}
      {step === 3 && (
        <Paper sx={{ p: { xs: 3, md: 6 }, textAlign: "center" }}>
          <CheckCircleOutlineIcon
            sx={{ fontSize: 56, color: "success.main", mb: 1 }}
          />
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Your Invitation is Ready!
          </Typography>
          <Typography color="text.secondary" mb={3}>
            The image has been downloaded to your device.
          </Typography>
          {previewTemplate && (
            <Box mb={3} mx="auto" sx={{ maxWidth: { xs: "100%", sm: 400 } }}>
              <TemplatePreview template={previewTemplate} values={values} />
            </Box>
          )}
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            justifyContent="center"
          >
            <Button
              variant="contained"
              fullWidth={isMobile}
              onClick={() => {
                setStep(2);
                setGenError(null);
              }}
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
        onClose={() => setSnack("")}
        message={snack}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </Box>
  );
}
