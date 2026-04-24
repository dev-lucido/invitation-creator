// src/types/index.ts

export type Language = 'English' | 'Sinhala' | 'Tamil'

export const LANGUAGES: Language[] = ['English', 'Sinhala', 'Tamil']

export interface LanguageVariant {
  lang: Language
  filename: string
  imageUrl: string
  fields?: TextField[]   // ← NEW: per-language fields
}

export interface TextField {
  id: string
  label: string
  key: string
  x: number
  y: number
  fontSize: number
  fontFamily: string
  color: string
  align: 'left' | 'center' | 'right'
  bold: boolean
  italic: boolean
  maxWidth: number
}

export interface Template {
  id: string
  name: string
  filename: string
  imageUrl: string
  variants: LanguageVariant[]
  fields: TextField[]   // kept as fallback/default
  createdAt: string
}

export type FieldValues = Record<string, string>

export function getVariantUrl(template: Template, lang: Language): string {
  const v = template.variants.find(v => v.lang === lang)
  return v ? v.imageUrl : template.imageUrl
}

// NEW: returns the fields for a specific language, falling back to template.fields
export function getVariantFields(template: Template, lang: Language): TextField[] {
  const v = template.variants.find(v => v.lang === lang)
  if (v?.fields && v.fields.length > 0) return v.fields
  return template.fields
}