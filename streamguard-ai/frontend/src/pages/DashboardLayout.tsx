import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import {
  LayoutDashboard,
  Activity,
  AlertTriangle,
  BarChart3,
  Key,
  Users,
  Settings,
  Bell,
  Search,
  LogOut,
  CreditCard,
  Menu,
  X,
  Plug2,
  Shield,
  Sliders,
  ChevronRight,
  SlidersHorizontal,
  Wifi
} from 'lucide-react';
import { useAlertStore } from '@/stores/alertStore';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export default function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isApiStatusOpen, setIsApiStatusOpen] = useState(false);
  const { user, organization, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  // Close sidebar on path change (mobile)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  // Global WebSocket connection
  useWebSocket();

  // Dynamic alerts count
  const unreadAlertsCount = useAlertStore((state) => state.unreadCount);

  // Dynamic open disputes count
  const [disputesCount, setDisputesCount] = useState(3);

  useEffect(() => {
    const checkDisputes = async () => {
      try {
        const api = (await import('@/services/api')).default;
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

  const orgPlan = organization?.plan || 'starter';
  const planBadgeText = orgPlan.toUpperCase();

  // Breadcrumb calculation
  const getBreadcrumb = () => {
    const p = location.pathname;
    if (p.includes('/dashboard/disputes')) return 'Disputes / Live Queue';
    if (p.includes('/dashboard/transactions')) return 'Transactions / Feed';
    if (p.includes('/dashboard/alerts')) return 'Alerts / Incident Triage';
    if (p.includes('/dashboard/analytics')) return 'Analytics / Intelligence';
    if (p.includes('/dashboard/api-keys')) return 'Developers / API Keys';
    if (p.includes('/dashboard/integrations')) return 'Settings / Integrations';
    if (p.includes('/dashboard/team')) return 'Organization / Team';
    if (p.includes('/dashboard/billing')) return 'Organization / Billing';
    if (p.includes('/dashboard/settings')) return 'Settings / Preferences';
    return 'Dashboard / Overview';
  };

  const navGroups = [
    {
      group: 'DETECTION',
      items: [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Transactions', path: '/dashboard/transactions', icon: Activity },
        { name: 'Alerts', path: '/dashboard/alerts', icon: AlertTriangle, badge: unreadAlertsCount > 0 ? unreadAlertsCount : null, isUrgent: true },
      ],
    },
    {
      group: 'DEFENSE',
      items: [
        { name: 'Disputes', path: '/dashboard/disputes', icon: Shield, badge: disputesCount > 0 ? disputesCount : null, isUrgent: false },
        { name: 'Evidence Hub', path: '/dashboard/integrations', icon: Plug2 },
      ],
    },
    {
      group: 'INTELLIGENCE',
      items: [
        { name: 'Analytics', path: '/dashboard/analytics', icon: BarChart3 },
        { name: 'Rule Builder', path: '/dashboard/api-keys', icon: Sliders },
      ],
    },
    {
      group: 'SETTINGS',
      items: [
        { name: 'Team', path: '/dashboard/team', icon: Users },
        { name: 'Plans & Billing', path: '/dashboard/billing', icon: CreditCard },
        { name: 'Settings', path: '/dashboard/settings', icon: Settings },
      ],
    },
  ];

  return (
    <div className="flex h-screen bg-surface-100 text-text-primary overflow-hidden font-sans">
      
      {/* Mobile Backdrop Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-surface-000/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* =========================================================================
          1. SIDEBAR (220px Width Desktop)
          ========================================================================= */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[220px] bg-surface-200 border-r border-border-200 flex flex-col justify-between transform transition-transform duration-normal ease-out-expo lg:relative lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top: Logo & Org Wordmark */}
        <div className="p-4 border-b border-border-100 flex items-center justify-between">
          <Link to="/" className="space-y-0.5 select-none block">
            <div className="flex items-center space-x-1">
              <span className="font-semibold text-sm tracking-tight text-text-primary">Flowshield</span>
              <span className="text-cyan-500 font-bold text-sm">/</span>
              <span className="font-semibold text-sm tracking-tight text-text-primary">AI</span>
            </div>
            <div className="text-[11px] font-normal text-text-tertiary truncate max-w-[170px]">
              {organization?.name || 'Production Workspace'}
            </div>
          </Link>

          <button
            type="button"
            className="lg:hidden text-text-tertiary hover:text-text-primary p-1"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Center: Categorized Nav Groups */}
        <div className="flex-1 overflow-y-auto px-2.5 py-4 space-y-5">
          {navGroups.map((grp) => (
            <div key={grp.group} className="space-y-1">
              <div className="type-label text-[10px] text-text-tertiary px-3 mb-1.5 font-bold tracking-wider">
                {grp.group}
              </div>
              {grp.items.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`h-[34px] flex items-center justify-between text-[13px] font-medium rounded-sm transition-all duration-fast select-none ${
                      isActive
                        ? 'bg-cyan-500/[0.08] text-cyan-400 border-l-2 border-cyan-500 pl-[10px] pr-3'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-400 px-3'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 truncate">
                      <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-cyan-400' : 'text-text-tertiary'}`} />
                      <span className="truncate">{item.name}</span>
                    </div>

                    {item.badge !== null && item.badge !== undefined && (
                      <span
                        className={`h-[18px] min-w-[18px] px-1 flex items-center justify-center rounded text-[10px] font-mono font-bold ${
                          item.isUrgent
                            ? 'bg-status-block text-surface-000'
                            : 'bg-surface-600 text-text-primary'
                        }`}
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

        {/* Bottom: User Profile Widget & Danger Logout */}
        <div className="p-3 border-t border-border-100 bg-surface-200 space-y-2">
          
          <div className="flex items-center justify-between px-2 py-1.5 rounded-sm hover:bg-surface-300 transition-colors">
            <div className="flex items-center space-x-2.5 truncate">
              <div className="w-7 h-7 rounded-sm bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-bold text-xs flex items-center justify-center flex-shrink-0">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="truncate">
                <div className="text-xs font-semibold text-text-primary truncate">
                  {user?.full_name || user?.email?.split('@')[0] || 'Operator'}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono font-bold text-cyan-400">
                    {planBadgeText}
                  </span>
                </div>
              </div>
            </div>

            <Link to="/dashboard/settings" title="Settings" className="text-text-tertiary hover:text-text-primary p-1">
              <Settings className="w-3.5 h-3.5" />
            </Link>
          </div>

          <button
            onClick={logout}
            className="w-full h-7 flex items-center justify-center gap-1.5 text-xs text-text-tertiary hover:text-status-block hover:bg-status-block/[0.06] rounded-sm transition-colors duration-fast font-medium"
          >
            <LogOut className="w-3 h-3" />
            <span>Sign out</span>
          </button>

        </div>
      </aside>

      {/* =========================================================================
          2. MAIN CONTENT AREA & TOPBAR (52px Height)
          ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Topbar */}
        <header className="h-[52px] border-b border-border-100 bg-transparent flex items-center justify-between px-4 sm:px-6 z-30">
          
          {/* Left: Mobile Toggle & Breadcrumb */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden text-text-secondary hover:text-text-primary p-1"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-[14px] font-semibold text-text-primary font-display">
              {getBreadcrumb()}
            </span>
          </div>

          {/* Center: Global Search Bar */}
          <div className="hidden md:flex items-center w-[320px] relative">
            <Search className="w-3.5 h-3.5 text-text-tertiary absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search transactions, disputes..."
              className="w-full h-8 bg-surface-200/70 border border-transparent focus:border-border-300 focus:bg-surface-300 rounded text-xs pl-8 pr-12 text-text-primary placeholder:text-text-tertiary focus:outline-none transition-all"
            />
            <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-text-tertiary bg-surface-400 px-1.5 py-0.5 rounded-xs border border-border-200">
              ⌘K
            </kbd>
          </div>

          {/* Right: API Live Status Indicator, Alerts, & Avatar */}
          <div className="flex items-center space-x-3 text-xs">
            
            {/* API Live Telemetry Popover */}
            <div className="relative">
              <button
                onClick={() => setIsApiStatusOpen(!isApiStatusOpen)}
                className="flex items-center space-x-2 px-2.5 py-1 rounded-sm bg-surface-200 border border-border-200 hover:border-border-300 transition-colors text-text-secondary hover:text-text-primary font-mono text-[11px]"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-allow opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-status-allow" />
                </span>
                <span>API live</span>
              </button>

              {isApiStatusOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-surface-300 border border-border-200 rounded-lg p-3 shadow-lg z-50 space-y-2 text-xs font-mono animate-in fade-in duration-fast">
                  <div className="flex items-center justify-between border-b border-border-100 pb-2">
                    <span className="font-bold text-text-primary">Gateway Telemetry</span>
                    <span className="text-status-allow text-[10px]">● Operational</span>
                  </div>
                  <div className="space-y-1 text-text-tertiary text-[11px]">
                    <div className="flex justify-between">
                      <span>Median Latency</span>
                      <span className="text-text-primary font-semibold">43ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span>P99 Latency</span>
                      <span className="text-text-primary font-semibold">58ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Uptime (30d)</span>
                      <span className="text-text-primary font-semibold">99.98%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Region</span>
                      <span className="text-text-primary font-semibold">ap-south-1 (Mumbai)</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Alert Notification Bell */}
            <Link
              to="/dashboard/alerts"
              className="p-1.5 text-text-tertiary hover:text-text-primary rounded-sm hover:bg-surface-300 transition-colors relative"
              title="Alerts"
            >
              <Bell className="w-4 h-4" />
              {unreadAlertsCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-status-block" />
              )}
            </Link>

            {/* Quick Profile Initials */}
            <Link to="/dashboard/settings" className="w-7 h-7 rounded-sm bg-surface-400 border border-border-300 flex items-center justify-center font-bold text-xs text-text-primary hover:border-cyan-500 transition-colors">
              {user?.email?.charAt(0).toUpperCase() || 'O'}
            </Link>

          </div>

        </header>

        {/* Dynamic Nested Route Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-surface-100">
          <div className="max-w-7xl mx-auto space-y-8">
            <Outlet />
          </div>
        </main>

      </div>

    </div>
  );
}
