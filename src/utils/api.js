import axios from 'axios';
const BASE = '/api';
export const fetchTemplates = () => axios.get(`${BASE}/templates`).then(r => r.data);
export const uploadTemplate = (name, image, fields) => {
    const form = new FormData();
    form.append('name', name);
    form.append('image', image);
    form.append('fields', JSON.stringify(fields));
    return axios.post(`${BASE}/templates`, form).then(r => r.data);
};
export const updateTemplate = (id, data) => axios.put(`${BASE}/templates/${id}`, data).then(r => r.data);
export const deleteTemplate = (id) => axios.delete(`${BASE}/templates/${id}`).then(r => r.data);
