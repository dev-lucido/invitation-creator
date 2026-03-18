import { useEffect, useState, useRef } from 'react'
import { Box } from '@mui/material'
import { Template, FieldValues } from '../types'

interface Props {
  template: Template
  values?: FieldValues
  onFieldClick?: (fieldId: string) => void
}

export default function TemplatePreview({ template, values = {}, onFieldClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [naturalSize, setNaturalSize] = useState({ w: 1, h: 1 })

  const imgUrl = template.imageUrl

  useEffect(() => {
    if (!imgUrl) return
    const img = new Image()
    img.onload = () => setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight })
    img.src = imgUrl
  }, [imgUrl])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const obs = new ResizeObserver(entries => {
      const w = entries[0].contentRect.width
      if (naturalSize.w > 0) setScale(w / naturalSize.w)
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [naturalSize.w])

  return (
    <Box
      ref={containerRef}
      sx={{ position: 'relative', width: '100%', userSelect: 'none', lineHeight: 0 }}
    >
      <Box
        component="img"
        src={imgUrl}
        alt={template.name}
        sx={{ width: '100%', display: 'block', borderRadius: 1 }}
      />

      {template.fields.map(field => {
        const text = values[field.key] || ''
        const displayText = text || `[${field.label}]`
        const isPlaceholder = !text
        const fontSize = field.fontSize * scale

        const translateX =
          field.align === 'center' ? '-50%' :
          field.align === 'right'  ? '-100%' : '0%'

        return (
          <Box
            key={field.id}
            onClick={() => onFieldClick?.(field.id)}
            sx={{
              position: 'absolute',
              left: `${field.x}%`,
              top: `${field.y}%`,
              transform: `translateX(${translateX})`,
              width: `${field.maxWidth}%`,
              fontSize: `${fontSize}px`,
              fontFamily: `"${field.fontFamily}", serif`,
              fontWeight: field.bold ? 700 : 400,
              fontStyle: field.italic ? 'italic' : 'normal',
              // Always use field.color — just reduce opacity for placeholder text
              color: field.color,
              opacity: isPlaceholder ? 0.45 : 1,
              textAlign: field.align,
              lineHeight: 1.3,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              cursor: onFieldClick ? 'pointer' : 'default',
              pointerEvents: onFieldClick ? 'auto' : 'none',
              '&:hover': onFieldClick ? {
                outline: '2px dashed rgba(99,102,241,0.7)',
                outlineOffset: 3,
                borderRadius: '2px',
              } : {},
            }}
          >
            {displayText}
          </Box>
        )
      })}
    </Box>
  )
}