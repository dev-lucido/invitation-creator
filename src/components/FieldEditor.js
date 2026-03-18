import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Box, Button, TextField as MuiTextField, Typography, Paper, Select, MenuItem, FormControl, InputLabel, Checkbox, FormControlLabel, IconButton, Divider, Chip, Slider, Stack, Collapse } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
const FONTS = [
    'Georgia', 'Times New Roman', 'Palatino', 'Garamond',
    'Arial', 'Helvetica', 'Trebuchet MS', 'Verdana',
    'Courier New', 'Impact',
];
const ALIGNS = ['left', 'center', 'right'];
function newField() {
    return {
        id: `f_${Date.now()}`,
        label: 'New Field',
        key: `field_${Date.now()}`,
        x: 50,
        y: 50,
        fontSize: 32,
        fontFamily: 'Georgia',
        color: '#000000',
        align: 'center',
        bold: false,
        italic: false,
        maxWidth: 80,
    };
}
export default function FieldEditor({ fields, onChange }) {
    const [expanded, setExpanded] = useState(null);
    const add = () => {
        const f = newField();
        onChange([...fields, f]);
        setExpanded(f.id);
    };
    const update = (id, patch) => onChange(fields.map(f => f.id === id ? { ...f, ...patch } : f));
    const remove = (id) => {
        onChange(fields.filter(f => f.id !== id));
        if (expanded === id)
            setExpanded(null);
    };
    return (_jsxs(Box, { children: [_jsxs(Box, { display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2, children: [_jsx(Typography, { variant: "subtitle1", fontWeight: 700, children: "Text Fields" }), _jsx(Button, { startIcon: _jsx(AddIcon, {}), variant: "outlined", size: "small", onClick: add, children: "Add Field" })] }), _jsxs(Stack, { spacing: 1.5, children: [fields.map(field => (_jsxs(Paper, { variant: "outlined", sx: { overflow: 'hidden' }, children: [_jsxs(Box, { display: "flex", alignItems: "center", px: 2, py: 1, sx: {
                                    cursor: 'pointer',
                                    bgcolor: expanded === field.id ? 'action.selected' : 'transparent',
                                }, onClick: () => setExpanded(expanded === field.id ? null : field.id), children: [_jsx(Chip, { label: field.label || 'Unnamed', size: "small", sx: { mr: 1, maxWidth: 120 } }), _jsxs(Typography, { variant: "caption", color: "text.secondary", sx: { flex: 1 }, noWrap: true, children: [field.key, " \u00B7 ", field.x.toFixed(0), "%,", field.y.toFixed(0), "%"] }), _jsx(IconButton, { size: "small", onClick: e => { e.stopPropagation(); remove(field.id); }, sx: { mr: 0.5 }, children: _jsx(DeleteIcon, { fontSize: "small" }) }), expanded === field.id ? _jsx(ExpandLessIcon, { fontSize: "small" }) : _jsx(ExpandMoreIcon, { fontSize: "small" })] }), _jsx(Collapse, { in: expanded === field.id, children: _jsxs(Box, { px: 2, pb: 2.5, children: [_jsx(Divider, { sx: { mb: 2 } }), _jsxs(Stack, { spacing: 2.5, children: [_jsxs(Stack, { direction: { xs: 'column', sm: 'row' }, spacing: 2, children: [_jsx(MuiTextField, { label: "Label (shown to user)", size: "small", fullWidth: true, value: field.label, onChange: e => update(field.id, { label: e.target.value }) }), _jsx(MuiTextField, { label: "Key (unique ID)", size: "small", fullWidth: true, value: field.key, onChange: e => update(field.id, { key: e.target.value.replace(/\s/g, '_') }) })] }), _jsxs(Box, { children: [_jsxs(Typography, { variant: "caption", gutterBottom: true, display: "block", children: ["X Position (anchor point): ", _jsxs("b", { children: [field.x.toFixed(1), "%"] })] }), _jsx(Slider, { min: 0, max: 100, step: 0.5, value: field.x, onChange: (_, v) => update(field.id, { x: v }) })] }), _jsxs(Box, { children: [_jsxs(Typography, { variant: "caption", gutterBottom: true, display: "block", children: ["Y Position: ", _jsxs("b", { children: [field.y.toFixed(1), "%"] })] }), _jsx(Slider, { min: 0, max: 100, step: 0.5, value: field.y, onChange: (_, v) => update(field.id, { y: v }) })] }), _jsxs(Box, { children: [_jsxs(Typography, { variant: "caption", gutterBottom: true, display: "block", children: ["Text Block Width: ", _jsxs("b", { children: [field.maxWidth, "%"] })] }), _jsx(Slider, { min: 10, max: 100, step: 1, value: field.maxWidth, onChange: (_, v) => update(field.id, { maxWidth: v }) })] }), _jsxs(Box, { children: [_jsxs(Typography, { variant: "caption", gutterBottom: true, display: "block", children: ["Font Size: ", _jsxs("b", { children: [field.fontSize, "px"] })] }), _jsx(Slider, { min: 8, max: 200, step: 1, value: field.fontSize, onChange: (_, v) => update(field.id, { fontSize: v }) })] }), _jsxs(Stack, { direction: { xs: 'column', sm: 'row' }, spacing: 2, children: [_jsxs(FormControl, { size: "small", fullWidth: true, children: [_jsx(InputLabel, { children: "Font Family" }), _jsx(Select, { label: "Font Family", value: field.fontFamily, onChange: e => update(field.id, { fontFamily: e.target.value }), children: FONTS.map(f => (_jsx(MenuItem, { value: f, style: { fontFamily: f }, children: f }, f))) })] }), _jsxs(FormControl, { size: "small", fullWidth: true, children: [_jsx(InputLabel, { children: "Align" }), _jsx(Select, { label: "Align", value: field.align, onChange: e => update(field.id, { align: e.target.value }), children: ALIGNS.map(a => _jsx(MenuItem, { value: a, children: a }, a)) })] })] }), _jsxs(Stack, { direction: "row", spacing: 2, alignItems: "center", flexWrap: "wrap", children: [_jsxs(Box, { children: [_jsx(Typography, { variant: "caption", display: "block", gutterBottom: true, children: "Color" }), _jsxs(Box, { display: "flex", alignItems: "center", gap: 1, children: [_jsx("input", { type: "color", value: field.color, onChange: e => update(field.id, { color: e.target.value }), style: { width: 40, height: 34, border: 'none', padding: 0, cursor: 'pointer', borderRadius: 4 } }), _jsx(Typography, { variant: "caption", children: field.color })] })] }), _jsx(FormControlLabel, { control: _jsx(Checkbox, { checked: field.bold, onChange: e => update(field.id, { bold: e.target.checked }), size: "small" }), label: _jsx(Typography, { variant: "body2", fontWeight: 700, children: "Bold" }) }), _jsx(FormControlLabel, { control: _jsx(Checkbox, { checked: field.italic, onChange: e => update(field.id, { italic: e.target.checked }), size: "small" }), label: _jsx(Typography, { variant: "body2", sx: { fontStyle: 'italic' }, children: "Italic" }) })] })] })] }) })] }, field.id))), fields.length === 0 && (_jsx(Typography, { variant: "body2", color: "text.secondary", align: "center", py: 3, children: "No fields yet. Click \"Add Field\" to start." }))] })] }));
}
