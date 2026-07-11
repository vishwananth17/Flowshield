import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '@/components/ProtectedRoute';
import { ErrorBoundary } from '@/components/ErrorBoundary';
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
import PrivacyPolicy from '@/pages/legal/PrivacyPolicy';
import TermsOfService from '@/pages/legal/TermsOfService';
import DataProcessingAgreement from '@/pages/legal/DataProcessingAgreement';
import ServiceLevelAgreement from '@/pages/legal/ServiceLevelAgreement';
import CookiePolicy from '@/pages/legal/CookiePolicy';
import SecurityPolicy from '@/pages/legal/SecurityPolicy';
import CookieConsent from '@/components/CookieConsent';
import { useAutoLogout } from '@/hooks/useAutoLogout';

function App() {
  useAutoLogout();
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Toaster position="top-right" richColors />
        <CookieConsent />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/docs" element={<Docs />} />
          <Route path="/developers" element={<DevPortal />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/dpa" element={<DataProcessingAgreement />} />
          <Route path="/sla" element={<ServiceLevelAgreement />} />
          <Route path="/cookies" element={<CookiePolicy />} />
          <Route path="/security" element={<SecurityPolicy />} />
          {/* Legacy Decommissioned Routes */}
          <Route path="/demo" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />

          
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<Dashboard />} />
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
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;

