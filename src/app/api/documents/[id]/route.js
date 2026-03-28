import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getObject, deleteFile } from '@/lib/wasabi';
import { NextResponse } from 'next/server';

// GET /api/documents/[id] — proxy del PDF desde Wasabi
export async function GET(request, { params }) {
  const supabase = await createServerSupabaseClient();
  const { id }   = await params;

  const { data: doc, error } = await supabase
    .from('vehicle_documents')
    .select('file_key, tipo_documento')
    .eq('id', id)
    .single();

  if (error || !doc?.file_key) return new NextResponse('Not found', { status: 404 });

  const obj = await getObject(doc.file_key);

  const chunks = [];
  for await (const chunk of obj.Body) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  const buffer = Buffer.concat(chunks);

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${doc.tipo_documento}.pdf"`,
      'Cache-Control': 'private, max-age=3600',
    },
  });
}

// DELETE /api/documents/[id] — elimina solo el PDF adjunto, mantiene el registro del documento
export async function DELETE(request, { params }) {
  const supabase = await createServerSupabaseClient();
  const { id }   = await params;

  const { data: doc, error: fetchError } = await supabase
    .from('vehicle_documents')
    .select('file_key')
    .eq('id', id)
    .single();

  if (fetchError || !doc) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

  if (doc.file_key) {
    await deleteFile(doc.file_key).catch(() => {});
  }

  const { error } = await supabase
    .from('vehicle_documents')
    .update({ file_url: null, file_key: null, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
