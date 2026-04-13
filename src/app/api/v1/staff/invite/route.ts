import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * POST /api/v1/staff/invite — generate an invite link for a new staff member
 * Auth required: caller must be an admin of their practice.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Look up the caller's staff record to verify admin role and get practice_id
  const serviceClient = createServiceClient();
  const { data: staffRecord, error: staffError } = await serviceClient
    .from('staff')
    .select('id, practice_id, role')
    .eq('auth_user_id', user.id)
    .single();

  if (staffError || !staffRecord) {
    return NextResponse.json({ error: 'Staff record not found' }, { status: 404 });
  }

  if (staffRecord.role !== 'admin') {
    return NextResponse.json({ error: 'Only admins can invite staff' }, { status: 403 });
  }

  // Parse the requested role from the body
  const body = await request.json();
  const role = body.role as string;

  if (!role || !['vet', 'receptionist', 'admin'].includes(role)) {
    return NextResponse.json({ error: 'Invalid role. Must be vet, receptionist, or admin.' }, { status: 400 });
  }

  const practiceId = staffRecord.practice_id;

  // Generate a unique invite token
  const token = crypto.randomUUID();

  // Fetch current practice settings
  const { data: practice, error: practiceError } = await serviceClient
    .from('practices')
    .select('settings')
    .eq('id', practiceId)
    .single();

  if (practiceError || !practice) {
    return NextResponse.json({ error: 'Practice not found' }, { status: 404 });
  }

  // Build updated invites array
  const settings = (practice.settings ?? {}) as Record<string, unknown>;
  const invites = Array.isArray(settings.invites) ? settings.invites : [];

  invites.push({
    token,
    role,
    created_at: new Date().toISOString(),
    used: false,
  });

  // Update practice settings with new invite
  const { error: updateError } = await serviceClient
    .from('practices')
    .update({ settings: { ...settings, invites } })
    .eq('id', practiceId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const inviteUrl = `${appUrl}/invite/${token}`;

  return NextResponse.json({ data: { token, invite_url: inviteUrl } });
}

/**
 * GET /api/v1/staff/invite — list invites for the caller's practice
 * Auth required: caller must be an admin.
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const serviceClient = createServiceClient();
  const { data: staffRecord, error: staffError } = await serviceClient
    .from('staff')
    .select('practice_id, role')
    .eq('auth_user_id', user.id)
    .single();

  if (staffError || !staffRecord) {
    return NextResponse.json({ error: 'Staff record not found' }, { status: 404 });
  }

  if (staffRecord.role !== 'admin') {
    return NextResponse.json({ error: 'Only admins can view invites' }, { status: 403 });
  }

  const { data: practice, error: practiceError } = await serviceClient
    .from('practices')
    .select('settings')
    .eq('id', staffRecord.practice_id)
    .single();

  if (practiceError || !practice) {
    return NextResponse.json({ error: 'Practice not found' }, { status: 404 });
  }

  const settings = (practice.settings ?? {}) as Record<string, unknown>;
  const invites = Array.isArray(settings.invites) ? settings.invites : [];

  return NextResponse.json({ data: invites });
}
