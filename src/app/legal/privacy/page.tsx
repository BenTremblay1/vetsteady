import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy — VetSteady',
  description: 'How VetSteady collects, uses, and protects your information.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-base"
            style={{ background: '#0D7377' }}
          >
            V
          </div>
          <Link href="/" className="font-semibold text-gray-900 hover:text-[#0D7377] transition-colors">
            VetSteady
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 md:p-12">
          <div className="mb-8 pb-8 border-b border-gray-100">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
            <p className="text-sm text-gray-500">
              <strong>Last Updated:</strong> March 28, 2026 &nbsp;|&nbsp;
              <strong>Effective Date:</strong> March 28, 2026 &nbsp;|&nbsp;
              <strong>Version:</strong> 1.1
            </p>
          </div>

          <div className="prose prose-gray max-w-none text-sm leading-relaxed">

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">Introduction</h2>
            <p className="text-gray-600 mb-4">
              Welcome to VetSteady (&ldquo;VetSteady,&rdquo; &ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;). VetSteady operates the website located at <strong>vetsteady.com</strong> and provides scheduling, appointment reminder, and client communication software for veterinary practices (the &ldquo;Service&rdquo;).
            </p>
            <p className="text-gray-600 mb-4">
              This Privacy Policy explains how we collect, use, disclose, and protect information about Practice Users (veterinary practice owners, veterinarians, and staff), Pet Owners/Clients (individuals whose contact information is entered by their vet), and Website Visitors.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">1. Who This Policy Covers</h2>

            <h3 className="text-base font-semibold text-gray-800 mt-4 mb-2">1.1 Practice Users</h3>
            <p className="text-gray-600 mb-3">
              If you sign up for a VetSteady account, you are a Practice User. We collect your information to provide, support, and improve the Service.
            </p>

            <h3 className="text-base font-semibold text-gray-800 mt-4 mb-2">1.2 Pet Owners / Clients</h3>
            <p className="text-gray-600 mb-3">
              If your veterinarian uses VetSteady, the practice has entered your contact information and appointment details into our system on your behalf. <strong>The veterinary practice is responsible for how your information is used.</strong> VetSteady processes this information solely to deliver the reminders and services the practice has configured. Contact your veterinary practice directly with questions about your personal information.
            </p>

            <h3 className="text-base font-semibold text-gray-800 mt-4 mb-2">1.3 What VetSteady Is Not</h3>
            <p className="text-gray-600 mb-3">
              VetSteady is a scheduling and communication platform — not a medical records system. We do not store veterinary diagnoses, treatment records, medications, lab results, or clinical notes.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">2. Information We Collect</h2>

            <h3 className="text-base font-semibold text-gray-800 mt-4 mb-2">2.1 Information You Provide (Practice Users)</h3>
            <ul className="list-disc pl-5 text-gray-600 mb-3 space-y-1">
              <li>Account information: practice name, business address, phone number, email address</li>
              <li>Staff information: names, email addresses, and roles of invited team members</li>
              <li>Payment information: billing details — processed securely by Stripe; we do not store credit card numbers</li>
              <li>Usage preferences: reminder timing, appointment types, business hours, timezone</li>
              <li>Communications: support requests and feedback</li>
            </ul>

            <h3 className="text-base font-semibold text-gray-800 mt-4 mb-2">2.2 Information Entered About Clients (Pet Owners)</h3>
            <p className="text-gray-600 mb-3">
              Veterinary practices enter the following information on behalf of their clients: contact information (name, email, phone), pet information (name, species, breed, weight), appointment information (date, time, type, veterinarian), practice notes, and appointment history.
            </p>
            <p className="text-gray-600 mb-3">
              <strong>We do NOT collect:</strong> diagnoses, symptoms, medications, lab results, treatment plans, or financial information beyond deposit status.
            </p>

            <h3 className="text-base font-semibold text-gray-800 mt-4 mb-2">2.3 Information We Collect Automatically</h3>
            <p className="text-gray-600 mb-3">
              When you visit vetsteady.com or use the Service, we automatically collect: IP address, browser type, pages visited, referring URL, timestamp, device information, and usage data. We also use cookies as described in Section 7.
            </p>

            <h3 className="text-base font-semibold text-gray-800 mt-4 mb-2">2.4 Information from Third Parties</h3>
            <p className="text-gray-600 mb-3">
              We may receive information from Twilio (SMS delivery status), Stripe (payment and subscription status), and authentication providers if you sign in via a third-party service.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc pl-5 text-gray-600 mb-3 space-y-1">
              <li><strong>To provide the Service:</strong> Account management, scheduling, SMS/email reminders, appointment confirmations, billing</li>
              <li><strong>To communicate with you:</strong> Transactional emails, service updates, support responses, product tips (opt-out anytime)</li>
              <li><strong>To improve the Service:</strong> Usage analytics, performance monitoring, feature development</li>
              <li><strong>To comply with legal obligations:</strong> Lawful requests, Terms enforcement, safety protections</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">4. How We Share Your Information</h2>
            <p className="text-gray-600 mb-3">
              <strong>We do not sell your personal information.</strong> We share information only in the following circumstances:
            </p>

            <h3 className="text-base font-semibold text-gray-800 mt-4 mb-2">4.1 Service Providers (Subprocessors)</h3>
            <div className="overflow-x-auto mb-3">
              <table className="w-full text-xs text-gray-600 border border-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold">Provider</th>
                    <th className="px-3 py-2 text-left font-semibold">Purpose</th>
                    <th className="px-3 py-2 text-left font-semibold">Data Shared</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr><td className="px-3 py-2">Supabase</td><td className="px-3 py-2">Database hosting</td><td className="px-3 py-2">All stored data</td></tr>
                  <tr><td className="px-3 py-2">Twilio</td><td className="px-3 py-2">SMS delivery</td><td className="px-3 py-2">Phone number, message body</td></tr>
                  <tr><td className="px-3 py-2">Resend</td><td className="px-3 py-2">Email delivery</td><td className="px-3 py-2">Email address, message body</td></tr>
                  <tr><td className="px-3 py-2">Stripe</td><td className="px-3 py-2">Payment processing</td><td className="px-3 py-2">Billing info, subscription status</td></tr>
                  <tr><td className="px-3 py-2">Vercel</td><td className="px-3 py-2">Application hosting</td><td className="px-3 py-2">Application traffic</td></tr>
                  <tr><td className="px-3 py-2">PostHog</td><td className="px-3 py-2">Product analytics</td><td className="px-3 py-2">Usage events (no PII)</td></tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-base font-semibold text-gray-800 mt-4 mb-2">4.2 The Veterinary Practice</h3>
            <p className="text-gray-600 mb-3">
              Appointment and client information is shared with the veterinary practice that entered it — this is the intended purpose of the Service.
            </p>

            <h3 className="text-base font-semibold text-gray-800 mt-4 mb-2">4.3 Shepherd Veterinary Software Integration</h3>
            <p className="text-gray-600 mb-3">
              If your veterinary practice connects Shepherd Veterinary Software to VetSteady, appointment and client data is imported via Shepherd&rsquo;s API. Shepherd&rsquo;s handling of your data is governed by Shepherd&rsquo;s own Privacy Policy at <a href="https://shepherd.vet/privacy-policy" className="text-[#0D7377] underline" target="_blank" rel="noopener noreferrer">shepherd.vet/privacy-policy</a>.
            </p>

            <h3 className="text-base font-semibold text-gray-800 mt-4 mb-2">4.4 Legal Requirements &amp; Business Transfers</h3>
            <p className="text-gray-600 mb-3">
              We may disclose information if required by law, or if VetSteady is acquired or merged. In such cases, we will notify Practice Users before information is transferred.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">5. SMS Communications</h2>
            <p className="text-gray-600 mb-3">
              VetSteady sends SMS appointment reminders and confirmations to clinic clients <strong>on behalf of veterinary practices</strong>. Messages contain the client&rsquo;s first name, pet name, appointment type, practice name, date and time, and a one-tap confirmation link.
            </p>
            <p className="text-gray-600 mb-3">
              <strong>Opt-out:</strong> Reply STOP to any message to stop all SMS reminders. Reply HELP for assistance or contact <a href="mailto:support@vetsteady.com" className="text-[#0D7377] underline">support@vetsteady.com</a>.
            </p>
            <p className="text-gray-600 mb-3">
              <strong>Frequency:</strong> Typically 2–4 messages per appointment (booking confirmation + up to 3 reminders). Message and data rates may apply.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">6. Data Retention</h2>
            <div className="overflow-x-auto mb-3">
              <table className="w-full text-xs text-gray-600 border border-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold">Data Type</th>
                    <th className="px-3 py-2 text-left font-semibold">Retention Period</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr><td className="px-3 py-2">Practice account data</td><td className="px-3 py-2">Duration of subscription + 90 days after cancellation</td></tr>
                  <tr><td className="px-3 py-2">Client contact information</td><td className="px-3 py-2">While practice account is active; deleted with account</td></tr>
                  <tr><td className="px-3 py-2">Appointment records</td><td className="px-3 py-2">2 years for practice operational continuity</td></tr>
                  <tr><td className="px-3 py-2">SMS delivery logs</td><td className="px-3 py-2">90 days</td></tr>
                  <tr><td className="px-3 py-2">Billing records</td><td className="px-3 py-2">7 years (legal/tax requirement)</td></tr>
                  <tr><td className="px-3 py-2">Server/access logs</td><td className="px-3 py-2">30 days</td></tr>
                  <tr><td className="px-3 py-2">Anonymized analytics</td><td className="px-3 py-2">Indefinitely (no personal identifiers)</td></tr>
                </tbody>
              </table>
            </div>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">7. Cookies and Tracking</h2>
            <p className="text-gray-600 mb-3">
              We use session cookies (keep you logged in), security cookies (CSRF protection), analytics cookies (PostHog — optional), and preference cookies. We do not use advertising cookies or sell browsing data. You can manage cookies through your browser settings.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">8. Security</h2>
            <p className="text-gray-600 mb-3">
              All data is encrypted in transit (TLS 1.2+). Database row-level security ensures each practice can only access their own data. Multi-factor authentication is available for practice accounts. API keys are stored in environment variables, never in code. Report security concerns to <a href="mailto:security@vetsteady.com" className="text-[#0D7377] underline">security@vetsteady.com</a>.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">9. Your Rights</h2>

            <h3 className="text-base font-semibold text-gray-800 mt-4 mb-2">Practice Users</h3>
            <p className="text-gray-600 mb-3">
              You may access, correct, or delete your account data; request a data export; and opt out of marketing emails at any time via the unsubscribe link.
            </p>

            <h3 className="text-base font-semibold text-gray-800 mt-4 mb-2">California Residents (CCPA/CPRA)</h3>
            <p className="text-gray-600 mb-3">
              You have the right to know what personal information we collect, delete personal information (subject to exceptions), and opt out of sale (we do not sell personal information). Contact <a href="mailto:privacy@vetsteady.com" className="text-[#0D7377] underline">privacy@vetsteady.com</a> with &ldquo;California Privacy Request&rdquo; in the subject line.
            </p>

            <h3 className="text-base font-semibold text-gray-800 mt-4 mb-2">European/UK Residents (GDPR/UK GDPR)</h3>
            <p className="text-gray-600 mb-3">
              You have rights to access, rectification, erasure, data portability, and to lodge a complaint with your local supervisory authority. Contact us at <a href="mailto:privacy@vetsteady.com" className="text-[#0D7377] underline">privacy@vetsteady.com</a>.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">10. Children&rsquo;s Privacy</h2>
            <p className="text-gray-600 mb-3">
              VetSteady is not directed at children under 13. We do not knowingly collect personal information from children under 13. Contact us at <a href="mailto:privacy@vetsteady.com" className="text-[#0D7377] underline">privacy@vetsteady.com</a> if this occurs.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">11. International Data Transfers</h2>
            <p className="text-gray-600 mb-3">
              VetSteady is operated from the United States. For users in the EEA/UK, transfers are conducted pursuant to appropriate safeguards (Standard Contractual Clauses or equivalent) as required under GDPR.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">12. Changes to This Policy</h2>
            <p className="text-gray-600 mb-3">
              We may update this Privacy Policy from time to time. Material changes will be posted here with a revised &ldquo;Last Updated&rdquo; date and sent to Practice Users by email with at least 30 days notice.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">13. Contact Us</h2>
            <div className="bg-gray-50 rounded-xl p-5 text-sm text-gray-600 space-y-1">
              <p><strong>VetSteady, Inc.</strong></p>
              <p>Privacy inquiries: <a href="mailto:privacy@vetsteady.com" className="text-[#0D7377] underline">privacy@vetsteady.com</a></p>
              <p>General support: <a href="mailto:support@vetsteady.com" className="text-[#0D7377] underline">support@vetsteady.com</a></p>
              <p>Security issues: <a href="mailto:security@vetsteady.com" className="text-[#0D7377] underline">security@vetsteady.com</a></p>
              <p>Website: <a href="https://vetsteady.com" className="text-[#0D7377] underline">vetsteady.com</a></p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-3xl mx-auto px-4 py-6 text-center text-xs text-gray-400">
        &copy; {new Date().getFullYear()} VetSteady, Inc. &nbsp;&middot;&nbsp;
        <Link href="/legal/terms" className="hover:text-[#0D7377]">Terms of Service</Link>
        &nbsp;&middot;&nbsp;
        <Link href="/legal/privacy" className="hover:text-[#0D7377]">Privacy Policy</Link>
      </footer>
    </div>
  );
}
