import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { getStripeServer } from '@/lib/stripe/stripe';

// POST /api/stripe/portal — open Stripe Customer Portal (manage billing, cancel, etc.)
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
      .select('stripe_customer_id')
      .eq('id', staff.practice_id)
      .single();

    if (!practice?.stripe_customer_id) {
      return NextResponse.json({ error: 'No billing account. Please subscribe first.' }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vetsteady.vercel.app';
    const portalSession = await getStripeServer().billingPortal.sessions.create({
      customer: practice.stripe_customer_id,
      return_url: `${appUrl}/dashboard/billing`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (err: any) {
    console.error('[stripe/portal] error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
