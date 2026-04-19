import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const isProduction = window.location.hostname.includes('vercel.app') || window.location.hostname.includes('flowshieldai.com');

const defaultBaseURL = isProduction 
  ? 'https://flowshield-backend-ani8.onrender.com' 
  : (window.location.hostname === '127.0.0.1' ? 'http://127.0.0.1:8002' : 'http://localhost:8002');

// Force the Render backend in production to override stale environment variables
export const API_BASE_URL = isProduction 
  ? 'https://flowshield-backend-ani8.onrender.com/api/v1' 
  : (import.meta.env.VITE_API_URL || defaultBaseURL);

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Automatically inject Bearer token from localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('flowshield_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

import { toast } from 'sonner';

api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Diagnostic logging
    if (!error.response) {
      console.error("❌ Network Error: Cannot reach backend at", originalRequest.baseURL);
      toast.error("Network Error: Backend unreachable. Check VITE_API_URL settings.");
    } else {
      console.error(`❌ API Error (${error.response.status}):`, error.response.data?.error?.message || error.message);
    }

    // Handle 401 Unauthorized
    const isAuthPath = originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/refresh');
    
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthPath) {
      originalRequest._retry = true;
      try {
        await api.post('/auth/refresh');
        return api(originalRequest);
      } catch (e) {
        if (useAuthStore.getState().user) {
          toast.error("Session expired. Please log in again.");
          useAuthStore.getState().logout();
        }
        return Promise.reject(e);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

