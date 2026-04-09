import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { getStripeServer, PLANS, TRIAL_DAYS, PlanKey } from '@/lib/stripe/stripe';

// POST /api/stripe/checkout — create a Stripe Checkout Session
export async function POST(req: NextRequest) {
  try {
    const { plan } = (await req.json()) as { plan: PlanKey };

    if (!plan || !PLANS[plan]) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // Get authenticated user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get their practice
    const service = createServiceClient();
    const { data: staff } = await service
      .from('staff')
      .select('practice_id')
      .eq('auth_user_id', user.id)
      .single();

    if (!staff) {
      return NextResponse.json({ error: 'No practice found' }, { status: 404 });
    }

    const { data: practice } = await service
      .from('practices')
      .select('id, name, email, stripe_customer_id')
      .eq('id', staff.practice_id)
      .single();

    if (!practice) {
      return NextResponse.json({ error: 'Practice not found' }, { status: 404 });
    }

    // Get or create Stripe customer
    let customerId = practice.stripe_customer_id;
    if (!customerId) {
      const customer = await getStripeServer().customers.create({
        email: practice.email || user.email || undefined,
        name: practice.name,
        metadata: { practice_id: practice.id },
      });
      customerId = customer.id;

      await service
        .from('practices')
        .update({ stripe_customer_id: customerId })
        .eq('id', practice.id);
    }

    // Create Checkout session with trial
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vetsteady.vercel.app';
    const session = await getStripeServer().checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: PLANS[plan].priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: TRIAL_DAYS,
        metadata: { practice_id: practice.id, plan },
      },
      success_url: `${appUrl}/dashboard/billing?success=true`,
      cancel_url: `${appUrl}/dashboard/billing?cancelled=true`,
      metadata: { practice_id: practice.id, plan },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('[stripe/checkout] error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
