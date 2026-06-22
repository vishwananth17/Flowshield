import React from 'react';
import LegalLayout from '@/components/legal/LegalLayout';
import LegalSection from '@/components/legal/LegalSection';
import LegalTable from '@/components/legal/LegalTable';

export default function CookiePolicy() {
  const sections = [
    { id: 'what-are-cookies', title: '1. What Are Cookies' },
    { id: 'cookies-we-use', title: '2. Cookies We Use' },
    { id: 'consent-banner', title: '3. Cookie Consent Banner' },
    { id: 'managing-cookies', title: '4. Managing Cookies' },
    { id: 'third-party-cookies', title: '5. Third Party Cookies' },
  ];

  const cookieHeaders = ['Cookie Name', 'Type', 'Purpose', 'Duration', 'Can be disabled?'];
  const cookieRows = [
    ['flowshield_session', 'Essential', 'Authenticates and keeps your user session active inside the dashboard.', 'Session length', 'No (Service fails without it)'],
    ['flowshield_csrf', 'Essential', 'Cross-site request forgery prevention token for secure POST actions.', 'Session length', 'No'],
    ['flowshield_prefs', 'Functional', 'Remembers your interface choices (e.g. dark mode toggle, side nav expand).', '1 year', 'Yes'],
    ['_ga', 'Analytics', 'Google Analytics cookie tracking anonymized landing page traffic.', '2 years', 'Yes'],
    ['_fbp', 'Marketing', 'Facebook Pixel cookie measuring ad clicks on flowshieldai.com.', '3 months', 'Yes'],
  ];

  return (
    <LegalLayout
      title="Cookie Policy"
      subtitle="How Flowshield AI uses browser cookies, local storage, and tracers to power and secure the application."
      lastUpdated="April 2026"
      effectiveDate="April 1, 2026"
      sections={sections}
    >
      <LegalSection id="what-are-cookies" number="1" title="What Are Cookies">
        <p>
          Cookies are small text files placed on your computer or mobile device by websites that you visit. They are widely used to make websites work, or work more efficiently, as well as to provide business intelligence information to the owners of the site.
        </p>
        <p>
          Cookies do not scan your computer or compile personal data from your hard drive. Most browser clients accept cookies automatically by default.
        </p>
      </LegalSection>

      <LegalSection id="cookies-we-use" number="2" title="Cookies We Use">
        <p>
          Flowshield AI utilizes cookies under the following classifications. The complete registry of cookies set by our protocol is described below:
        </p>
        <LegalTable headers={cookieHeaders} rows={cookieRows} />
        
        <h3 className="text-white font-medium text-sm mt-6">Cookie Classifications:</h3>
        <ul className="list-disc list-inside pl-4 space-y-3 mt-2">
          <li><strong>Essential Cookies:</strong> These cookies are critical to deliver dashboard access, prevent CSRF injection attacks, and support secure checkout payments. They cannot be disabled.</li>
          <li><strong>Functional Cookies:</strong> These cookies enable the dashboard to remember your preferences, such as keeping dark mode active or saving table sorting orders.</li>
          <li><strong>Analytics Cookies:</strong> These cookies gather anonymized traffic signals. They help us understand visitor paths, loading performance, and error frequencies.</li>
          <li><strong>Marketing Cookies:</strong> These are used exclusively on our public marketing pages (`flowshieldai.com`) to measure ad conversions. We do not load marketing cookies inside the dashboard (`app.flowshieldai.com`) or API environments.</li>
        </ul>
      </LegalSection>

      <LegalSection id="consent-banner" number="3" title="Cookie Consent Banner">
        <p>
          When you first visit our marketing website, we display a cookie consent banner at the bottom of the viewport. This banner gives you the choice to accept all cookies, decline all marketing/analytics cookies, or customize your preferences.
        </p>
        <p>
          We store your preferences in your browser's local storage under the key `flowshield_cookie_consent`. If you consent to functional, analytics, or marketing categories, we will load the corresponding scripts. If you decline, only essential cookies are loaded.
        </p>
      </LegalSection>

      <LegalSection id="managing-cookies" number="4" title="Managing Cookies">
        <p>
          You can block or remove cookies through your web browser settings. Disabling cookies will impact your experience; for example, you may need to log in repeatedly when browsing the dashboard.
        </p>
        <p>
          To adjust cookie configurations on major web browsers, please follow the links below:
        </p>
        <ul className="list-disc list-inside pl-4 space-y-2 mt-2">
          <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">Google Chrome Settings</a></li>
          <li><a href="https://support.mozilla.org/en-US/kb/enhanced-tracking-protection-firefox-desktop" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">Mozilla Firefox Settings</a></li>
          <li><a href="https://support.apple.com/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">Apple Safari Settings</a></li>
          <li><a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63fd9a5b-99f8-3d53-a55c-728938f24ed9" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">Microsoft Edge Settings</a></li>
        </ul>
      </LegalSection>

      <LegalSection id="third-party-cookies" number="5" title="Third Party Cookies">
        <p>
          Some services integrated into our site may place their own cookies. For example, Razorpay uses cookies to secure payments and prevent checkout anomalies during subscription processing. Google and Facebook may place cookies when you navigate from their ad platforms.
        </p>
        <p>
          We do not control the cookie settings of these third-party providers. We recommend reviewing their respective privacy policies for cookie management information.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
