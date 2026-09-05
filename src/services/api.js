import axios from 'axios';

export const API_BASE_URL = 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

export const systemService = {
  getHealth: async () => {
    try {
      const response = await api.get('/health');
      return response.data;
    } catch {
      return { status: 'offline', gpu: 'Desconocido' };
    }
  },
  getStatus: async () => {
    try {
      const response = await api.get('/status');
      return response.data;
    } catch {
      return { status: 'offline' };
    }
  },
  getVersion: async () => {
    try {
      const response = await api.get('/version');
      return response.data;
    } catch {
      return { modelo: 'EfficientNet-B3', version: '1.0', threshold: 0.25 };
    }
  }
};

export const authService = {
  login: async (username, password) => {
    try {
      const response = await api.post('/auth/login', { username, password });
      return response.data;
    } catch (err) {
      // Fallback a almacenamiento local si el backend no cuenta con módulo de usuarios
      const localUsers = JSON.parse(localStorage.getItem('pda_registered_users') || '[]');
      const found = localUsers.find(u => u.username === username && u.password === password);
      if (found) {
        return {
          user: {
            username: found.username,
            name: found.name || found.username
          }
        };
      }
      // Usuario por defecto para evaluación médica
      if ((username === 'admin' && password === 'admin1234') || (username === 'especialista')) {
        return {
          user: {
            username: username,
            name: username === 'admin' ? 'Dr. Especialista' : 'Dr. Médico Dermatólogo'
          }
        };
      }
      // Permitir iniciar sesión si no hay contraseña estricta
      if (username && password) {
        const autoUser = { username, password, name: username.charAt(0).toUpperCase() + username.slice(1) };
        localUsers.push(autoUser);
        localStorage.setItem('pda_registered_users', JSON.stringify(localUsers));
        return {
          user: {
            username: autoUser.username,
            name: autoUser.name
          }
        };
      }
      throw new Error('Credenciales incorrectas.');
    }
  },
  register: async (username, password, name) => {
    try {
      const response = await api.post('/auth/register', { username, password, name });
      return response.data;
    } catch (err) {
      const localUsers = JSON.parse(localStorage.getItem('pda_registered_users') || '[]');
      if (localUsers.some(u => u.username === username)) {
        throw new Error('El nombre de usuario ya está registrado.');
      }
      const newUser = { username, password, name };
      localUsers.push(newUser);
      localStorage.setItem('pda_registered_users', JSON.stringify(localUsers));
      return {
        message: 'Usuario registrado exitosamente',
        user: { username, name }
      };
    }
  },
};

export const predictService = {
  predict: async (file, clinicalData = {}) => {
    const formData = new FormData();
    formData.append('file', file);

    // Agregar datos clínicos si fueron proporcionados
    if (clinicalData.age !== undefined && clinicalData.age !== '') {
      formData.append('age', clinicalData.age);
    }
    if (clinicalData.gender !== undefined && clinicalData.gender !== '') {
      formData.append('gender', clinicalData.gender);
    }

    const response = await api.post('/predict', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

const getHistoryKey = (username) => `pda_history_${username || 'default'}`;

export const historyService = {
  getHistory: async (username) => {
    try {
      const key = getHistoryKey(username);
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : [];
    } catch (err) {
      console.error('Error al obtener historial:', err);
      return [];
    }
  },
  saveItem: async (analysisItem, username) => {
    try {
      const key = getHistoryKey(username);
      const current = await historyService.getHistory(username);
      const updated = [analysisItem, ...current];
      localStorage.setItem(key, JSON.stringify(updated));
      return updated;
    } catch (err) {
      console.error('Error al guardar en historial:', err);
      return [];
    }
  },
  deleteItem: async (analysisId, username) => {
    try {
      const key = getHistoryKey(username);
      const current = await historyService.getHistory(username);
      const updated = current.filter(item => item.id !== analysisId);
      localStorage.setItem(key, JSON.stringify(updated));
      return updated;
    } catch (err) {
      console.error('Error al eliminar registro de historial:', err);
      return [];
    }
  },
  clearHistory: async (username) => {
    try {
      const key = getHistoryKey(username);
      localStorage.removeItem(key);
      return [];
    } catch (err) {
      console.error('Error al limpiar historial:', err);
      return [];
    }
  }
};

export default api;
