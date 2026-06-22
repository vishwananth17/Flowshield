import { create } from 'zustand';
import api from '../services/api';

export interface User {
  id: string;
  email: string;
  full_name?: string;
  role: string;
  org_id: string;
  created_at?: string;
}

export interface Organization {
  id: string;
  name: string;
  plan: string;
  created_at?: string;
}

interface AuthStore {
  user: User | null;
  organization: Organization | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  checkAuth: () => Promise<void>;
  login: (credentials: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  organization: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,

  refreshUser: async () => {
    try {
      const res = await api.get('/auth/me');
      const token = res.data.access_token;
      if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
      set({ 
        user: res.data.user, 
        organization: res.data.organization,
        accessToken: token || null
      });
    } catch (e) {
      console.error("Failed to refresh user data", e);
    }
  },

  checkAuth: async () => {
    try {
      // Refresh the access token from refresh token cookie on start
      try {
        const refreshRes = await api.post('/auth/refresh');
        const token = refreshRes.data.access_token;
        if (token) {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          set({ accessToken: token });
        }
      } catch (err) {
        // Safe to ignore if refresh cookie is missing or invalid on initial load
      }

      const res = await api.get('/auth/me');
      const token = res.data.access_token || get().accessToken;
      if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }

      set({ 
        user: res.data.user, 
        organization: res.data.organization,
        accessToken: token,
        isAuthenticated: true, 
        isLoading: false 
      });
    } catch (error) {
      api.defaults.headers.common['Authorization'] = '';
      set({ user: null, organization: null, accessToken: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async (credentials) => {
    set({ isLoading: true });
    try {
      const res = await api.post('/auth/login', credentials);
      const token = res.data.access_token;
      if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
      
      set({ 
        user: res.data.user, 
        organization: res.data.organization,
        accessToken: token,
        isAuthenticated: true,
        isLoading: false 
      });
    } catch (error) {
      api.defaults.headers.common['Authorization'] = '';
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (data) => {
    set({ isLoading: true });
    try {
      const res = await api.post('/auth/register', data);
      const token = res.data.access_token;
      if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }

      set({ 
        user: res.data.user, 
        organization: res.data.organization,
        accessToken: token,
        isAuthenticated: true,
        isLoading: false
      });
    } catch (error) {
      api.defaults.headers.common['Authorization'] = '';
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {}
    api.defaults.headers.common['Authorization'] = '';
    set({ user: null, organization: null, accessToken: null, isAuthenticated: false });
    
    // Prevent browser back after logout (Layer 15.5)
    window.history.pushState(null, '', '/login');
    window.addEventListener('popstate', () => {
      window.history.pushState(null, '', '/login');
    });
  }
}));
