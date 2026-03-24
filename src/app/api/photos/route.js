import { createServerSupabaseClient } from '@/lib/supabase-server';
import { uploadFile, deleteFile } from '@/lib/wasabi';
import { NextResponse } from 'next/server';

export async function POST(request) {
  const supabase = await createServerSupabaseClient();
  const formData = await request.formData();

  const file       = formData.get('file');
  const vehicle_id = formData.get('vehicle_id');
  const tipo       = formData.get('tipo');

  if (!file || !vehicle_id || !tipo) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
  }

  // Buscar foto existente del mismo tipo para este vehiculo
  const { data: existing } = await supabase
    .from('vehicle_photos')
    .select('id, key')
    .eq('vehicle_id', vehicle_id)
    .eq('tipo', tipo)
    .maybeSingle();

  // Subir nuevo archivo a Wasabi
  const buffer = Buffer.from(await file.arrayBuffer());
  const ext    = file.name.split('.').pop().toLowerCase();
  const key    = `flota/${vehicle_id}/${tipo}.${ext}`;

  const { url } = await uploadFile(buffer, key, file.type);

  let data, error;

  if (existing) {
    // Eliminar archivo anterior si tiene distinto key
    if (existing.key !== key) {
      await deleteFile(existing.key).catch(() => {});
    }
    // Actualizar registro existente
    ({ data, error } = await supabase
      .from('vehicle_photos')
      .update({ url, key })
      .eq('id', existing.id)
      .select()
      .single());
  } else {
    // Crear nuevo registro
    ({ data, error } = await supabase
      .from('vehicle_photos')
      .insert({ vehicle_id, tipo, url, key })
      .select()
      .single());
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: existing ? 200 : 201 });
}
