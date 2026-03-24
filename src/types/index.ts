export type Language = 'English' | 'Sinhala' | 'Tamil'

export const LANGUAGES: Language[] = ['English', 'Sinhala', 'Tamil']

export interface LanguageVariant {
  lang: Language
  filename: string
  imageUrl: string
}

export interface TextField {
  id: string
  label: string
  key: string
  x: number             // % of image width
  y: number             // % of image height
  fontSize: number
  fontFamily: string
  color: string
  align: 'left' | 'center' | 'right'
  bold: boolean
  italic: boolean
  maxWidth: number      // % of image width
}

export interface Template {
  id: string
  name: string
  // Legacy single-image support
  filename: string
  imageUrl: string
  // Per-language image variants
  variants: LanguageVariant[]
  fields: TextField[]
  createdAt: string
}

export type FieldValues = Record<string, string>

export function getVariantUrl(template: Template, lang: Language): string {
  const v = template.variants.find(v => v.lang === lang)
  return v ? v.imageUrl : template.imageUrl
}