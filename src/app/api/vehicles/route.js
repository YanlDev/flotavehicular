import { createServerSupabaseClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('vehicles')
    .select('*, vehicle_documents(*), vehicle_photos(*)')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request) {
  const supabase = await createServerSupabaseClient();
  const body = await request.json();
  const { documents, ...vehicleData } = body;

  if (vehicleData.placa) {
    vehicleData.placa = vehicleData.placa.toUpperCase().trim();
  }

  // Convertir numericos — string vacio → null
  const toInt = (v) => (v === '' || v === null || v === undefined ? null : parseInt(v));
  vehicleData.anio           = toInt(vehicleData.anio);
  vehicleData.km_actuales    = toInt(vehicleData.km_actuales);
  vehicleData.km_ultimo_mant = toInt(vehicleData.km_ultimo_mant);

  // Strings vacios → null para campos opcionales
  const toStr = (v) => (v === '' ? null : v);
  ['motor','chasis','tipo_motor','transmision','traccion','propietario','color','marca',
   'modelo','taller_mant','tipo_servicio_mant','tiene_registro_factura',
   'fecha_ultimo_mant','conductor','conductor_tel','problema_activo'].forEach((k) => {
    if (k in vehicleData) vehicleData[k] = toStr(vehicleData[k]);
  });

  const { data: vehicle, error: vehicleError } = await supabase
    .from('vehicles')
    .insert(vehicleData)
    .select()
    .single();

  if (vehicleError) return NextResponse.json({ error: vehicleError.message }, { status: 400 });

  if (documents && documents.length > 0) {
    const docsToInsert = documents
      .filter((d) => d.tipo_documento)
      .map((d) => {
        const clean = { ...d, vehicle_id: vehicle.id };
        // Fechas y strings vacios → null
        ['fecha_vencimiento','numero','aseguradora','centro_citv','vigente','frecuencia_citv'].forEach((k) => {
          if (k in clean && clean[k] === '') clean[k] = null;
        });
        return clean;
      });

    if (docsToInsert.length > 0) {
      const { error: docsError } = await supabase
        .from('vehicle_documents')
        .insert(docsToInsert);

      if (docsError) return NextResponse.json({ error: docsError.message }, { status: 400 });
    }
  }

  return NextResponse.json(vehicle, { status: 201 });
}
