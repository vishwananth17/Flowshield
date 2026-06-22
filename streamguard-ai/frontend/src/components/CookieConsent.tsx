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
      <div className="no-print fixed bottom-0 left-0 right-0 z-40 bg-[#111827] border-t border-[#1F2937] px-4 py-4 md:py-5 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Left Text */}
          <div className="text-xs md:text-sm text-[#9CA3AF] text-center md:text-left leading-relaxed max-w-2xl">
            We use cookies to improve your dashboard performance, analyze marketing conversion, and secure transaction checks. 
            By clicking "Accept All", you agree to our storage of preferences. See our{' '}
            <Link to="/cookies" className="text-blue-500 hover:underline">
              Cookie Policy
            </Link>{' '}
            for full details.
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={handleAcceptAll}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/10 whitespace-nowrap"
            >
              Accept All
            </button>
            
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 rounded-xl border border-[#1F2937] hover:bg-white/5 text-slate-300 text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Manage Preferences</span>
            </button>

            <button
              onClick={handleDeclineAll}
              className="text-xs font-semibold text-slate-500 hover:text-white transition-colors pl-2 py-2 whitespace-nowrap"
            >
              Decline All
            </button>
          </div>

        </div>
      </div>

      {/* Preferences Customizer Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#111827] border border-[#1F2937] rounded-3xl p-6 md:p-8 shadow-2xl relative">
            
            {/* Close */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-5 right-5 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="mb-6 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white leading-tight">Cookie Preferences</h3>
                <p className="text-xs text-slate-500 mt-0.5">Customize data signals stored in your client</p>
              </div>
            </div>

            {/* Selection Toggles */}
            <div className="space-y-4 mb-8">
              
              {/* Essential */}
              <div className="flex items-start justify-between p-3.5 rounded-2xl bg-[#0A0E1A]/40 border border-[#1F2937]/50">
                <div className="flex-1 pr-4">
                  <div className="text-xs font-bold text-white">Essential Cookies</div>
                  <div className="text-[10px] text-slate-500 mt-1 leading-normal">
                    Required for basic dashboard login sessions, API token operations, and Razorpay integrations.
                  </div>
                </div>
                <div className="relative inline-flex items-center h-6 rounded-full w-11 bg-blue-600/40 cursor-not-allowed opacity-80">
                  <span className="translate-x-6 inline-block w-4 h-4 transform bg-blue-500 rounded-full transition-transform" />
                </div>
              </div>

              {/* Functional */}
              <div className="flex items-start justify-between p-3.5 rounded-2xl bg-[#0A0E1A]/40 border border-[#1F2937]/50">
                <div className="flex-1 pr-4">
                  <div className="text-xs font-bold text-white">Functional Cookies</div>
                  <div className="text-[10px] text-slate-500 mt-1 leading-normal">
                    Used to remember UI configurations, sidebar states, and dashboard theme overrides.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPreferences({ ...preferences, functional: !preferences.functional })}
                  className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${
                    preferences.functional ? 'bg-blue-600' : 'bg-slate-800'
                  }`}
                >
                  <span
                    className={`${
                      preferences.functional ? 'translate-x-6' : 'translate-x-1'
                    } inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}
                  />
                </button>
              </div>

              {/* Analytics */}
              <div className="flex items-start justify-between p-3.5 rounded-2xl bg-[#0A0E1A]/40 border border-[#1F2937]/50">
                <div className="flex-1 pr-4">
                  <div className="text-xs font-bold text-white">Analytics Cookies</div>
                  <div className="text-[10px] text-slate-500 mt-1 leading-normal">
                    Enables us to track visitor volumes and checkout latency to improve model speeds.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPreferences({ ...preferences, analytics: !preferences.analytics })}
                  className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${
                    preferences.analytics ? 'bg-blue-600' : 'bg-slate-800'
                  }`}
                >
                  <span
                    className={`${
                      preferences.analytics ? 'translate-x-6' : 'translate-x-1'
                    } inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}
                  />
                </button>
              </div>

              {/* Marketing */}
              <div className="flex items-start justify-between p-3.5 rounded-2xl bg-[#0A0E1A]/40 border border-[#1F2937]/50">
                <div className="flex-1 pr-4">
                  <div className="text-xs font-bold text-white">Marketing Cookies</div>
                  <div className="text-[10px] text-slate-500 mt-1 leading-normal">
                    Measures Google and Facebook ad conversions on public pages. Disabled inside app dashboards.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPreferences({ ...preferences, marketing: !preferences.marketing })}
                  className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${
                    preferences.marketing ? 'bg-blue-600' : 'bg-slate-800'
                  }`}
                >
                  <span
                    className={`${
                      preferences.marketing ? 'translate-x-6' : 'translate-x-1'
                    } inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}
                  />
                </button>
              </div>

            </div>

            {/* Modal Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleSavePreferences}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all border border-[#1F2937]"
              >
                Save Preferences
              </button>
              <button
                onClick={handleAcceptAll}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/10 flex items-center justify-center gap-1"
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
