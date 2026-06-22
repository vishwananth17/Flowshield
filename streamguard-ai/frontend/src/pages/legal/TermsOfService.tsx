import React from 'react';
import LegalLayout from '@/components/legal/LegalLayout';
import LegalSection from '@/components/legal/LegalSection';
import LegalTable from '@/components/legal/LegalTable';

export default function TermsOfService() {
  const sections = [
    { id: 'acceptance', title: '1. Acceptance of Terms' },
    { id: 'services', title: '2. Description of Services' },
    { id: 'registration', title: '3. Account Registration' },
    { id: 'api-use', title: '4. API Usage and Acceptable Use' },
    { id: 'rate-limits', title: '5. API Rate Limits and Quotas' },
    { id: 'pricing', title: '6. Pricing and Payment' },
    { id: 'intellectual-property', title: '7. Intellectual Property' },
    { id: 'data-ownership', title: '8. Data Ownership and Usage' },
    { id: 'confidentiality', title: '9. Confidentiality' },
    { id: 'liability', title: '10. Limitation of Liability' },
    { id: 'indemnification', title: '11. Indemnification' },
    { id: 'sla-summary', title: '12. Service Level Agreement' },
    { id: 'termination', title: '13. Termination' },
    { id: 'dispute-resolution', title: '14. Dispute Resolution' },
    { id: 'general', title: '15. General' },
  ];

  const rateHeaders = ['Plan', 'Monthly Requests', 'Requests/Second', 'Overage'];
  const rateRows = [
    ['Free', '1,000', '1 req/sec', 'Service suspended (HTTP 429)'],
    ['Basic', '25,000', '10 req/sec', 'Service suspended (HTTP 429)'],
    ['Growth', '1,00,000', '100 req/sec', 'Service suspended (HTTP 429)'],
    ['Enterprise', 'Unlimited', 'Custom / Dedicated', 'Custom terms / N/A'],
  ];

  return (
    <LegalLayout
      title="Terms of Service"
      subtitle="The contractual terms and usage policies governing the Flowshield AI fraud detection platform."
      lastUpdated="April 2026"
      effectiveDate="April 1, 2026"
      sections={sections}
    >
      <LegalSection id="acceptance" number="1" title="Acceptance of Terms">
        <p>
          By creating an account, registering an organization, or using the Flowshield AI API and dashboard, you agree to be bound by these Terms of Service. If you are entering into this agreement on behalf of a company, organization, or other legal entity, you represent and warrant that you have the authority to bind such entity to these terms.
        </p>
        <p>
          If you do not agree to these terms, you must not access or use the Flowshield AI API or dashboard.
        </p>
      </LegalSection>

      <LegalSection id="services" number="2" title="Description of Services">
        <p>
          Flowshield AI is a real-time transaction fraud detection service. We provide:
        </p>
        <ul className="list-disc list-inside pl-4 space-y-2">
          <li>Real-time transaction risk scoring via REST API endpoints.</li>
          <li>Machine learning ensemble scoring (Isolation Forest + XGBoost models).</li>
          <li>SHAP-powered explainability markers indicating reasons for fraud scores.</li>
          <li>A central web dashboard for alert visualization, review, and webhook configuration.</li>
          <li>Programmatic webhook alerts for transaction state notifications.</li>
          <li>Official SDK libraries (Node.js, Python) to facilitate system integrations.</li>
        </ul>
      </LegalSection>

      <LegalSection id="registration" number="3" title="Account Registration">
        <p>
          To utilize the platform, you must create a corporate account. The following conditions apply:
        </p>
        <ul className="list-disc list-inside pl-4 space-y-2">
          <li><strong>3.1 Accuracy:</strong> You must provide current, complete, and accurate registration data.</li>
          <li><strong>3.2 Credential Security:</strong> You are responsible for keeping passwords and API keys secure. You are liable for all activities under your account.</li>
          <li><strong>3.3 Unauthorized Use:</strong> You must immediately notify us at <a href="mailto:security@flowshieldai.com" className="text-blue-500 underline">security@flowshieldai.com</a> of any unauthorized access.</li>
          <li><strong>3.4 No Account Sharing:</strong> Credentials and keys must not be shared. Accounts are mapped strictly to one organization.</li>
          <li><strong>3.5 Age Restriction:</strong> You must be 18 years of age or older (or have parental/guardian consent where applicable) to create an account.</li>
        </ul>
      </LegalSection>

      <LegalSection id="api-use" number="4" title="API Usage and Acceptable Use">
        <h3 className="text-white font-medium text-sm mt-2">4.1 Permitted Uses:</h3>
        <p className="pl-4 mt-1">
          You may use the API and services solely for analyzing legitimate transactions, detecting fraud flags on payments to your business, executing tests in sandbox environment mode, and integrating the services with your checkout pages.
        </p>

        <h3 className="text-white font-medium text-sm mt-4">4.2 Prohibited Uses:</h3>
        <p className="pl-4 mt-1">
          Any breach of these acceptable use terms will result in immediate service termination:
        </p>
        <ul className="list-disc list-inside pl-8 space-y-2 mt-2">
          <li>Analyzing payment data without proper customer permissions or legal basis.</li>
          <li>Using risk scores to discriminate based on protected characteristics (religion, caste, gender, race, etc.).</li>
          <li>Attempting to reverse-engineer our machine learning models, weights, or code.</li>
          <li>Reselling, sublicensing, or renting API tokens without our explicit prior written consent.</li>
          <li>Sending fake or dummy transaction data in production mode to disrupt services.</li>
          <li>Bypassing rate limits, API quotas, or licensing walls through automated scripting.</li>
          <li>Using the service to facilitate money laundering, tax evasion, or other illegal operations.</li>
          <li>Sending restricted credentials or sensitive data in fields not intended for them (e.g. putting Aadhaar or PAN numbers in the `customer_id` payload field).</li>
        </ul>
      </LegalSection>

      <LegalSection id="rate-limits" number="5" title="API Rate Limits and Quotas">
        <p>
          Flowshield AI implements plan-specific rate limits to ensure system stability and performance. Out-of-quota behavior is summarized below:
        </p>
        <LegalTable headers={rateHeaders} rows={rateRows} />
        <p className="mt-4">
          We will send automated email warnings when your organization reaches 80% of its monthly request limit. Once 100% of the limit is reached, API requests will fail with an HTTP 429 status code. Monthly quotas reset on the 1st of each calendar month at 00:00 IST.
        </p>
      </LegalSection>

      <LegalSection id="pricing" number="6" title="Pricing and Payment">
        <p>
          <strong>6.1 Subscription Fees:</strong> Flowshield AI offers free and paid subscription models. Fees are billed in advance on a monthly or annual cycle. All pricing plans are listed in Indian Rupees (INR) and do not include the applicable 18% Goods and Services Tax (GST).
        </p>
        <p>
          <strong>6.2 GST Compliance:</strong> You are responsible for any GST charges. Flowshield AI provides GST-compliant tax invoices for payments. You must supply your GSTIN in your billing dashboard for proper reverse charge mechanism verification.
        </p>
        <p>
          <strong>6.3 Payment Processing:</strong> Payments are processed securely by Razorpay. We do not store or collect credit/debit card numbers directly. If a payment fails, we will retry 3 times over 7 days. If all retries fail, the account will be automatically downgraded to the Free tier.
        </p>
        <p>
          <strong>6.4 Refunds:</strong> No refunds are issued for partial months or unused quotas on monthly plans. For annual plans, you may request a pro-rated refund within 30 days of subscription renewal or purchase if you are unsatisfied. No refunds are available after 30 days.
        </p>
        <p>
          <strong>6.5 Price Adjustments:</strong> We will provide at least 30 days written notice before modifying subscription fees. Changes will take effect starting your next billing cycle.
        </p>
      </LegalSection>

      <LegalSection id="intellectual-property" number="7" title="Intellectual Property">
        <p>
          <strong>7.1 Ownership:</strong> All right, title, and interest in and to Flowshield AI, the API schemas, dashboard interfaces, machine learning model weights, logic models, documentation, logos, and patents belong exclusively to Flowshield AI. You receive a limited, revocable, non-exclusive, non-transferable license to access the API during your subscription term.
        </p>
        <p>
          <strong>7.2 Customer Data:</strong> You retain all ownership rights to the transaction logs, metadata, and payment signals sent through the API.
        </p>
        <p>
          <strong>7.3 Feedback:</strong> By sending feedback or feature requests, you grant Flowshield AI an unrestricted, royalty-free, perpetual license to implement and use those ideas without payment or attribution to you.
        </p>
      </LegalSection>

      <LegalSection id="data-ownership" number="8" title="Data Ownership and Usage">
        <p>
          <strong>8.1 Proprietary Logs:</strong> Your transaction records belong solely to you. We act as a processor.
        </p>
        <p>
          <strong>8.2 Purpose limitation:</strong> We process your data strictly to perform fraud detection services.
        </p>
        <p>
          <strong>8.3 Model Training:</strong> We do not use your transaction records to train machine learning models for competitors without your consent.
        </p>
        <p>
          <strong>8.4 Aggregated Stats:</strong> We may compile aggregated, fully anonymized statistics to benchmark, improve, and train general baseline models.
        </p>
        <p>
          <strong>8.5 Deletion on Termination:</strong> Upon account cancellation or deletion request, we will remove your transaction records within 90 days, in compliance with our Privacy Policy.
        </p>
      </LegalSection>

      <LegalSection id="confidentiality" number="9" title="Confidentiality">
        <p>
          Both parties agree to hold in strict confidence any proprietary business info, technical architectures, API secrets, private encryption keys, or customer records shared under this contract. This obligation does not apply to information that is publicly known, developed independently, or required to be disclosed by legal authorities.
        </p>
      </LegalSection>

      <LegalSection id="liability" number="10" title="Limitation of Liability">
        <p className="font-semibold text-white">
          TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW:
        </p>
        <p>
          <strong>10.1 Disclaimer of Errors:</strong> Flowshield AI is not liable for fraud losses arising from false negatives (transactions not detected as fraud by our models). No fraud detection system is 100% accurate. We are not liable for business interruptions or lost revenue due to false positives (legitimate transactions incorrectly flagged as high risk).
        </p>
        <p>
          <strong>10.2 Liability Cap:</strong> Our total aggregate liability for any claims under this agreement is limited to the fees paid by your organization to Flowshield AI during the 12-month period preceding the event.
        </p>
        <p>
          <strong>10.3 Risk Warning:</strong> Flowshield AI is a risk-scoring detection tool. We do not guarantee, represent, or warrant that our risk analysis is error-free. The final decision to approve or reject a transaction remains your responsibility.
        </p>
      </LegalSection>

      <LegalSection id="indemnification" number="11" title="Indemnification">
        <p>
          You agree to defend, indemnify, and hold harmless Flowshield AI, its founder (Vishwanath B), and partners from and against any claims, losses, liabilities, costs, or damages arising out of your violation of these terms, unauthorized API usage, failure to secure consent from end users, or infringement of any data principal rights under the DPDP Act.
        </p>
      </LegalSection>

      <LegalSection id="sla-summary" number="12" title="Service Level Agreement">
        <p>
          For our SLA details, see the complete document at <a href="/sla" className="text-blue-500 underline">flowshieldai.com/sla</a>.
        </p>
        <ul className="list-disc list-inside pl-4 space-y-2 mt-2">
          <li><strong>Uptime commitment:</strong> 99.9% availability for standard API endpoints.</li>
          <li><strong>Latency Target:</strong> API response time under 100ms for P99 requests.</li>
          <li><strong>Credits:</strong> Outage credits are applied on a pro-rata basis on subsequent billing cycles.</li>
        </ul>
      </LegalSection>

      <LegalSection id="termination" number="13" title="Termination">
        <p>
          <strong>13.1 By You:</strong> You can terminate your subscription at any time through the billing dashboard. The termination takes effect at the end of the billing period, and data deletion is completed within 90 days.
        </p>
        <p>
          <strong>13.2 By Us:</strong> We reserve the right to suspend or terminate accounts immediately in cases of API abuse, non-payment, registration with falsified information, or activities that compromise our servers.
        </p>
        <p>
          <strong>13.3 Effects of Termination:</strong> Upon termination, API tokens are revoked, dashboard access is disabled, and transaction logs are scheduled for deletion.
        </p>
      </LegalSection>

      <LegalSection id="dispute-resolution" number="14" title="Dispute Resolution">
        <p>
          <strong>14.1 Informal Resolution:</strong> Before initiating legal action, both parties agree to attempt to resolve disputes informally by contacting <a href="mailto:legal@flowshieldai.com" className="text-blue-500 underline">legal@flowshieldai.com</a>. We will respond within 30 days.
        </p>
        <p>
          <strong>14.2 Governing Law:</strong> These terms are governed by and construed in accordance with the laws of India.
        </p>
        <p>
          <strong>14.3 Jurisdiction:</strong> Any legal action, suit, or proceeding arising under this contract must be filed in the competent courts of Chennai, Tamil Nadu, India.
        </p>
        <p>
          <strong>14.4 Arbitration:</strong> Any dispute, difference, or claim arising out of this agreement exceeding ₹1,00,000 shall be referred to arbitration in accordance with the Arbitration and Conciliation Act, 1996. The arbitration will be held in Chennai with a single arbitrator mutually agreed upon by the parties. The language of arbitration shall be English.
        </p>
      </LegalSection>

      <LegalSection id="general" number="15" title="General">
        <p>
          <strong>15.1 Entire Agreement:</strong> These Terms of Service, the Privacy Policy, DPA, and SLA constitute the entire agreement between you and Flowshield AI.
        </p>
        <p>
          <strong>15.2 Severability:</strong> If any provision of this agreement is held invalid or unenforceable, the remaining provisions will continue in full force.
        </p>
        <p>
          <strong>15.3 Assignment:</strong> You may not assign your rights under these Terms without our written consent.
        </p>
        <p>
          <strong>15.4 Legal Notices:</strong> All formal notices must be sent to <a href="mailto:legal@flowshieldai.com" className="text-blue-500 underline">legal@flowshieldai.com</a>. We will send notices to the primary email associated with your account.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
