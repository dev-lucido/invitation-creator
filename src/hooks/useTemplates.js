import { useState, useEffect, useCallback } from 'react';
import { fetchTemplates, deleteTemplate } from '../utils/api';
export function useTemplates() {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchTemplates();
            setTemplates(data);
        }
        catch {
            setError('Failed to load templates');
        }
        finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => { load(); }, [load]);
    const remove = useCallback(async (id) => {
        await deleteTemplate(id);
        setTemplates(prev => prev.filter(t => t.id !== id));
    }, []);
    return { templates, loading, error, reload: load, remove };
}
