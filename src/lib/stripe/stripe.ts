import Stripe from 'stripe';

// Stripe is initialized lazily to allow builds without env vars.
// All API routes that use `stripe` will fail gracefully at runtime if the key is missing.
let _stripe: Stripe | null = null;

export function getStripeServer(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('Missing STRIPE_SECRET_KEY environment variable');
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-03-31.basil' as any,
      typescript: true,
    });
  }
  return _stripe;
}

// Default export for convenience — use getStripeServer() in API routes
export const stripe = typeof process !== 'undefined' && process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-03-31.basil' as any, typescript: true })
  : (null as unknown as Stripe);

// ─── Plan config ────────────────────────────────────────────────────────────
// Map plan names to Stripe Price IDs (set in Vercel env vars)
export const PLANS = {
  starter: {
    name: 'Starter',
    priceId: process.env.STRIPE_STARTER_PRICE_ID!,
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
    priceId: process.env.STRIPE_PRO_PRICE_ID!,
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

export type PlanKey = keyof typeof PLANS;

export const TRIAL_DAYS = 15;
