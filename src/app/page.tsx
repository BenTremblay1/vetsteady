import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[#0D7377] font-bold text-xl tracking-tight">VetSteady</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-600">
            <a href="#how-it-works" className="hover:text-gray-900 transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-gray-900 transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-gray-900 transition-colors">FAQ</a>
            <Link href="/compare/petdesk" className="hover:text-gray-900 transition-colors">vs PetDesk</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Sign in
            </Link>
            <Link
              href="/onboarding"
              className="text-sm bg-[#0D7377] text-white px-4 py-2 rounded-lg hover:bg-[#0a5c60] transition-colors font-medium"
            >
              Start free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-teal-50 text-[#0D7377] text-xs font-semibold px-3 py-1.5 rounded-full mb-8 uppercase tracking-wide">
          Built for independent vet practices
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6 tracking-tight">
          VetSteady's Smart Reminder Engine{' '}
          <span className="text-[#0D7377]">cuts no-shows by 30%</span>
          {' '}— automatically.
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          AI-optimized SMS reminders that learn when each client responds best — 
          purpose-built for 1–3 vet independent practices.
          Every empty slot costs $180. VetSteady fills them.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/onboarding"
            className="bg-[#0D7377] text-white px-8 py-4 rounded-xl font-semibold text-base hover:bg-[#0a5c60] transition-colors"
          >
            Start free — no credit card
          </Link>
          <a
            href="#how-it-works"
            className="border border-gray-200 text-gray-700 px-8 py-4 rounded-xl font-semibold text-base hover:border-gray-300 hover:bg-gray-50 transition-colors"
          >
            See how it works
          </a>
        </div>
        <p className="text-sm text-gray-400 mt-4">Free for 60 days · Setup in under 10 minutes</p>
      </section>

      {/* Social proof numbers */}
      <section className="bg-gray-50 border-y border-gray-100 py-12">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-3xl font-bold text-gray-900 mb-1">$59,400</div>
            <div className="text-sm text-gray-500">lost per vet annually to no-shows</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-[#0D7377] mb-1">30%</div>
            <div className="text-sm text-gray-500">average no-show reduction</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900 mb-1">99%</div>
            <div className="text-sm text-gray-500">SMS open rate vs 33% email</div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="max-w-5xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Simple by design</h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            No training required. No IT department needed. If you can send a text, you can use VetSteady.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-10">
          {[
            {
              step: '01',
              title: 'Book the appointment',
              desc: 'Your client books online or your staff adds it to the calendar. VetSteady immediately queues their reminder sequence.',
            },
            {
              step: '02',
              title: 'Reminders go out automatically',
              desc: 'SMS reminders fire at 2 weeks, 4 days, and 2 days before — personalized with the pet\'s name. No manual work.',
            },
            {
              step: '03',
              title: 'Clients confirm in one tap',
              desc: 'Every reminder includes a confirmation link. You see real-time status: confirmed, unconfirmed, at-risk. Fill waitlist instantly.',
            },
          ].map(({ step, title, desc }) => (
            <div key={step} className="relative">
              <div className="text-5xl font-bold text-gray-100 mb-4">{step}</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">{title}</h3>
              <p className="text-gray-500 leading-relaxed text-sm">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 border-y border-gray-100 py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything you need. Nothing you don't.</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { icon: '📱', title: 'SMS-first reminders', desc: '99% open rate. Clients confirm with one tap — no app download, no login.' },
              { icon: '🧠', title: 'Smart Reminder Engine', desc: 'AI-optimized timing learns when each client responds best. Reduces no-shows 30%+ without any manual work.' },
              { icon: '🐾', title: 'Pet + client profiles', desc: 'Track no-show history per client. Know who needs a deposit requirement before they book again.' },
              { icon: '📅', title: 'Smart scheduling calendar', desc: 'Day and week views per vet. Colour-coded by appointment type and confirmation status.' },
              { icon: '🔗', title: 'Online booking portal', desc: 'Your own booking page at vetsteady.com/book/your-practice. Clients self-schedule wellness & tech appointments.' },
              { icon: '💳', title: 'Deposit collection', desc: 'Require deposits for new clients or high-risk appointments. Stripe-powered, frictionless.' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="bg-white rounded-xl p-6 border border-gray-100">
                <div className="text-2xl mb-3">{icon}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-4xl mx-auto px-6 py-24 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Pricing that makes sense</h2>
        <p className="text-gray-500 mb-12 max-w-xl mx-auto">
          Less than the revenue from one recovered no-show per month. Seriously.
        </p>
        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* Free */}
          <div className="border border-gray-200 rounded-2xl p-8 text-left">
            <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Starter</div>
            <div className="text-4xl font-bold text-gray-900 mb-1">$0</div>
            <div className="text-sm text-gray-400 mb-6">Up to 50 appointments/month</div>
            <ul className="space-y-3 text-sm text-gray-600 mb-8">
              {['SMS + email reminders', 'Online booking portal', 'Client & pet profiles', 'Confirmation tracking', '1 vet calendar'].map(f => (
                <li key={f} className="flex items-center gap-2">
                  <span className="text-[#0D7377]">✓</span> {f}
                </li>
              ))}
            </ul>
            <Link href="/onboarding" className="block text-center border border-gray-200 text-gray-700 py-3 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
              Start free
            </Link>
          </div>
          {/* Pro */}
          <div className="bg-[#0D7377] rounded-2xl p-8 text-left text-white relative overflow-hidden">
            <div className="absolute top-4 right-4 bg-[#F4A435] text-white text-xs font-bold px-3 py-1 rounded-full">Most popular</div>
            <div className="text-sm font-semibold text-teal-200 uppercase tracking-wide mb-2">Pro</div>
            <div className="text-4xl font-bold mb-1">$99<span className="text-xl font-normal text-teal-200">/mo</span></div>
            <div className="text-sm text-teal-200 mb-6">Unlimited appointments · 1–3 vets</div>
            <ul className="space-y-3 text-sm text-teal-100 mb-8">
              {[
                'Everything in Starter',
                'Unlimited appointments',
                'Up to 3 vet calendars',
                'Waitlist auto-fill',
                'Deposit collection (Stripe)',
                'No-show analytics',
                'Priority support',
              ].map(f => (
                <li key={f} className="flex items-center gap-2">
                  <span className="text-white">✓</span> {f}
                </li>
              ))}
            </ul>
            <Link href="/onboarding" className="block text-center bg-white text-[#0D7377] py-3 rounded-lg text-sm font-semibold hover:bg-teal-50 transition-colors">
              Start 60-day free trial
            </Link>
          </div>
        </div>
        <p className="text-sm text-gray-400 mt-8">
          Recovering one no-show at $180 avg = your subscription paid for. Twice over.
        </p>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-gray-50 border-t border-gray-100 py-24">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Common questions</h2>
          <div className="space-y-8">
            {[
              {
                q: 'Do I need to replace my current software?',
                a: 'No. VetSteady runs alongside your existing practice management system. We handle scheduling and reminders — you keep using whatever else you have.',
              },
              {
                q: 'How long does setup take?',
                a: 'Under 10 minutes. Sign up, enter your practice details, and your first reminder sequence is ready to go. No installation, no IT help needed.',
              },
              {
                q: 'What if my clients don\'t respond to SMS?',
                a: 'VetSteady automatically falls back to email if SMS isn\'t delivered. You can also configure preferred channels per client.',
              },
              {
                q: 'Is client data secure?',
                a: 'Yes. Data is encrypted at rest and in transit. We use Twilio (HIPAA-eligible with BAA) for SMS and never include medical information in reminder messages.',
              },
              {
                q: 'What\'s the cancellation policy?',
                a: 'Cancel any time. No contracts, no cancellation fees. Export your data any time.',
              },
            ].map(({ q, a }) => (
              <div key={q} className="border-b border-gray-200 pb-8 last:border-0">
                <h3 className="font-semibold text-gray-900 mb-2">{q}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-3xl mx-auto px-6 py-24 text-center">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">
          Stop losing $59,000 a year to no-shows.
        </h2>
        <p className="text-gray-500 mb-8 text-lg">
          Join practices already using VetSteady to keep their calendars full.
        </p>
        <Link
          href="/onboarding"
          className="inline-block bg-[#0D7377] text-white px-10 py-4 rounded-xl font-semibold text-base hover:bg-[#0a5c60] transition-colors"
        >
          Start your free trial
        </Link>
        <p className="text-sm text-gray-400 mt-4">No credit card · 60 days free · Cancel any time</p>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <span className="font-semibold text-[#0D7377]">VetSteady</span>
          <span>© {new Date().getFullYear()} VetSteady. Built for independent veterinary practices.</span>
          <div className="flex gap-6">
            <a href="/privacy" className="hover:text-gray-600 transition-colors">Privacy</a>
            <a href="/terms" className="hover:text-gray-600 transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
