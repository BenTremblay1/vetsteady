'use client';

import { useState, useEffect } from 'react';
import { CreditCard, Check, ExternalLink, Sparkles, Shield } from 'lucide-react';

// ─── Plan definitions (must match stripe.ts) ────────────────────────────────
const PLANS = {
  starter: {
    name: 'Starter',
    price: 30,
    features: [
      'SMS + email reminders',
      'Online booking portal',
      'Client & pet profiles',
      'Confirmation tracking',
      '1 vet calendar',
      'Up to 100 appointments/mo',
    ],
  },
  pro: {
    name: 'Pro',
    price: 49,
    features: [
      'Everything in Starter',
      'Unlimited appointments',
      'Up to 3 vet calendars',
      'Waitlist auto-fill',
      'Deposit collection (Stripe)',
      'No-show analytics',
      'Priority support',
    ],
  },
} as const;

type PlanKey = keyof typeof PLANS;

interface PracticeData {
  subscription_status: string;
  settings: { plan?: string; stripe_subscription_id?: string };
  stripe_customer_id: string | null;
  name: string;
}

export default function BillingPage() {
  const [practice, setPractice] = useState<PracticeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<PlanKey | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Check for success/cancelled URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      setMessage({ type: 'success', text: 'Subscription activated! Your 15-day free trial has started.' });
      // Clean URL
      window.history.replaceState({}, '', '/dashboard/billing');
    }
    if (params.get('cancelled') === 'true') {
      setMessage({ type: 'error', text: 'Checkout cancelled. You can try again anytime.' });
      window.history.replaceState({}, '', '/dashboard/billing');
    }
  }, []);

  // Load practice data
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/v1/practice');
        const json = await res.json();
        if (json.data) setPractice(json.data);
      } catch (e) {
        console.error('[billing] load error:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const currentPlan = (practice?.settings?.plan as PlanKey) || null;
  const isActive = practice?.subscription_status === 'active';
  const isTrial = practice?.subscription_status === 'trial';
  const hasSubscription = isActive || isTrial;

  async function handleCheckout(plan: PlanKey) {
    setCheckoutLoading(plan);
    setMessage(null);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const json = await res.json();
      if (json.url) {
        window.location.href = json.url;
      } else {
        setMessage({ type: 'error', text: json.error || 'Failed to create checkout' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setCheckoutLoading(null);
    }
  }

  async function handlePortal() {
    setPortalLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      const json = await res.json();
      if (json.url) {
        window.location.href = json.url;
      } else {
        setMessage({ type: 'error', text: json.error || 'Failed to open billing portal' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setPortalLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 bg-gray-100 rounded" />
        <div className="h-64 bg-gray-100 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your subscription and payment method</p>
      </div>

      {/* Status message */}
      {message && (
        <div
          className={`rounded-xl px-4 py-3 text-sm font-medium ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Current plan status */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Current Plan</p>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-gray-900">
                {hasSubscription ? PLANS[currentPlan || 'starter'].name : 'No active plan'}
              </h2>
              {isTrial && (
                <span className="text-xs font-semibold bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full">
                  15-day trial
                </span>
              )}
              {isActive && (
                <span className="text-xs font-semibold bg-green-100 text-green-700 px-2.5 py-1 rounded-full">
                  Active
                </span>
              )}
              {practice?.subscription_status === 'paused' && (
                <span className="text-xs font-semibold bg-red-100 text-red-700 px-2.5 py-1 rounded-full">
                  Payment issue
                </span>
              )}
              {practice?.subscription_status === 'cancelled' && (
                <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                  Cancelled
                </span>
              )}
            </div>
            {hasSubscription && currentPlan && (
              <p className="text-sm text-gray-500 mt-1">
                ${PLANS[currentPlan].price}/month
              </p>
            )}
          </div>
          {practice?.stripe_customer_id && (
            <button
              onClick={handlePortal}
              disabled={portalLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <ExternalLink size={14} />
              {portalLoading ? 'Opening...' : 'Manage Billing'}
            </button>
          )}
        </div>
      </div>

      {/* Plan cards */}
      {!hasSubscription && (
        <>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Shield size={14} />
            <span>15-day free trial on all plans. No credit card required to start.</span>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {(Object.entries(PLANS) as [PlanKey, typeof PLANS[PlanKey]][]).map(([key, plan]) => (
              <div
                key={key}
                className={`rounded-xl border-2 p-6 transition-colors ${
                  key === 'pro'
                    ? 'border-[#0D7377] bg-teal-50/30'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-gray-900">{plan.name}</h3>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-3xl font-bold text-gray-900">${plan.price}</span>
                      <span className="text-sm text-gray-400">/mo</span>
                    </div>
                  </div>
                  {key === 'pro' && (
                    <span className="flex items-center gap-1 text-xs font-bold bg-[#0D7377] text-white px-3 py-1 rounded-full">
                      <Sparkles size={12} /> Best value
                    </span>
                  )}
                </div>

                <ul className="space-y-2.5 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                      <Check size={15} className="text-[#0D7377] mt-0.5 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleCheckout(key)}
                  disabled={checkoutLoading !== null}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 ${
                    key === 'pro'
                      ? 'bg-[#0D7377] text-white hover:bg-[#0a5c60]'
                      : 'border-2 border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <CreditCard size={15} />
                  {checkoutLoading === key
                    ? 'Redirecting to Stripe...'
                    : `Start 15-day free trial`}
                </button>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-gray-400">
            Recovering one no-show at $180 avg = your subscription paid for. Twice over.
          </p>
        </>
      )}

      {/* Upgrade prompt if on Starter */}
      {hasSubscription && currentPlan === 'starter' && (
        <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl border border-teal-200 p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-[#0D7377] flex items-center justify-center flex-shrink-0">
              <Sparkles size={18} className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900">Upgrade to Pro</h3>
              <p className="text-sm text-gray-600 mt-1 mb-4">
                Get unlimited appointments, waitlist auto-fill, deposit collection, and analytics for just $19 more/month.
              </p>
              <button
                onClick={() => handleCheckout('pro')}
                disabled={checkoutLoading !== null}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#0D7377] text-white hover:bg-[#0a5c60] transition-colors disabled:opacity-50"
              >
                <CreditCard size={15} />
                {checkoutLoading === 'pro' ? 'Redirecting...' : 'Upgrade to Pro — $49/mo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
