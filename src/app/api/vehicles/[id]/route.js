import { createServerSupabaseClient } from '@/lib/supabase-server';
import { deleteFile } from '@/lib/wasabi';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  const supabase = await createServerSupabaseClient();
  const { id } = await params;

  const { data, error } = await supabase
    .from('vehicles')
    .select('*, vehicle_documents(*), vehicle_photos(*)')
    .eq('id', id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

export async function DELETE(request, { params }) {
  const supabase = await createServerSupabaseClient();
  const { id } = await params;

  // Eliminar fotos de Wasabi antes de borrar el registro
  const { data: photos } = await supabase
    .from('vehicle_photos')
    .select('key')
    .eq('vehicle_id', id);

  if (photos?.length) {
    await Promise.allSettled(photos.map((p) => deleteFile(p.key)));
  }

  const { error } = await supabase.from('vehicles').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

export async function PATCH(request, { params }) {
  const supabase = await createServerSupabaseClient();
  const { id } = await params;
  const body = await request.json();

  const { data, error } = await supabase
    .from('vehicles')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
