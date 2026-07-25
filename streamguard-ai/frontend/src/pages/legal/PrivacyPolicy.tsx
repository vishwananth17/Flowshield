import React from 'react';
import LegalLayout from '@/components/legal/LegalLayout';
import LegalSection from '@/components/legal/LegalSection';
import LegalTable from '@/components/legal/LegalTable';

export default function PrivacyPolicy() {
  const sections = [
    { id: 'introduction', title: '1. Introduction & Who We Are' },
    { id: 'definitions', title: '2. Definitions' },
    { id: 'data-collect', title: '3. Data We Collect' },
    { id: 'purpose', title: '4. Why We Collect This Data' },
    { id: 'retention', title: '5. Data Retention' },
    { id: 'sharing', title: '6. Data Sharing and Third Parties' },
    { id: 'localisation', title: '7. Data Localisation' },
    { id: 'rights', title: '8. Your Rights Under DPDP Act 2023' },
    { id: 'security', title: '9. Security Measures' },
    { id: 'cookies', title: '10. Cookies' },
    { id: 'children', title: '11. Children\'s Privacy' },
    { id: 'changes', title: '12. Changes to This Policy' },
    { id: 'contact', title: '13. Contact & Grievance Officer' },
  ];

  const definitionsHeaders = ['Term', 'Definition'];
  const definitionsRows = [
    ['"We/Us/Our"', 'Flowshield AI and its operators (operated by Vishwanath B, Chennai, India).'],
    ['"Customer"', 'Businesses and merchant organizations using our API for real-time fraud analysis.'],
    ['"End User"', 'Individuals whose transactions and checkout details are analyzed by our system.'],
    ['"Personal Data"', 'Any data about an individual who is identifiable by or in relation to such data.'],
    ['"Data Fiduciary"', 'Our API customer (the business) who determines the purpose and means of processing personal data.'],
    ['"Data Processor"', 'Flowshield AI, which processes personal data on behalf of the Data Fiduciary (the business customer).'],
    ['"Transaction Data"', 'Payment signals, metadata, and device info sent to our API for risk scoring.'],
  ];

  const purposeHeaders = ['Data Type', 'Purpose', 'Legal Basis'];
  const purposeRows = [
    ['Email/Name', 'Account setup, management, dashboard authentication, and customer support.', 'Contract performance'],
    ['Billing info', 'Processing subscription payments through Razorpay integration.', 'Contract performance'],
    ['Transaction signals', 'Real-time transaction fraud scoring using machine learning algorithms.', 'Legitimate interest + Contract'],
    ['IP addresses', 'Fraud geolocation analysis and checking for proxy/VPN usage.', 'Legitimate interest'],
    ['Device fingerprint', 'Device anomaly checks, fraud ring mitigation, and device identity matching.', 'Legitimate interest'],
    ['Usage logs', 'API rate limiting, abuse detection, and system maintenance.', 'Legitimate interest'],
    ['Analytics data', 'Product improvement, ML model recalibration, and performance logging.', 'Legitimate interest'],
  ];

  const retentionHeaders = ['Data Type', 'Retention Period', 'Reason'];
  const retentionRows = [
    ['Account data', 'Duration of account relationship + 90 days', 'Contractual obligation & account recovery.'],
    ['Transaction records', '12 months (Growth/Enterprise plan)', 'Customer audit trails, dispute analysis, and custom training.'],
    ['Transaction records', '90 days (Basic plan)', 'Plan tier limitation.'],
    ['Transaction records', '30 days (Free plan)', 'Plan tier limitation.'],
    ['Billing records', '7 years', 'Compliance with Indian tax laws and auditing regulations.'],
    ['Security logs', '6 months', 'Security incident investigation and traffic audit logs.'],
    ['Anonymized analytics', '3 years', 'Product improvement and machine learning regression evaluations.'],
  ];

  const sharingHeaders = ['Sub-processor', 'Purpose', 'Location', 'Safeguards'];
  const sharingRows = [
    ['Amazon Web Services (AWS)', 'Cloud infrastructure, hosting, and compute services.', 'India (ap-south-1, Mumbai)', 'ISO 27001, SOC 2, strict VPC isolation.'],
    ['Railway', 'Backend application hosting and container orchestration.', 'United States', 'Transit encryption, access logging.'],
    ['Neon Technologies', 'Serverless PostgreSQL database hosting.', 'United States', 'Encrypted at rest, logical partition isolation.'],
    ['Upstash', 'Serverless Redis cache and Kafka streaming queue.', 'United States', 'Encryption in transit, key authentication.'],
    ['Razorpay', 'Payment processing and subscription billing.', 'India', 'PCI DSS Level 1 certified.'],
  ];

  return (
    <LegalLayout
      title="Privacy Policy"
      subtitle="How we collect, process, and protect your information under the DPDP Act 2023 and payment guidelines."
      lastUpdated="April 2026"
      effectiveDate="April 1, 2026"
      sections={sections}
    >
      <LegalSection id="introduction" number="1" title="Introduction & Who We Are">
        <p>
          Flowshield AI is a real-time fraud detection API platform operated by Vishwanath B (trading as Flowshield AI), based at Kings Engineering College, Chennai, Tamil Nadu, India.
        </p>
        <p>
          We operate as a <strong>Data Processor</strong> under India's Digital Personal Data Protection Act 2023 (DPDP Act). We process transaction details and device identifiers on behalf of our business customers (who act as <strong>Data Fiduciaries</strong>) to detect and prevent fraudulent transactions, reduce chargebacks, and protect financial pipelines in real time.
        </p>
        <p>
          This privacy policy explains what personal data we collect, why we collect it, how we protect it, and how end users and customers can exercise their legal rights.
        </p>
      </LegalSection>

      <LegalSection id="definitions" number="2" title="Definitions">
        <p>
          To ensure transparency, the following terms used throughout this document have the definitions described below:
        </p>
        <LegalTable headers={definitionsHeaders} rows={definitionsRows} />
      </LegalSection>

      <LegalSection id="data-collect" number="3" title="Data We Collect">
        <p>
          We limit data collection to what is strictly necessary to perform real-time fraud analysis.
        </p>
        
        <h3 className="text-white font-medium text-sm mt-4">3.1 Data from API Customers (Businesses):</h3>
        <ul className="list-disc list-inside pl-4 space-y-2 mt-2">
          <li>Full name and work email address of the account owner.</li>
          <li>Organization/Company name.</li>
          <li>Billing and transaction details (processed securely via Razorpay; we do not store full card details or credentials).</li>
          <li>API usage logs, including request timestamps, request volumes, and success rates.</li>
          <li>IP addresses from which the API keys and dashboards are accessed.</li>
        </ul>

        <h3 className="text-white font-medium text-sm mt-6">3.2 Transaction Data (Processed on behalf of Customers):</h3>
        <p className="mt-2 text-red-400 font-semibold flex items-center">
          ❌ We DO NOT require, collect, or store any of the following sensitive parameters:
        </p>
        <ul className="list-none pl-4 space-y-1 mt-1 text-slate-400 font-mono text-xs">
          <li>🚫 Full Credit Card / Debit Card Numbers (PAN)</li>
          <li>🚫 Card Security Codes (CVV / CVC)</li>
          <li>🚫 Aadhaar Numbers</li>
          <li>🚫 Permanent Account Numbers (PAN CARD)</li>
          <li>🚫 Full Names of End Users</li>
          <li>🚫 Bank Account Numbers / Netbanking Passwords</li>
        </ul>

        <p className="mt-4 text-emerald-400 font-semibold flex items-center">
          ✅ We collect and process ONLY the following fraud signal indicators:
        </p>
        <ul className="list-none pl-4 space-y-1 mt-1 text-slate-400 font-mono text-xs">
          <li>✔️ Transaction amount and currency</li>
          <li>✔️ Last 4 digits of card (optional payload)</li>
          <li>✔️ Merchant name and category code (MCC)</li>
          <li>✔️ Customer ID (anonymized/hashed value as provided by your platform)</li>
          <li>✔️ IP address (used to parse country/city and check velocity indicators)</li>
          <li>✔️ Device fingerprint hash (cryptographically anonymized hash)</li>
          <li>✔️ Country and City (parsed at gateway; no precise GPS coordinates)</li>
          <li>✔️ Transaction channel (web / mobile / pos)</li>
          <li>✔️ Request timestamp</li>
        </ul>

        <h3 className="text-white font-medium text-sm mt-6">3.3 Automatically Collected Data:</h3>
        <p className="mt-2">
          When you access our dashboard or marketing website, we automatically collect browser type, operating system version, referring URL, visited pages, and session duration for security diagnostics and optimization.
        </p>
      </LegalSection>

      <LegalSection id="purpose" number="4" title="Why We Collect This Data (Purpose Limitation)">
        <p>
          In accordance with the DPDP Act 2023, data is processed solely for specific, pre-determined purposes. The legal bases for our processing operations are detailed below:
        </p>
        <LegalTable headers={purposeHeaders} rows={purposeRows} />
      </LegalSection>

      <LegalSection id="retention" number="5" title="Data Retention">
        <p>
          We do not retain personal data longer than necessary to fulfill the purposes of processing or to comply with statutory legal requirements.
        </p>
        <LegalTable headers={retentionHeaders} rows={retentionRows} />
        <p className="mt-4">
          Once the retention period expires, the transaction data is permanently deleted or irreversibly anonymized within 30 days.
        </p>
      </LegalSection>

      <LegalSection id="sharing" number="6" title="Data Sharing and Third Parties">
        <p>
          We utilize highly secure sub-processors to run our cloud gateway. All data transfers between our backend and these providers are encrypted in transit.
        </p>
        <LegalTable headers={sharingHeaders} rows={sharingRows} />
        <p className="mt-4 font-semibold text-white">
          Our Data Commitment:
        </p>
        <ul className="list-disc list-inside pl-4 space-y-2 mt-2">
          <li>We do NOT sell or license personal data to third parties.</li>
          <li>We do NOT share transaction data between different customers. Each organization's data is isolated.</li>
          <li>We do NOT use transaction data to train models for your direct competitors.</li>
          <li>We do NOT share data with government agencies unless forced by a valid court order under Indian law.</li>
        </ul>
      </LegalSection>

      <LegalSection id="localisation" number="7" title="Data Localisation">
        <p>
          In strict compliance with Reserve Bank of India (RBI) directives on payment data storage, we store all transaction logs, payment signals, and related transaction details on secure cloud servers located within India (AWS ap-south-1, Mumbai region).
        </p>
        <p>
          Analytics and dashboard configuration data may be processed on servers outside India (e.g., US servers hosted by Railway/Neon) with adequate safeguards and end-to-end encryption in place to prevent unauthorized exposure.
        </p>
      </LegalSection>

      <LegalSection id="rights" number="8" title="Your Rights Under DPDP Act 2023">
        <p>
          If you are an individual residing in India (Data Principal), you possess the following statutory rights under the DPDP Act 2023. Note that since we process transaction signals as a Data Processor on behalf of our customers, requests regarding end-user data are typically routed through the respective customer (the Data Fiduciary):
        </p>
        
        <h3 className="text-white font-medium text-sm mt-4">8.1 Right to Access:</h3>
        <p className="pl-4 mt-1">
          You have the right to request a copy of the personal data we hold about you and details of processing activities. We will respond within 30 days.
        </p>

        <h3 className="text-white font-medium text-sm mt-4">8.2 Right to Correction:</h3>
        <p className="pl-4 mt-1">
          You can request correction of inaccurate, incomplete, or outdated personal data.
        </p>

        <h3 className="text-white font-medium text-sm mt-4">8.3 Right to Erasure:</h3>
        <p className="pl-4 mt-1">
          You may request deletion of your personal data, subject to legal, tax, or regulatory retention requirements. Erasure is processed within 30 days.
        </p>

        <h3 className="text-white font-medium text-sm mt-4">8.4 Right to Grievance Redressal:</h3>
        <p className="pl-4 mt-1">
          You may raise complaints with our Grievance Officer. If unsatisfied, you can escalate the matter to the Data Protection Board of India (DPBI) once formally constituted.
        </p>

        <h3 className="text-white font-medium text-sm mt-4">8.5 Right to Nomination:</h3>
        <p className="pl-4 mt-1">
          You have the right to nominate another individual to exercise your data principal rights in the event of death or incapacity.
        </p>

        <p className="mt-4">
          To exercise any of these rights, email us at <a href="mailto:legal@flowshieldai.com" className="text-blue-500 underline">legal@flowshieldai.com</a> with the subject line <strong>"DPDP Rights Request — [your right]"</strong>.
        </p>
      </LegalSection>

      <LegalSection id="security" number="9" title="Security Measures">
        <p>
          We implement top-tier technical and organizational measures to safeguard data:
        </p>
        <ul className="list-disc list-inside pl-4 space-y-2 mt-2">
          <li><strong>Encryption:</strong> AES-256 encryption at rest, and TLS 1.2+ for all data in transit.</li>
          <li><strong>API Security:</strong> Hashed API keys (SHA-256) are never stored in plaintext.</li>
          <li><strong>Access Control:</strong> Strict role-based access controls (RBAC) on a need-to-know basis.</li>
          <li><strong>Vulnerability Auditing:</strong> Automated dependency scanning and regular code checks.</li>
        </ul>
        <p className="mt-4">
          In the event of a confirmed data breach affecting your information, we will notify affected customers within 72 hours of verification.
        </p>
      </LegalSection>

      <LegalSection id="cookies" number="10" title="Cookies">
        <p>
          Our marketing site uses cookies to remember your preferences and analyze traffic. For detailed configurations, see our <a href="/cookies" className="text-blue-500 underline">Cookie Policy</a>. Our API endpoints do not utilize third-party cookies or tracker scripts.
        </p>
      </LegalSection>

      <LegalSection id="children" number="11" title="Children's Privacy">
        <p>
          Our services are designed strictly for businesses and are not marketed to or intended for individuals under 18 years of age. We do not knowingly collect personal data from minors.
        </p>
      </LegalSection>

      <LegalSection id="changes" number="12" title="Changes to This Policy">
        <p>
          We will notify registered customers of material changes to this policy by email at least 30 days before they become effective. Continued use of the platform after the effective date constitutes acceptance of the updated policy.
        </p>
      </LegalSection>

      <LegalSection id="contact" number="13" title="Contact & Grievance Officer">
        <p>
          If you have questions, complaints, or grievance requests under the DPDP Act 2023, you can contact our Data Grievance Officer:
        </p>
        <div className="bg-[var(--bg-inset)] rounded-[var(--radius-md)] p-4 mt-2 font-mono text-xs space-y-1.5 border border-[var(--border-default)]">
          <p><span className="text-[var(--text-gold)]">Name:</span> Vishwanath B</p>
          <p><span className="text-[var(--text-gold)]">Email:</span> legal@flowshieldai.com</p>
          <p><span className="text-[var(--text-gold)]">Address:</span> Kings Engineering College, Chennai, Tamil Nadu, India</p>
          <p><span className="text-[var(--text-gold)]">Response time:</span> Within 30 days of receipt</p>
        </div>
      </LegalSection>
    </LegalLayout>
  );
}
