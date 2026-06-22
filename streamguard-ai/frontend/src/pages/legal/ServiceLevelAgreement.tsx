import React from 'react';
import LegalLayout from '@/components/legal/LegalLayout';
import LegalSection from '@/components/legal/LegalSection';
import LegalTable from '@/components/legal/LegalTable';

export default function ServiceLevelAgreement() {
  const sections = [
    { id: 'overview', title: '1. Overview and Scope' },
    { id: 'uptime', title: '2. Uptime Commitment' },
    { id: 'performance', title: '3. Performance Targets' },
    { id: 'support', title: '4. Support Response Times' },
    { id: 'credits', title: '5. SLA Credits' },
    { id: 'maintenance', title: '6. Scheduled Maintenance' },
    { id: 'incident', title: '7. Incident Communication' },
    { id: 'exclusions', title: '8. Exclusions' },
  ];

  const uptimeHeaders = ['Plan Tier', 'Monthly Uptime Commitment', 'Maximum Allowable Downtime / Month'];
  const uptimeRows = [
    ['Basic', '99.5%', '3.65 hours'],
    ['Growth', '99.9%', '43.8 minutes'],
    ['Enterprise', '99.95%', '21.9 minutes'],
  ];

  const perfHeaders = ['Metric', 'Performance Target', 'Measurement Window'];
  const perfRows = [
    ['API Response Time (P50)', '< 50ms', 'Monthly average'],
    ['API Response Time (P95)', '< 150ms', 'Monthly average'],
    ['API Response Time (P99)', '< 300ms', 'Monthly average'],
    ['Fraud Detection Latency', '< 100ms', 'P99 target'],
    ['Dashboard Load Time', '< 3 seconds', 'Monthly average'],
    ['WebSocket Connection', '< 2 seconds', 'Time to first message'],
  ];

  const supportHeaders = ['Severity Level', 'Description', 'Basic Support', 'Growth Support', 'Enterprise Support'];
  const supportRows = [
    ['P1 Critical', 'Production API is completely down and failing for all requests.', '4 hours', '1 hour', '30 minutes (24/7)'],
    ['P2 High', 'A major feature (e.g. webhooks or dashboard) is broken with no workaround.', '24 hours', '4 hours', '2 hours'],
    ['P3 Medium', 'A feature is degraded or failing sporadically; workarounds exist.', '72 hours', '24 hours', '8 hours'],
    ['P4 Low', 'General questions, integration advice, and product feedback.', '5 days', '48 hours', '24 hours'],
  ];

  const creditHeaders = ['Uptime Achieved in Billing Cycle', 'SLA Billing Credit (% of monthly fee)'];
  const creditRows = [
    ['99.0% to 99.9% (Growth Plan)', '10% credit applied to next invoice'],
    ['98.0% to 99.0%', '25% credit applied to next invoice'],
    ['95.0% to 98.0%', '50% credit applied to next invoice'],
    ['Below 95.0%', '100% credit (one month subscription free)'],
  ];

  return (
    <LegalLayout
      title="Service Level Agreement (SLA)"
      subtitle="Uptime targets, performance latency benchmarks, support response tiers, and invoice credit schedules."
      lastUpdated="April 2026"
      effectiveDate="April 1, 2026"
      sections={sections}
    >
      <LegalSection id="overview" number="1" title="Overview and Scope">
        <p>
          This Service Level Agreement ("SLA") defines the operational performance standards and support commitments provided by Flowshield AI. This SLA applies strictly to paid subscription plans (Basic, Growth, and Enterprise tiers).
        </p>
        <p>
          Customers on our Free plan receive best-effort support and availability with no uptime guarantees, performance targets, or SLA billing credit applicability.
        </p>
      </LegalSection>

      <LegalSection id="uptime" number="2" title="Uptime Commitment">
        <p>
          Flowshield AI commits to maintaining high availability for our core REST API transaction analysis endpoint. The uptime commitment varies by pricing tier:
        </p>
        <LegalTable headers={uptimeHeaders} rows={uptimeRows} />
        <p className="mt-4">
          <strong>Definition of Downtime:</strong> Downtime is defined as any period where the core fraud analysis endpoint (`/v1/transactions/analyze`) returns HTTP 5xx server errors for more than 5 consecutive minutes, as measured by our external, independent synthetic monitoring systems.
        </p>
        <p className="mt-2 text-slate-400">
          Uptime calculations exclude periods of scheduled maintenance, emergency security patches, client-side network routing issues, DNS propagation delays outside our control, or failures of downstream customer servers.
        </p>
      </LegalSection>

      <LegalSection id="performance" number="3" title="Performance Targets">
        <p>
          We architect our transaction processing gateway for sub-second latency. Our targeted performance metrics are detailed below:
        </p>
        <LegalTable headers={perfHeaders} rows={perfRows} />
        <p className="mt-4">
          These performance benchmarks represent average targets. Outage credits do not apply to latency targets; SLA invoice credits are tied exclusively to the Uptime Commitment.
        </p>
      </LegalSection>

      <LegalSection id="support" number="4" title="Support Response Times">
        <p>
          Flowshield AI provides technical support. Support hours are Monday to Friday, 9:00 AM to 6:00 PM IST (Indian Standard Time), except for Enterprise P1 issues, which are monitored 24/7.
        </p>
        <LegalTable headers={supportHeaders} rows={supportRows} />
        
        <h3 className="text-white font-medium text-sm mt-6">Support Channels by Plan Tier:</h3>
        <ul className="list-disc list-inside pl-4 space-y-2 mt-2">
          <li><strong>Free Plan:</strong> Public GitHub Issues page only. Best-effort responses.</li>
          <li><strong>Basic Plan:</strong> Email support via <a href="mailto:legal@flowshieldai.com" className="text-blue-500 underline">legal@flowshieldai.com</a>.</li>
          <li><strong>Growth Plan:</strong> Priority email support with a 24-hour response SLA.</li>
          <li><strong>Enterprise Plan:</strong> Dedicated Slack channel + 24/7 emergency phone line for P1 Critical outages.</li>
        </ul>
      </LegalSection>

      <LegalSection id="credits" number="5" title="SLA Credits">
        <p>
          If Flowshield AI fails to meet its uptime commitments in a given billing cycle, you are eligible to claim a billing credit. Credits are calculated as a percentage of your monthly subscription fee:
        </p>
        <LegalTable headers={creditHeaders} rows={creditRows} />
        
        <h3 className="text-white font-medium text-sm mt-6">How to Claim Credits:</h3>
        <p className="mt-1">
          To receive an SLA credit, your organization must submit a claim by emailing <a href="mailto:legal@flowshieldai.com" className="text-blue-500 underline">legal@flowshieldai.com</a> within 30 days of the incident. The claim email must contain:
        </p>
        <ul className="list-disc list-inside pl-4 space-y-1.5 mt-2">
          <li>The date and time of the alleged outage.</li>
          <li>The duration and timestamp logs of the failed API calls.</li>
          <li>The exact HTTP error responses received.</li>
        </ul>
        <p className="mt-4">
          Upon validation, Flowshield AI will apply the credit to your next invoice within 15 business days. Credits are non-transferable, cannot be redeemed for cash, and are capped at 100% of the monthly fee.
        </p>
      </LegalSection>

      <LegalSection id="maintenance" number="6" title="Scheduled Maintenance">
        <p>
          We periodically perform database maintenance and model deployments to ensure the stability of the platform.
        </p>
        <ul className="list-disc list-inside pl-4 space-y-2 mt-2">
          <li><strong>Preferred Maintenance Window:</strong> Sundays between 2:00 AM and 6:00 AM IST.</li>
          <li><strong>Advance Notice:</strong> We will provide at least 48 hours notice via email and dashboard announcements for scheduled downtime.</li>
          <li><strong>Status Tracker:</strong> Check current schedules at `status.flowshieldai.com`.</li>
          <li><strong>Emergency Actions:</strong> Critical security vulnerabilities or server failures may require immediate offline patching. We will notify customers as soon as possible in these circumstances.</li>
        </ul>
      </LegalSection>

      <LegalSection id="incident" number="7" title="Incident Communication">
        <p>
          In the event of service degradation, our engineering team updates the status page at `status.flowshieldai.com`. Status updates transition through the following states:
        </p>
        <ul className="list-disc list-inside pl-4 space-y-1.5 mt-2">
          <li><strong>Investigating:</strong> We have detected anomalies and are identifying the root cause.</li>
          <li><strong>Identified:</strong> Root cause is determined; engineers are developing a hotfix.</li>
          <li><strong>Monitoring:</strong> Hotfix is deployed; we are monitoring API responses for stability.</li>
          <li><strong>Resolved:</strong> Normal operations are restored. A post-mortem report will be shared within 48 hours for critical outages.</li>
        </ul>
      </LegalSection>

      <LegalSection id="exclusions" number="8" title="Exclusions">
        <p>
          This SLA does not apply to any performance or availability issues caused by:
        </p>
        <ul className="list-disc list-inside pl-4 space-y-1.5 mt-2">
          <li>Factors outside our reasonable control (e.g. natural disasters, major internet routing failures, government blockades).</li>
          <li>Issues resulting from your own code, software configurations, or database connections.</li>
          <li>Outages of third-party payment infrastructure partners (such as Razorpay or Stripe).</li>
          <li>Beta, preview, or testing sandbox features (which are provided strictly "as-is" without warranty).</li>
        </ul>
      </LegalSection>
    </LegalLayout>
  );
}
