import { NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';
import { supabaseServer } from '@/lib/supabase/server';
import { allow } from '@/lib/ratelimit';
// Issues a LiveKit token only to the assigned teacher or student of this exact session, inside the join window. Recording is never enabled here.
export async function POST(req: Request) {
  const { sessionId } = await req.json().catch(() => ({})); if (typeof sessionId !== 'string' || !/^[0-9a-f-]{36}$/i.test(sessionId)) return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  const sb = await supabaseServer(); const { data: { user } } = await sb.auth.getUser(); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!(await allow(`live:${user.id}`, 300, 20))) return NextResponse.json({ error: 'Too many attempts' }, { status: 429 });
  const { data: ses } = await sb.from('class_sessions').select('id,teacher_id,student_id,starts_at,ends_at,status').eq('id', sessionId).maybeSingle(); // RLS: participants/admin only
  if (!ses || ses.status === 'cancelled') return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const [{ data: st }, { data: te }] = await Promise.all([sb.from('students').select('id,full_name').eq('user_id', user.id).eq('status', 'active').maybeSingle(), sb.from('teachers').select('id,full_name').eq('user_id', user.id).eq('status', 'active').maybeSingle()]);
  const me = te && te.id === ses.teacher_id ? { name: te.full_name, role: 'teacher' } : st && st.id === ses.student_id ? { name: st.full_name, role: 'student' } : null;
  if (!me) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const now = Date.now(); if (now < new Date(ses.starts_at).getTime() - 10 * 60000 || now > new Date(ses.ends_at).getTime() + 30 * 60000) return NextResponse.json({ error: 'The class room is open from 10 minutes before the start until 30 minutes after the end.' }, { status: 403 });
  const { LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET } = process.env; if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) return NextResponse.json({ error: 'Live classes are not configured yet.' }, { status: 503 });
  const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, { identity: user.id, name: me.name, ttl: '2h', metadata: me.role });
  at.addGrant({ room: `session-${ses.id}`, roomJoin: true, canPublish: true, canSubscribe: true, canPublishData: true });
  return NextResponse.json({ token: await at.toJwt(), url: LIVEKIT_URL, role: me.role });
}
