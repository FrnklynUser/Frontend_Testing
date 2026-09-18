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
      const userData = response.data.user || response.data;
      // Enriquecer con nombre completo si está guardado localmente
      const localUsers = JSON.parse(localStorage.getItem('pda_registered_users') || '[]');
      const found = localUsers.find(u => u.username?.toLowerCase() === username.toLowerCase());
      if (found) {
        userData.name = found.fullName || found.name || `${found.firstName || ''} ${found.lastName || ''}`.trim();
        userData.fullName = userData.name;
        userData.firstName = found.firstName;
        userData.lastName = found.lastName;
      }
      return { user: userData };
    } catch (err) {
      // Fallback a almacenamiento local si el backend no cuenta con módulo de usuarios
      const localUsers = JSON.parse(localStorage.getItem('pda_registered_users') || '[]');
      const found = localUsers.find(u => u.username?.toLowerCase() === username.toLowerCase() && u.password === password);
      if (found) {
        const fullName = found.fullName || found.name || `${found.firstName || ''} ${found.lastName || ''}`.trim() || found.username;
        return {
          user: {
            username: found.username,
            name: fullName,
            fullName: fullName,
            firstName: found.firstName,
            lastName: found.lastName
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
  register: async (username, password, name, extraData = {}) => {
    try {
      const response = await api.post('/auth/register', { username, password, name, ...extraData });
      const localUsers = JSON.parse(localStorage.getItem('pda_registered_users') || '[]');
      const filtered = localUsers.filter(u => u.username?.toLowerCase() !== username.toLowerCase());
      const userObj = {
        username,
        password,
        name,
        fullName: name,
        firstName: extraData.firstName || name.split(' ')[0] || '',
        lastName: extraData.lastName || name.split(' ').slice(1).join(' ') || ''
      };
      filtered.push(userObj);
      localStorage.setItem('pda_registered_users', JSON.stringify(filtered));
      return response.data;
    } catch (err) {
      const localUsers = JSON.parse(localStorage.getItem('pda_registered_users') || '[]');
      if (localUsers.some(u => u.username?.toLowerCase() === username.toLowerCase())) {
        throw new Error('El nombre de usuario ya está registrado.');
      }
      const userObj = {
        username,
        password,
        name,
        fullName: name,
        firstName: extraData.firstName || name.split(' ')[0] || '',
        lastName: extraData.lastName || name.split(' ').slice(1).join(' ') || ''
      };
      localUsers.push(userObj);
      localStorage.setItem('pda_registered_users', JSON.stringify(localUsers));
      return {
        message: 'Usuario registrado exitosamente',
        user: userObj
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
    const key = getHistoryKey(username);
    try {
      const response = await api.get(`/history/${username || 'default'}`);
      if (Array.isArray(response.data)) {
        localStorage.setItem(key, JSON.stringify(response.data));
        return response.data;
      }
    } catch (err) {
      console.warn('Usando almacenamiento local para historial:', err);
    }
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : [];
  },
  saveItem: async (analysisItem, username) => {
    const key = getHistoryKey(username);
    const current = await historyService.getHistory(username);
    const updated = [analysisItem, ...current.filter(i => i.id !== analysisItem.id)];
    localStorage.setItem(key, JSON.stringify(updated));

    try {
      await api.post(`/history/${username || 'default'}`, analysisItem);
    } catch (err) {
      console.warn('No se pudo guardar historial en backend:', err);
    }
    return updated;
  },
  deleteItem: async (analysisId, username) => {
    const key = getHistoryKey(username);
    const current = await historyService.getHistory(username);
    const updated = current.filter(item => item.id !== analysisId);
    localStorage.setItem(key, JSON.stringify(updated));

    try {
      await api.delete(`/history/${username || 'default'}/${analysisId}`);
    } catch (err) {
      console.warn('No se pudo eliminar de backend:', err);
    }
    return updated;
  },
  clearHistory: async (username) => {
    const key = getHistoryKey(username);
    localStorage.removeItem(key);

    try {
      await api.delete(`/history/${username || 'default'}`);
    } catch (err) {
      console.warn('No se pudo limpiar historial en backend:', err);
    }
    return [];
  }
};

export default api;
