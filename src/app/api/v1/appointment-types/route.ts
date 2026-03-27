import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('appointment_types')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Get staff's practice_id
  const { data: staff } = await supabase
    .from('staff')
    .select('practice_id')
    .eq('auth_user_id', user.id)
    .single();

  if (!staff?.practice_id) {
    return NextResponse.json({ error: 'Practice not found' }, { status: 400 });
  }

  const body = await request.json();
  const { data, error } = await supabase
    .from('appointment_types')
    .insert({ ...body, practice_id: staff.practice_id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
