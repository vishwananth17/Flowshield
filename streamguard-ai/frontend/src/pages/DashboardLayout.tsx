import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
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
  Shield,
  CreditCard
} from 'lucide-react';
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
  const { user, logout } = useAuthStore();
  const location = useLocation();
  
  // Activate global websocket
  useWebSocket();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Transactions', path: '/dashboard/transactions', icon: Activity },
    { name: 'Alerts', path: '/dashboard/alerts', icon: AlertTriangle },
    { name: 'Analytics', path: '/dashboard/analytics', icon: BarChart3 },
    { name: 'API Keys', path: '/dashboard/api-keys', icon: Key },
    { name: 'Team', path: '/dashboard/team', icon: Users },
    { name: 'Billing', path: '/dashboard/billing', icon: CreditCard },
    { name: 'Subscription', path: '/dashboard/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-[#0A0E1A] text-white">
      {/* Sidebar */}
      <div className="w-64 border-r border-[#1F2937] bg-[#111827] flex flex-col">
        <div className="p-6 flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-blue-600/20 flex items-center justify-center border border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
            <Shield className="h-5 w-5 text-blue-400" />
          </div>
          <span className="text-xl font-display font-bold">Flowshield AI</span>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-4">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
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
                  {item.name === 'Billing' && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      useAuthStore.getState().organization?.plan === 'growth' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-700 text-gray-400'
                    }`}>
                      {useAuthStore.getState().organization?.plan === 'growth' ? 'PRO' : 'FREE'}
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
            <br/><span className="text-blue-500/50">Founder: Vishwananth B</span>
          </div>
          <Link
            to="/docs"
            target="_blank"
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
        <header className="h-16 border-b border-[#1F2937] bg-[#111827] flex items-center justify-between px-6">
          <div className="flex items-center bg-[#1F2937] rounded-lg px-3 py-2 w-96 border border-[#374151]">
            <Search className="h-4 w-4 text-gray-400 mr-2" />
            <input 
              type="text" 
              placeholder="Search transactions, alerts..." 
              className="bg-transparent border-none outline-none text-sm w-full text-white placeholder:text-gray-500"
            />
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
