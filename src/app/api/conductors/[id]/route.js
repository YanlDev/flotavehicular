import { createServerSupabaseClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  const supabase = await createServerSupabaseClient();
  const { id } = await params;

  const { data, error } = await supabase
    .from('conductors')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(request, { params }) {
  const supabase = await createServerSupabaseClient();
  const { id } = await params;
  const body = await request.json();

  const clean = { ...body };
  if (clean.dni) clean.dni = clean.dni.trim();
  ['fecha_nacimiento', 'licencia_vencimiento', 'numero_licencia', 'apellidos',
   'telefono', 'licencia_categoria', 'observaciones'].forEach((k) => {
    if (k in clean && clean[k] === '') clean[k] = null;
  });

  const { data, error } = await supabase
    .from('conductors')
    .update({ ...clean, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function DELETE(request, { params }) {
  const supabase = await createServerSupabaseClient();
  const { id } = await params;

  const { error } = await supabase.from('conductors').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
