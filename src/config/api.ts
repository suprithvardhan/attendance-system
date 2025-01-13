import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // Increase timeout to 30 seconds
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('token', token);
  } else {
    delete api.defaults.headers.common['Authorization'];
    localStorage.removeItem('token');
  }
};

export const login = async (username: string, password: string) => {
  const response = await api.post('/auth/login', { username, password });
  return response.data;
};

export const startAttendance = async (companyName: string, duration: number, location: { lat: number; lng: number }) => {
  try {
    if (!companyName?.trim()) {
      throw new Error('Company name is required');
    }

    if (!duration || duration <= 0) {
      throw new Error('Valid duration is required');
    }

    if (!location?.lat || !location?.lng) {
      throw new Error('Valid location is required');
    }

    const response = await api.post('/startAttendance', {
      companyName: companyName.trim(),
      duration: Number(duration),
      location: {
        lat: Number(location.lat),
        lng: Number(location.lng)
      }
    });
    return response.data;
  } catch (error: any) {
    console.error('Start attendance error:', error.response?.data || error);
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    } else if (error.response?.data?.details) {
      throw new Error(error.response.data.details);
    } else if (error.message) {
      throw new Error(error.message);
    } else {
      throw new Error('Failed to start attendance session');
    }
  }
};

export const stopAttendance = async () => {
  try {
    const response = await api.post('/stopAttendance');
    return response.data;
  } catch (error) {
    console.error('Error stopping attendance:', error);
    throw error;
  }
};

export const markAttendance = async (studentId: string, sessionId: string) => {
  const response = await api.post('/attendance/mark', { studentId, sessionId });
  return response.data;
};

