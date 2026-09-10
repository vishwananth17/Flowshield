import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Search, Bell, HelpCircle, Menu } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';

export interface TopBarProps {
  isSidebarCollapsed: boolean;
  onOpenMobileSidebar?: () => void;
  onOpenCommandPalette: () => void;
  unreadAlertsCount?: number;
}

export const TopBar: React.FC<TopBarProps> = ({
  isSidebarCollapsed,
  onOpenMobileSidebar,
  onOpenCommandPalette,
  unreadAlertsCount = 2,
}) => {
  const location = useLocation();
  const { user } = useAuthStore();

  // Dynamic semantic breadcrumb calculation
  const getBreadcrumb = () => {
    const path = location.pathname;
    if (path.includes('/dashboard/transactions/')) {
      const parts = path.split('/');
      return (
        <span className="flex items-center gap-2">
          <Link to="/dashboard/transactions" className="hover:underline text-[var(--text-secondary)]">
            Transactions
          </Link>
          <span className="text-[var(--text-tertiary)]">/</span>
          <span className="font-mono text-[var(--text-primary)]">{parts[parts.length - 1]}</span>
        </span>
      );
    }
    if (path.includes('/dashboard/transactions')) return 'Transactions';
    if (path.includes('/dashboard/live')) return 'Live Feed';
    if (path.includes('/dashboard/intelligence')) return 'Risk Intelligence';
    if (path.includes('/dashboard/disputes')) return 'Disputes';
    if (path.includes('/dashboard/rules')) return 'Rules';
    if (path.includes('/dashboard/analytics')) return 'Analytics';
    if (path.includes('/dashboard/alerts')) return 'Alerts';
    if (path.includes('/dashboard/api-keys')) return 'Developers / API Keys';
    if (path.includes('/dashboard/integrations')) return 'Integrations';
    if (path.includes('/dashboard/simulator')) return 'Sandbox / Simulator';
    if (path.includes('/dashboard/settings')) return 'Settings';
    return 'Overview';
  };

  return (
    <header
      className={cn(
        'h-[48px] fixed top-0 right-0 z-20 bg-[var(--surface-page)] border-b border-[var(--border-subtle)] flex items-center justify-between px-4 sm:px-6 transition-[left] duration-slow ease-out-expo select-none',
        isSidebarCollapsed ? 'left-[52px]' : 'left-[224px]'
      )}
    >
      {/* Left: Mobile Toggle & Breadcrumb */}
      <div className="flex items-center gap-3">
        {onOpenMobileSidebar && (
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            className="lg:hidden p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded"
          >
            <Menu size={18} />
          </button>
        )}
        <div className="text-[14px] font-medium text-[var(--text-primary)]">
          {getBreadcrumb()}
        </div>
      </div>

      {/* Center: Global Search Bar */}
      <div className="hidden md:flex items-center w-[280px]">
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="w-full h-[32px] px-3 bg-[var(--surface-secondary)] border border-[var(--border-default)] hover:border-[var(--border-strong)] rounded-[var(--radius-sm)] flex items-center justify-between text-[13px] text-[var(--text-tertiary)] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Search size={14} />
            <span>Search...</span>
          </div>
          <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--surface-subtle)] border border-[var(--border-subtle)] text-[var(--text-secondary)]">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right: Action Cluster */}
      <div className="flex items-center gap-1">
        {/* Notification Bell */}
        <Link
          to="/dashboard/alerts"
          className="w-[32px] h-[32px] rounded-[var(--radius-sm)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-colors relative"
          title="Alerts"
        >
          <Bell size={16} />
          {unreadAlertsCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-[6px] h-[6px] rounded-full bg-[var(--risk-high-dot)]" />
          )}
        </Link>

        {/* Documentation / Help */}
        <Link
          to="/docs"
          className="w-[32px] h-[32px] rounded-[var(--radius-sm)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-colors"
          title="Documentation"
        >
          <HelpCircle size={16} />
        </Link>

        {/* Avatar */}
        <Link
          to="/dashboard/settings"
          className="w-[32px] h-[32px] rounded-full bg-[var(--surface-inset)] border border-[var(--border-default)] flex items-center justify-center font-bold text-[12px] text-[var(--text-primary)] hover:border-[var(--border-focus)] transition-colors ml-1"
          title="User Profile"
        >
          {user?.email?.charAt(0).toUpperCase() || 'V'}
        </Link>
      </div>
    </header>
  );
};
