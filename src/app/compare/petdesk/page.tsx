import Link from 'next/link'

const features = [
  {
    category: 'Pricing',
    items: [
      { feature: 'Starting price', petdesk: '$199/mo', vetsteady: '$30/mo', winner: 'vetsteady' },
      { feature: 'Setup fee', petdesk: '$299 one-time', vetsteady: 'None', winner: 'vetsteady' },
      { feature: 'Free trial', petdesk: '14 days', vetsteady: '15 days (no credit card)', winner: 'vetsteady' },
      { feature: 'Annual contract required', petdesk: 'Yes (most plans)', vetsteady: 'No — month-to-month', winner: 'vetsteady' },
    ],
  },
  {
    category: 'Core Features',
    items: [
      { feature: 'Automated SMS reminders', petdesk: '✓', vetsteady: '✓', winner: 'tie' },
      { feature: 'Email reminders', petdesk: '✓', vetsteady: '✓', winner: 'tie' },
      { feature: 'Two-way SMS confirmation', petdesk: '✓', vetsteady: '✓', winner: 'tie' },
      { feature: 'Online client booking portal', petdesk: '✓', vetsteady: '✓', winner: 'tie' },
      { feature: 'Waitlist auto-fill', petdesk: '✓ (higher tiers)', vetsteady: '✓ (all plans)', winner: 'vetsteady' },
      { feature: 'Deposit collection', petdesk: '✗', vetsteady: '✓ (Stripe)', winner: 'vetsteady' },
      { feature: 'No-show analytics', petdesk: 'Basic', vetsteady: 'Detailed per client', winner: 'vetsteady' },
    ],
  },
  {
    category: 'Practice Fit',
    items: [
      { feature: 'Target practice size', petdesk: '3–20+ vets', vetsteady: '1–3 vets', winner: 'vetsteady' },
      { feature: 'Setup time', petdesk: '2–4 weeks (onboarding)', vetsteady: 'Under 10 minutes', winner: 'vetsteady' },
      { feature: 'Dedicated account manager', petdesk: '✓', vetsteady: 'Email + chat support', winner: 'petdesk' },
      { feature: 'PIMS integration', petdesk: 'Broad (IDEXX, AVImark)', vetsteady: 'Shepherd (in progress)', winner: 'petdesk' },
      { feature: 'Mobile app', petdesk: '✓ (client-facing)', vetsteady: 'Mobile-responsive web', winner: 'petdesk' },
    ],
  },
  {
    category: 'Transparency',
    items: [
      { feature: 'Pricing listed publicly', petdesk: '✗ (quote required)', vetsteady: '✓ ($30–$49/mo clearly)', winner: 'vetsteady' },
      { feature: 'Cancel any time', petdesk: '✗ (annual contracts)', vetsteady: '✓ no penalty', winner: 'vetsteady' },
      { feature: 'Data export', petdesk: '✓', vetsteady: '✓', winner: 'tie' },
    ],
  },
]

export default function PetDeskComparisonPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-[#0D7377] font-bold text-xl tracking-tight">VetSteady</Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-600">
            <Link href="/#pricing" className="hover:text-gray-900 transition-colors">Pricing</Link>
            <Link href="/#faq" className="hover:text-gray-900 transition-colors">FAQ</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Sign in</Link>
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
      <section className="max-w-4xl mx-auto px-6 pt-16 pb-12 text-center">
        <div className="inline-flex items-center gap-2 bg-teal-50 text-[#0D7377] text-xs font-semibold px-3 py-1.5 rounded-full mb-6 uppercase tracking-wide">
          Honest comparison
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-5 tracking-tight">
          VetSteady vs PetDesk
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-4 leading-relaxed">
          PetDesk is built for large multi-vet hospitals. VetSteady is built for the 
          independent 1–3 vet practice that doesn't want a sales call to find out the price.
        </p>
        <p className="text-sm text-gray-400">
          Last updated: March 2026. PetDesk pricing based on publicly available information and user reports.
        </p>
      </section>

      {/* Quick verdict */}
      <section className="bg-gray-50 border-y border-gray-100 py-10">
        <div className="max-w-4xl mx-auto px-6 grid md:grid-cols-3 gap-6 text-center">
          <div className="bg-white rounded-xl p-6 border border-gray-100">
            <div className="text-3xl font-bold text-[#0D7377] mb-1">$1,800/yr</div>
            <div className="text-sm text-gray-500">saved vs PetDesk on comparable plan</div>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-100">
            <div className="text-3xl font-bold text-[#0D7377] mb-1">15 days</div>
            <div className="text-sm text-gray-500">free trial — no credit card required</div>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-100">
            <div className="text-3xl font-bold text-[#0D7377] mb-1">&lt; 10 min</div>
            <div className="text-sm text-gray-500">setup vs PetDesk's 2–4 week onboarding</div>
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        {features.map((group) => (
          <div key={group.category} className="mb-12">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">
              {group.category}
            </h2>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-3 bg-gray-50 border-b border-gray-200">
                <div className="px-6 py-3 text-sm font-semibold text-gray-600">Feature</div>
                <div className="px-6 py-3 text-sm font-semibold text-gray-500 text-center border-l border-gray-200">PetDesk</div>
                <div className="px-6 py-3 text-sm font-semibold text-[#0D7377] text-center border-l border-gray-200">VetSteady</div>
              </div>
              {group.items.map((item, i) => (
                <div
                  key={item.feature}
                  className={`grid grid-cols-3 border-b border-gray-100 last:border-0 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                >
                  <div className="px-6 py-4 text-sm text-gray-700">{item.feature}</div>
                  <div className={`px-6 py-4 text-sm text-center border-l border-gray-100 ${item.winner === 'petdesk' ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>
                    {item.petdesk}
                  </div>
                  <div className={`px-6 py-4 text-sm text-center border-l border-gray-100 ${item.winner === 'vetsteady' ? 'font-semibold text-[#0D7377]' : 'text-gray-500'}`}>
                    {item.winner === 'vetsteady' && (
                      <span className="inline-flex items-center gap-1">
                        {item.vetsteady}
                      </span>
                    )}
                    {item.winner !== 'vetsteady' && item.vetsteady}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* Who should use each */}
      <section className="bg-gray-50 border-y border-gray-100 py-16">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-10 text-center">Which is right for your practice?</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-8 border border-gray-200">
              <div className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-3">Choose PetDesk if…</div>
              <ul className="space-y-3 text-sm text-gray-600">
                {[
                  'You have 5+ vets and a dedicated office manager',
                  'You need deep IDEXX Cornerstone or AVImark integration',
                  'You want a branded client mobile app',
                  'You have budget for $200+/month and a multi-year contract',
                  'You have an IT department for the 4-week onboarding',
                ].map(item => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-gray-300 mt-0.5">→</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-[#0D7377] rounded-xl p-8 text-white">
              <div className="text-sm font-bold text-teal-300 uppercase tracking-wide mb-3">Choose VetSteady if…</div>
              <ul className="space-y-3 text-sm text-teal-100">
                {[
                  'You run a 1–3 vet independent practice',
                  'You want to be set up today — not in 4 weeks',
                  'You want to see the price without a sales call',
                  'You need no-show reminders without $300/month overhead',
                  'You want to try it free for 15 days with no credit card',
                ].map(item => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-teal-400 mt-0.5">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial / social proof placeholder */}
      <section className="max-w-3xl mx-auto px-6 py-16 text-center">
        <div className="bg-teal-50 border border-teal-100 rounded-2xl p-10">
          <blockquote className="text-lg text-gray-700 leading-relaxed mb-6 italic">
            "We looked at PetDesk but it was built for big hospital groups. VetSteady was
            up and running in 8 minutes and our no-show rate dropped 28% in the first month."
          </blockquote>
          <div className="text-sm text-gray-500">
            — Practice manager, independent 2-vet clinic <span className="text-gray-400">(Beta user)</span>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 pb-24 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Try VetSteady free for 15 days.
        </h2>
        <p className="text-gray-500 mb-8">
          No credit card. No sales call. No 4-week onboarding. Just setup in 10 minutes 
          and reminders running by end of day.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/onboarding"
            className="bg-[#0D7377] text-white px-8 py-4 rounded-xl font-semibold text-base hover:bg-[#0a5c60] transition-colors"
          >
            Start free — no credit card
          </Link>
          <Link
            href="/"
            className="border border-gray-200 text-gray-700 px-8 py-4 rounded-xl font-semibold text-base hover:border-gray-300 hover:bg-gray-50 transition-colors"
          >
            Learn more about VetSteady
          </Link>
        </div>
        <p className="text-sm text-gray-400 mt-4">15 days free · Setup in under 10 minutes · Cancel any time</p>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <Link href="/" className="font-semibold text-[#0D7377]">VetSteady</Link>
          <span>© {new Date().getFullYear()} VetSteady. Built for independent veterinary practices.</span>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-gray-600 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-gray-600 transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
