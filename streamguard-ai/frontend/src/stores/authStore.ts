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
      set({ 
        user: res.data.user, 
        organization: res.data.organization 
      });
    } catch (e) {
      console.error("Failed to refresh user data", e);
    }
  },

  checkAuth: async () => {
    try {
      const res = await api.get('/auth/me');
      set({ 
        user: res.data.user, 
        organization: res.data.organization,
        accessToken: res.data.access_token,
        isAuthenticated: true, 
        isLoading: false 
      });
    } catch (error) {
      set({ user: null, organization: null, accessToken: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async (credentials) => {
    set({ isLoading: true });
    try {
      const res = await api.post('/auth/login', credentials);
      set({ 
        user: res.data.user, 
        organization: res.data.organization,
        accessToken: res.data.access_token,
        isAuthenticated: true,
        isLoading: false 
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (data) => {
    set({ isLoading: true });
    try {
      const res = await api.post('/auth/register', data);
      set({ 
        user: res.data.user, 
        organization: res.data.organization,
        accessToken: res.data.access_token,
        isAuthenticated: true,
        isLoading: false
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {}
    set({ user: null, organization: null, accessToken: null, isAuthenticated: false });
  }
}));

