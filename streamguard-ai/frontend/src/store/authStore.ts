import { create } from 'zustand';
import api from '../services/api';

export interface User {
  id: string;
  email: string;
  full_name?: string;
  role: string;
  org_id: string;
}

export interface Organization {
  id: string;
  name: string;
  plan: string;
}

interface AuthStore {
  user: User | null;
  organization: Organization | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  checkAuth: () => Promise<void>;
  login: (credentials: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  organization: null,
  isAuthenticated: false,
  isLoading: true,

  checkAuth: async () => {
    try {
      const res = await api.get('/auth/me');
      set({ 
        user: res.data.user, 
        organization: res.data.organization,
        isAuthenticated: true, 
        isLoading: false 
      });
    } catch (error) {
      set({ user: null, organization: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async (credentials) => {
    const res = await api.post('/auth/login', credentials);
    set({ user: res.data.user, isAuthenticated: true });
    // Fetch further details if needed or handled in layout
  },

  register: async (data) => {
    const res = await api.post('/auth/register', data);
    set({ 
      user: res.data.user, 
      organization: res.data.organization,
      isAuthenticated: true 
    });
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {}
    set({ user: null, organization: null, isAuthenticated: false });
  }
}));
