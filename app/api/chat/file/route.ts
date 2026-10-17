import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { signed } from '@/lib/files';
// Redirects to a short-lived signed URL, only if RLS lets the caller see the message.
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get('id') ?? ''; if (!/^[0-9a-f-]{36}$/i.test(id)) return new NextResponse('Bad request', { status: 400 });
  const sb = await supabaseServer(); const { data } = await sb.from('chat_messages').select('attachment_path,deleted_at').eq('id', id).maybeSingle();
  if (!data?.attachment_path || data.deleted_at) return new NextResponse('Not found', { status: 404 });
  const url = await signed(data.attachment_path, 'lms-files', 120); return url ? NextResponse.redirect(url) : new NextResponse('Not found', { status: 404 });
}
