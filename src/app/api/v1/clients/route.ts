/**
 * GET /api/v1/clients — search/list clients
 * POST /api/v1/clients — create client
 */
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { CreateClientInput } from '@/types';

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  const limit = parseInt(searchParams.get('limit') ?? '100', 10);

  let query = supabase
    .from('clients')
    .select('*')
    .order('last_name', { ascending: true })
    .limit(limit);

  if (q) {
    query = query.or(
      `first_name.ilike.%${q}%,last_name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%`
    );
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Resolve practice_id for this authenticated staff member
  const { data: staff } = await supabase
    .from('staff')
    .select('practice_id')
    .eq('auth_user_id', user.id)
    .single();

  if (!staff?.practice_id) {
    return NextResponse.json({ error: 'Practice not found for this user' }, { status: 400 });
  }

  const body: CreateClientInput = await request.json();
  const { data, error } = await supabase
    .from('clients')
    .insert({ ...body, practice_id: staff.practice_id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
