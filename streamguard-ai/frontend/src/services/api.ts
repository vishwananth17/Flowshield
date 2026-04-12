import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL + '/api/v1' : 'http://localhost:8000/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  }
});

import { toast } from 'sonner';

api.interceptors.response.use(
  (response) => {
    const remaining = response.headers['x-ratelimit-remaining'];
    const limit = response.headers['x-ratelimit-limit'];
    
    if (remaining !== undefined && limit !== undefined) {
      const remainingNum = parseInt(remaining);
      const limitNum = parseInt(limit);
      const usedPercent = ((limitNum - remainingNum) / limitNum) * 100;

      if (usedPercent >= 100) {
        toast.error("Monthly request limit reached. Upgrade to continue.", { id: 'rate-limit-100' });
      } else if (usedPercent >= 80) {
        toast.warning("You've used 80% of your monthly requests. Upgrade to avoid interruption.", { id: 'rate-limit-80' });
      }
    }
    return response;
  },
  async (error) => {
    if (error.response?.status === 429) {
      toast.error(error.response.data.error?.message || "Rate limit exceeded");
    }
    const originalRequest = error.config;
    
    // If unauthorized, and not already retrying, and not a login/refresh request
    const isAuthPath = originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/refresh');
    
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthPath) {
      originalRequest._retry = true;
      try {
        await api.post('/auth/refresh');
        return api(originalRequest);
      } catch (e) {
        useAuthStore.getState().logout();
        return Promise.reject(e);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
