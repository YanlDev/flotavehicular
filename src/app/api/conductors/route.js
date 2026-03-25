import { createServerSupabaseClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('conductors')
    .select('*')
    .order('apellidos', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request) {
  const supabase = await createServerSupabaseClient();
  const body = await request.json();

  const clean = { ...body };
  if (clean.dni) clean.dni = clean.dni.trim();
  ['fecha_nacimiento', 'licencia_vencimiento', 'numero_licencia', 'apellidos',
   'telefono', 'licencia_categoria', 'observaciones'].forEach((k) => {
    if (k in clean && clean[k] === '') clean[k] = null;
  });

  const { data, error } = await supabase
    .from('conductors')
    .insert(clean)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
