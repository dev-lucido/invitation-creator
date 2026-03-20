import axios from 'axios'
import { Template, TextField } from '../types'

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
  image: File,
  fields: TextField[]
): Promise<Template> => {
  const form = new FormData()
  form.append('name', name)
  form.append('image', image)
  form.append('fields', JSON.stringify(fields))
  return axios.post(`${BASE}/templates`, form, { headers: authHeaders() }).then(r => r.data)
}

export const updateTemplate = (
  id: string,
  data: { name?: string; fields?: TextField[] }
): Promise<Template> =>
  axios.put(`${BASE}/templates/${id}`, data, { headers: authHeaders() }).then(r => r.data)

export const deleteTemplate = (id: string): Promise<void> =>
  axios.delete(`${BASE}/templates/${id}`, { headers: authHeaders() }).then(r => r.data)