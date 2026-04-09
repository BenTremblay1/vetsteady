import { NextRequest, NextResponse } from 'next/server';
import { getStripeServer } from '@/lib/stripe/stripe';
import { createServiceClient } from '@/lib/supabase/service';
import Stripe from 'stripe';

// POST /api/stripe/webhooks — Stripe sends events here
export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripeServer().webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    console.error('[stripe/webhooks] signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const service = createServiceClient();

  try {
    switch (event.type) {
      // ─── Checkout completed — activate subscription ───────────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const practiceId = session.metadata?.practice_id;
        const plan = session.metadata?.plan || 'starter';

        if (practiceId) {
          // First update status + customer ID
          await service
            .from('practices')
            .update({
              subscription_status: 'active',
              stripe_customer_id: session.customer as string,
            })
            .eq('id', practiceId);

          // Then merge plan info into settings JSONB
          const { data: practice } = await service
            .from('practices')
            .select('settings')
            .eq('id', practiceId)
            .single();

          const currentSettings = (practice?.settings as Record<string, unknown>) || {};
          await service
            .from('practices')
            .update({
              settings: { ...currentSettings, plan, stripe_subscription_id: session.subscription },
            })
            .eq('id', practiceId);
        }
        break;
      }

      // ─── Subscription updated (upgrade, downgrade, trial end) ─────────
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const practiceId = subscription.metadata?.practice_id;

        if (practiceId) {
          let status: string = 'active';
          if (subscription.status === 'trialing') status = 'trial';
          else if (subscription.status === 'past_due' || subscription.status === 'unpaid') status = 'paused';
          else if (subscription.status === 'canceled') status = 'cancelled';
          else if (subscription.status === 'active') status = 'active';

          await service
            .from('practices')
            .update({ subscription_status: status })
            .eq('id', practiceId);
        }
        break;
      }

      // ─── Subscription cancelled ───────────────────────────────────────
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const practiceId = subscription.metadata?.practice_id;

        if (practiceId) {
          await service
            .from('practices')
            .update({ subscription_status: 'cancelled' })
            .eq('id', practiceId);
        }
        break;
      }

      // ─── Invoice payment failed ───────────────────────────────────────
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        if (customerId) {
          await service
            .from('practices')
            .update({ subscription_status: 'paused' })
            .eq('stripe_customer_id', customerId);
        }
        break;
      }

      default:
        // Unhandled event type — log and move on
        console.log(`[stripe/webhooks] unhandled event: ${event.type}`);
    }
  } catch (err: any) {
    console.error(`[stripe/webhooks] error handling ${event.type}:`, err);
    return NextResponse.json({ error: 'Webhook handler error' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
