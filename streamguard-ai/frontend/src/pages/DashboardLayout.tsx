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
  Settings, 
  BookOpen,
  Bell,
  Search,
  LogOut,
  CreditCard,
  Menu,
  X,
  Plug2,
  Shield
} from 'lucide-react';
import Logo from '@/components/Logo';
import { useAlertStore } from '@/stores/alertStore';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Button } from '@/components/ui/button';

const AlertBadge = () => {
  const unreadCount = useAlertStore(state => state.unreadCount);
  if (unreadCount <= 0) return null;
  return (
    <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
      {unreadCount > 99 ? '99+' : unreadCount}
    </span>
  );
};

export default function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, organization, logout } = useAuthStore();
  const location = useLocation();

  // Close sidebar automatically on navigation path changes (for mobile/tablet sizes)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);
  
  // Derive display label and style from org plan
  const orgPlan = organization?.plan || 'free';
  const planLabel = {
    free:     'FREE',
    basic:    'BASIC',
    standard: 'GROWTH',
    growth:   'GROWTH',
    premium:  'PRO',
    enterprise: 'ENT',
  }[orgPlan] ?? orgPlan.toUpperCase();
  const planStyle = orgPlan === 'free'
    ? 'bg-gray-700 text-gray-400'
    : orgPlan === 'premium' || orgPlan === 'enterprise'
      ? 'bg-purple-600 text-white shadow-[0_0_8px_rgba(147,51,234,0.5)]'
      : 'bg-blue-500 text-white shadow-[0_0_8px_rgba(59,130,246,0.5)]';
  
  // Activate global websocket
  useWebSocket();

  // Dynamic disputes count for badge
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

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Disputes', path: '/dashboard/disputes', icon: Shield },
    { name: 'Transactions', path: '/dashboard/transactions', icon: Activity },
    { name: 'Alerts', path: '/dashboard/alerts', icon: AlertTriangle },
    { name: 'Analytics', path: '/dashboard/analytics', icon: BarChart3 },
    { name: 'API Keys', path: '/dashboard/api-keys', icon: Key },
    { name: 'Integrations', path: '/dashboard/integrations', icon: Plug2 },
    { name: 'Team', path: '/dashboard/team', icon: Users },
    { name: 'Plans & Billing', path: '/dashboard/billing', icon: CreditCard },
  ];

  return (
    <div className="flex h-screen bg-[#0A0E1A] text-white overflow-hidden">
      {/* Mobile Backdrop Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Desktop & Tablet */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-[#111827] border-r border-[#1F2937] transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Logo size={32} iconSize={18} theme="dark" />
            <span className="text-xl font-display font-bold">Flowshield AI</span>
          </div>
          <button 
            type="button"
            className="lg:hidden text-gray-400 hover:text-white"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-4">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || (item.name === 'Disputes' && location.pathname.startsWith('/dashboard/disputes'));
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-400 hover:bg-[#1F2937] hover:text-white'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium text-sm flex-1">{item.name}</span>
                  {item.name === 'Alerts' && (
                    <AlertBadge />
                  )}
                  {item.name === 'Disputes' && disputesCount > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                      {disputesCount}
                    </span>
                  )}
                  {item.name === 'Plans & Billing' && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${planStyle}`}>
                      {planLabel}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
        
        <div className="p-4 border-t border-[#1F2937] space-y-2">
          <div className="px-3 pb-2 text-[10px] uppercase tracking-widest text-[#374151] font-bold">
            Powered by Flowshield AI
            <br/><span className="text-blue-500/50">Founder: Vishwananth BS</span>
          </div>
          <Link
            to="/docs"
            className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-gray-400 hover:bg-[#1F2937] hover:text-white transition-colors"
          >
            <BookOpen className="h-5 w-5" />
            <span className="font-medium text-sm">Documentation</span>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 border-b border-[#1F2937] bg-[#111827] flex items-center justify-between px-6 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden text-gray-400"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
            <div className="hidden sm:flex items-center bg-[#1F2937] rounded-lg px-3 py-2 w-64 lg:w-96 border border-[#374151]">
              <Search className="h-4 w-4 text-gray-400 mr-2" />
              <input 
                type="text" 
                placeholder="Search transactions, alerts..." 
                className="bg-transparent border-none outline-none text-sm w-full text-white placeholder:text-gray-500"
              />
            </div>
            <div className="flex items-center gap-2 bg-emerald-500/5 px-3 py-1.5 rounded-full border border-emerald-500/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-tighter">Live Engine Connected</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Link 
              to="/dashboard/alerts" 
              className="relative p-2 text-gray-400 hover:text-white transition-colors group"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-[#111827]"></span>
              <div className="absolute top-full mt-2 right-0 bg-[#1F2937] text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                View Alerts
              </div>
            </Link>
            
            <Link 
              to="/dashboard/profile"
              className="h-8 w-8 rounded-full border border-[#374151] overflow-hidden bg-[#111827] flex items-center justify-center text-sm font-medium hover:border-blue-500/50 transition-colors group relative"
            >
              {user?.email?.charAt(0).toUpperCase() || 'U'}
              <div className="absolute top-full mt-2 right-0 bg-[#1F2937] text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                Personal Profile
              </div>
            </Link>

            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => {
                logout();
                import('sonner').then(m => m.toast.success("Successfully logged out"));
              }}
              title="Logout"
            >
              <LogOut className="h-5 w-5 text-gray-400 hover:text-white" />
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-[#0A0E1A]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

