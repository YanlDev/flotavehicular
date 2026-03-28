import { createServerSupabaseClient } from '@/lib/supabase-server';
import { uploadFile, deleteFile } from '@/lib/wasabi';
import { NextResponse } from 'next/server';

// POST /api/documents — sube o reemplaza el PDF adjunto de un documento
export async function POST(request) {
  const supabase   = await createServerSupabaseClient();
  const formData   = await request.formData();

  const file           = formData.get('file');
  const vehicle_id     = formData.get('vehicle_id');
  const tipo_documento = formData.get('tipo_documento');

  if (!file || !vehicle_id || !tipo_documento) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
  }

  // Solo aceptar PDF
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    return NextResponse.json({ error: 'Solo se permiten archivos PDF' }, { status: 400 });
  }

  // Buscar registro existente del documento
  const { data: existing, error: fetchError } = await supabase
    .from('vehicle_documents')
    .select('id, file_key')
    .eq('vehicle_id', vehicle_id)
    .eq('tipo_documento', tipo_documento)
    .maybeSingle();

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });

  // Subir PDF a Wasabi
  const buffer = Buffer.from(await file.arrayBuffer());
  const key    = `flota/${vehicle_id}/docs/${tipo_documento}.pdf`;
  const { url } = await uploadFile(buffer, key, 'application/pdf');

  let data, error;

  if (existing) {
    // Eliminar PDF anterior si tenía otro key
    if (existing.file_key && existing.file_key !== key) {
      await deleteFile(existing.file_key).catch(() => {});
    }
    // Actualizar registro
    ({ data, error } = await supabase
      .from('vehicle_documents')
      .update({ file_url: url, file_key: key, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select('id, tipo_documento, file_url, file_key')
      .single());
  } else {
    // Crear nuevo registro de documento con el PDF
    ({ data, error } = await supabase
      .from('vehicle_documents')
      .insert({ vehicle_id, tipo_documento, file_url: url, file_key: key })
      .select('id, tipo_documento, file_url, file_key')
      .single());
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: existing ? 200 : 201 });
}
