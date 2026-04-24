// src/components/FieldEditor.tsx

import { useState } from "react";
import {
  Box,
  Button,
  TextField as MuiTextField,
  Typography,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
  IconButton,
  Divider,
  Chip,
  Slider,
  Stack,
  Collapse,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { TextField } from "../types";

interface Props {
  fields: TextField[]
  onChange: (fields: TextField[]) => void
  imageWidth: number
  imageHeight: number
}

const FONTS = [
  "Georgia",
  "Times New Roman",
  "Palatino",
  "Garamond",
  "Arial",
  "Helvetica",
  "Trebuchet MS",
  "Verdana",
  "Courier New",
  "Impact",
];
const ALIGNS: ("left" | "center" | "right")[] = ["left", "center", "right"];

function newField(): TextField {
  return {
    id: `f_${Date.now()}`,
    label: "New Field",
    key: `field_${Date.now()}`,
    x: 50,
    y: 50,
    fontSize: 32,
    fontFamily: "Georgia",
    color: "#000000",
    align: "center",
    bold: false,
    italic: false,
    maxWidth: 80,
  };
}

export default function FieldEditor({ fields, onChange }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null)

  const add = () => {
    const f = newField()
    onChange([...fields, f])
    setExpanded(f.id)
  }

  const update = (id: string, patch: Partial<TextField>) =>
    onChange(fields.map(f => f.id === id ? { ...f, ...patch } : f))

  const remove = (id: string) => {
    onChange(fields.filter(f => f.id !== id))
    if (expanded === id) setExpanded(null)
  }

    

  return (
    <Box>
    
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        mb={2}
      >
        <Typography variant="subtitle1" fontWeight={700}>
          Text Fields
        </Typography>
        <Button
          startIcon={<AddIcon />}
          variant="outlined"
          size="small"
          onClick={add}
        >
          Add Field
        </Button>
      </Box>

      <Stack spacing={1.5}>
        {fields.map((field) => (
          <Paper key={field.id} variant="outlined" sx={{ overflow: "hidden" }}>
            {/* Header row */}
            <Box
              display="flex"
              alignItems="center"
              px={2}
              py={1}
              sx={{
                cursor: "pointer",
                bgcolor:
                  expanded === field.id ? "action.selected" : "transparent",
              }}
              onClick={() =>
                setExpanded(expanded === field.id ? null : field.id)
              }
            >
              <Chip
                label={field.label || "Unnamed"}
                size="small"
                sx={{ mr: 1, maxWidth: 120 }}
              />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ flex: 1 }}
                noWrap
              >
                {field.key} · {field.x.toFixed(0)}%,{field.y.toFixed(0)}%
              </Typography>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  remove(field.id);
                }}
                sx={{ mr: 0.5 }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
              {expanded === field.id ? (
                <ExpandLessIcon fontSize="small" />
              ) : (
                <ExpandMoreIcon fontSize="small" />
              )}
            </Box>

            <Collapse in={expanded === field.id}>
              <Box px={2} pb={2.5}>
                <Divider sx={{ mb: 2 }} />
                <Stack spacing={2.5}>
                  {/* Label + Key */}
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <MuiTextField
                      label="Label (shown to user)"
                      size="small"
                      fullWidth
                      value={field.label}
                      onChange={(e) =>
                        update(field.id, { label: e.target.value })
                      }
                    />
                    <MuiTextField
                      label="Key (unique ID)"
                      size="small"
                      fullWidth
                      value={field.key}
                      onChange={(e) =>
                        update(field.id, {
                          key: e.target.value.replace(/\s/g, "_"),
                        })
                      }
                    />
                  </Stack>

                  {/* X position */}
                  <Box>
                    <Typography variant="caption" gutterBottom display="block">
                      X Position (anchor point): <b>{field.x.toFixed(1)}%</b>
                    </Typography>
                    <Slider
                      min={0}
                      max={100}
                      step={0.5}
                      value={field.x}
                      onChange={(_, v) => update(field.id, { x: v as number })}
                    />
                  </Box>

                  {/* Y position */}
                  <Box>
                    <Typography variant="caption" gutterBottom display="block">
                      Y Position: <b>{field.y.toFixed(1)}%</b>
                    </Typography>
                    <Slider
                      min={0}
                      max={100}
                      step={0.5}
                      value={field.y}
                      onChange={(_, v) => update(field.id, { y: v as number })}
                    />
                  </Box>

                  {/* Max width */}
                  <Box>
                    <Typography variant="caption" gutterBottom display="block">
                      Text Block Width: <b>{field.maxWidth}%</b>
                    </Typography>
                    <Slider
                      min={10}
                      max={100}
                      step={1}
                      value={field.maxWidth}
                      onChange={(_, v) =>
                        update(field.id, { maxWidth: v as number })
                      }
                    />
                  </Box>

                  {/* Font size */}
                  <Box>
                    <Typography variant="caption" gutterBottom display="block">
                      Font Size: <b>{field.fontSize}px</b>
                    </Typography>
                    <Slider
                      min={8}
                      max={200}
                      step={1}
                      value={field.fontSize}
                      onChange={(_, v) =>
                        update(field.id, { fontSize: v as number })
                      }
                    />
                  </Box>

                  {/* Font + align */}
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <FormControl size="small" fullWidth>
                      <InputLabel>Font Family</InputLabel>
                      <Select
                        label="Font Family"
                        value={field.fontFamily}
                        onChange={(e) =>
                          update(field.id, { fontFamily: e.target.value })
                        }
                      >
                        {FONTS.map((f) => (
                          <MenuItem key={f} value={f} style={{ fontFamily: f }}>
                            {f}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl size="small" fullWidth>
                      <InputLabel>Align</InputLabel>
                      <Select
                        label="Align"
                        value={field.align}
                        onChange={(e) =>
                          update(field.id, {
                            align: e.target.value as
                              | "left"
                              | "center"
                              | "right",
                          })
                        }
                      >
                        {ALIGNS.map((a) => (
                          <MenuItem key={a} value={a}>
                            {a}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Stack>

                  {/* Color + Bold + Italic */}
                  <Stack
                    direction="row"
                    spacing={2}
                    alignItems="center"
                    flexWrap="wrap"
                  >
                    <Box>
                      <Typography
                        variant="caption"
                        display="block"
                        gutterBottom
                      >
                        Color
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1}>
                        <input
                          type="color"
                          value={field.color}
                          onChange={(e) =>
                            update(field.id, { color: e.target.value })
                          }
                          style={{
                            width: 40,
                            height: 34,
                            border: "none",
                            padding: 0,
                            cursor: "pointer",
                            borderRadius: 4,
                          }}
                        />
                        <Typography variant="caption">{field.color}</Typography>
                      </Box>
                    </Box>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={field.bold}
                          onChange={(e) =>
                            update(field.id, { bold: e.target.checked })
                          }
                          size="small"
                        />
                      }
                      label={
                        <Typography variant="body2" fontWeight={700}>
                          Bold
                        </Typography>
                      }
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={field.italic}
                          onChange={(e) =>
                            update(field.id, { italic: e.target.checked })
                          }
                          size="small"
                        />
                      }
                      label={
                        <Typography
                          variant="body2"
                          sx={{ fontStyle: "italic" }}
                        >
                          Italic
                        </Typography>
                      }
                    />
                  </Stack>
                </Stack>
              </Box>
            </Collapse>
          </Paper>
        ))}

        {fields.length === 0 && (
          <Typography
            variant="body2"
            color="text.secondary"
            align="center"
            py={3}
          >
            No fields yet. Click "Add Field" to start.
          </Typography>
        )}
      </Stack>
    </Box>
  );
}
