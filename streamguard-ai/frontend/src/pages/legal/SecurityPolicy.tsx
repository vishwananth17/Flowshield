import React from 'react';
import LegalLayout from '@/components/legal/LegalLayout';
import LegalSection from '@/components/legal/LegalSection';

export default function SecurityPolicy() {
  const sections = [
    { id: 'commitment', title: '1. Our Security Commitment' },
    { id: 'infrastructure', title: '2. Infrastructure Security' },
    { id: 'data-security', title: '3. Data Security' },
    { id: 'application', title: '4. Application Security' },
    { id: 'access-control', title: '5. Access Control' },
    { id: 'disclosure', title: '6. Vulnerability Disclosure (Responsible Disclosure)' },
    { id: 'incident-response', title: '7. Security Incident Response' },
    { id: 'compliance', title: '8. Compliance' },
  ];

  return (
    <LegalLayout
      title="Security Policy"
      subtitle="Security parameters, data isolation details, encryption standards, and responsible disclosure protocols."
      lastUpdated="April 2026"
      effectiveDate="April 1, 2026"
      sections={sections}
    >
      <LegalSection id="commitment" number="1" title="Our Security Commitment">
        <p>
          As a real-time fraud detection gateway, security is at the core of everything we build. Flowshield AI is dedicated to keeping transaction signals secure, confidential, and fully isolated. We enforce strict administrative, physical, and logical access controls to safeguard Customer assets and prevent unauthorized access.
        </p>
      </LegalSection>

      <LegalSection id="infrastructure" number="2" title="Infrastructure Security">
        <p>
          Our network infrastructure is built to guarantee high availability and prevent lateral exploits:
        </p>
        <ul className="list-disc list-inside pl-4 space-y-2 mt-2">
          <li><strong>AWS Mumbai Region:</strong> Core production servers and primary PostgreSQL databases are hosted in AWS ap-south-1 (Mumbai, India) to enforce local data residency compliance.</li>
          <li><strong>VPC Isolation:</strong> Production services run inside dedicated Virtual Private Clouds (VPCs). Networks are logically segmented, separating development, staging, and production assets.</li>
          <li><strong>No Public DB Access:</strong> Database instances are located in private subnets with no public internet routing. DB connections are allowed only via authorized app gateways using secure key groups.</li>
          <li><strong>Load Balancing:</strong> Services are behind secure Application Load Balancers (ALBs) that terminate SSL and inspect connection requests.</li>
          <li><strong>DDoS Protection:</strong> Traffic is routed through network firewalls with active DDoS scrubbing and automated rate throttling to block brute-force resource starvation.</li>
        </ul>
      </LegalSection>

      <LegalSection id="data-security" number="3" title="Data Security">
        <p>
          We employ cryptography to protect transactional data in all states:
        </p>
        <ul className="list-disc list-inside pl-4 space-y-2 mt-2">
          <li><strong>Encryption At Rest:</strong> Data saved to disks, logs, and backups is encrypted using the AES-256 standard.</li>
          <li><strong>Encryption In Transit:</strong> Data transferred between the Customer API client and Flowshield AI is encrypted using TLS 1.2 or TLS 1.3. Plain text HTTP traffic is disabled.</li>
          <li><strong>API Key Hashing:</strong> Private API tokens are hashed using SHA-256 before being written to the database. Plain text keys are never stored.</li>
          <li><strong>Secrets Management:</strong> System credentials, passwords, and private API keys are injected at runtime via environment variables managed through AWS Secrets Manager and Railway Config.</li>
        </ul>
      </LegalSection>

      <LegalSection id="application" number="4" title="Application Security">
        <p>
          Our software core is designed and written following OWASP security standards:
        </p>
        <ul className="list-disc list-inside pl-4 space-y-2 mt-2">
          <li><strong>Dashboard Authentication:</strong> User session dashboard accounts utilize JWT (JSON Web Tokens) with a short 15-minute expiry, coupled with secure refresh token rotation.</li>
          <li><strong>CSRF Mitigation:</strong> State-modifying requests in the browser require CSRF tokens.</li>
          <li><strong>Rate Limiting:</strong> Authentication and public registration endpoints enforce strict IP-level rate limiting to prevent credential stuffing.</li>
          <li><strong>Input Validation:</strong> API payloads are validated using Pydantic schema validation. Requests containing incorrect structures are rejected at the gateway.</li>
          <li><strong>Injection Prevention:</strong> Database transactions are executed using SQLAlchemy ORM to prevent SQL injection vulnerabilities.</li>
          <li><strong>XSS Protection:</strong> Our React frontend auto-escapes rendered content to prevent Cross-Site Scripting (XSS) attacks.</li>
          <li><strong>Security Headers:</strong> We enforce headers including `X-Content-Type-Options`, `X-Frame-Options`, `Content-Security-Policy`, and Strict-Transport-Security (HSTS).</li>
          <li><strong>Strict CORS:</strong> Cross-Origin Resource Sharing is locked down to known dashboard and marketing origins, blocking unauthorized third-party site requests.</li>
        </ul>
      </LegalSection>

      <LegalSection id="access-control" number="5" title="Access Control">
        <p>
          We strictly limit access to our production server environments:
        </p>
        <ul className="list-disc list-inside pl-4 space-y-2 mt-2">
          <li><strong>Principle of Least Privilege:</strong> Team members receive access rights mapped strictly to their functional roles.</li>
          <li><strong>Founder-Only Access:</strong> Currently, production database access and server administrative credentials are restricted exclusively to the founder (Vishwanath B).</li>
          <li><strong>No Shared Credentials:</strong> Developer accounts must utilize individual accounts with multi-factor authentication (MFA) enabled.</li>
          <li><strong>Audit Trail Logging:</strong> Access to keys, secrets, databases, and logs is tracked in immutable audit trails.</li>
        </ul>
      </LegalSection>

      <LegalSection id="disclosure" number="6" title="Vulnerability Disclosure (Responsible Disclosure)">
        <p>
          We welcome security research from the community. If you identify a security vulnerability in our platform, please report it to us responsibly:
        </p>
        <p className="font-semibold text-white mt-4">
          Reporting Process:
        </p>
        <ul className="list-disc list-inside pl-4 space-y-2 mt-2">
          <li>Submit details of the vulnerability by emailing <a href="mailto:security@flowshieldai.com" className="text-blue-500 underline">security@flowshieldai.com</a>.</li>
          <li>Provide step-by-step instructions or proof-of-concept logs to help us replicate the issue.</li>
          <li>Do NOT publicly disclose the vulnerability before we have deployed a patch.</li>
        </ul>
        <p className="font-semibold text-white mt-4">
          Our Commitments:
        </p>
        <ul className="list-disc list-inside pl-4 space-y-2 mt-2">
          <li>We will acknowledge receipt of your report within 48 hours.</li>
          <li>We target resolving critical issues and deploying hotfixes within 7 days.</li>
          <li>We will credit you in our security acknowledgements (unless you request anonymity).</li>
          <li>We will not take legal action against you if you act in good faith and follow these guidelines.</li>
        </ul>
      </LegalSection>

      <LegalSection id="incident-response" number="7" title="Security Incident Response">
        <p>
          Our security incident response plan includes the following steps:
        </p>
        <ol className="list-decimal list-inside pl-4 space-y-2.5 mt-2">
          <li><strong>Detection:</strong> Automated alerts monitor database exceptions and network traffic spikes. Security reports can also be submitted by users.</li>
          <li><strong>Containment:</strong> If a breach is detected, affected systems are immediately isolated.</li>
          <li><strong>Investigation:</strong> Our security team analyzes logs to identify the root cause, exploit vector, and records affected.</li>
          <li><strong>Remediation:</strong> Deploy patches, update server credentials, and verify system integrity.</li>
          <li><strong>Notification:</strong> We notify affected Customers within 72 hours of confirming a personal data breach.</li>
          <li><strong>Post-mortem:</strong> We compile a detailed post-mortem report within 5 days to prevent future incidents.</li>
        </ol>
      </LegalSection>

      <LegalSection id="compliance" number="8" title="Compliance">
        <p>
          Flowshield AI aligns its systems with the following compliance standards:
        </p>
        <ul className="list-disc list-inside pl-4 space-y-2 mt-2">
          <li><strong>PCI DSS:</strong> Our systems are designed to comply with Payment Card Industry Data Security Standards (full certification is planned).</li>
          <li><strong>ISO 27001:</strong> We are mapping our controls to meet ISO 27001 security frameworks.</li>
          <li><strong>SOC 2:</strong> Audits for SOC 2 Type II compliance are planned for our Enterprise tier rollout.</li>
          <li><strong>DPDP Act 2023 & IT Act 2000:</strong> Fully compliant with Indian personal data protection regulations.</li>
        </ul>
      </LegalSection>
    </LegalLayout>
  );
}
