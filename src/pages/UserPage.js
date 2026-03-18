import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Box, Button, Typography, Paper, Grid, CircularProgress, Alert, TextField, Stack, Divider, Stepper, Step, StepLabel, Chip, Snackbar, useMediaQuery, useTheme, MobileStepper } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import ImageIcon from '@mui/icons-material/Image';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { useTemplates } from '../hooks/useTemplates';
import TemplatePreview from '../components/TemplatePreview';
import { renderInvitation, downloadBlob } from '../utils/canvas';
const STEPS = ['Choose Template', 'Fill In Details', 'Download'];
export default function UserPage() {
    const { templates, loading, error } = useTemplates();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [step, setStep] = useState(0);
    const [selected, setSelected] = useState(null);
    const [values, setValues] = useState({});
    const [generating, setGenerating] = useState(false);
    const [genError, setGenError] = useState(null);
    const [snack, setSnack] = useState('');
    const handleSelectTemplate = (t) => {
        setSelected(t);
        setValues({});
        setStep(1);
    };
    const handleGenerate = async () => {
        if (!selected)
            return;
        setGenerating(true);
        setGenError(null);
        try {
            const blob = await renderInvitation(selected, values);
            downloadBlob(blob, `invitation-${Date.now()}.png`);
            setStep(2);
            setSnack('Invitation downloaded!');
        }
        catch (e) {
            setGenError('Failed to generate image. Please try again.');
            console.error(e);
        }
        finally {
            setGenerating(false);
        }
    };
    const reset = () => { setStep(0); setSelected(null); setValues({}); setGenError(null); };
    return (_jsxs(Box, { sx: { p: { xs: 2, sm: 3, md: 4 }, maxWidth: 1100, mx: 'auto' }, children: [_jsx(Typography, { variant: "h4", fontWeight: 800, gutterBottom: true, sx: { fontSize: { xs: '1.5rem', md: '2.125rem' } }, children: "Create Your Invitation" }), _jsx(Typography, { variant: "body2", color: "text.secondary", mb: 3, children: "Pick a template, fill in your details, and download your personalized invitation." }), !isMobile && (_jsx(Stepper, { activeStep: step, sx: { mb: 4 }, children: STEPS.map(label => _jsx(Step, { children: _jsx(StepLabel, { children: label }) }, label)) })), isMobile && step < 2 && (_jsxs(Box, { mb: 2, children: [_jsxs(Typography, { variant: "caption", color: "text.secondary", children: ["Step ", step + 1, " of ", STEPS.length, ": ", _jsx("b", { children: STEPS[step] })] }), _jsx(MobileStepper, { variant: "dots", steps: STEPS.length, position: "static", activeStep: step, nextButton: null, backButton: null, sx: { p: 0, mt: 0.5, bgcolor: 'transparent' } })] })), step === 0 && (_jsxs(_Fragment, { children: [error && _jsx(Alert, { severity: "error", sx: { mb: 2 }, children: error }), loading ? (_jsx(Box, { display: "flex", justifyContent: "center", py: 8, children: _jsx(CircularProgress, {}) })) : templates.length === 0 ? (_jsxs(Paper, { sx: { p: { xs: 4, md: 6 }, textAlign: 'center', border: '2px dashed', borderColor: 'divider' }, children: [_jsx(ImageIcon, { sx: { fontSize: 48, color: 'text.disabled', mb: 1 } }), _jsx(Typography, { color: "text.secondary", children: "No templates available yet. Ask an admin to upload some." })] })) : (_jsx(Grid, { container: true, spacing: 2, children: templates.map(t => (_jsx(Grid, { item: true, xs: 12, sm: 6, md: 4, children: _jsxs(Paper, { variant: "outlined", onClick: () => handleSelectTemplate(t), sx: {
                                    overflow: 'hidden',
                                    cursor: 'pointer',
                                    transition: 'all .2s',
                                    '&:hover': {
                                        boxShadow: 6,
                                        transform: 'translateY(-3px)',
                                        borderColor: 'primary.main',
                                    },
                                    '&:active': { transform: 'translateY(0)' },
                                }, children: [_jsx(Box, { component: "img", src: t.imageUrl, alt: t.name, sx: { width: '100%', height: { xs: 140, sm: 180 }, objectFit: 'cover', display: 'block' } }), _jsxs(Box, { p: 2, children: [_jsx(Typography, { fontWeight: 700, gutterBottom: true, noWrap: true, title: t.name, children: t.name }), _jsx(Box, { display: "flex", gap: 0.5, flexWrap: "wrap", children: t.fields.map(f => _jsx(Chip, { label: f.label, size: "small" }, f.id)) })] })] }) }, t.id))) }))] })), step === 1 && selected && (_jsxs(_Fragment, { children: [_jsx(Button, { startIcon: _jsx(ArrowBackIcon, {}), onClick: reset, sx: { mb: 2 }, size: "small", children: "Back to Templates" }), _jsxs(Grid, { container: true, spacing: 3, alignItems: "flex-start", children: [_jsx(Grid, { item: true, xs: 12, md: 7, children: _jsxs(Paper, { variant: "outlined", sx: { p: { xs: 1.5, md: 2 } }, children: [_jsx(Typography, { variant: "subtitle2", gutterBottom: true, color: "text.secondary", children: "Live Preview" }), _jsx(TemplatePreview, { template: selected, values: values })] }) }), _jsx(Grid, { item: true, xs: 12, md: 5, children: _jsxs(Paper, { variant: "outlined", sx: { p: { xs: 2, md: 3 } }, children: [_jsx(Typography, { variant: "h6", fontWeight: 700, gutterBottom: true, noWrap: true, children: selected.name }), _jsx(Divider, { sx: { mb: 2 } }), selected.fields.length === 0 ? (_jsx(Alert, { severity: "info", sx: { mb: 2 }, children: "This template has no text fields. You can download it as-is." })) : (_jsx(Stack, { spacing: 2, children: selected.fields.map(field => (_jsx(TextField, { label: field.label, value: values[field.key] || '', onChange: e => setValues(v => ({ ...v, [field.key]: e.target.value })), fullWidth: true, size: "small", multiline: field.maxWidth > 60, rows: field.maxWidth > 60 ? 2 : 1 }, field.id))) })), genError && _jsx(Alert, { severity: "error", sx: { mt: 2 }, children: genError }), _jsx(Stack, { spacing: 1.5, mt: 3, children: _jsx(Button, { variant: "contained", size: "large", fullWidth: true, startIcon: generating
                                                    ? _jsx(CircularProgress, { size: 18, color: "inherit" })
                                                    : _jsx(DownloadIcon, {}), onClick: handleGenerate, disabled: generating, children: generating ? 'Generating…' : 'Generate & Download' }) })] }) })] })] })), step === 2 && (_jsxs(Paper, { sx: { p: { xs: 3, md: 6 }, textAlign: 'center' }, children: [_jsx(CheckCircleOutlineIcon, { sx: { fontSize: 56, color: 'success.main', mb: 1 } }), _jsx(Typography, { variant: "h5", fontWeight: 700, gutterBottom: true, children: "Your Invitation is Ready!" }), _jsx(Typography, { color: "text.secondary", mb: 3, children: "The image has been downloaded to your device." }), selected && (_jsx(Box, { mb: 3, mx: "auto", sx: { maxWidth: { xs: '100%', sm: 400 } }, children: _jsx(TemplatePreview, { template: selected, values: values }) })), _jsxs(Stack, { direction: { xs: 'column', sm: 'row' }, spacing: 2, justifyContent: "center", children: [_jsx(Button, { variant: "contained", onClick: () => { if (selected) {
                                    setStep(1);
                                    setGenError(null);
                                } }, fullWidth: isMobile, children: "Edit This Invitation" }), _jsx(Button, { variant: "outlined", onClick: reset, fullWidth: isMobile, children: "Start Over" })] })] })), _jsx(Snackbar, { open: !!snack, autoHideDuration: 3000, onClose: () => setSnack(''), message: snack, anchorOrigin: { vertical: 'bottom', horizontal: 'center' } })] }));
}
