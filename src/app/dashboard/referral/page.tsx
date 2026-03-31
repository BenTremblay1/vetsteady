'use client';

import { useState, useEffect, useCallback } from 'react';
import { Gift, Link2, Copy, Check, Users, DollarSign, ArrowRight, Clock, Star, Share2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface ReferralStats {
  totalReferred: number;
  pendingReferred: number;
  earnedMonths: number;
  pendingMonths: number;
  practiceName: string;
  practiceSlug: string;
  referralLink: string;
  isEligible: boolean;
  activationDaysRemaining: number | null;
  npsScore: number | null;
}

export default function ReferralPage() {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();

    // Get current user + practice
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data: practice } = await supabase
      .from('practices')
      .select('id, name, slug')
      .eq('owner_id', user.id)
      .single();

    if (!practice) {
      setLoading(false);
      return;
    }

    // Get or create referral record
    const { data: referral } = await supabase
      .from('referral_programs')
      .select('*')
      .eq('practice_id', practice.id)
      .single();

    // Count referred clinics
    const { count: referredCount } = await supabase
      .from('referral_programs')
      .select('*', { count: 'exact', head: true })
      .eq('referred_by_practice_id', practice.id);

    // Calculate activation eligibility (30 days + NPS check)
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('created_at')
      .eq('practice_id', practice.id)
      .single();

    const createdAt = subscription?.created_at ? new Date(subscription.created_at) : new Date(user.created_at);
    const daysSinceCreation = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    const activationDaysRemaining = Math.max(0, 30 - daysSinceCreation);
    const isEligible = daysSinceCreation >= 30;

    // Mock NPS from user metadata or Supabase (placeholder)
    const npsScore = isEligible ? (referral?.nps_score ?? null) : null;

    // Estimate pending (referred but not yet converted)
    const pendingCount = Math.max(0, (referredCount ?? 0) - (referral?.converted_count ?? 0));

    const referralLink = `https://vetsteady.com/ref/${practice.slug}`;

    setStats({
      practiceName: practice.name,
      practiceSlug: practice.slug,
      referralLink,
      totalReferred: referredCount ?? 0,
      pendingReferred: pendingCount,
      earnedMonths: referral?.earned_months ?? 0,
      pendingMonths: referral?.pending_months ?? 0,
      isEligible,
      activationDaysRemaining,
      npsScore,
    });

    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const copyLink = async () => {
    if (!stats) return;
    try {
      await navigator.clipboard.writeText(stats.referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setShareError('Could not copy — please select and copy manually.');
    }
  };

  const shareViaWebShare = async () => {
    if (!stats) return;
    try {
      await navigator.share({
        title: 'VetSteady — Keep your practice running',
        text: `VetSteady cut our no-show rate by 30%. It's $99/mo and takes 10 minutes to set up. Use my link: ${stats.referralLink}`,
        url: stats.referralLink,
      });
    } catch {
      setShareError('Sharing was cancelled.');
    }
  };

  const shareViaEmail = () => {
    if (!stats) return;
    const subject = encodeURIComponent("You've got to try VetSteady");
    const body = encodeURIComponent(
      `Hi,\n\nI use VetSteady to reduce no-shows at my practice — our rate dropped 30% in the first month.\n\nIt's built for independent 1–3 vet practices, $99/mo, and you can be up and running today.\n\nUse my referral link to get started: ${stats.referralLink}\n\n— ${stats.practiceName}`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-8 w-48 bg-gray-100 rounded" />
        <div className="h-4 w-72 bg-gray-100 rounded" />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-xl" />
          ))}
        </div>
        <div className="h-48 bg-gray-100 rounded-xl" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex flex-col gap-4 items-start">
        <h1 className="text-2xl font-bold text-gray-900">Referral Program</h1>
        <p className="text-gray-500">Please sign in to access your referral dashboard.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Gift size={22} className="text-[#0D7377]" />
          Referral Program
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Refer another vet practice — both of you get a month free.
        </p>
      </div>

      {/* Eligibility Banner */}
      {!stats.isEligible && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-start gap-4">
          <Clock size={20} className="text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800 mb-1">
              Referral program unlocks in {stats.activationDaysRemaining} day{stats.activationDaysRemaining !== 1 ? 's' : ''}
            </p>
            <p className="text-sm text-amber-700">
              Once your account is 30 days old, you can start referring other practices. You'll both get a month free when they convert.
            </p>
          </div>
        </div>
      )}

      {/* Referral Link Card */}
      <div className="bg-[#0D7377] rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p className="text-teal-200 text-xs font-semibold uppercase tracking-wide mb-1">Your referral link</p>
            <p className="text-white/60 text-xs">Share this link with vet practice owners you know</p>
          </div>
          {stats.isEligible && (
            <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full shrink-0">
              Active
            </span>
          )}
        </div>

        <div className="flex gap-2 mb-4">
          <div className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 flex items-center gap-2 overflow-hidden">
            <Link2 size={14} className="text-teal-300 shrink-0" />
            <span className="text-sm text-white truncate font-mono">{stats.referralLink}</span>
          </div>
          <button
            onClick={copyLink}
            className="bg-white text-[#0D7377] px-4 py-2 rounded-xl text-sm font-semibold hover:bg-teal-50 transition-colors shrink-0 flex items-center gap-1.5"
          >
            {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy</>}
          </button>
        </div>

        {shareError && (
          <p className="text-xs text-red-200 mb-3">{shareError}</p>
        )}

        {/* Share buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={shareViaWebShare}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 border border-white/20 px-3 py-2 rounded-lg text-sm text-white transition-colors"
          >
            <Share2 size={13} />
            Share
          </button>
          <button
            onClick={shareViaEmail}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 border border-white/20 px-3 py-2 rounded-lg text-sm text-white transition-colors"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
            Email a colleague
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-[#0D7377]/10 flex items-center justify-center">
              <Users size={14} className="text-[#0D7377]" />
            </div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Referred</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.totalReferred}</p>
          <p className="text-xs text-gray-400 mt-1">{stats.pendingReferred} pending conversion</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <DollarSign size={14} className="text-emerald-600" />
            </div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Earned</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {stats.earnedMonths > 0 ? `${stats.earnedMonths} mo` : '—'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {stats.earnedMonths > 0 ? 'free months earned' : 'refer to start earning'}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <Clock size={14} className="text-amber-600" />
            </div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Pending</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {stats.pendingMonths > 0 ? `${stats.pendingMonths} mo` : '—'}
          </p>
          <p className="text-xs text-gray-400 mt-1">unlocks when they pay</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
              <ArrowRight size={14} className="text-purple-600" />
            </div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Your reward</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">1 month free</p>
          <p className="text-xs text-gray-400 mt-1">when they complete setup</p>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">How the referral program works</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {[
            {
              step: '1',
              title: 'Share your link',
              desc: 'Send vetsteady.com/ref/your-practice to a vet practice owner you know. Works best with colleagues from vet school, local VMA chapters, or Facebook vet groups.',
              done: true,
            },
            {
              step: '2',
              title: 'They start their free trial',
              desc: 'New referrals get 60 days free (vs the standard 14 days) using your link. No credit card required to start.',
              done: true,
            },
            {
              step: '3',
              title: 'They complete setup',
              desc: 'They must connect Twilio, send 5+ reminders, and be active for 7 days — this prevents fraud and ensures they're a real clinic.',
              done: stats.totalReferred > 0,
            },
            {
              step: '4',
              title: 'Both of you get a month free',
              desc: `Once the referred clinic subscribes, you receive a Stripe coupon for 1 free month (applied to your next invoice automatically). They also get a 14-day extension on their trial.`,
              done: stats.earnedMonths > 0,
            },
          ].map(({ step, title, desc, done }) => (
            <div key={step} className="px-6 py-4 flex items-start gap-4">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                done ? 'bg-[#0D7377] text-white' : 'bg-gray-100 text-gray-400'
              }`}>
                {done ? <Check size={12} /> : step}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{title}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Who to refer */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Users size={16} className="text-gray-400" />
          Who to refer
        </h2>
        <div className="grid md:grid-cols-2 gap-3">
          {[
            { icon: '🏥', text: 'Independent 1–3 vet practices (our ideal customer)' },
            { icon: '📅', text: 'Clinics with a known no-show problem' },
            { icon: '💸', text: 'Practices currently paying $150+/mo for basic reminders' },
            { icon: '🤝', text: 'Vet school classmates, former colleagues, VMA members' },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-start gap-3 bg-gray-50 rounded-xl px-4 py-3">
              <span className="text-lg">{icon}</span>
              <p className="text-sm text-gray-700 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Terms */}
      <div className="text-xs text-gray-400 space-y-1">
        <p><strong>Eligibility:</strong> Your account must be active for 30+ days to participate.</p>
        <p><strong>Reward:</strong> 1 free month credited to your VetSteady subscription (no cash value). Non-transferable.</p>
        <p><strong>Referral requirements:</strong> Referred clinic must complete onboarding, connect Twilio, send ≥5 reminders, and subscribe to a paid plan.</p>
        <p><strong>Limits:</strong> Maximum 10 active referral credits per account at any time.</p>
        <p><strong>Abuse:</strong> Self-referrals or fake accounts will be disqualified. VetSteady reserves the right to terminate abusive accounts.</p>
      </div>
    </div>
  );
}
