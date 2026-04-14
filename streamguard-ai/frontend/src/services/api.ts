import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const isProduction = window.location.hostname.includes('vercel.app') || window.location.hostname.includes('flowshieldai.com');
const defaultBaseURL = isProduction 
  ? 'https://flowshieldai-backend-production.up.railway.app' 
  : 'http://localhost:8000';

const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || defaultBaseURL) + '/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  }
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
