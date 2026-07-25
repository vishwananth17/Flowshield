import { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { 
  Bell,
  Search,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Button } from '@/components/ui/Button';
import { Sidebar } from '@/components/Sidebar';

export default function DashboardLayout() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { user, logout } = useAuthStore();
  
  // Activate global websocket
  useWebSocket();

  return (
    <div className="flex h-screen bg-[var(--bg-base)] text-[var(--text-primary)] overflow-hidden font-body">
      
      {/* Mobile Backdrop Overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Collapsible Desktop & Tablet */}
      <div className="hidden lg:block h-full">
        <Sidebar />
      </div>

      {/* Sidebar - Mobile Drawer */}
      <div 
        className={`
          fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out lg:hidden
          ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="relative h-full">
          <Sidebar />
          <button
            type="button"
            className="absolute top-4 right-[-40px] w-8 h-8 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-full flex items-center justify-center text-white"
            onClick={() => setIsMobileSidebarOpen(false)}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header Navbar */}
        <header className="h-14 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] flex items-center justify-between px-6 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden text-[var(--text-secondary)] hover:text-white h-8 w-8"
              onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            {/* Search Bar */}
            <div className="hidden sm:flex items-center bg-[var(--bg-inset)] rounded-[var(--radius-md)] px-3 py-1.5 w-64 lg:w-96 border border-[var(--border-default)] focus-within:border-[var(--color-primary)] transition-colors">
              <Search className="h-3.5 w-3.5 text-[var(--text-muted)] mr-2" />
              <input 
                type="text" 
                placeholder="Search transactions, alerts..." 
                className="bg-transparent border-none outline-none text-xs w-full text-[var(--text-primary)] placeholder:text-[var(--text-muted)] font-mono"
              />
            </div>

            {/* Live Indicator */}
            <div className="flex items-center gap-2 bg-[var(--bg-inset)] px-3 py-1 rounded-[var(--radius-sm)] border border-[var(--border-default)]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-secondary)]">Live Engine Connected</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Link 
              to="/dashboard/alerts" 
              className="relative p-1.5 text-[var(--text-secondary)] hover:text-white transition-colors group"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-[var(--color-primary)] animate-pulse"></span>
            </Link>
            
            {/* User Icon */}
            <Link 
              to="/dashboard/profile"
              className="h-7 w-7 rounded-full border border-[var(--border-gold)] bg-[var(--bg-inset)] flex items-center justify-center text-xs font-mono font-bold text-white hover:border-white transition-colors"
            >
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </Link>
            
            {/* Logout button */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 border-transparent hover:bg-[var(--bg-elevated)]"
              onClick={() => {
                logout();
                import('sonner').then(m => m.toast.success("Successfully logged out"));
              }}
              title="Logout"
            >
              <LogOut className="h-4 w-4 text-[var(--text-muted)] hover:text-white" />
            </Button>
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="flex-1 overflow-y-auto p-6 bg-[var(--bg-base)] text-[var(--text-primary)]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
