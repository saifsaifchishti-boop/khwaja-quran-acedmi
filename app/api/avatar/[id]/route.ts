import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
// Profile pictures are private: only signed-in members of the academy can load them.
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; if (!/^[0-9a-f-]{36}$/i.test(id)) return new NextResponse('Bad request', { status: 400 });
  const sb = await supabaseServer(); const { data: { user } } = await sb.auth.getUser(); if (!user) return new NextResponse('Unauthorized', { status: 401 });
  const db = supabaseAdmin(); const { data: p } = await db.from('profiles').select('avatar_path').eq('id', id).maybeSingle(); if (!p?.avatar_path) return new NextResponse('Not found', { status: 404 });
  const { data, error } = await db.storage.from('avatars').download(p.avatar_path); if (error || !data) return new NextResponse('Not found', { status: 404 });
  return new NextResponse(data, { headers: { 'Content-Type': data.type || 'image/jpeg', 'Cache-Control': 'private, max-age=86400' } });
}
