// // src/utils/api.ts

// import axios from 'axios'
// import { Template, TextField, Language } from '../types'

// const BASE = '/api'

// function authHeaders(): Record<string, string> {
//   try {
//     const raw = sessionStorage.getItem('inviteforge_auth')
//     if (!raw) return {}
//     const { token } = JSON.parse(raw)
//     return token ? { Authorization: `Bearer ${token}` } : {}
//   } catch { return {} }
// }

// export const fetchTemplates = (): Promise<Template[]> =>
//   axios.get(`${BASE}/templates`, { headers: authHeaders() }).then(r => r.data)

// // langFields: per-language field arrays (serialised as fields_English, fields_Sinhala, etc.)
// export const uploadTemplate = (
//   name: string,
//   langImages: Partial<Record<Language, File>>,
//   langFields: Partial<Record<Language, TextField[]>>,
//   fallbackFields: TextField[]
// ): Promise<Template> => {
//   const form = new FormData()
//   form.append('name', name)
//   form.append('fields', JSON.stringify(fallbackFields))
//   for (const [lang, file] of Object.entries(langImages)) {
//     if (file) form.append(`image_${lang}`, file)
//   }
//   for (const [lang, fields] of Object.entries(langFields)) {
//     if (fields) form.append(`fields_${lang}`, JSON.stringify(fields))
//   }
//   return axios.post(`${BASE}/templates`, form, { headers: authHeaders() }).then(r => r.data)
// }

// export const updateTemplate = (
//   id: string,
//   data: {
//     name?: string
//     fallbackFields?: TextField[]
//     langFields?: Partial<Record<Language, TextField[]>>
//     langImages?: Partial<Record<Language, File>>
//   }
// ): Promise<Template> => {
//   const form = new FormData()
//   if (data.name) form.append('name', data.name)
//   if (data.fallbackFields) form.append('fields', JSON.stringify(data.fallbackFields))
//   if (data.langFields) {
//     for (const [lang, fields] of Object.entries(data.langFields)) {
//       if (fields) form.append(`fields_${lang}`, JSON.stringify(fields))
//     }
//   }
//   if (data.langImages) {
//     for (const [lang, file] of Object.entries(data.langImages)) {
//       if (file) form.append(`image_${lang}`, file)
//     }
//   }
//   return axios.put(`${BASE}/templates/${id}`, form, { headers: authHeaders() }).then(r => r.data)
// }

// export const deleteTemplate = (id: string): Promise<void> =>
//   axios.delete(`${BASE}/templates/${id}`, { headers: authHeaders() }).then(r => r.data)



















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

// ── User management ────────────────────────────────────────────────────────────
export interface AppUser {
  id: string
  username: string
  role: 'admin' | 'user'
  createdAt: string
  createdBy: string
}

export const fetchUsers = (): Promise<AppUser[]> =>
  axios.get(`${BASE}/users`, { headers: authHeaders() }).then(r => r.data)

export const createUser = (data: { username: string; password: string; role: 'admin' | 'user' }): Promise<AppUser> =>
  axios.post(`${BASE}/users`, data, { headers: authHeaders() }).then(r => r.data)

export const updateUser = (id: string, data: { username?: string; password?: string; role?: 'admin' | 'user' }): Promise<AppUser> =>
  axios.put(`${BASE}/users/${id}`, data, { headers: authHeaders() }).then(r => r.data)

export const deleteUser = (id: string): Promise<void> =>
  axios.delete(`${BASE}/users/${id}`, { headers: authHeaders() }).then(r => r.data)

// ── Activity tracking ──────────────────────────────────────────────────────────
export const trackEvent = (type: string, data: Record<string, unknown> = {}): Promise<void> =>
  axios.post(`${BASE}/track`, { type, ...data }, { headers: authHeaders() })
    .then(() => undefined)
    .catch(() => undefined) // fire-and-forget, never throw

// ── Stats ──────────────────────────────────────────────────────────────────────
export interface UserStat {
  username: string
  role: string
  createdAt: string | null
  loginCount: number
  downloadCount: number
  lastLogin: string | null
  lastActivity: string | null
  languages: Record<string, number>
  templates: Record<string, number>
}

export interface StatsResponse {
  summary: {
    totalUsers: number
    totalLogins: number
    totalDownloads: number
    activeUsers: number
  }
  userStats: UserStat[]
  languageTotals: Record<string, number>
  templateTotals: Record<string, number>
  dailyDownloads: Record<string, number>
  recentActivity: ActivityEvent[]
}

export interface ActivityEvent {
  id: string
  type: string
  username: string
  role: string
  timestamp: string
  language?: string
  templateName?: string
  ip?: string
}

export const fetchStats = (): Promise<StatsResponse> =>
  axios.get(`${BASE}/stats`, { headers: authHeaders() }).then(r => r.data)