import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { 
  LayoutDashboard, 
  Activity, 
  AlertTriangle, 
  BarChart3, 
  Key, 
  Users, 
  BookOpen,
  Bell,
  Search,
  LogOut,
  CreditCard,
  Menu,
  X,
  Plug2,
  Shield,
  ChevronRight
} from 'lucide-react';
import Logo from '@/components/Logo';
import { useAlertStore } from '@/stores/alertStore';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Button } from '@/components/ui/button';

const AlertBadge = () => {
  const unreadCount = useAlertStore(state => state.unreadCount);
  if (unreadCount <= 0) return null;
  return (
    <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold px-2 py-0.5 rounded-full">
      {unreadCount > 99 ? '99+' : unreadCount}
    </span>
  );
};

export default function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, organization, logout } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);
  
  const orgPlan = organization?.plan || 'free';
  const planLabel = {
    free:     'Free',
    basic:    'Basic',
    standard: 'Growth',
    growth:   'Growth',
    premium:  'Pro',
    enterprise: 'Enterprise',
  }[orgPlan] ?? orgPlan;

  useWebSocket();

  const [disputesCount, setDisputesCount] = useState(0);

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

  const navSections = [
    {
      title: "Overview",
      items: [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Transactions', path: '/dashboard/transactions', icon: Activity },
        { name: 'Alerts', path: '/dashboard/alerts', icon: AlertTriangle, badge: <AlertBadge /> },
      ]
    },
    {
      title: "Dispute Defense",
      items: [
        { 
          name: 'Disputes', 
          path: '/dashboard/disputes', 
          icon: Shield,
          badge: disputesCount > 0 ? (
            <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold px-2 py-0.5 rounded-full">
              {disputesCount}
            </span>
          ) : null
        },
        { name: 'Analytics', path: '/dashboard/analytics', icon: BarChart3 },
      ]
    },
    {
      title: "Settings & Integrations",
      items: [
        { name: 'API Keys', path: '/dashboard/api-keys', icon: Key },
        { name: 'Integrations', path: '/dashboard/integrations', icon: Plug2 },
        { name: 'Team', path: '/dashboard/team', icon: Users },
        { 
          name: 'Plans & Billing', 
          path: '/dashboard/billing', 
          icon: CreditCard,
          badge: (
            <span className="text-xs text-slate-400 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded font-medium">
              {planLabel}
            </span>
          )
        },
      ]
    }
  ];

  return (
    <div className="flex h-screen bg-[#0B0F17] text-slate-100 overflow-hidden font-body antialiased">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-[#0F1523] border-r border-[#1E293B] flex flex-col transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Header Branding */}
        <div className="h-16 px-5 border-b border-[#1E293B] flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center space-x-3">
            <Logo size={28} iconSize={16} theme="dark" />
            <span className="text-base font-semibold text-white tracking-tight">Flowshield AI</span>
          </Link>
          <button 
            type="button"
            className="lg:hidden text-slate-400 hover:text-white"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Nav Sections */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-1">
              <h3 className="px-3 text-xs font-medium text-slate-500">
                {section.title}
              </h3>
              <div className="mt-1.5 space-y-0.5">
                {section.items.map((item) => {
                  const isActive = location.pathname === item.path || (item.name === 'Disputes' && location.pathname.startsWith('/dashboard/disputes'));
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      className={`flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive 
                          ? 'bg-blue-600/15 text-blue-400 font-semibold' 
                          : 'text-slate-400 hover:bg-[#1A2234] hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className={`h-4 w-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                        <span>{item.name}</span>
                      </div>
                      {item.badge && <div>{item.badge}</div>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        
        {/* Footer info */}
        <div className="p-3 border-t border-[#1E293B] bg-[#0C111C]">
          <Link
            to="/docs"
            className="flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium text-slate-400 hover:bg-[#1A2234] hover:text-white transition-colors"
          >
            <div className="flex items-center space-x-3">
              <BookOpen className="h-4 w-4 text-slate-400" />
              <span>Documentation</span>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-600" />
          </Link>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation Bar */}
        <header className="h-16 border-b border-[#1E293B] bg-[#0F1523] flex items-center justify-between px-6 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden text-slate-400 hover:text-white"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>

            <div className="hidden sm:flex items-center bg-[#182030] rounded-md px-3 py-1.5 w-64 lg:w-80 border border-[#26334D] focus-within:border-blue-500 transition-colors">
              <Search className="h-4 w-4 text-slate-400 mr-2 flex-shrink-0" />
              <input 
                type="text" 
                placeholder="Search transactions, alerts..." 
                className="bg-transparent border-none outline-none text-xs w-full text-white placeholder:text-slate-500"
              />
            </div>

            <div className="flex items-center gap-2 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-medium text-emerald-400">Live Engine</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Link 
              to="/dashboard/alerts" 
              className="relative p-2 text-slate-400 hover:text-white transition-colors rounded-md hover:bg-[#1A2234]"
              title="Alert Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-[#0F1523]"></span>
            </Link>
            
            <div className="h-4 w-[1px] bg-[#1E293B]" />

            <Link 
              to="/dashboard/profile"
              className="flex items-center space-x-2.5 p-1.5 rounded-md hover:bg-[#1A2234] transition-colors"
            >
              <div className="h-7 w-7 rounded-full border border-slate-700 bg-blue-600/20 text-blue-400 flex items-center justify-center text-xs font-semibold">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span className="hidden md:inline-block text-xs font-medium text-slate-300">{user?.email?.split('@')[0] || 'Account'}</span>
            </Link>

            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => {
                logout();
                import('sonner').then(m => m.toast.success("Successfully logged out"));
              }}
              title="Logout"
              className="text-slate-400 hover:text-white hover:bg-red-500/10"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Page Container */}
        <main className="flex-1 overflow-y-auto p-6 bg-[#0B0F17]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
