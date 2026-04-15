import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '@/components/ProtectedRoute';
import { ErrorBoundary } from '@/components/ErrorBoundary';
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

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/docs" element={<Docs />} />
          
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="profile" element={<Profile />} />
              <Route path="api-keys" element={<ApiKeys />} />
              <Route path="transactions" element={<Transactions />} />
              <Route path="alerts" element={<Alerts />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="team" element={<Team />} />
              <Route path="billing" element={<Billing />} />
              <Route path="settings" element={<Settings />} />
              <Route path="docs" element={<Docs />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;

