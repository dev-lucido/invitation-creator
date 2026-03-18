import { useState, useEffect, useCallback } from 'react'
import { Template } from '../types'
import { fetchTemplates, deleteTemplate } from '../utils/api'

export function useTemplates() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchTemplates()
      setTemplates(data)
    } catch {
      setError('Failed to load templates')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const remove = useCallback(async (id: string) => {
    await deleteTemplate(id)
    setTemplates(prev => prev.filter(t => t.id !== id))
  }, [])

  return { templates, loading, error, reload: load, remove }
}
