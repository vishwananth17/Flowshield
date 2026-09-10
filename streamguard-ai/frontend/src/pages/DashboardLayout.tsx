import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { CommandPalette } from '@/components/ui/CommandPalette';
import { useAlertStore } from '@/stores/alertStore';
import { useWebSocket } from '@/hooks/useWebSocket';
import { cn } from '@/lib/utils';

export default function DashboardLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Global WebSocket connection for real-time telemetry
  useWebSocket();

  // Dynamic alert count
  const unreadAlertsCount = useAlertStore((state) => state.unreadCount);

  return (
    <div className="min-h-screen bg-[var(--surface-secondary)] text-[var(--text-primary)] font-sans flex flex-col">
      {/* 1. Sidebar Navigation (224px / 52px) */}
      <Sidebar
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        unreadAlertsCount={unreadAlertsCount}
      />

      {/* 2. Top Bar (48px) */}
      <TopBar
        isSidebarCollapsed={isCollapsed}
        onOpenMobileSidebar={() => setIsMobileOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        unreadAlertsCount={unreadAlertsCount}
      />

      {/* 3. Main Content Area */}
      <main
        className={cn(
          'flex-1 min-h-screen pt-[48px] transition-[margin-left] duration-slow ease-out-expo flex flex-col',
          isCollapsed ? 'ml-[52px]' : 'ml-[224px]'
        )}
      >
        <div className="flex-1 w-full max-w-[1400px] mx-auto p-6 sm:p-8 space-y-6">
          <Outlet />
        </div>
      </main>

      {/* 4. Global Command Palette (⌘K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />
    </div>
  );
}
