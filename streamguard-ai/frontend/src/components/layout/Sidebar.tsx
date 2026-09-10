import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Activity,
  Radio,
  Brain,
  BarChart3,
  AlertTriangle,
  Sliders,
  Users,
  Plug2,
  Key,
  BookOpen,
  Zap,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  LogOut,
  FileText,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

export interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  unreadAlertsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  unreadAlertsCount = 2,
}) => {
  const location = useLocation();
  const { user, organization, logout } = useAuthStore();
  const { theme, toggleTheme } = useTheme();
  const [environment, setEnvironment] = useState<'LIVE' | 'SANDBOX'>('LIVE');

  const navGroups = [
    {
      group: 'MONITOR',
      items: [
        { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Transactions', path: '/dashboard/transactions', icon: Activity },
        { name: 'Live Feed', path: '/dashboard/live', icon: Radio },
      ],
    },
    {
      group: 'INTELLIGENCE',
      items: [
        { name: 'Risk Intelligence', path: '/dashboard/intelligence', icon: Brain },
        { name: 'Analytics', path: '/dashboard/analytics', icon: BarChart3 },
        {
          name: 'Alerts',
          path: '/dashboard/alerts',
          icon: AlertTriangle,
          badge: unreadAlertsCount > 0 ? unreadAlertsCount : null,
        },
      ],
    },
    {
      group: 'TOOLS',
      items: [
        { name: 'Risk Audit', path: '/dashboard/audit', icon: FileText },
        { name: 'Rules', path: '/dashboard/rules', icon: Sliders },
        { name: 'Disputes', path: '/dashboard/disputes', icon: Users },
        { name: 'Integrations', path: '/dashboard/integrations', icon: Plug2 },
      ],
    },
    {
      group: 'DEVELOPER',
      items: [
        { name: 'API', path: '/dashboard/api-keys', icon: Key },
        { name: 'Documentation', path: '/docs', icon: BookOpen },
        { name: 'Sandbox', path: '/dashboard/simulator', icon: Zap },
      ],
    },
  ];

  return (
    <aside
      className={cn(
        'fixed top-0 left-0 bottom-0 z-30 bg-[var(--surface-page)] border-r border-[var(--border-default)] flex flex-col justify-between select-none transition-[width] duration-slow ease-out-expo',
        isCollapsed ? 'w-[52px]' : 'w-[224px]'
      )}
    >
      {/* Top Half: Logo, Env Badge, Navigation */}
      <div className="flex flex-col min-h-0 flex-1">
        {/* 52px Logo Section */}
        <div className="h-[52px] px-4 border-b border-[var(--border-subtle)] flex items-center justify-between flex-shrink-0">
          <Link to="/" className="flex items-center gap-2 overflow-hidden">
            {isCollapsed ? (
              <span className="font-bold text-[16px] text-[var(--text-primary)] font-sans">
                F
              </span>
            ) : (
              <span className="font-bold text-[15px] text-[var(--text-primary)] tracking-tight font-sans">
                FlowShield
              </span>
            )}
          </Link>

          {!isCollapsed && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] p-1 rounded transition-colors"
              title="Collapse sidebar"
            >
              <ChevronLeft size={16} />
            </button>
          )}
        </div>

        {/* Environment Badge */}
        {!isCollapsed ? (
          <div className="px-4 py-2 border-b border-[var(--border-subtle)] flex items-center justify-between flex-shrink-0">
            <button
              type="button"
              onClick={() => setEnvironment(environment === 'LIVE' ? 'SANDBOX' : 'LIVE')}
              className="flex items-center gap-2 text-[10px] font-semibold tracking-wider uppercase text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              title="Click to switch environment"
            >
              <span
                className={cn(
                  'w-[6px] h-[6px] rounded-full flex-shrink-0',
                  environment === 'LIVE' ? 'bg-[#22C55E]' : 'bg-[#F59E0B]'
                )}
              />
              <span>{environment}</span>
            </button>
            <span className="text-[10px] text-[var(--text-tertiary)] font-mono">v1.2</span>
          </div>
        ) : (
          <div className="py-2 flex justify-center border-b border-[var(--border-subtle)]">
            <span
              className={cn(
                'w-[6px] h-[6px] rounded-full',
                environment === 'LIVE' ? 'bg-[#22C55E]' : 'bg-[#F59E0B]'
              )}
              title={`Environment: ${environment}`}
            />
          </div>
        )}

        {/* Scrollable Navigation Groups */}
        <nav className="flex-1 overflow-y-auto py-2 overflow-x-hidden">
          {navGroups.map((grp) => (
            <div key={grp.group} className="mb-3">
              {!isCollapsed && (
                <div className="px-4 pt-3 pb-1 text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                  {grp.group}
                </div>
              )}
              {grp.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  location.pathname === item.path ||
                  (item.path !== '/dashboard' && location.pathname.startsWith(item.path));

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    title={isCollapsed ? item.name : undefined}
                    className={cn(
                      'h-[32px] mx-2 my-[1px] flex items-center rounded-[var(--radius-sm)] text-[13px] font-medium transition-all duration-fast select-none',
                      isCollapsed ? 'justify-center px-0' : 'px-3 gap-2',
                      isActive
                        ? 'bg-[rgba(6,182,212,0.08)] text-[var(--brand-600)] border-l-2 border-[var(--brand-500)] pl-[10px]'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)]'
                    )}
                  >
                    <Icon
                      size={16}
                      className={cn(
                        'flex-shrink-0',
                        isActive ? 'text-[var(--brand-500)]' : 'text-[var(--text-tertiary)]'
                      )}
                    />
                    {!isCollapsed && <span className="truncate">{item.name}</span>}

                    {!isCollapsed && item.badge !== null && item.badge !== undefined && (
                      <span className="h-[18px] min-w-[18px] px-1.5 flex items-center justify-center rounded-full bg-[var(--surface-subtle)] border border-[var(--border-default)] text-[var(--text-secondary)] text-[10px] font-medium ml-auto font-mono">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* Bottom User / Settings / Collapse Section */}
      <div className="p-2 border-t border-[var(--border-subtle)] bg-[var(--surface-page)] flex-shrink-0 space-y-1">
        {/* User Row */}
        {!isCollapsed ? (
          <div className="flex items-center justify-between p-1.5 rounded-[var(--radius-sm)] hover:bg-[var(--surface-subtle)] transition-colors">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-[32px] h-[32px] rounded-full bg-[var(--surface-inset)] border border-[var(--border-default)] flex items-center justify-center font-bold text-[12px] text-[var(--text-primary)] flex-shrink-0">
                {user?.email?.charAt(0).toUpperCase() || 'V'}
              </div>
              <div className="min-w-0 leading-tight">
                <div className="text-[13px] font-semibold text-[var(--text-primary)] truncate">
                  {user?.full_name || 'Vishwanath'}
                </div>
                <div className="text-[11px] text-[var(--text-tertiary)] truncate">
                  {organization?.plan?.toUpperCase() || 'GROWTH'} PLAN
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={toggleTheme}
                className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] rounded transition-colors"
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
              </button>
              <Link
                to="/dashboard/settings"
                className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] rounded transition-colors"
                title="Settings"
              >
                <Settings size={14} />
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-1">
            <button
              type="button"
              onClick={toggleTheme}
              className="p-1.5 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] rounded transition-colors"
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <button
              type="button"
              onClick={onToggleCollapse}
              className="p-1.5 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] rounded transition-colors"
              title="Expand sidebar"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
