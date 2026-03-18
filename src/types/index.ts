export interface TextField {
  id: string
  label: string         // e.g. "Guest Name", "Date"
  key: string           // e.g. "name", "date"
  x: number             // % of image width
  y: number             // % of image height
  fontSize: number      // px
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
  filename: string
  imageUrl: string
  fields: TextField[]
  createdAt: string
}

export type FieldValues = Record<string, string>
