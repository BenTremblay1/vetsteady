import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service — VetSteady',
  description: 'The terms and conditions governing your use of VetSteady.',
};

export default function TermsOfServicePage() {
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
            <p className="text-sm text-gray-500">
              <strong>Last Updated:</strong> March 28, 2026 &nbsp;|&nbsp;
              <strong>Effective Date:</strong> March 28, 2026
            </p>
          </div>

          <div className="prose prose-gray max-w-none text-sm leading-relaxed">

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 text-sm text-amber-800">
              <strong>Note:</strong> These Terms of Service are a draft and should be reviewed by qualified legal counsel before VetSteady commences commercial operations. Do not publish without legal review.
            </div>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">1. Agreement to Terms</h2>
            <p className="text-gray-600 mb-3">
              These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of VetSteady&rsquo;s scheduling, appointment reminder, and client communication platform and all related websites, APIs, and services (collectively, the &ldquo;Service&rdquo;) operated by VetSteady, Inc. (&ldquo;VetSteady,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;).
            </p>
            <p className="text-gray-600 mb-3">
              By creating an account or using the Service, you agree to be bound by these Terms. If you do not agree to these Terms, do not use the Service. If you are accepting these Terms on behalf of a veterinary practice or other organization, you represent and warrant that you have authority to bind that entity to these Terms.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">2. Description of Service</h2>
            <p className="text-gray-600 mb-3">
              VetSteady provides a cloud-based scheduling and client communication platform for veterinary practices, including:
            </p>
            <ul className="list-disc pl-5 text-gray-600 mb-3 space-y-1">
              <li>Appointment scheduling and calendar management</li>
              <li>Automated SMS and email appointment reminders</li>
              <li>Public online booking portals for client self-scheduling</li>
              <li>Client and pet record management</li>
              <li>Team management and staff scheduling</li>
              <li>Confirmation and cancellation handling via SMS or web links</li>
            </ul>
            <p className="text-gray-600 mb-3">
              VetSteady reserves the right to modify, suspend, or discontinue any part of the Service at any time, with reasonable notice where practicable.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">3. Account Registration and Eligibility</h2>
            <p className="text-gray-600 mb-3">
              <strong>Eligibility:</strong> The Service is available only to veterinary practices and their authorized staff located in countries where the Service is permitted. You must be at least 18 years of age and able to form a binding contract to create an account.
            </p>
            <p className="text-gray-600 mb-3">
              <strong>Account security:</strong> You are responsible for maintaining the confidentiality of your login credentials and for all activity that occurs under your account. You agree to notify VetSteady immediately of any unauthorized access. VetSteady is not liable for any loss arising from unauthorized use of your credentials.
            </p>
            <p className="text-gray-600 mb-3">
              <strong>Accuracy of information:</strong> You agree to provide accurate, complete information during registration and to keep your account information up to date.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">4. Subscriptions and Payments</h2>

            <h3 className="text-base font-semibold text-gray-800 mt-4 mb-2">4.1 Subscription Plans</h3>
            <p className="text-gray-600 mb-3">
              VetSteady offers subscription plans at the pricing disclosed on our website at the time of signup. All prices are in U.S. dollars unless otherwise stated.
            </p>

            <h3 className="text-base font-semibold text-gray-800 mt-4 mb-2">4.2 Billing Cycle</h3>
            <p className="text-gray-600 mb-3">
              Subscriptions are billed monthly or annually in advance, depending on the plan selected. By providing payment information, you authorize VetSteady (via Stripe) to charge your payment method for all fees associated with your selected plan.
            </p>

            <h3 className="text-base font-semibold text-gray-800 mt-4 mb-2">4.3 Free Trials</h3>
            <p className="text-gray-600 mb-3">
              VetSteady may offer a free trial period for new accounts. If your account includes a free trial, you will not be charged until the trial period expires. You may cancel at any time during the trial at no charge. VetSteady reserves the right to determine trial eligibility.
            </p>

            <h3 className="text-base font-semibold text-gray-800 mt-4 mb-2">4.4 Cancellation and Refunds</h3>
            <p className="text-gray-600 mb-3">
              You may cancel your subscription at any time via the account settings page or by contacting support. Cancellation takes effect at the end of the current billing period. <strong>No refunds are provided for partial months.</strong> Upon cancellation, your account will remain active until the end of the paid period, after which it will be downgraded or suspended per the policy in effect at that time.
            </p>

            <h3 className="text-base font-semibold text-gray-800 mt-4 mb-2">4.5 Failed Payments</h3>
            <p className="text-gray-600 mb-3">
              If a payment fails, VetSteady will attempt to charge the payment method again. If payment is not received within 14 days of the failed attempt, VetSteady reserves the right to suspend or terminate your account. You are responsible for any fees charged by your payment provider as a result of a failed payment.
            </p>

            <h3 className="text-base font-semibold text-gray-800 mt-4 mb-2">4.6 Price Changes</h3>
            <p className="text-gray-600 mb-3">
              VetSteady may change subscription pricing at any time. Price changes will take effect at the start of the next billing cycle following notice (which may be provided by email or through the Service). Continued use of the Service after a price change constitutes acceptance of the new pricing.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">5. Acceptable Use</h2>
            <p className="text-gray-600 mb-3">
              You agree to use the Service only for lawful purposes and in accordance with these Terms. You agree NOT to:
            </p>
            <ul className="list-disc pl-5 text-gray-600 mb-3 space-y-1">
              <li>Use the Service to send unsolicited communications or spam</li>
              <li>Send SMS or email messages that are unlawful, harassing, defamatory, obscene, or otherwise objectionable</li>
              <li>Use the Service to store or process Protected Health Information (PHI) beyond appointment scheduling data; VetSteady is not a HIPAA-covered entity and the Service is not intended as a medical records system</li>
              <li>Attempt to gain unauthorized access to any part of the Service or to another user&rsquo;s account</li>
              <li>Reverse engineer, disassemble, or decompile the Service or its underlying technology</li>
              <li>Resell, sublicense, or redistribute the Service without written permission from VetSteady</li>
              <li>Use the Service in any manner that interferes with its availability to other users</li>
              <li>Violate any applicable local, state, national, or international law in connection with your use of the Service</li>
            </ul>
            <p className="text-gray-600 mb-3">
              <strong>Client data:</strong> You represent and warrant that you have all rights, permissions, and consents required to enter client contact information into the Service and to send SMS/email communications to those clients on your behalf.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">6. Data Ownership and Your Content</h2>
            <p className="text-gray-600 mb-3">
              <strong>Your data:</strong> You retain ownership of all data, content, and information you or your staff enter into the Service (&ldquo;Practice Data&rdquo;). You grant VetSteady a limited, non-exclusive, worldwide license to host, store, process, and display Practice Data solely as necessary to provide the Service.
            </p>
            <p className="text-gray-600 mb-3">
              <strong>VetSteady data:</strong> Aggregated, de-identified data derived from Practice Data (&ldquo;VetSteady Data&rdquo;) is owned by VetSteady. Such data does not identify individual practices or clients.
            </p>
            <p className="text-gray-600 mb-3">
              <strong>Data export:</strong> You may export your Practice Data at any time through the account settings or by contacting support. VetSteady is not responsible for any data lost if your account is terminated.
            </p>
            <p className="text-gray-600 mb-3">
              <strong>Account termination:</strong> Upon account cancellation, VetSteady will retain Practice Data for 90 days, after which it will be deleted from the Service, except as required by law or for legitimate business purposes (e.g., billing dispute resolution).
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">7. SMS and Electronic Communications</h2>
            <p className="text-gray-600 mb-3">
              By using VetSteady to send SMS reminders, you authorize VetSteady to send text messages to your clients on your behalf using phone numbers you provide. You represent that you have obtained all required consents from clients to receive SMS communications before entering their phone numbers into the Service.
            </p>
            <p className="text-gray-600 mb-3">
              Message frequency depends on appointment volume. Standard carrier message and data rates may apply. Clients may opt out by replying STOP; you may not override or circumvent client opt-outs.
            </p>
            <p className="text-gray-600 mb-3">
              VetSteady uses Twilio as its SMS provider. You agree to Twilio&rsquo;s <a href="https://www.twilio.com/legal/tos" className="text-[#0D7377] underline" target="_blank" rel="noopener noreferrer">Terms of Service</a> and <a href="https://www.twilio.com/legal/privacy" className="text-[#0D7377] underline" target="_blank" rel="noopener noreferrer">Privacy Policy</a> insofar as they apply to SMS delivery.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">8. Third-Party Services</h2>
            <p className="text-gray-600 mb-3">
              The Service integrates with third-party services including Twilio (SMS), Resend (email), Stripe (payments), Supabase (database hosting), and Shepherd Veterinary Software (optional PIMS integration). Your use of these third-party services is governed by their own terms and privacy policies. VetSteady is not responsible for the actions, data practices, or availability of any third-party service.
            </p>
            <p className="text-gray-600 mb-3">
              If you connect Shepherd Veterinary Software to VetSteady, Shepherd&rsquo;s collection and handling of your practice&rsquo;s data is governed by Shepherd&rsquo;s terms and privacy policy at <a href="https://shepherd.vet/privacy-policy" className="text-[#0D7377] underline" target="_blank" rel="noopener noreferrer">shepherd.vet/privacy-policy</a>.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">9. Intellectual Property</h2>
            <p className="text-gray-600 mb-3">
              The Service and its original content, features, and functionality are owned by VetSteady, Inc. and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws. The VetSteady name, logo, and all related names are trademarks of VetSteady and may not be used without prior written consent.
            </p>
            <p className="text-gray-600 mb-3">
              You may not copy, modify, distribute, sell, or lease any part of the Service without VetSteady&rsquo;s prior written consent. You may not reverse engineer or exploit the Service for competitive purposes.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">10. Disclaimers and Limitation of Liability</h2>

            <h3 className="text-base font-semibold text-gray-800 mt-4 mb-2">10.1 Disclaimers</h3>
            <p className="text-gray-600 mb-3">
              <strong>THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.</strong> VetSteady does not warrant that the Service will be uninterrupted, error-free, secure, or free of viruses. No advice or information obtained by you from VetSteady creates any warranty not expressly stated herein.
            </p>
            <p className="text-gray-600 mb-3">
              <strong>SMS delivery:</strong> VetSteady uses Twilio to deliver SMS messages. VetSteady does not guarantee that SMS messages will be delivered, that they will be delivered within a specific timeframe, or that they will be received by clients. SMS delivery depends on carrier networks and other factors outside VetSteady&rsquo;s control.
            </p>
            <p className="text-gray-600 mb-3">
              <strong>No medical advice:</strong> VetSteady is a scheduling and communication platform. VetSteady does not provide, and is not responsible for, any veterinary medical advice, diagnosis, or treatment. Any questions about a pet&rsquo;s health should be directed to the appropriate veterinary professional.
            </p>

            <h3 className="text-base font-semibold text-gray-800 mt-4 mb-2">10.2 Limitation of Liability</h3>
            <p className="text-gray-600 mb-3">
              <strong>TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL VETSTEADY, ITS OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, OR AFFILIATES BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM:</strong> (i) your access to or use of (or inability to access or use) the Service; (ii) any conduct or content of any third party; (iii) any content obtained from the Service; and (iv) unauthorized access, use, or alteration of your transmissions or data, <strong>WHETHER BASED ON WARRANTY, CONTRACT, TORT (INCLUDING NEGLIGENCE), OR ANY OTHER LEGAL THEORY, WHETHER OR NOT VETSTEADY HAS BEEN INFORMED OF THE POSSIBILITY OF SUCH DAMAGE.</strong>
            </p>
            <p className="text-gray-600 mb-3">
              <strong>CAP ON LIABILITY:</strong> EXCEPT FOR CLAIMS ARISING FROM FRAUD, GROSS NEGLIGENCE, OR WILLFUL MISCONDUCT, VETSTEADY&rsquo;S TOTAL LIABILITY ARISING OUT OF OR RELATED TO THESE TERMS OR THE SERVICE SHALL NOT EXCEED THE AMOUNT OF FEES PAID BY YOU TO VETSTEADY IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">11. Indemnification</h2>
            <p className="text-gray-600 mb-3">
              You agree to indemnify, defend, and hold harmless VetSteady, its officers, directors, employees, agents, and affiliates from and against any and all claims, damages, losses, costs, and expenses (including reasonable attorneys&rsquo; fees) arising out of or relating to: (i) your use of the Service; (ii) your violation of these Terms; (iii) your violation of any third-party right; or (iv) your practice&rsquo;s provision of veterinary services to its clients.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">12. Governing Law</h2>
            <p className="text-gray-600 mb-3">
              These Terms shall be governed by and construed in accordance with the laws of the <strong>State of Delaware, United States of America</strong>, without regard to its conflict of law provisions. Any disputes arising from or relating to these Terms or the Service shall be subject to the exclusive jurisdiction of the state or federal courts located in <strong>Delaware, USA</strong>, and you hereby consent to the personal jurisdiction of such courts.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">13. Termination</h2>
            <p className="text-gray-600 mb-3">
              You may terminate your account at any time through the account settings or by contacting support. VetSteady may suspend or terminate your access to the Service immediately, without prior notice, if we believe you have violated these Terms or for any other reason at VetSteady&rsquo;s sole discretion. Upon termination: (a) your right to use the Service ceases immediately; (b) you must stop all use of the Service; and (c) Sections 6 (Data Ownership), 9 (Intellectual Property), 10 (Disclaimers and Limitation of Liability), 11 (Indemnification), and 13 (Governing Law) survive termination.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">14. Modifications to These Terms</h2>
            <p className="text-gray-600 mb-3">
              VetSteady reserves the right to modify these Terms at any time. If we make material changes, we will provide notice (which may include email notification or posting a notice within the Service) at least 30 days before the changes take effect. Your continued use of the Service after such notice constitutes your acceptance of the modified Terms.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">15. HIPAA and Compliance</h2>
            <p className="text-gray-600 mb-3">
              VetSteady is not a Business Associate under HIPAA and the Service is not intended to function as a covered entity or business associate system. If your practice is subject to HIPAA, you are responsible for ensuring that your use of the Service complies with HIPAA requirements, including determining whether connecting Shepherd Veterinary Software or entering any data into VetSteady is appropriate for your HIPAA compliance program.
            </p>
            <p className="text-gray-600 mb-3">
              For more information, see our <Link href="/legal/privacy" className="text-[#0D7377] underline">Privacy Policy</Link> and our <a href="/docs/hipaa-review.md" className="text-[#0D7377] underline">HIPAA Review</a>.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">16. General</h2>
            <p className="text-gray-600 mb-3">
              These Terms constitute the entire agreement between you and VetSteady regarding the Service and supersede all prior agreements and understandings. If any provision of these Terms is found to be unenforceable, the remaining provisions shall remain in full force and effect. VetSteady&rsquo;s failure to enforce any right or provision shall not constitute a waiver of that right or provision.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">17. Contact Us</h2>
            <div className="bg-gray-50 rounded-xl p-5 text-sm text-gray-600 space-y-1">
              <p><strong>VetSteady, Inc.</strong></p>
              <p>General inquiries: <a href="mailto:support@vetsteady.com" className="text-[#0D7377] underline">support@vetsteady.com</a></p>
              <p>Billing questions: <a href="mailto:billing@vetsteady.com" className="text-[#0D7377] underline">billing@vetsteady.com</a></p>
              <p>Legal notices: <a href="mailto:legal@vetsteady.com" className="text-[#0D7377] underline">legal@vetsteady.com</a></p>
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
