// src/utils/api.ts

import axios from 'axios'
import { Template, TextField, Language } from '../types'

const BASE = '/api'

function authHeaders(): Record<string, string> {
  try {
    const raw = sessionStorage.getItem('inviteforge_auth')
    if (!raw) return {}
    const { token } = JSON.parse(raw)
    return token ? { Authorization: `Bearer ${token}` } : {}
  } catch { return {} }
}

export const fetchTemplates = (): Promise<Template[]> =>
  axios.get(`${BASE}/templates`, { headers: authHeaders() }).then(r => r.data)

// langFields: per-language field arrays (serialised as fields_English, fields_Sinhala, etc.)
export const uploadTemplate = (
  name: string,
  langImages: Partial<Record<Language, File>>,
  langFields: Partial<Record<Language, TextField[]>>,
  fallbackFields: TextField[]
): Promise<Template> => {
  const form = new FormData()
  form.append('name', name)
  form.append('fields', JSON.stringify(fallbackFields))
  for (const [lang, file] of Object.entries(langImages)) {
    if (file) form.append(`image_${lang}`, file)
  }
  for (const [lang, fields] of Object.entries(langFields)) {
    if (fields) form.append(`fields_${lang}`, JSON.stringify(fields))
  }
  return axios.post(`${BASE}/templates`, form, { headers: authHeaders() }).then(r => r.data)
}

export const updateTemplate = (
  id: string,
  data: {
    name?: string
    fallbackFields?: TextField[]
    langFields?: Partial<Record<Language, TextField[]>>
    langImages?: Partial<Record<Language, File>>
  }
): Promise<Template> => {
  const form = new FormData()
  if (data.name) form.append('name', data.name)
  if (data.fallbackFields) form.append('fields', JSON.stringify(data.fallbackFields))
  if (data.langFields) {
    for (const [lang, fields] of Object.entries(data.langFields)) {
      if (fields) form.append(`fields_${lang}`, JSON.stringify(fields))
    }
  }
  if (data.langImages) {
    for (const [lang, file] of Object.entries(data.langImages)) {
      if (file) form.append(`image_${lang}`, file)
    }
  }
  return axios.put(`${BASE}/templates/${id}`, form, { headers: authHeaders() }).then(r => r.data)
}

export const deleteTemplate = (id: string): Promise<void> =>
  axios.delete(`${BASE}/templates/${id}`, { headers: authHeaders() }).then(r => r.data)