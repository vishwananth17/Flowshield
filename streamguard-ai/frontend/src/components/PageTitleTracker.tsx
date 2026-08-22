import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ROUTE_TITLES: Record<string, string> = {
  '/': 'Flowshield AI | Autonomous Fraud Detection & Dispute Defense',
  '/docs': 'API Reference & Quickstart | Flowshield AI',
  '/developers': 'Developer Portal & Rule Simulator | Flowshield AI',
  '/privacy': 'Privacy Policy & DPDP Act 2023 | Flowshield AI',
  '/terms': 'Terms of Service & Master Agreement | Flowshield AI',
  '/dpa': 'Data Processing Agreement | Flowshield AI',
  '/sla': 'Service Level Agreement (99.98% SLA) | Flowshield AI',
  '/cookies': 'Cookie Policy & Consent | Flowshield AI',
  '/security': 'Security Architecture & PCI Posture | Flowshield AI',
  '/login': 'Sign In to Merchant Console | Flowshield AI',
  '/register': 'Create Sandbox Account | Flowshield AI',
  '/thank-you': 'Welcome to Flowshield AI | Account Provisioned',
  '/dashboard': 'Intelligence Console | Flowshield AI',
  '/dashboard/transactions': 'Live Transactions Feed | Flowshield AI',
  '/dashboard/disputes': 'Automated Dispute Defense | Flowshield AI',
  '/dashboard/alerts': 'Real-Time Anomaly Alerts | Flowshield AI',
  '/dashboard/analytics': 'Forensics & Institutional Reports | Flowshield AI',
  '/dashboard/integrations': 'Payment Gateway & Carrier Sync | Flowshield AI',
  '/dashboard/api-keys': 'API Keys & Secrets Vault | Flowshield AI',
  '/dashboard/team': 'Access Control & Team RBAC | Flowshield AI',
  '/dashboard/billing': 'Subscription & Unit Economics | Flowshield AI',
  '/dashboard/settings': 'Organization Settings | Flowshield AI',
  '/dashboard/profile': 'User Profile & Credentials | Flowshield AI',
};

export default function PageTitleTracker() {
  const location = useLocation();

  useEffect(() => {
    const title = ROUTE_TITLES[location.pathname] || 'Flowshield AI | Autonomous Fraud Intelligence';
    document.title = title;
  }, [location.pathname]);

  return null;
}
