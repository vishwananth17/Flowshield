import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X, Settings, ShieldAlert, Check } from 'lucide-react';

export default function CookieConsent() {
  const location = useLocation();
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Toggle states for categories
  const [preferences, setPreferences] = useState({
    essential: true,
    functional: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    const consent = localStorage.getItem('flowshield_cookie_consent');
    const isDashboard = location.pathname.startsWith('/dashboard');
    const isDocs = location.pathname.startsWith('/docs');

    // Show banner only if consent is not stored and user is not in dashboard or docs
    if (!consent && !isDashboard && !isDocs) {
      setShowBanner(true);
    } else {
      setShowBanner(false);
    }
  }, [location]);

  const handleAcceptAll = () => {
    localStorage.setItem('flowshield_cookie_consent', 'all');
    setShowBanner(false);
    setShowModal(false);
  };

  const handleDeclineAll = (e: React.MouseEvent) => {
    e.preventDefault();
    localStorage.setItem('flowshield_cookie_consent', 'declined');
    setShowBanner(false);
    setShowModal(false);
  };

  const handleSavePreferences = () => {
    // If all checked, save 'all'
    if (preferences.functional && preferences.analytics && preferences.marketing) {
      localStorage.setItem('flowshield_cookie_consent', 'all');
    } else {
      // Otherwise serialize preference state or mark as essential customized
      localStorage.setItem('flowshield_cookie_consent', 'essential');
      localStorage.setItem('flowshield_cookie_pref_functional', String(preferences.functional));
      localStorage.setItem('flowshield_cookie_pref_analytics', String(preferences.analytics));
      localStorage.setItem('flowshield_cookie_pref_marketing', String(preferences.marketing));
    }
    setShowBanner(false);
    setShowModal(false);
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Bottom Sticky Banner */}
      <div className="no-print fixed bottom-0 left-0 right-0 z-40 bg-[#080C16]/95 backdrop-blur-md border-t border-border-200 px-4 py-3.5 sm:py-4 shadow-[0_-12px_32px_rgba(0,0,0,0.6)] font-sans">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Left Text */}
          <div className="text-xs sm:text-sm text-text-secondary text-center md:text-left leading-relaxed max-w-2xl font-normal">
            We use cookies to improve your dashboard performance, analyze marketing conversion, and secure transaction checks. 
            By clicking "Accept All", you agree to our storage of preferences. See our{' '}
            <Link to="/cookies" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-4 decoration-cyan-500/40 hover:decoration-cyan-400 transition-colors font-medium">
              Cookie Policy
            </Link>{' '}
            for full details.
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={handleAcceptAll}
              className="px-4 py-2 rounded bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 text-surface-000 text-xs font-semibold transition-all shadow-sm shadow-cyan-500/20 whitespace-nowrap hover:-translate-y-[0.5px]"
            >
              Accept All
            </button>
            
            <button
              onClick={() => setShowModal(true)}
              className="px-3.5 py-2 rounded border border-border-300 hover:border-border-400 hover:bg-white/[0.04] text-text-primary text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5"
            >
              <Settings className="w-3.5 h-3.5 text-text-tertiary" />
              <span>Manage Preferences</span>
            </button>

            <button
              onClick={handleDeclineAll}
              className="text-xs font-medium text-text-tertiary hover:text-text-primary transition-colors px-2 py-2 whitespace-nowrap"
            >
              Decline All
            </button>
          </div>

        </div>
      </div>

      {/* Preferences Customizer Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-sans animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#080C16] border border-border-200 rounded-xl p-6 sm:p-7 shadow-2xl relative">
            
            {/* Close */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-5 right-5 p-1 rounded-md text-text-tertiary hover:text-text-primary hover:bg-white/[0.05] transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="mb-6 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/20">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-text-primary leading-tight">Cookie Preferences</h3>
                <p className="text-xs text-text-secondary mt-0.5">Customize data signals stored in your client</p>
              </div>
            </div>

            {/* Selection Toggles */}
            <div className="space-y-3 mb-6">
              
              {/* Essential */}
              <div className="flex items-start justify-between p-3.5 rounded-lg bg-surface-100/60 border border-border-100">
                <div className="flex-1 pr-4">
                  <div className="text-xs font-semibold text-text-primary">Essential Cookies</div>
                  <div className="text-[11px] text-text-tertiary mt-1 leading-normal">
                    Required for basic dashboard login sessions, API token operations, and payment security checks.
                  </div>
                </div>
                <div className="relative inline-flex items-center h-5 rounded-full w-9 bg-cyan-500/40 cursor-not-allowed opacity-80 mt-0.5">
                  <span className="translate-x-4 inline-block w-3.5 h-3.5 transform bg-cyan-400 rounded-full transition-transform" />
                </div>
              </div>

              {/* Functional */}
              <div className="flex items-start justify-between p-3.5 rounded-lg bg-surface-100/60 border border-border-100">
                <div className="flex-1 pr-4">
                  <div className="text-xs font-semibold text-text-primary">Functional Cookies</div>
                  <div className="text-[11px] text-text-tertiary mt-1 leading-normal">
                    Used to remember UI configurations, sidebar states, and dashboard theme overrides.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPreferences({ ...preferences, functional: !preferences.functional })}
                  className={`relative inline-flex items-center h-5 rounded-full w-9 transition-colors mt-0.5 ${
                    preferences.functional ? 'bg-cyan-500' : 'bg-surface-300'
                  }`}
                >
                  <span
                    className={`${
                      preferences.functional ? 'translate-x-4' : 'translate-x-0.5'
                    } inline-block w-3.5 h-3.5 transform bg-white rounded-full transition-transform`}
                  />
                </button>
              </div>

              {/* Analytics */}
              <div className="flex items-start justify-between p-3.5 rounded-lg bg-surface-100/60 border border-border-100">
                <div className="flex-1 pr-4">
                  <div className="text-xs font-semibold text-text-primary">Analytics Cookies</div>
                  <div className="text-[11px] text-text-tertiary mt-1 leading-normal">
                    Enables us to track visitor volumes and checkout latency to improve model evaluation speeds.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPreferences({ ...preferences, analytics: !preferences.analytics })}
                  className={`relative inline-flex items-center h-5 rounded-full w-9 transition-colors mt-0.5 ${
                    preferences.analytics ? 'bg-cyan-500' : 'bg-surface-300'
                  }`}
                >
                  <span
                    className={`${
                      preferences.analytics ? 'translate-x-4' : 'translate-x-0.5'
                    } inline-block w-3.5 h-3.5 transform bg-white rounded-full transition-transform`}
                  />
                </button>
              </div>

              {/* Marketing */}
              <div className="flex items-start justify-between p-3.5 rounded-lg bg-surface-100/60 border border-border-100">
                <div className="flex-1 pr-4">
                  <div className="text-xs font-semibold text-text-primary">Marketing Cookies</div>
                  <div className="text-[11px] text-text-tertiary mt-1 leading-normal">
                    Measures conversion telemetry on public pages. Disabled inside merchant dashboards.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPreferences({ ...preferences, marketing: !preferences.marketing })}
                  className={`relative inline-flex items-center h-5 rounded-full w-9 transition-colors mt-0.5 ${
                    preferences.marketing ? 'bg-cyan-500' : 'bg-surface-300'
                  }`}
                >
                  <span
                    className={`${
                      preferences.marketing ? 'translate-x-4' : 'translate-x-0.5'
                    } inline-block w-3.5 h-3.5 transform bg-white rounded-full transition-transform`}
                  />
                </button>
              </div>

            </div>

            {/* Modal Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleSavePreferences}
                className="w-full py-2 rounded border border-border-300 hover:border-border-400 hover:bg-white/[0.04] text-text-primary text-xs font-semibold transition-all"
              >
                Save Preferences
              </button>
              <button
                onClick={handleAcceptAll}
                className="w-full py-2 rounded bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 text-surface-000 text-xs font-semibold transition-all shadow-sm shadow-cyan-500/20 flex items-center justify-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Accept All</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
