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

const getStoredUser = (): User | null => {
  try {
    const s = localStorage.getItem('flowshield_user');
    return s ? JSON.parse(s) : null;
  } catch { return null; }
};

const getStoredOrg = (): Organization | null => {
  try {
    const s = localStorage.getItem('flowshield_org');
    return s ? JSON.parse(s) : null;
  } catch { return null; }
};

const savedToken = typeof localStorage !== 'undefined' ? localStorage.getItem('flowshield_token') : null;
const savedUser = getStoredUser();
const savedOrg = getStoredOrg();

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: savedUser,
  organization: savedOrg,
  accessToken: savedToken,
  isAuthenticated: !!(savedToken || savedUser),
  isLoading: false,

  refreshUser: async () => {
    try {
      const res = await api.get('/auth/me');
      const token = res.data.access_token || get().accessToken;
      if (token) {
        localStorage.setItem('flowshield_token', token);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
      if (res.data.user) localStorage.setItem('flowshield_user', JSON.stringify(res.data.user));
      if (res.data.organization) localStorage.setItem('flowshield_org', JSON.stringify(res.data.organization));
      
      set({ 
        user: res.data.user || get().user, 
        organization: res.data.organization || get().organization,
        accessToken: token || null,
        isAuthenticated: true
      });
    } catch (e) {
      console.warn("Failed to refresh user data silently", e);
    }
  },

  checkAuth: async () => {
    const token = localStorage.getItem('flowshield_token') || get().accessToken;
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      set({ isAuthenticated: true, isLoading: false });
    }

    try {
      const res = await api.get('/auth/me');
      const freshToken = res.data.access_token || token;
      if (freshToken) {
        localStorage.setItem('flowshield_token', freshToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${freshToken}`;
      }
      if (res.data.user) localStorage.setItem('flowshield_user', JSON.stringify(res.data.user));
      if (res.data.organization) localStorage.setItem('flowshield_org', JSON.stringify(res.data.organization));

      set({ 
        user: res.data.user || get().user, 
        organization: res.data.organization || get().organization,
        accessToken: freshToken,
        isAuthenticated: true, 
        isLoading: false 
      });
    } catch (error) {
      // If we have a stored token/user in localStorage, do NOT log the user out on network glitches
      if (!localStorage.getItem('flowshield_token') && !get().user) {
        api.defaults.headers.common['Authorization'] = '';
        set({ user: null, organization: null, accessToken: null, isAuthenticated: false, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    }
  },

  login: async (credentials) => {
    set({ isLoading: true });
    try {
      const res = await api.post('/auth/login', credentials);
      const token = res.data.access_token;
      if (token) {
        localStorage.setItem('flowshield_token', token);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
      if (res.data.user) localStorage.setItem('flowshield_user', JSON.stringify(res.data.user));
      if (res.data.organization) localStorage.setItem('flowshield_org', JSON.stringify(res.data.organization));
      
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
        localStorage.setItem('flowshield_token', token);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
      if (res.data.user) localStorage.setItem('flowshield_user', JSON.stringify(res.data.user));
      if (res.data.organization) localStorage.setItem('flowshield_org', JSON.stringify(res.data.organization));

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
    localStorage.removeItem('flowshield_token');
    localStorage.removeItem('flowshield_user');
    localStorage.removeItem('flowshield_org');
    api.defaults.headers.common['Authorization'] = '';
    set({ user: null, organization: null, accessToken: null, isAuthenticated: false });
    
    // Prevent browser back after logout
    window.history.pushState(null, '', '/login');
    window.addEventListener('popstate', () => {
      window.history.pushState(null, '', '/login');
    });
  }
}));
