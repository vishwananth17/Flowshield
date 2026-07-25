import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Shield, 
  Activity, 
  AlertTriangle, 
  BarChart3, 
  Key, 
  Users, 
  CreditCard, 
  Plug2,
  BookOpen,
  Settings,
  ChevronLeft,
  ChevronRight,
  Gavel,
  FileSpreadsheet,
  BrainCircuit,
  Radio
} from 'lucide-react';
import Logo from './Logo';
import { ThemeToggle } from './ui/ThemeToggle';
import { useAuthStore } from '@/stores/authStore';
import { useAlertStore } from '@/stores/alertStore';
import api from '@/services/api';

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, organization } = useAuthStore();
  const location = useLocation();

  const unreadCount = useAlertStore(state => state.unreadCount);
  const [disputesCount, setDisputesCount] = useState(0);

  useEffect(() => {
    const checkDisputes = async () => {
      try {
        const res = await api.get('/disputes');
        const openCount = res.data.filter((d: any) => d.status === 'open' || d.status === 'evidence_gathering').length;
        setDisputesCount(openCount);
      } catch (e) {
        // silent
      }
    };
    checkDisputes();
    const interval = setInterval(checkDisputes, 60_000);
    return () => clearInterval(interval);
  }, []);

  const orgPlan = organization?.plan || 'free';
  const planLabel = {
    free:     'FREE',
    basic:    'BASIC',
    standard: 'GROWTH',
    growth:   'GROWTH',
    premium:  'PRO',
    enterprise: 'ENT',
  }[orgPlan] ?? orgPlan.toUpperCase();

  const navigationGroups = [
    {
      title: 'Fraud Protection',
      items: [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Transactions', path: '/dashboard/transactions', icon: Activity },
        { name: 'Alerts', path: '/dashboard/alerts', icon: AlertTriangle, badge: unreadCount },
        { name: 'Rule Builder', path: '#', icon: Gavel },
      ]
    },
    {
      title: 'Dispute Defense',
      items: [
        { name: 'Disputes', path: '/dashboard/disputes', icon: Shield, badge: disputesCount },
        { name: 'Evidence Hub', path: '#', icon: FileSpreadsheet },
      ]
    },
    {
      title: 'Intelligence',
      items: [
        { name: 'Analytics', path: '/dashboard/analytics', icon: BarChart3 },
        { name: 'Fraud Intel', path: '#', icon: BrainCircuit },
      ]
    },
    {
      title: 'Settings',
      items: [
        { name: 'API Keys', path: '/dashboard/api-keys', icon: Key },
        { name: 'Webhooks', path: '#', icon: Radio },
        { name: 'Integrations', path: '/dashboard/integrations', icon: Plug2 },
        { name: 'Billing', path: '/dashboard/billing', icon: CreditCard },
        { name: 'Team', path: '/dashboard/team', icon: Users },
      ]
    }
  ];

  return (
    <div 
      className={`
        relative flex flex-col h-full
        bg-[var(--bg-surface)]
        border-r border-[var(--border-subtle)]
        transition-all duration-[var(--transition-normal)]
        ${isCollapsed ? 'w-16' : 'w-60'}
      `}
    >
      {/* Top Section: Logo + product name */}
      <div className="p-4 flex flex-col items-center border-b border-[var(--border-subtle)]">
        <Link to="/" className="flex items-center space-x-2 w-full justify-start overflow-hidden">
          <Logo size={28} iconSize={16} showText={!isCollapsed} />
        </Link>
      </div>

      {/* Middle Section: Navigation Items */}
      <div className="flex-1 overflow-y-auto py-4 px-2 space-y-4 no-scrollbar">
        {navigationGroups.map((group) => (
          <div key={group.title} className="space-y-1">
            {!isCollapsed && (
              <div className="px-3 py-1 text-[10px] font-bold font-[var(--font-display)] uppercase tracking-[var(--tracking-widest)] text-[var(--text-muted)]">
                {group.title}
              </div>
            )}
            {group.items.map((item) => {
              const isActive = location.pathname === item.path || (item.name === 'Disputes' && location.pathname.startsWith('/dashboard/disputes'));
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  title={isCollapsed ? item.name : undefined}
                  className={`
                    group relative flex items-center rounded-[var(--radius-md)] px-3 py-2 text-xs transition-all duration-[var(--transition-fast)]
                    ${isActive
                      ? 'bg-[var(--color-primary-muted)] border-l-2 border-[var(--color-primary)] text-[var(--text-gold)] font-medium'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]'
                    }
                  `}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {!isCollapsed && <span className="ml-3 flex-1 whitespace-nowrap">{item.name}</span>}
                  
                  {item.badge !== undefined && item.badge > 0 && (
                    <span 
                      className={`
                        absolute right-2 flex items-center justify-center
                        bg-[var(--color-danger)] text-white text-[10px] font-bold
                        rounded-full px-1 min-w-[18px] h-[18px]
                        ${item.name === 'Alerts' ? 'animate-pulse' : ''}
                        ${isCollapsed ? 'top-1 -right-1' : ''}
                      `}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Bottom section: User avatar + plan + settings + theme toggle */}
      <div className="p-3 border-t border-[var(--border-subtle)] bg-[var(--bg-inset)] space-y-3">
        <div className="flex items-center justify-between gap-2 overflow-hidden">
          <div className="flex items-center space-x-2 overflow-hidden">
            {/* Avatar Circle */}
            <div className="h-8 w-8 rounded-full bg-[var(--color-secondary)] border border-[var(--border-gold)] flex items-center justify-center text-xs font-mono font-bold text-white flex-shrink-0">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-[var(--text-primary)] truncate">
                  {user?.email?.split('@')[0]}
                </span>
                <span className="text-[9px] font-mono font-extrabold text-[var(--text-gold)] uppercase tracking-wider">
                  {planLabel} PLAN
                </span>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <Link to="/dashboard/settings" className="text-[var(--text-muted)] hover:text-white transition-colors">
              <Settings className="h-4 w-4" />
            </Link>
          )}
        </div>

        {/* Theme Toggle Button */}
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between px-1'}`}>
          {!isCollapsed && <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Appearance</span>}
          <ThemeToggle />
        </div>
      </div>

      {/* Toggle Arrow Trigger */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="
          absolute -right-3 top-1/2 -translate-y-1/2
          w-6 h-6 rounded-full border border-[var(--border-default)]
          bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)]
          flex items-center justify-center text-[var(--text-secondary)] hover:text-white
          shadow-[var(--shadow-sm)] cursor-pointer z-50
        "
      >
        {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </div>
  );
}

export default Sidebar;
