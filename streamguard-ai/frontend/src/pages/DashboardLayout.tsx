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
  ListFilter,
  SlidersHorizontal,
  Wifi,
  BookOpen,
  Zap,
  CheckCircle2,
  Clock,
  ExternalLink
} from 'lucide-react';
import { useAlertStore } from '@/stores/alertStore';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Logo } from '@/components/Logo';
import { toast } from 'sonner';

export default function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isApiStatusOpen, setIsApiStatusOpen] = useState(false);
  const [isTestMode, setIsTestMode] = useState(true);
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
    if (p.includes('/dashboard/radar/reviews')) return 'Radar / Review Queue';
    if (p.includes('/dashboard/radar/rules')) return 'Radar / Rules';
    if (p.includes('/dashboard/radar/lists')) return 'Radar / Lists';
    if (p.includes('/dashboard/radar/risk-controls')) return 'Radar / Risk Controls';
    if (p.includes('/dashboard/simulator')) return 'Defense / Attack Simulator';
    if (p.includes('/dashboard/disputes')) return 'Payments / Disputes';
    if (p.includes('/dashboard/transactions')) return 'Payments / Transactions';
    if (p.includes('/dashboard/alerts')) return 'Intelligence / Alerts';
    if (p.includes('/dashboard/analytics')) return 'Intelligence / Analytics';
    if (p.includes('/dashboard/api-keys')) return 'Developers / API Keys';
    if (p.includes('/dashboard/integrations')) return 'Settings / Integrations';
    if (p.includes('/dashboard/team')) return 'Organization / Team';
    if (p.includes('/dashboard/billing')) return 'Organization / Billing';
    if (p.includes('/dashboard/settings')) return 'Settings / Preferences';
    return 'Radar / Overview';
  };

  const navGroups = [
    {
      group: 'STRIPE RADAR',
      items: [
        { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Reviews', path: '/dashboard/radar/reviews', icon: Clock, badge: '4', isUrgent: false },
        { name: 'Rules', path: '/dashboard/radar/rules', icon: Sliders },
        { name: 'Lists', path: '/dashboard/radar/lists', icon: ListFilter },
        { name: 'Risk Controls', path: '/dashboard/radar/risk-controls', icon: SlidersHorizontal },
      ],
    },
    {
      group: 'PAYMENTS & DISPUTES',
      items: [
        { name: 'Transactions', path: '/dashboard/transactions', icon: Activity },
        { name: 'Disputes & Evidence', path: '/dashboard/disputes', icon: Shield, badge: disputesCount > 0 ? disputesCount : null, isUrgent: false },
        { name: 'Attack Simulator', path: '/dashboard/simulator', icon: Zap, badge: 'LIVE', isUrgent: false },
        { name: 'Evidence Hub', path: '/dashboard/integrations', icon: Plug2 },
      ],
    },
    {
      group: 'DEVELOPERS & SETTINGS',
      items: [
        { name: 'Analytics', path: '/dashboard/analytics', icon: BarChart3 },
        { name: 'API Keys', path: '/dashboard/api-keys', icon: Key },
        { name: 'Team', path: '/dashboard/team', icon: Users },
        { name: 'Plans & Billing', path: '/dashboard/billing', icon: CreditCard },
        { name: 'Settings', path: '/dashboard/settings', icon: Settings },
      ],
    },
  ];

  return (
    <div className="flex h-screen bg-[#F6F9FC] text-[#1A1F36] overflow-hidden font-sans">
      
      {/* Mobile Backdrop Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* =========================================================================
          1. STRIPE-STYLE SIDEBAR (230px Desktop)
          ========================================================================= */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[230px] bg-white border-r border-[#E3E8EE] flex flex-col justify-between transform transition-transform duration-normal ease-out-expo lg:relative lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top: Flowshield Logo & Workspace */}
        <div className="p-4 border-b border-[#E3E8EE] flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2.5 select-none group">
            <Logo size={28} withContainer={false} className="group-hover:scale-105 transition-transform" />
            <div className="space-y-0.5">
              <div className="flex items-center space-x-1">
                <span className="font-bold text-sm tracking-tight text-[#1A1F36]">Flowshield</span>
                <span className="text-[#635BFF] font-bold text-sm">/</span>
                <span className="font-bold text-xs uppercase tracking-wider text-[#635BFF] bg-[#EEF2FF] px-1 py-0.2 rounded">Radar</span>
              </div>
              <div className="text-[10px] text-[#697386] truncate max-w-[130px]">
                {organization?.name || 'Production Workspace'}
              </div>
            </div>
          </Link>

          <button
            type="button"
            className="lg:hidden text-[#697386] hover:text-[#1A1F36] p-1"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Center: Categorized Stripe Nav Groups */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navGroups.map((grp) => (
            <div key={grp.group} className="space-y-1">
              <div className="text-[10px] text-[#697386] px-2 mb-1.5 font-bold tracking-wider uppercase">
                {grp.group}
              </div>
              {grp.items.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`h-[32px] flex items-center justify-between text-[13px] rounded-md transition-colors select-none ${
                      isActive
                        ? 'bg-[#EEF2FF] text-[#635BFF] font-semibold px-2.5'
                        : 'text-[#4F566B] hover:text-[#1A1F36] hover:bg-[#F8FAFC] px-2.5 font-medium'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 truncate">
                      <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-[#635BFF]' : 'text-[#697386]'}`} />
                      <span className="truncate">{item.name}</span>
                    </div>

                    {item.badge !== null && item.badge !== undefined && (
                      <span
                        className={`h-[18px] min-w-[18px] px-1.5 flex items-center justify-center rounded text-[10px] font-mono font-bold ${
                          item.badge === 'LIVE'
                            ? 'bg-[#CBF4C9] text-[#0E6245]'
                            : 'bg-[#FFECD1] text-[#8A6100]'
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
        <div className="p-3 border-t border-[#E3E8EE] bg-white space-y-2">
          
          <div className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-[#F8FAFC] transition-colors">
            <div className="flex items-center space-x-2.5 truncate">
              <div className="w-7 h-7 rounded bg-[#EEF2FF] border border-[#C7D2FE] text-[#635BFF] font-bold text-xs flex items-center justify-center flex-shrink-0">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="truncate">
                <div className="text-xs font-semibold text-[#1A1F36] truncate">
                  {user?.full_name || user?.email?.split('@')[0] || 'Vishwanath'}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono font-bold text-[#635BFF]">
                    {planBadgeText}
                  </span>
                </div>
              </div>
            </div>

            <Link to="/dashboard/settings" title="Settings" className="text-[#697386] hover:text-[#1A1F36] p-1">
              <Settings className="w-3.5 h-3.5" />
            </Link>
          </div>

          <button
            onClick={logout}
            className="w-full h-7 flex items-center justify-center gap-1.5 text-xs text-[#697386] hover:text-[#A8071A] hover:bg-red-50 rounded transition-colors font-medium"
          >
            <LogOut className="w-3 h-3" />
            <span>Sign out</span>
          </button>

        </div>
      </aside>

      {/* =========================================================================
          2. MAIN CONTENT AREA & STRIPE TOPBAR (52px Height)
          ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Topbar */}
        <header className="h-[52px] border-b border-[#E3E8EE] bg-white flex items-center justify-between px-4 sm:px-6 z-30 shadow-xs">
          
          {/* Left: Mobile Toggle & Breadcrumb */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden text-[#4F566B] hover:text-[#1A1F36] p-1"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-sm font-semibold text-[#1A1F36]">
              {getBreadcrumb()}
            </span>
          </div>

          {/* Center: Global Search Bar */}
          <div className="hidden md:flex items-center w-[320px] relative">
            <Search className="w-3.5 h-3.5 text-[#697386] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search payments, customers, rules..."
              className="w-full h-8 bg-[#F8FAFC] border border-[#E3E8EE] focus:border-[#635BFF] focus:bg-white rounded text-xs pl-8 pr-12 text-[#1A1F36] placeholder:text-[#697386] focus:outline-none transition-all shadow-xs"
            />
            <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-[#697386] bg-[#EDF2F7] px-1.5 py-0.5 rounded border border-[#E3E8EE]">
              ⌘K
            </kbd>
          </div>

          {/* Right: Test/Live Mode Switcher, Telemetry, & Avatar */}
          <div className="flex items-center space-x-3 text-xs">
            
            {/* Stripe Test Mode / Live Mode Switcher */}
            <div className="flex items-center bg-[#F1F5F9] p-0.5 rounded border border-[#E3E8EE]">
              <button
                type="button"
                onClick={() => {
                  setIsTestMode(true);
                  toast.info('Switched to Test Data Environment');
                }}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                  isTestMode
                    ? 'bg-[#FFECD1] text-[#8A6100] shadow-xs'
                    : 'text-[#697386] hover:text-[#1A1F36]'
                }`}
              >
                TEST MODE
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsTestMode(false);
                  toast.success('Switched to Live Production Traffic');
                }}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                  !isTestMode
                    ? 'bg-[#CBF4C9] text-[#0E6245] shadow-xs'
                    : 'text-[#697386] hover:text-[#1A1F36]'
                }`}
              >
                LIVE
              </button>
            </div>

            {/* API Live Telemetry Popover */}
            <div className="relative">
              <button
                onClick={() => setIsApiStatusOpen(!isApiStatusOpen)}
                className="flex items-center space-x-2 px-2.5 py-1 rounded bg-white border border-[#E3E8EE] hover:border-[#CBD5E1] transition-colors text-[#4F566B] hover:text-[#1A1F36] font-mono text-[11px] shadow-xs"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0E6245] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0E6245]" />
                </span>
                <span>Radar API 43ms</span>
              </button>

              {isApiStatusOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-[#E3E8EE] rounded-lg p-3 shadow-xl z-50 space-y-2 text-xs font-mono animate-in fade-in duration-fast">
                  <div className="flex items-center justify-between border-b border-[#E3E8EE] pb-2">
                    <span className="font-bold text-[#1A1F36]">Radar ML Telemetry</span>
                    <span className="text-[#0E6245] text-[10px] font-semibold">● Operational</span>
                  </div>
                  <div className="space-y-1 text-[#697386] text-[11px]">
                    <div className="flex justify-between">
                      <span>Inference Latency</span>
                      <span className="text-[#1A1F36] font-semibold">43ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span>P99 Evaluation</span>
                      <span className="text-[#1A1F36] font-semibold">58ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Uptime (30d)</span>
                      <span className="text-[#1A1F36] font-semibold">99.98%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Region</span>
                      <span className="text-[#1A1F36] font-semibold">ap-south-1 (Mumbai)</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Alert Notification Bell */}
            <Link
              to="/dashboard/alerts"
              className="p-1.5 text-[#697386] hover:text-[#1A1F36] rounded hover:bg-[#F8FAFC] transition-colors relative"
              title="Alerts"
            >
              <Bell className="w-4 h-4" />
              {unreadAlertsCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#A8071A]" />
              )}
            </Link>

            {/* Quick Profile Initials */}
            <Link to="/dashboard/settings" className="w-7 h-7 rounded bg-[#F1F5F9] border border-[#E3E8EE] flex items-center justify-center font-bold text-xs text-[#1A1F36] hover:border-[#635BFF] transition-colors">
              {user?.email?.charAt(0).toUpperCase() || 'V'}
            </Link>

          </div>

        </header>

        {/* Dynamic Nested Route Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#F6F9FC]">
          <div className="max-w-7xl mx-auto space-y-8">
            <Outlet />
          </div>
        </main>

      </div>

    </div>
  );
}
