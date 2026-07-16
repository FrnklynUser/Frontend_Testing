import axios from 'axios';

const API_BASE_URL = 'https://gentle-tables-exist.loca.lt'; // URL Temporal de LocalTunnel

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'bypass-tunnel-reminder': 'true', // Salta la pantalla de recordatorio de LocalTunnel
  },
});

export const authService = {
  login: async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    return response.data;
  },
  register: async (username, password, name) => {
    const response = await api.post('/auth/register', { username, password, name });
    return response.data;
  },
};

export const predictService = {
  predict: async (username, file, clinicalData = {}) => {
    const formData = new FormData();
    formData.append('file', file);

    // Agregar datos clínicos opcionales si fueron proporcionados
    if (clinicalData.age !== undefined && clinicalData.age !== '')
      formData.append('age', clinicalData.age);
    if (clinicalData.gender !== undefined && clinicalData.gender !== '')
      formData.append('gender', clinicalData.gender);
    if (clinicalData.family_history !== undefined && clinicalData.family_history !== '')
      formData.append('family_history', clinicalData.family_history);
    if (clinicalData.sun_exposure !== undefined && clinicalData.sun_exposure !== '')
      formData.append('sun_exposure', clinicalData.sun_exposure);

    const response = await axios.post(`${API_BASE_URL}/predict?username=${username}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'bypass-tunnel-reminder': 'true', // Salta la pantalla de recordatorio de LocalTunnel
      },
    });
    return response.data;
  },
};

export const historyService = {
  getHistory: async (username) => {
    const response = await api.get(`/history/${username}`);
    return response.data.analyses;
  },
  deleteItem: async (username, analysisId) => {
    const response = await api.delete(`/history/${username}/${analysisId}`);
    return response.data;
  },
};

export default api;
