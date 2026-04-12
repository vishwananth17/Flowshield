import { create } from 'zustand';
import api from '../services/api';

interface Alert {
  id: string;
  transaction_id: string | null;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'in_review' | 'resolved' | 'false_positive';
  title: string;
  description: string;
  created_at: string;
  amount: number;
  currency: string;
  merchant_name: string;
  risk_score: number;
}

interface AlertStats {
  open: number;
  in_review: number;
  resolved_today: number;
  false_positives_today: number;
  critical: number;
  high: number;
  medium: number;
  avg_resolution_time_minutes: number;
}

interface AlertStore {
  alerts: Alert[];
  total: number;
  unreadCount: number;
  stats: AlertStats | null;
  isLoading: boolean;
  
  fetchAlerts: (status?: string, severity?: string, page?: number) => Promise<void>;
  fetchStats: () => Promise<void>;
  updateAlertStatus: (alertId: string, status: string, note?: string) => Promise<void>;
  bulkAction: (alertIds: string[], action: string) => Promise<void>;
  addAlertFromSocket: (alert: Alert) => void;
}

export const useAlertStore = create<AlertStore>((set, get) => ({
  alerts: [],
  total: 0,
  unreadCount: 0,
  stats: null,
  isLoading: false,

  fetchAlerts: async (status = 'open', severity = 'all', page = 1) => {
    set({ isLoading: true });
    try {
      const response = await api.get('/alerts', {
        params: { status, severity, page }
      });
      set({ 
        alerts: response.data.alerts,
        total: response.data.total,
        unreadCount: response.data.unread_count,
        isLoading: false 
      });
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
      set({ isLoading: false });
    }
  },

  fetchStats: async () => {
    try {
      const response = await api.get('/alerts/stats');
      set({ stats: response.data });
    } catch (error) {
      console.error('Failed to fetch alert stats:', error);
    }
  },

  updateAlertStatus: async (alertId, status, note) => {
    try {
      await api.patch(`/alerts/${alertId}`, { status, note });
      // Optimistic update or refresh
      const { alerts } = get();
      set({
        alerts: alerts.map(a => a.id === alertId ? { ...a, status: status as any } : a)
      });
      get().fetchStats();
    } catch (error) {
      console.error('Failed to update alert status:', error);
      throw error;
    }
  },

  bulkAction: async (alertIds, action) => {
    try {
      await api.post('/alerts/bulk', { alert_ids: alertIds, action });
      get().fetchAlerts();
      get().fetchStats();
    } catch (error) {
      console.error('Failed to perform bulk action:', error);
      throw error;
    }
  },

  addAlertFromSocket: (alert) => {
    const { alerts, unreadCount } = get();
    // Prepend if it matches current view (simplified)
    set({
      alerts: [alert, ...alerts].slice(0, 50),
      unreadCount: unreadCount + 1
    });
  }
}));
