import axios from 'axios';

const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

export const API_BASE_URL: string = isLocal ? 'http://localhost:8000/api/v1' : 'https://flowshield-backend-ani8.onrender.com/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  xsrfCookieName: 'flowshield_csrf',
  xsrfHeaderName: 'X-CSRF-Token',
  headers: {
    'Content-Type': 'application/json',
  }
});

function getCsrfToken(): string {
  return document.cookie
    .split('; ')
    .find(row => row.startsWith('flowshield_csrf='))
    ?.split('=')[1] || '';
}

api.interceptors.request.use((config) => {
  if (!['GET','HEAD','OPTIONS'].includes(
    config.method?.toUpperCase() || ''
  )) {
    config.headers['X-CSRF-Token'] = getCsrfToken();
  }
  const token = localStorage.getItem('flowshield_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
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
    
    // 1. Silent handling for background network cold starts
    if (!error.response) {
      console.warn("⚠️ Network Latency/Cold Start detected at", originalRequest?.url);
    }

    // 2. Handle 401 Unauthorized Smarter
    const isAuthPath = originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/register') || originalRequest.url?.includes('/auth/refresh');
    const isPublicPage = ['/', '/login', '/register', '/docs', '/demo'].includes(window.location.pathname);
    
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthPath) {
      originalRequest._retry = true;
      try {
        const refreshRes = await api.post('/auth/refresh');
        if (refreshRes.data?.access_token) {
          localStorage.setItem('flowshield_token', refreshRes.data.access_token);
          originalRequest.headers['Authorization'] = `Bearer ${refreshRes.data.access_token}`;
          return api(originalRequest);
        }
      } catch (e) {
        console.warn("Session refresh attempt failed gracefully", e);
        return Promise.reject(e);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
