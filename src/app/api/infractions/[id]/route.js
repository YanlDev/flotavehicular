import { createServerSupabaseClient } from '@/lib/supabase-server';
import { uploadFile, deleteFile, getObject } from '@/lib/wasabi';
import { NextResponse } from 'next/server';

// GET /api/infractions/[id] — proxy del PDF papeleta
export async function GET(request, { params }) {
  const supabase = await createServerSupabaseClient();
  const { id }   = await params;

  const { data: inf, error } = await supabase
    .from('vehicle_infractions')
    .select('file_key, entidad, codigo')
    .eq('id', id)
    .single();

  if (error || !inf?.file_key) return new NextResponse('Not found', { status: 404 });

  const obj = await getObject(inf.file_key);

  const chunks = [];
  for await (const chunk of obj.Body) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  const buffer = Buffer.concat(chunks);

  const filename = [inf.entidad, inf.codigo].filter(Boolean).join('-') || 'papeleta';

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}.pdf"`,
      'Cache-Control': 'private, max-age=3600',
    },
  });
}

// PATCH /api/infractions/[id] — actualiza datos o sube PDF
export async function PATCH(request, { params }) {
  const supabase    = await createServerSupabaseClient();
  const { id }      = await params;
  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('multipart/form-data')) {
    // Subida de PDF papeleta
    const formData   = await request.formData();
    const file       = formData.get('file');

    if (!file) return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 });
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: 'Solo se permiten archivos PDF' }, { status: 400 });
    }

    // Obtener vehicle_id para construir key
    const { data: existing, error: fetchError } = await supabase
      .from('vehicle_infractions')
      .select('vehicle_id, file_key')
      .eq('id', id)
      .single();

    if (fetchError || !existing) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

    const key    = `flota/${existing.vehicle_id}/infractions/${id}.pdf`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const { url } = await uploadFile(buffer, key, 'application/pdf');

    if (existing.file_key && existing.file_key !== key) {
      await deleteFile(existing.file_key).catch(() => {});
    }

    const { data, error } = await supabase
      .from('vehicle_infractions')
      .update({ file_url: url, file_key: key, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  // Actualizar campos de la infraccion (JSON)
  const body = await request.json();
  const toNum = (v) => (v === '' || v === null || v === undefined ? null : parseFloat(v));
  const toStr = (v) => (v === '' ? null : v);

  const update = {};
  const fields = ['fecha','entidad','codigo','descripcion','monto','estado','fecha_pago','referencia_pago','observaciones'];
  for (const f of fields) {
    if (f in body) {
      update[f] = (f === 'monto') ? toNum(body[f]) : toStr(body[f]);
    }
  }
  update.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('vehicle_infractions')
    .update(update)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE /api/infractions/[id] — elimina infraccion y su PDF
export async function DELETE(request, { params }) {
  const supabase = await createServerSupabaseClient();
  const { id }   = await params;

  const { data: inf, error: fetchError } = await supabase
    .from('vehicle_infractions')
    .select('file_key')
    .eq('id', id)
    .single();

  if (fetchError || !inf) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

  if (inf.file_key) {
    await deleteFile(inf.file_key).catch(() => {});
  }

  const { error } = await supabase.from('vehicle_infractions').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
