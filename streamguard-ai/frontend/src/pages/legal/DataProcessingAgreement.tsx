import React from 'react';
import LegalLayout from '@/components/legal/LegalLayout';
import LegalSection from '@/components/legal/LegalSection';
import LegalTable from '@/components/legal/LegalTable';

export default function DataProcessingAgreement() {
  const sections = [
    { id: 'introduction', title: 'Introduction' },
    { id: 'definitions', title: '1. Definitions' },
    { id: 'scope', title: '2. Scope and Nature of Processing' },
    { id: 'customer-obligations', title: '3. Customer Obligations (Data Fiduciary)' },
    { id: 'processor-obligations', title: '4. Flowshield AI Obligations (Data Processor)' },
    { id: 'subprocessors', title: '5. Sub-processors' },
    { id: 'transfers', title: '6. International Data Transfers' },
    { id: 'security-audits', title: '7. Security and Audits' },
    { id: 'breach-notification', title: '8. Data Breach Notification' },
    { id: 'deletion', title: '9. Data Deletion' },
    { id: 'liability', title: '10. Liability' },
    { id: 'governing-law', title: '11. Governing Law' },
    { id: 'schedule-a', title: 'Schedule A — Sub-processors' },
    { id: 'schedule-b', title: 'Schedule B — Security Measures' },
  ];

  const defHeaders = ['Data Role / Term', 'Definition under DPDP Act 2023'];
  const defRows = [
    ['Data Fiduciary', 'The Customer organization using the API who determines the purpose and means of personal data processing.'],
    ['Data Processor', 'Flowshield AI (operated by Vishwanath B), which processes personal data on behalf of the Data Fiduciary.'],
    ['Data Principal', 'The end user whose transaction is analyzed to verify potential fraud indicators.'],
    ['Processing', 'Any automated or manual operation performed on personal data (collection, structuring, storage, analysis, deletion).'],
    ['Personal Data Breach', 'Any unauthorized access, sharing, alteration, loss, or destruction of personal data.'],
    ['Sub-processor', 'Any third-party cloud database or infrastructure service provider engaged by Flowshield AI.'],
    ['Instructions', 'The Customer\'s documented API configurations, request payloads, and service integrations.'],
  ];

  const fieldHeaders = ['Data Field', 'Purpose in Fraud Detection', 'Requirement Status'];
  const fieldRows = [
    ['Transaction Amount & Currency', 'Used to identify abnormal transaction volumes and values.', 'Required'],
    ['Last 4 Digits of Card', 'Used to analyze card reuse velocity without capturing full PAN numbers.', 'Optional'],
    ['Merchant ID & Category Code', 'Used to trace cross-merchant velocity and industry risk indexes.', 'Required'],
    ['Customer ID', 'Anonymized string used to map velocity histories for a single customer identity.', 'Required'],
    ['IP Address', 'Used to extract geolocation signals and identify proxy/VPN routing discrepancies.', 'Required'],
    ['Device Fingerprint Hash', 'Anonymized device identifiers used to detect automated bots and card testing.', 'Required'],
    ['Transaction Timestamp', 'Required to calculate transaction rates, sequence timings, and velocity thresholds.', 'Required'],
  ];

  const subHeaders = ['Sub-processor', 'Service Provided', 'Data Processed', 'Location', 'Compliance / Safeguards'];
  const subRows = [
    ['AWS Mumbai', 'Cloud Hosting, Compute, & Storage', 'All database backups, transaction logs, and analytical data', 'India (ap-south-1)', 'ISO 27001, SOC 2 Type II, physically secured datacenters.'],
    ['Railway', 'Application Server Hosting', 'Temporary application runtime logs', 'United States', 'End-to-end TLS transit, automated load balancing.'],
    ['Neon', 'Serverless PostgreSQL Database', 'Account records, billing states, and transaction indices', 'United States', 'AES-256 at-rest database encryption, row-level access control.'],
    ['Upstash', 'Redis Cache & Kafka Queue', 'Real-time transaction queue cache (deleted in 24 hours)', 'United States', 'Hashed storage, transit encryption.'],
    ['Razorpay', 'Payment Gateway Integration', 'Customer email, Billing name, GSTIN, and card invoices', 'India', 'PCI DSS Level 1 Certified.'],
  ];

  return (
    <LegalLayout
      title="Data Processing Agreement (DPA)"
      subtitle="B2B compliance agreement detailing instructions, data processing structures, sub-processors, and DPDP Act guarantees."
      lastUpdated="April 2026"
      effectiveDate="April 1, 2026"
      sections={sections}
    >
      <LegalSection id="introduction" number="0" title="Introduction">
        <p>
          This Data Processing Agreement ("DPA") forms a legally binding addendum to the Terms of Service between Flowshield AI ("Data Processor") and the Customer ("Data Fiduciary"). It governs the processing of transaction metadata and personal data provided by the Customer through the Flowshield AI REST API.
        </p>
        <p>
          This DPA is structured to comply with:
        </p>
        <ul className="list-disc list-inside pl-4 space-y-2">
          <li><strong>India's Digital Personal Data Protection Act 2023 ("DPDP Act")</strong> guidelines on processor engagements.</li>
          <li>The Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011.</li>
          <li>Reserve Bank of India (RBI) master directions on digital payment security and payment data localisation.</li>
        </ul>
      </LegalSection>

      <LegalSection id="definitions" number="1" title="Definitions">
        <p>
          The terminology in this DPA is aligned with terms defined under Section 2 of the DPDP Act 2023:
        </p>
        <LegalTable headers={defHeaders} rows={defRows} />
      </LegalSection>

      <LegalSection id="scope" number="2" title="Scope and Nature of Processing">
        <p>
          <strong>2.1 Subject Matter:</strong> Flowshield AI processes transaction signals on behalf of the Customer to score transaction risks and prevent checkout fraud.
        </p>
        <p>
          <strong>2.2 Duration:</strong> The processing of data under this DPA will continue until the expiration or termination of the Customer's subscription, plus the standard data deletion cycle.
        </p>
        <p>
          <strong>2.3 Nature of Processing:</strong> We collect payload signals, analyze behavior using ML models, generate risk reports, trigger alert webhooks, and store audit logs.
        </p>
        <p>
          <strong>2.4 Categories of Data Principals:</strong> Customers' end users, checkout buyers, and cardholders using the Customer's apps or websites.
        </p>
        <p>
          <strong>2.5 Types of Personal Data Processed:</strong> The exact data fields processed by Flowshield AI and their requirements are listed below:
        </p>
        <LegalTable headers={fieldHeaders} rows={fieldRows} />
      </LegalSection>

      <LegalSection id="customer-obligations" number="3" title="Customer Obligations (Data Fiduciary)">
        <p>
          The Customer (Data Fiduciary) agrees to the following covenants:
        </p>
        <p>
          <strong>3.1 User Consent:</strong> The Customer must obtain valid, explicit consent from its end users (Data Principals) before sharing their transaction details with Flowshield AI, as mandated by the DPDP Act 2023.
        </p>
        <p>
          <strong>3.2 Lawful Basis:</strong> The Customer must establish a clear lawful basis (such as consent or legitimate business interest under the DPDP Act) for fraud prevention processing.
        </p>
        <p>
          <strong>3.3 Data Minimisation:</strong> The Customer must only transmit fields necessary for risk evaluations.
        </p>
        <p>
          <strong>3.4 No Sensitive PII:</strong> The Customer must NOT transmit credit card CVVs, full card numbers, bank passwords, Aadhaar numbers, or PAN numbers to Flowshield AI.
        </p>
        <p>
          <strong>3.5 Privacy Policy Disclosure:</strong> The Customer must maintain a public privacy policy disclosing the use of third-party fraud scoring tools (like Flowshield AI).
        </p>
        <p>
          <strong>3.6 Handling DSRs:</strong> The Customer must handle data principal rights requests and notify Flowshield AI within 5 business days if deletion is required.
        </p>
        <p>
          <strong>3.7 Legal Compliance:</strong> The Customer warrants that all transaction data sent to Flowshield AI has been collected in accordance with applicable Indian laws.
        </p>
      </LegalSection>

      <LegalSection id="processor-obligations" number="4" title="Flowshield AI Obligations (Data Processor)">
        <p>
          Flowshield AI (Data Processor) agrees to:
        </p>
        <p>
          <strong>4.1 Documented Instructions:</strong> Process personal data only on documented instructions from the Customer, unless required by Indian statutory laws.
        </p>
        <p>
          <strong>4.2 Confidentiality:</strong> Ensure that all employees and engineers authorized to handle transaction records have signed confidentiality agreements.
        </p>
        <p>
          <strong>4.3 Security Standards:</strong> Implement appropriate security protocols (detailed in Schedule B).
        </p>
        <p>
          <strong>4.4 Sub-processor Approvals:</strong> Maintain an updated list of sub-processors and notify the Customer of changes.
        </p>
        <p>
          <strong>4.5 Assisting Fiduciaries:</strong> Help the Customer fulfill their compliance obligations regarding Data Principal rights requests.
        </p>
        <p>
          <strong>4.6 Incident Reporting:</strong> Notify the Customer within 72 hours of identifying any personal data breach.
        </p>
        <p>
          <strong>4.7 Deletion on Expiry:</strong> Delete or return all transaction logs upon contract termination.
        </p>
        <p>
          <strong>4.8 Audits:</strong> Allow for reasonable security audits conducted by the Customer or their auditor.
        </p>
      </LegalSection>

      <LegalSection id="subprocessors" number="5" title="Sub-processors">
        <p>
          <strong>5.1 Current Sub-processors:</strong> The Customer authorizes the use of sub-processors listed in <strong>Schedule A</strong>.
        </p>
        <p>
          <strong>5.2 Notifications of Changes:</strong> Flowshield AI will notify the Customer at least 30 days before adding any new sub-processor. The Customer has 14 days to object. If the Customer objects and no resolution is found, the Customer may terminate their subscription with a pro-rata refund.
        </p>
      </LegalSection>

      <LegalSection id="transfers" number="6" title="International Data Transfers">
        <p>
          We store all primary transaction records, databases, and logs in India (AWS Mumbai region) to comply with RBI regulations. Application containers and temporary queue metrics may be processed outside India (e.g. US data centers). For any cross-border transfers, we implement standard contractual clauses and end-to-end encryption.
        </p>
      </LegalSection>

      <LegalSection id="security-audits" number="7" title="Security and Audits">
        <p>
          <strong>7.1 Security controls:</strong> We maintain physical, administrative, and logical access controls (Schedule B).
        </p>
        <p>
          <strong>7.2 Auditing Rights:</strong> Enterprise subscribers may conduct 1 audit per calendar year, with at least 14 days prior notice. Growth plan subscribers are provided with completed security questionnaires. Free/Basic tier users are provided with standard compliance reports.
        </p>
      </LegalSection>

      <LegalSection id="breach-notification" number="8" title="Data Breach Notification">
        <p>
          <strong>8.1 Timing:</strong> In the event of a confirmed breach, we will notify the Customer within 72 hours of verification.
        </p>
        <p>
          <strong>8.2 Scope:</strong> The notification will include a description of the incident, estimated records affected, potential consequences, and remediation actions.
        </p>
        <p>
          <strong>8.3 DPBI Reporting:</strong> The Customer is responsible for reporting breaches to the Data Protection Board of India and notifying affected users when required by law.
        </p>
      </LegalSection>

      <LegalSection id="deletion" number="9" title="Data Deletion">
        <p>
          Upon subscription cancellation or account termination:
        </p>
        <ul className="list-disc list-inside pl-4 space-y-2">
          <li>API keys are immediately deactivated.</li>
          <li>Transaction logs are permanently deleted within 90 days.</li>
          <li>Database backups are fully purged within 180 days.</li>
          <li>Enterprise customers may request a certificate of deletion.</li>
          <li>Billing records are retained for 7 years as required by Indian tax laws.</li>
        </ul>
      </LegalSection>

      <LegalSection id="liability" number="10" title="Liability">
        <p>
          Each party's liability under this DPA is subject to the limitations of liability specified in the Flowshield AI Terms of Service. Flowshield AI is not liable for data breaches caused by the Customer's failure to secure their own systems or obtain necessary user consents.
        </p>
      </LegalSection>

      <LegalSection id="governing-law" number="11" title="Governing Law">
        <p>
          This DPA is governed by the laws of India. Any legal disputes arising under this agreement will be subject to the exclusive jurisdiction of the competent courts of Chennai, Tamil Nadu, India.
        </p>
      </LegalSection>

      <LegalSection id="schedule-a" number="A" title="Schedule A — Sub-processors">
        <p>
          The authorized sub-processors engaged by Flowshield AI as of the effective date are listed below:
        </p>
        <LegalTable headers={subHeaders} rows={subRows} />
      </LegalSection>

      <LegalSection id="schedule-b" number="B" title="Schedule B — Security Measures">
        <p>
          We implement the following technical and organizational security controls:
        </p>
        <ul className="list-disc list-inside pl-4 space-y-2">
          <li><strong>Data Encryption:</strong> AES-256 encryption at rest for databases and backups; TLS 1.2+ encryption for data in transit.</li>
          <li><strong>Network Security:</strong> Isolated Virtual Private Cloud (VPC) hosting, database instances restricted from public access, and active firewalls.</li>
          <li><strong>Access Auditing:</strong> Hashed API keys (SHA-256), multi-factor authentication for developers, and detailed access logging.</li>
          <li><strong>Code Reviews:</strong> Automated security scanners for third-party libraries and dependencies.</li>
        </ul>
      </LegalSection>
    </LegalLayout>
  );
}
