'use server';
import { z } from 'zod';
import { supabaseServer } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { putFile } from '@/lib/files';
import { allow } from '@/lib/ratelimit';
import { loadPeople } from '@/lib/chat-data';

async function who() {
  const sb = await supabaseServer(); const { data: { user } } = await sb.auth.getUser(); if (!user) throw new Error('Not signed in');
  const { data: p } = await sb.from('profiles').select('role').eq('id', user.id).single();
  return { sb, user, role: (p?.role ?? 'student') as 'admin' | 'teacher' | 'student' };
}
const uuid = z.string().uuid();

export async function touchSeen() {
  try { const { user } = await who(); await supabaseAdmin().from('profiles').update({ last_seen: new Date().toISOString() }).eq('id', user.id); } catch { /* signed out */ }
}

// Opens (or creates) a one-to-one chat. Allowed: anyone <-> admin, and a student <-> their assigned teacher.
export async function openDirect(otherId: string): Promise<{ id?: string; error?: string }> {
  const { user, role } = await who(); uuid.parse(otherId); if (otherId === user.id) return { error: 'You cannot chat with yourself.' };
  const db = supabaseAdmin(); const { data: op } = await db.from('profiles').select('role').eq('id', otherId).maybeSingle(); if (!op) return { error: 'Person not found.' };
  let ok = role === 'admin' || op.role === 'admin';
  if (!ok && ((role === 'student' && op.role === 'teacher') || (role === 'teacher' && op.role === 'student'))) {
    const sUser = role === 'student' ? user.id : otherId; const tUser = role === 'teacher' ? user.id : otherId;
    const [{ data: s }, { data: t }] = await Promise.all([db.from('students').select('id').eq('user_id', sUser).maybeSingle(), db.from('teachers').select('id').eq('user_id', tUser).maybeSingle()]);
    if (s && t) { const { data: a } = await db.from('teacher_assignments').select('id').eq('student_id', s.id).eq('teacher_id', t.id).eq('active', true).maybeSingle(); ok = !!a; }
  }
  if (!ok) return { error: 'You can only message your assigned teacher, your students, or the administrators.' };
  const key = [user.id, otherId].sort().join(':');
  const { data: ex } = await db.from('conversations').select('id').eq('dm_key', key).maybeSingle(); if (ex) return { id: ex.id };
  const { data: c, error } = await db.from('conversations').insert({ kind: 'dm', dm_key: key, created_by: user.id }).select('id').single(); if (error || !c) return { error: 'Could not open the chat.' };
  await db.from('conversation_members').insert([{ conversation_id: c.id, user_id: user.id }, { conversation_id: c.id, user_id: otherId }]); return { id: c.id };
}

export async function sendAttachment(fd: FormData): Promise<{ ok?: boolean; error?: string }> {
  const { sb, user } = await who(); const cid = uuid.parse(fd.get('cid'));
  const { data: m } = await sb.from('conversation_members').select('user_id').eq('conversation_id', cid).eq('user_id', user.id).maybeSingle(); if (!m) return { error: 'Forbidden' };
  const { data: okDm } = await sb.rpc('dm_ok', { cid }); if (!okDm) return { error: 'This chat is no longer available.' };
  if (!(await allow(`chatfile:${user.id}`, 600, 30))) return { error: 'Too many files. Please wait a few minutes.' };
  const f = fd.get('file'); if (!(f instanceof File) || f.size === 0) return { error: 'No file selected.' };
  const r = await putFile(`chat/${cid}`, f, 10); if (r.error) return { error: r.error };
  const t = f.type.startsWith('image/') ? 'image' : f.type.startsWith('audio/') ? (fd.get('kind') === 'voice' ? 'voice' : 'audio') : 'file';
  const { error } = await sb.from('messages').insert({ conversation_id: cid, sender_id: user.id, body: '', attachment_path: r.path, attachment_name: f.name.slice(0, 120), attachment_type: t });
  return error ? { error: 'Could not send the file.' } : { ok: true };
}

export async function deleteForEveryone(id: string) {
  const { sb, user } = await who(); uuid.parse(id);
  const { data: m } = await sb.from('messages').select('id,sender_id').eq('id', id).single(); if (!m || m.sender_id !== user.id) return { error: 'Not allowed' };
  await supabaseAdmin().from('messages').update({ body: '', attachment_path: null, attachment_name: null, attachment_type: null, deleted_at: new Date().toISOString() }).eq('id', id); return { ok: true };
}
export async function reportMessage(id: string, reason: string) {
  const { sb, user } = await who(); uuid.parse(id);
  const { data: m } = await sb.from('messages').select('id,conversation_id').eq('id', id).single(); if (!m) return { error: 'Message not found.' };
  await supabaseAdmin().from('message_reports').insert({ message_id: id, conversation_id: m.conversation_id, reporter: user.id, reason: reason.trim().slice(0, 500) || 'No reason given' }); return { ok: true };
}
export async function markRead(cid: string) {
  const { sb, user } = await who(); uuid.parse(cid);
  await sb.from('message_reads').upsert({ conversation_id: cid, user_id: user.id, last_read_at: new Date().toISOString() }, { onConflict: 'conversation_id,user_id' });
}

// Groups: only administrators create groups and change who is in them.
export async function createGroup(title: string, userIds: string[]): Promise<{ id?: string; error?: string }> {
  const { user, role } = await who(); if (role !== 'admin') return { error: 'Only administrators can create groups.' };
  const t = title.trim().slice(0, 80); if (!t) return { error: 'Please enter a group name.' }; const ids = [...new Set([user.id, ...userIds.map(i => uuid.parse(i))])];
  const db = supabaseAdmin(); const { data: c, error } = await db.from('conversations').insert({ kind: 'group', title: t, created_by: user.id }).select('id').single(); if (error || !c) return { error: 'Could not create the group.' };
  await db.from('conversation_members').insert(ids.map(u => ({ conversation_id: c.id, user_id: u }))); return { id: c.id };
}
export async function updateGroup(cid: string, title: string, userIds: string[]): Promise<{ ok?: boolean; error?: string }> {
  const { user, role } = await who(); if (role !== 'admin') return { error: 'Only administrators can change groups.' }; uuid.parse(cid);
  const db = supabaseAdmin(); const { data: c } = await db.from('conversations').select('kind').eq('id', cid).single(); if (c?.kind !== 'group') return { error: 'Not a group.' };
  const t = title.trim().slice(0, 80); if (!t) return { error: 'Please enter a group name.' }; const ids = new Set([user.id, ...userIds.map(i => uuid.parse(i))]);
  await db.from('conversations').update({ title: t }).eq('id', cid);
  const { data: cur } = await db.from('conversation_members').select('user_id').eq('conversation_id', cid); const have = new Set((cur ?? []).map(x => x.user_id as string));
  const add = [...ids].filter(i => !have.has(i)); const del = [...have].filter(i => !ids.has(i));
  if (add.length) await db.from('conversation_members').insert(add.map(u => ({ conversation_id: cid, user_id: u })));
  if (del.length) await db.from('conversation_members').delete().eq('conversation_id', cid).in('user_id', del); return { ok: true };
}

export async function callInfo(callId: string) {
  const { sb, user } = await who(); uuid.parse(callId);
  const { data: c } = await sb.from('calls').select('id,conversation_id,caller_id,kind,status').eq('id', callId).maybeSingle(); if (!c || c.caller_id === user.id) return null;
  const { data: cv } = await sb.from('conversations').select('kind,title').eq('id', c.conversation_id).maybeSingle(); const ppl = await loadPeople([c.caller_id]);
  const name = ppl[c.caller_id]?.name ?? 'Someone';
  return { id: c.id as string, convId: c.conversation_id as string, kind: c.kind as 'audio' | 'video', status: c.status as string, callerId: c.caller_id as string, name, group: cv?.kind === 'group', title: cv?.kind === 'group' ? (cv.title ?? 'Group') : name };
}
export async function logCall(cid: string, text: string) {
  const { sb, user } = await who(); uuid.parse(cid);
  await sb.from('messages').insert({ conversation_id: cid, sender_id: user.id, body: text.slice(0, 120), attachment_type: 'call' });
}
