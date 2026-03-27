/**
 * GET /api/v1/clients/[id] — get single client with pets
 * PATCH /api/v1/clients/[id] — update client
 */
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

interface RouteParams { params: { id: string } }

export async function GET(_req: Request, { params }: RouteParams) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('clients')
    .select('*, pets(*)')
    .eq('id', params.id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({ data });
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const allowed = ['first_name','last_name','email','phone','preferred_contact','notes','no_show_count','late_cancel_count'];
  const patch: Record<string, unknown> = {};
  for (const f of allowed) if (f in body) patch[f] = body[f];

  const { data, error } = await supabase
    .from('clients').update(patch).eq('id', params.id).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
