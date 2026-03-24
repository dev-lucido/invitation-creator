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

export const uploadTemplate = (
  name: string,
  langImages: Partial<Record<Language, File>>,
  fields: TextField[]
): Promise<Template> => {
  const form = new FormData()
  form.append('name', name)
  form.append('fields', JSON.stringify(fields))
  for (const [lang, file] of Object.entries(langImages)) {
    if (file) form.append(`image_${lang}`, file)
  }
  return axios.post(`${BASE}/templates`, form, { headers: authHeaders() }).then(r => r.data)
}

export const updateTemplate = (
  id: string,
  data: { name?: string; fields?: TextField[]; langImages?: Partial<Record<Language, File>> }
): Promise<Template> => {
  const form = new FormData()
  if (data.name) form.append('name', data.name)
  if (data.fields) form.append('fields', JSON.stringify(data.fields))
  if (data.langImages) {
    for (const [lang, file] of Object.entries(data.langImages)) {
      if (file) form.append(`image_${lang}`, file)
    }
  }
  return axios.put(`${BASE}/templates/${id}`, form, { headers: authHeaders() }).then(r => r.data)
}

export const deleteTemplate = (id: string): Promise<void> =>
  axios.delete(`${BASE}/templates/${id}`, { headers: authHeaders() }).then(r => r.data)