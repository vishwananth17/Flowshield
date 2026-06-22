import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { toast } from 'sonner';

export const useAutoLogout = () => {
  const { logout, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) return;

    let warningTimer: NodeJS.Timeout;
    let logoutTimer: NodeJS.Timeout;

    const resetTimers = () => {
      clearTimeout(warningTimer);
      clearTimeout(logoutTimer);

      // Warning at 25 minutes
      warningTimer = setTimeout(() => {
        toast.warning("You will be logged out in 5 minutes due to inactivity.", {
          duration: 10000,
          description: "Move your mouse or press a key to stay signed in."
        });
      }, 25 * 60 * 1000);

      // Logout at 30 minutes
      logoutTimer = setTimeout(() => {
        toast.error("Logged out due to inactivity.");
        logout();
      }, 30 * 60 * 1000);
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    // Add event listeners to detect user activity
    events.forEach(e => {
      document.addEventListener(e, resetTimers);
    });

    // Initialize timers
    resetTimers();

    return () => {
      clearTimeout(warningTimer);
      clearTimeout(logoutTimer);
      events.forEach(e => {
        document.removeEventListener(e, resetTimers);
      });
    };
  }, [isAuthenticated, logout]);
};
