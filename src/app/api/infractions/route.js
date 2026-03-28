import { createServerSupabaseClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

// GET /api/infractions?vehicle_id=... — lista infracciones de un vehiculo
export async function GET(request) {
  const supabase    = await createServerSupabaseClient();
  const { searchParams } = new URL(request.url);
  const vehicle_id  = searchParams.get('vehicle_id');

  if (!vehicle_id) return NextResponse.json({ error: 'vehicle_id requerido' }, { status: 400 });

  const { data, error } = await supabase
    .from('vehicle_infractions')
    .select('*')
    .eq('vehicle_id', vehicle_id)
    .order('fecha', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/infractions — registra una nueva infraccion
export async function POST(request) {
  const supabase = await createServerSupabaseClient();
  const body     = await request.json();

  const { vehicle_id, fecha, entidad, codigo, descripcion, monto, estado, observaciones } = body;

  if (!vehicle_id || !fecha || !entidad) {
    return NextResponse.json({ error: 'Faltan campos requeridos: vehicle_id, fecha, entidad' }, { status: 400 });
  }

  const toNum = (v) => (v === '' || v === null || v === undefined ? null : parseFloat(v));
  const toStr = (v) => (v === '' ? null : v);

  const { data, error } = await supabase
    .from('vehicle_infractions')
    .insert({
      vehicle_id,
      fecha,
      entidad:      toStr(entidad),
      codigo:       toStr(codigo),
      descripcion:  toStr(descripcion),
      monto:        toNum(monto),
      estado:       toStr(estado) || 'pendiente',
      observaciones: toStr(observaciones),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
