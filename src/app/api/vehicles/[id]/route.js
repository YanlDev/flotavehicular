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

  // Eliminar fotos y PDFs de Wasabi antes de borrar el registro
  const [{ data: photos }, { data: docFiles }] = await Promise.all([
    supabase.from('vehicle_photos').select('key').eq('vehicle_id', id),
    supabase.from('vehicle_documents').select('file_key').eq('vehicle_id', id).not('file_key', 'is', null),
  ]);

  const filesToDelete = [
    ...(photos || []).map((p) => p.key),
    ...(docFiles || []).map((d) => d.file_key).filter(Boolean),
  ];
  if (filesToDelete.length) {
    await Promise.allSettled(filesToDelete.map((key) => deleteFile(key)));
  }

  const { error } = await supabase.from('vehicles').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

export async function PATCH(request, { params }) {
  const supabase = await createServerSupabaseClient();
  const { id } = await params;
  const body = await request.json();
  const { documents, ...vehicleData } = body;

  if (vehicleData.placa) vehicleData.placa = vehicleData.placa.toUpperCase().trim();

  const toInt = (v) => (v === '' || v == null ? null : parseInt(v));
  const toStr = (v) => (v === '' ? null : v);

  vehicleData.anio           = toInt(vehicleData.anio);
  vehicleData.km_actuales    = toInt(vehicleData.km_actuales);
  vehicleData.km_ultimo_mant = toInt(vehicleData.km_ultimo_mant);

  ['motor','chasis','tipo_motor','transmision','traccion','propietario','color','marca',
   'modelo','taller_mant','tipo_servicio_mant','tiene_registro_factura',
   'fecha_ultimo_mant','conductor','conductor_tel','problema_activo'].forEach((k) => {
    if (k in vehicleData) vehicleData[k] = toStr(vehicleData[k]);
  });

  const { data, error } = await supabase
    .from('vehicles')
    .update({ ...vehicleData, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Upsert documentos si vienen en el body
  if (documents?.length) {
    for (const doc of documents) {
      if (!doc.tipo_documento) continue;
      const clean = { ...doc, vehicle_id: id };
      ['fecha_vencimiento','numero','aseguradora','centro_citv','vigente','frecuencia_citv'].forEach((k) => {
        if (k in clean && clean[k] === '') clean[k] = null;
      });
      await supabase
        .from('vehicle_documents')
        .upsert(clean, { onConflict: 'vehicle_id,tipo_documento' });
    }
  }

  return NextResponse.json(data);
}
