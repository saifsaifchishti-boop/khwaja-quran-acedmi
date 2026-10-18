import { NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';
import { supabaseServer } from '@/lib/supabase/server';
import { allow } from '@/lib/ratelimit';
// LiveKit token for a chat call. Row-level security only returns the call to members of its conversation. Calls are never recorded.
export async function POST(req: Request) {
  const { callId } = await req.json().catch(() => ({})); if (typeof callId !== 'string' || !/^[0-9a-f-]{36}$/i.test(callId)) return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  const sb = await supabaseServer(); const { data: { user } } = await sb.auth.getUser(); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!(await allow(`call:${user.id}`, 300, 40))) return NextResponse.json({ error: 'Too many attempts' }, { status: 429 });
  const { data: call } = await sb.from('calls').select('id,status,created_at').eq('id', callId).maybeSingle();
  if (!call || !['ringing', 'active'].includes(call.status)) return NextResponse.json({ error: 'This call is no longer available.' }, { status: 404 });
  if (Date.now() - new Date(call.created_at).getTime() > 6 * 3600 * 1000) return NextResponse.json({ error: 'This call has expired.' }, { status: 410 });
  const { LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET } = process.env; if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) return NextResponse.json({ error: 'Calls are not configured yet (LiveKit settings are missing).' }, { status: 503 });
  const { data: p } = await sb.from('profiles').select('full_name').eq('id', user.id).maybeSingle();
  const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, { identity: user.id, name: p?.full_name ?? 'Member', ttl: '2h' });
  at.addGrant({ room: `call-${call.id}`, roomJoin: true, canPublish: true, canSubscribe: true, canPublishData: true });
  return NextResponse.json({ token: await at.toJwt(), url: LIVEKIT_URL });
}
