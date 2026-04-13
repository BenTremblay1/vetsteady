import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/v1/staff/invite/accept — accept an invite and join a practice
 * Auth required: the accepting user must be logged in.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const token = body.token as string;

  if (!token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 });
  }

  const serviceClient = createServiceClient();

  // Look up ALL practices and search for the matching invite token
  const { data: practices, error: practicesError } = await serviceClient
    .from('practices')
    .select('id, name, settings');

  if (practicesError || !practices) {
    return NextResponse.json({ error: 'Failed to look up practices' }, { status: 500 });
  }

  let matchedPractice: { id: string; name: string; settings: Record<string, unknown> } | null = null;
  let matchedInviteIndex = -1;

  for (const practice of practices) {
    const settings = (practice.settings ?? {}) as Record<string, unknown>;
    const invites = Array.isArray(settings.invites) ? settings.invites : [];

    const idx = invites.findIndex(
      (inv: { token: string; used: boolean }) => inv.token === token && !inv.used
    );

    if (idx !== -1) {
      matchedPractice = { id: practice.id, name: practice.name, settings };
      matchedInviteIndex = idx;
      break;
    }
  }

  if (!matchedPractice || matchedInviteIndex === -1) {
    return NextResponse.json({ error: 'Invite not found or already used' }, { status: 404 });
  }

  const invites = (matchedPractice.settings.invites as Array<{
    token: string;
    role: string;
    created_at: string;
    used: boolean;
  }>);
  const invite = invites[matchedInviteIndex];

  // Check if user already has a staff record for this practice
  const { data: existingStaff } = await serviceClient
    .from('staff')
    .select('id')
    .eq('auth_user_id', user.id)
    .eq('practice_id', matchedPractice.id)
    .single();

  if (existingStaff) {
    return NextResponse.json({ error: 'You are already a member of this practice' }, { status: 409 });
  }

  // Create staff record
  const { error: staffError } = await serviceClient
    .from('staff')
    .insert({
      practice_id: matchedPractice.id,
      auth_user_id: user.id,
      name: user.user_metadata?.full_name ?? user.email ?? 'New Staff',
      role: invite.role,
      is_bookable: invite.role === 'vet',
    });

  if (staffError) {
    return NextResponse.json({ error: staffError.message }, { status: 500 });
  }

  // Mark invite as used
  invites[matchedInviteIndex] = { ...invite, used: true };
  const { error: updateError } = await serviceClient
    .from('practices')
    .update({ settings: { ...matchedPractice.settings, invites } })
    .eq('id', matchedPractice.id);

  if (updateError) {
    console.error('[invite/accept] Failed to mark invite as used:', updateError.message);
  }

  return NextResponse.json({
    data: {
      practice_id: matchedPractice.id,
      practice_name: matchedPractice.name,
      role: invite.role,
    },
  });
}
