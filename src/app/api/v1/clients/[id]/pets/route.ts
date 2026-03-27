import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

interface RouteParams { params: { id: string } }

export async function GET(_req: Request, { params }: RouteParams) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('pets').select('*').eq('client_id', params.id).order('name');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request: Request, { params }: RouteParams) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: clientData } = await supabase.from('clients').select('practice_id').eq('id', params.id).single();
  const body = await request.json();
  const { data, error } = await supabase.from('pets')
    .insert({ ...body, client_id: params.id, practice_id: clientData?.practice_id })
    .select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
