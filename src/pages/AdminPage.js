import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef } from 'react';
import { Box, Button, TextField, Typography, Paper, Grid, CircularProgress, Alert, IconButton, Stack, Snackbar, Chip, Divider, useTheme, useMediaQuery } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import CloseIcon from '@mui/icons-material/Close';
import { uploadTemplate, updateTemplate } from '../utils/api';
import { useTemplates } from '../hooks/useTemplates';
import FieldEditor from '../components/FieldEditor';
import TemplatePreview from '../components/TemplatePreview';
function makeFakeTemplate(name, imageUrl, fields) {
    return { id: '__preview__', name: name || 'Preview', filename: '', imageUrl, fields, createdAt: '' };
}
function EditorPanel({ imageUrl, templateName, onNameChange, fields, onFieldsChange, actions, error }) {
    const fakeTemplate = makeFakeTemplate(templateName, imageUrl, fields);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    return (_jsxs(Grid, { container: true, spacing: 0, sx: { minHeight: 0 }, children: [_jsxs(Grid, { item: true, xs: 12, md: 6, sx: {
                    p: { xs: 2, md: 3 },
                    borderRight: { md: '1px solid' },
                    borderBottom: { xs: '1px solid', md: 'none' },
                    borderColor: 'divider',
                    bgcolor: '#f0f0f0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                }, children: [_jsx(Typography, { variant: "caption", color: "text.secondary", fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", children: "Live Preview" }), _jsx(Box, { sx: { flex: 1, display: 'flex', alignItems: 'flex-start' }, children: _jsx(TemplatePreview, { template: fakeTemplate }) })] }), _jsxs(Grid, { item: true, xs: 12, md: 6, sx: {
                    p: { xs: 2, md: 3 },
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    maxHeight: { md: '80vh' },
                    overflowY: { md: 'auto' },
                }, children: [_jsx(TextField, { label: "Template Name", value: templateName, onChange: e => onNameChange(e.target.value), fullWidth: true, size: "small", placeholder: "e.g. Wedding Invite 2024" }), _jsx(FieldEditor, { fields: fields, onChange: onFieldsChange, imageWidth: 800, imageHeight: 600 }), error && _jsx(Alert, { severity: "error", children: error }), _jsx(Box, { sx: { pt: 1 }, children: actions })] })] }));
}
// ── Main page ──────────────────────────────────────────────────────────────────
export default function AdminPage() {
    const { templates, loading, error: listError, reload, remove } = useTemplates();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    // Upload state
    const [uploading, setUploading] = useState(false);
    const [uploadErr, setUploadErr] = useState(null);
    const [snack, setSnack] = useState('');
    const [name, setName] = useState('');
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [fields, setFields] = useState([]);
    const fileRef = useRef(null);
    // Edit state — null = list view, Template = editing that template
    const [editing, setEditing] = useState(null);
    const [editFields, setEditFields] = useState([]);
    const [editName, setEditName] = useState('');
    const [saving, setSaving] = useState(false);
    const handleFileChange = (e) => {
        const f = e.target.files?.[0];
        if (!f)
            return;
        if (previewUrl)
            URL.revokeObjectURL(previewUrl);
        setFile(f);
        setPreviewUrl(URL.createObjectURL(f));
        setUploadErr(null);
    };
    const handleUpload = async () => {
        if (!file || !name.trim()) {
            setUploadErr('Please provide a name and choose an image.');
            return;
        }
        setUploading(true);
        setUploadErr(null);
        try {
            await uploadTemplate(name.trim(), file, fields);
            setName('');
            setFile(null);
            if (previewUrl)
                URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
            setFields([]);
            if (fileRef.current)
                fileRef.current.value = '';
            await reload();
            setSnack('Template uploaded!');
        }
        catch {
            setUploadErr('Upload failed. Is the server running on port 3001?');
        }
        finally {
            setUploading(false);
        }
    };
    const openEdit = (t) => {
        setEditing(t);
        setEditFields(JSON.parse(JSON.stringify(t.fields)));
        setEditName(t.name);
    };
    const closeEdit = () => setEditing(null);
    const handleSaveEdit = async () => {
        if (!editing)
            return;
        setSaving(true);
        try {
            await updateTemplate(editing.id, { name: editName, fields: editFields });
            await reload();
            setEditing(null);
            setSnack('Template updated!');
        }
        catch {
            setSnack('Save failed.');
        }
        finally {
            setSaving(false);
        }
    };
    // ── Edit view (full page replacement) ──
    if (editing) {
        return (_jsxs(Box, { sx: { p: { xs: 2, sm: 3, md: 4 }, maxWidth: 1400, mx: 'auto' }, children: [_jsxs(Box, { display: "flex", alignItems: "center", gap: 1, mb: 3, children: [_jsx(IconButton, { onClick: closeEdit, size: "small", children: _jsx(CloseIcon, {}) }), _jsxs(Typography, { variant: "h5", fontWeight: 700, children: ["Editing: ", editing.name] })] }), _jsx(Paper, { sx: { border: '1px solid', borderColor: 'divider', overflow: 'hidden' }, children: _jsx(EditorPanel, { imageUrl: editing.imageUrl, templateName: editName, onNameChange: setEditName, fields: editFields, onFieldsChange: setEditFields, actions: _jsxs(Stack, { direction: "row", spacing: 1.5, children: [_jsx(Button, { variant: "outlined", onClick: closeEdit, fullWidth: isMobile, children: "Cancel" }), _jsx(Button, { variant: "contained", onClick: handleSaveEdit, disabled: saving, startIcon: saving ? _jsx(CircularProgress, { size: 16, color: "inherit" }) : null, fullWidth: isMobile, children: saving ? 'Saving…' : 'Save Changes' })] }) }) })] }));
    }
    // ── Main list + upload view ──
    return (_jsxs(Box, { sx: { p: { xs: 2, sm: 3, md: 4 }, maxWidth: 1400, mx: 'auto' }, children: [_jsx(Typography, { variant: "h4", fontWeight: 800, gutterBottom: true, sx: { fontSize: { xs: '1.5rem', md: '2.125rem' } }, children: "Admin \u2014 Template Manager" }), _jsx(Typography, { variant: "body2", color: "text.secondary", mb: 3, children: "Upload invitation templates and define where text fields appear on the image." }), _jsxs(Paper, { sx: { mb: 4, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }, children: [_jsxs(Box, { sx: { px: { xs: 2, md: 3 }, pt: { xs: 2, md: 3 }, pb: 1.5 }, children: [_jsx(Typography, { variant: "h6", fontWeight: 700, gutterBottom: true, children: "Upload New Template" }), _jsxs(Stack, { direction: { xs: 'column', sm: 'row' }, spacing: 2, alignItems: { sm: 'center' }, children: [_jsxs(Box, { children: [_jsx("input", { ref: fileRef, type: "file", accept: "image/*", style: { display: 'none' }, onChange: handleFileChange, id: "img-upload" }), _jsx("label", { htmlFor: "img-upload", children: _jsx(Button, { variant: "outlined", component: "span", startIcon: _jsx(AddPhotoAlternateIcon, {}), fullWidth: isMobile, children: file ? file.name.slice(0, 28) + (file.name.length > 28 ? '…' : '') : 'Choose Image' }) })] }), file && (_jsx(Typography, { variant: "caption", color: "success.main", fontWeight: 600, children: "\u2713 Image selected" }))] })] }), _jsx(Divider, {}), previewUrl ? (_jsx(EditorPanel, { imageUrl: previewUrl, templateName: name, onNameChange: setName, fields: fields, onFieldsChange: setFields, error: uploadErr, actions: _jsx(Button, { variant: "contained", size: "large", startIcon: uploading ? _jsx(CircularProgress, { size: 18, color: "inherit" }) : _jsx(CloudUploadIcon, {}), onClick: handleUpload, disabled: uploading || !name.trim(), fullWidth: isMobile, sx: { px: 4 }, children: uploading ? 'Uploading…' : 'Upload Template' }) })) : (_jsx(Box, { sx: { p: { xs: 2, md: 3 }, pt: 2 }, children: _jsx(Typography, { variant: "body2", color: "text.secondary", children: "Choose an image above to start placing text fields." }) }))] }), _jsxs(Typography, { variant: "h6", fontWeight: 700, gutterBottom: true, children: ["Saved Templates (", templates.length, ")"] }), listError && _jsx(Alert, { severity: "error", sx: { mb: 2 }, children: listError }), loading ? (_jsx(Box, { display: "flex", justifyContent: "center", py: 6, children: _jsx(CircularProgress, {}) })) : templates.length === 0 ? (_jsx(Paper, { sx: { p: 6, textAlign: 'center', border: '2px dashed', borderColor: 'divider' }, children: _jsx(Typography, { color: "text.secondary", children: "No templates yet. Upload one above." }) })) : (_jsx(Grid, { container: true, spacing: 2, children: templates.map(t => (_jsx(Grid, { item: true, xs: 12, sm: 6, md: 4, lg: 3, children: _jsxs(Paper, { variant: "outlined", sx: { overflow: 'hidden', transition: 'box-shadow .2s', '&:hover': { boxShadow: 4 } }, children: [_jsxs(Box, { sx: { position: 'relative', bgcolor: '#f5f5f5' }, children: [_jsx(Box, { component: "img", src: t.imageUrl, alt: t.name, sx: { width: '100%', height: 160, objectFit: 'cover', display: 'block' } }), _jsxs(Box, { sx: { position: 'absolute', top: 6, right: 6, display: 'flex', gap: 0.5 }, children: [_jsx(IconButton, { size: "small", sx: { bgcolor: 'white', boxShadow: 1 }, onClick: () => openEdit(t), children: _jsx(EditIcon, { fontSize: "small" }) }), _jsx(IconButton, { size: "small", sx: { bgcolor: 'white', boxShadow: 1 }, onClick: () => remove(t.id), children: _jsx(DeleteIcon, { fontSize: "small", color: "error" }) })] })] }), _jsxs(Box, { p: 1.5, children: [_jsx(Typography, { fontWeight: 700, noWrap: true, title: t.name, children: t.name }), _jsxs(Box, { display: "flex", gap: 0.5, mt: 0.5, flexWrap: "wrap", children: [t.fields.map(f => _jsx(Chip, { label: f.label, size: "small", variant: "outlined" }, f.id)), t.fields.length === 0 && (_jsx(Typography, { variant: "caption", color: "text.secondary", children: "No fields" }))] }), _jsx(Typography, { variant: "caption", color: "text.secondary", display: "block", mt: 0.5, children: new Date(t.createdAt).toLocaleDateString() })] })] }) }, t.id))) })), _jsx(Snackbar, { open: !!snack, autoHideDuration: 3000, onClose: () => setSnack(''), message: snack, anchorOrigin: { vertical: 'bottom', horizontal: 'center' } })] }));
}
