import axios from 'axios';

// Priority: VITE_API_URL env var → Render cloud (production) → localhost (fallback)
// This ensures local dev always hits the live Render backend via .env
const rawApiUrl = import.meta.env.VITE_API_URL || 'https://api.flowshieldai.com/api/v1';
export const API_BASE_URL: string = rawApiUrl.endsWith('/api/v1') ? rawApiUrl : `${rawApiUrl}/api/v1`;

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
  return config;
});

import { toast } from 'sonner';

api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // 1. Silent failure for non-critical network errors (e.g. cold starts)
    if (!error.response) {
      console.warn("⚠️ Network Latency/Cold Start detected at", originalRequest.url);
      // Suppress toast for background/GET requests to avoid annoying the user
      if (originalRequest.method !== 'get') {
        toast.error("Low-level connection error. Re-syncing...");
      }
    }

    // 2. Handle 401 Unauthorized Smarter
    const isAuthPath = originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/register') || originalRequest.url?.includes('/auth/refresh');
    const isPublicPage = ['/', '/login', '/register', '/docs', '/demo'].includes(window.location.pathname);
    
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthPath) {
      originalRequest._retry = true;
      try {
        await api.post('/auth/refresh');
        return api(originalRequest);
      } catch (e) {
        localStorage.removeItem('flowshield_token');
        // Only redirect if we are on a protected dashboard route
        if (!isPublicPage && window.location.pathname.startsWith('/dashboard')) {
          window.location.href = '/login';
        }
        return Promise.reject(e);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
