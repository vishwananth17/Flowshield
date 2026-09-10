import { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@/contexts/ThemeContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { LoadingScreen } from '@/components/LoadingScreen';
import { Toaster } from 'sonner';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import DashboardLayout from '@/pages/DashboardLayout';
import Dashboard from '@/pages/Dashboard';
import ApiKeys from '@/pages/ApiKeys';
import Transactions from '@/pages/Transactions';
import Docs from '@/pages/Docs';
import Settings from '@/pages/Settings';
import Alerts from '@/pages/Alerts';
import Analytics from '@/pages/Analytics';
import Team from '@/pages/Team';
import Billing from '@/pages/Billing';
import Profile from '@/pages/Profile';
import Landing from '@/pages/Landing';
import DevPortal from '@/pages/DevPortal';
import Integrations from '@/pages/Integrations';
import Disputes from '@/pages/Disputes';
import DisputeDetail from '@/pages/DisputeDetail';
import Simulator from '@/pages/Simulator';
import RiskAudit from '@/pages/RiskAudit';
import PrivacyPolicy from '@/pages/legal/PrivacyPolicy';
import TermsOfService from '@/pages/legal/TermsOfService';
import DataProcessingAgreement from '@/pages/legal/DataProcessingAgreement';
import ServiceLevelAgreement from '@/pages/legal/ServiceLevelAgreement';
import CookiePolicy from '@/pages/legal/CookiePolicy';
import SecurityPolicy from '@/pages/legal/SecurityPolicy';
import CookieConsent from '@/components/CookieConsent';
import PageTitleTracker from '@/components/PageTitleTracker';
import { useAutoLogout } from '@/hooks/useAutoLogout';
import NotFound from '@/pages/NotFound';
import ThankYou from '@/pages/ThankYou';

function App() {
  useAutoLogout();
  return (
    <ThemeProvider>
      <BrowserRouter>
        <ErrorBoundary>
          <Toaster position="top-right" richColors closeButton theme="dark" />
          <CookieConsent />
          <PageTitleTracker />
          <Suspense fallback={<LoadingScreen message="Loading telemetry..." />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/thank-you" element={<ThankYou />} />
            <Route path="/welcome" element={<ThankYou />} />
            <Route path="/docs" element={<Docs />} />
            <Route path="/developers" element={<DevPortal />} />
            <Route path="/simulator" element={<Simulator />} />
            <Route path="/demo" element={<Simulator />} />
            <Route path="/audit" element={<RiskAudit />} />
            <Route path="/risk-audit" element={<RiskAudit />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/dpa" element={<DataProcessingAgreement />} />
            <Route path="/sla" element={<ServiceLevelAgreement />} />
            <Route path="/cookies" element={<CookiePolicy />} />
            <Route path="/security" element={<SecurityPolicy />} />
            <Route path="*" element={<NotFound />} />

            
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="simulator" element={<Simulator />} />
                <Route path="audit" element={<RiskAudit />} />
                <Route path="profile" element={<Profile />} />
                <Route path="api-keys" element={<ApiKeys />} />
                <Route path="transactions" element={<Transactions />} />
                <Route path="disputes" element={<Disputes />} />
                <Route path="disputes/:disputeId" element={<DisputeDetail />} />
                <Route path="alerts" element={<Alerts />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="integrations" element={<Integrations />} />
                <Route path="team" element={<Team />} />
                <Route path="billing" element={<Billing />} />
                <Route path="settings" element={<Settings />} />
                <Route path="docs" element={<Docs />} />
              </Route>
            </Route>
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  </ThemeProvider>
  );
}

export default App;

