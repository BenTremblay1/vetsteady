import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

/**
 * POST /api/v1/onboarding
 *
 * Final onboarding step — creates the practice and the first admin staff member.
 * Requires the user to be authenticated (magic link was clicked).
 *
 * Body:
 *   practice_name     string  required
 *   practice_slug     string  required  (URL-safe, auto-generated from name)
 *   practice_phone    string  optional
 *   timezone          string  required  (IANA tz, e.g. "America/New_York")
 *   staff_name        string  required
 *   staff_role        'admin' | 'vet' | 'receptionist'
 *
 * Response:
 *   { practice_id, staff_id }
 */
export async function POST(request: Request) {
  try {
    // 1. Verify auth
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized — please sign in first' },
        { status: 401 }
      );
    }

    // 2. Parse body
    const body = await request.json();
    const {
      practice_name,
      practice_slug,
      practice_phone,
      timezone,
      staff_name,
      staff_role = 'admin',
    } = body;

    if (!practice_name?.trim() || !practice_slug?.trim() || !staff_name?.trim()) {
      return NextResponse.json(
        { error: 'practice_name, practice_slug, and staff_name are required' },
        { status: 400 }
      );
    }

    // 3. Use service client to bypass RLS (safe here — we trust the auth check above)
    const service = createServiceClient();

    // 4. Check if this user already has a practice
    const { data: existingStaff } = await service
      .from('staff')
      .select('id, practice_id')
      .eq('auth_user_id', user.id)
      .single();

    if (existingStaff) {
      return NextResponse.json(
        {
          error: 'Account already set up',
          practice_id: existingStaff.practice_id,
        },
        { status: 409 }
      );
    }

    // 5. Create practice
    const { data: practice, error: practiceError } = await service
      .from('practices')
      .insert({
        name: practice_name.trim(),
        slug: practice_slug.trim(),
        phone: practice_phone?.trim() ?? null,
        timezone: timezone ?? 'America/New_York',
        subscription_status: 'trial',
        settings: {
          reminder_timing: {
            booking_confirm: true,
            two_week: true,
            four_day: true,
            two_day: true,
            same_day: false,
          },
        },
      })
      .select('id')
      .single();

    if (practiceError) {
      console.error('[onboarding] Practice insert error:', practiceError);
      // Handle slug collision
      if (practiceError.code === '23505') {
        return NextResponse.json(
          { error: 'A practice with that name already exists. Try a slightly different name.' },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: practiceError.message }, { status: 500 });
    }

    // 6. Create the first staff member (linked to Supabase auth user)
    const { data: staff, error: staffError } = await service
      .from('staff')
      .insert({
        practice_id: practice.id,
        name: staff_name.trim(),
        email: user.email ?? '',
        role: staff_role,
        is_bookable: staff_role === 'vet' || staff_role === 'admin',
        auth_user_id: user.id,
      })
      .select('id')
      .single();

    if (staffError) {
      console.error('[onboarding] Staff insert error:', staffError);
      // Cleanup: delete the practice we just created
      await service.from('practices').delete().eq('id', practice.id);
      return NextResponse.json({ error: staffError.message }, { status: 500 });
    }

    // 7. Seed default appointment types
    const defaultTypes = [
      { name: 'Wellness Exam',   duration_minutes: 30, color: '#10B981' },
      { name: 'Vaccination',     duration_minutes: 15, color: '#3B82F6' },
      { name: 'Sick Visit',      duration_minutes: 45, color: '#EF4444' },
      { name: 'Dental Cleaning', duration_minutes: 60, color: '#8B5CF6' },
      { name: 'Surgery Consult', duration_minutes: 30, color: '#F59E0B' },
      { name: 'Follow-up',       duration_minutes: 20, color: '#0D7377' },
    ];

    const { error: typesError } = await service.from('appointment_types').insert(
      defaultTypes.map((t) => ({
        ...t,
        practice_id: practice.id,
        allow_online_booking: true,
        requires_deposit: false,
        deposit_amount_cents: 0,
        is_active: true,
      }))
    );

    if (typesError) {
      // Non-fatal — log but don't fail onboarding
      console.warn('[onboarding] Failed to seed appointment types:', typesError.message);
    }

    console.log(
      `[onboarding] New practice created: ${practice_name} (${practice.id}), staff: ${staff.id}`
    );

    return NextResponse.json(
      {
        ok: true,
        practice_id: practice.id,
        staff_id: staff.id,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('[onboarding] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
