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
    <span className="bg-white text-black text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-zinc-300">
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
    ? 'bg-zinc-800 text-zinc-400 border border-zinc-700'
    : 'bg-white text-black font-extrabold border border-zinc-300';
  
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
    <div className="flex h-screen bg-black text-white overflow-hidden font-body">
      {/* Mobile Backdrop Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Desktop & Tablet */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-[#09090B] border-r border-zinc-800 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 flex items-center justify-between border-b border-zinc-800">
          <Link to="/" className="flex items-center space-x-3">
            <Logo size={28} iconSize={16} theme="dark" showText={true} />
          </Link>
          <button 
            type="button"
            className="lg:hidden text-zinc-400 hover:text-white"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-3">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || (item.name === 'Disputes' && location.pathname.startsWith('/dashboard/disputes'));
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-md transition-colors text-xs font-semibold ${
                    isActive 
                      ? 'bg-white text-black font-bold' 
                      : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="flex-1">{item.name}</span>
                  {item.name === 'Alerts' && (
                    <AlertBadge />
                  )}
                  {item.name === 'Disputes' && disputesCount > 0 && (
                    <span className="bg-white text-black text-[10px] font-extrabold px-2 py-0.5 rounded border border-zinc-300">
                      {disputesCount}
                    </span>
                  )}
                  {item.name === 'Plans & Billing' && (
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${planStyle}`}>
                      {planLabel}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
        
        <div className="p-4 border-t border-zinc-800 space-y-2 bg-black">
          <div className="px-3 pb-2 text-[10px] font-mono tracking-widest text-zinc-500 uppercase">
            POWERED BY FLOWSHIELD AI
          </div>
          <Link
            to="/docs"
            className="flex items-center space-x-3 px-3 py-2 rounded text-xs text-zinc-400 hover:bg-zinc-900 hover:text-white transition-colors"
          >
            <BookOpen className="h-4 w-4" />
            <span>Documentation</span>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="h-14 border-b border-zinc-800 bg-[#09090B] flex items-center justify-between px-6 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden text-zinc-400 hover:text-white h-8 w-8"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            
            <div className="hidden sm:flex items-center bg-black rounded-md px-3 py-1.5 w-64 lg:w-96 border border-zinc-800">
              <Search className="h-3.5 w-3.5 text-zinc-500 mr-2" />
              <input 
                type="text" 
                placeholder="Search transactions, alerts..." 
                className="bg-transparent border-none outline-none text-xs w-full text-white placeholder:text-zinc-600 font-mono"
              />
            </div>

            <div className="flex items-center gap-2 bg-black px-3 py-1 rounded border border-zinc-800">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-300">Live Engine Connected</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Link 
              to="/dashboard/alerts" 
              className="relative p-1.5 text-zinc-400 hover:text-white transition-colors group"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-white"></span>
            </Link>
            
            <Link 
              to="/dashboard/profile"
              className="h-7 w-7 rounded border border-zinc-700 bg-black flex items-center justify-center text-xs font-mono font-bold text-white hover:border-white transition-colors"
            >
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </Link>

            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => {
                logout();
                import('sonner').then(m => m.toast.success("Successfully logged out"));
              }}
              title="Logout"
            >
              <LogOut className="h-4 w-4 text-zinc-400 hover:text-white" />
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-black">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
