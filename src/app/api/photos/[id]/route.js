import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getObject, deleteFile } from '@/lib/wasabi';
import { NextResponse } from 'next/server';

// GET /api/photos/[id] — proxy de imagen desde Wasabi
export async function GET(request, { params }) {
  const supabase = await createServerSupabaseClient();
  const { id } = await params;

  const { data: photo, error } = await supabase
    .from('vehicle_photos')
    .select('key')
    .eq('id', id)
    .single();

  if (error || !photo) return new NextResponse('Not found', { status: 404 });

  const obj = await getObject(photo.key);
  const contentType = obj.ContentType || 'image/jpeg';

  // Leer todo el stream en un buffer
  const chunks = [];
  for await (const chunk of obj.Body) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  const buffer = Buffer.concat(chunks);

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'private, max-age=3600',
    },
  });
}

// DELETE /api/photos/[id] — elimina foto de Wasabi y BD
export async function DELETE(request, { params }) {
  const supabase = await createServerSupabaseClient();
  const { id } = await params;

  const { data: photo, error: fetchError } = await supabase
    .from('vehicle_photos')
    .select('key')
    .eq('id', id)
    .single();

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 404 });

  await deleteFile(photo.key).catch(() => {});

  const { error } = await supabase.from('vehicle_photos').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
