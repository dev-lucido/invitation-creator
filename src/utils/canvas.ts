// src/utils/canvas.ts

import { Template, FieldValues } from '../types'

export async function renderInvitation(
  template: Template,
  values: FieldValues
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = template.imageUrl

    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')!

      ctx.drawImage(img, 0, 0)

      for (const field of template.fields) {
        const text = values[field.key] || ''
        if (!text) continue

        const px = (field.x / 100) * canvas.width
        const py = (field.y / 100) * canvas.height
        const maxW = (field.maxWidth / 100) * canvas.width

        const weight = field.bold ? 'bold' : 'normal'
        const style = field.italic ? 'italic' : 'normal'
        ctx.font = `${style} ${weight} ${field.fontSize}px "${field.fontFamily}", sans-serif`
        ctx.fillStyle = field.color
        ctx.textAlign = field.align
        ctx.textBaseline = 'top'

        // Word wrap
        const words = text.split(' ')
        const lines: string[] = []
        let current = ''
        for (const word of words) {
          const test = current ? `${current} ${word}` : word
          if (ctx.measureText(test).width > maxW && current) {
            lines.push(current)
            current = word
          } else {
            current = test
          }
        }
        if (current) lines.push(current)

        const lineHeight = field.fontSize * 1.3
        lines.forEach((line, i) => {
          ctx.fillText(line, px, py + i * lineHeight)
        })
      }

      canvas.toBlob(blob => {
        if (blob) resolve(blob)
        else reject(new Error('Canvas toBlob failed'))
      }, 'image/png')
    }

    img.onerror = reject
  })
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
