'use server';
import { z } from 'zod';
import { supabaseServer } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { putFile } from '@/lib/files';
import { allow } from '@/lib/ratelimit';
// Chat server actions (used by both roles). Authorization = RLS via the user's own client; service role only for the few writes RLS does not allow.
async function who() {
  const sb = await supabaseServer(); const { data: { user } } = await sb.auth.getUser(); if (!user) throw new Error('Not signed in');
  const [{ data: s }, { data: t }] = await Promise.all([sb.from('students').select('id').eq('user_id', user.id).eq('status', 'active').maybeSingle(), sb.from('teachers').select('id').eq('user_id', user.id).eq('status', 'active').maybeSingle()]);
  return { sb, user, studentId: s?.id as string | undefined, teacherId: t?.id as string | undefined };
}
const pair = z.object({ student_id: z.string().uuid(), teacher_id: z.string().uuid() });
export async function sendAttachment(fd: FormData) {
  const { sb, user, studentId, teacherId } = await who(); const p = pair.parse({ student_id: fd.get('student_id'), teacher_id: fd.get('teacher_id') });
  if (!(p.student_id === studentId || p.teacher_id === teacherId)) return { error: 'Forbidden' };
  if (!(await allow(`chatfile:${user.id}`, 600, 15))) return { error: 'Too many files. Wait a few minutes.' };
  const f = fd.get('file'); if (!(f instanceof File) || f.size === 0) return { error: 'No file' };
  const r = await putFile(`chat/${p.student_id}_${p.teacher_id}`, f, 8); if (r.error) return { error: r.error };
  const { error } = await sb.from('chat_messages').insert({ ...p, sender_id: user.id, body: String(fd.get('body') ?? '').slice(0, 2000), attachment_path: r.path, attachment_name: f.name.slice(0, 120) });
  return error ? { error: 'Could not send' } : { ok: true };
}
export async function deleteForEveryone(id: string) {
  const { sb, user } = await who(); z.string().uuid().parse(id);
  const { data: m } = await sb.from('chat_messages').select('id,sender_id').eq('id', id).single(); if (!m || m.sender_id !== user.id) return { error: 'Not allowed' };
  await supabaseAdmin().from('chat_messages').update({ body: '', attachment_path: null, attachment_name: null, deleted_at: new Date().toISOString() }).eq('id', id); return { ok: true };
}
export async function reportMessage(id: string, reason: string) {
  const { sb, user } = await who(); z.string().uuid().parse(id);
  const { data: m } = await sb.from('chat_messages').select('id,student_id,teacher_id').eq('id', id).single(); if (!m) return { error: 'Not found' };
  await supabaseAdmin().from('chat_reports').insert({ message_id: id, student_id: m.student_id, teacher_id: m.teacher_id, reporter: user.id, reason: reason.trim().slice(0, 500) || 'No reason given' }); return { ok: true };
}
export async function markRead(student_id: string, teacher_id: string) {
  const { sb, user } = await who(); const p = pair.parse({ student_id, teacher_id });
  await sb.from('chat_reads').upsert({ ...p, user_id: user.id, last_read_at: new Date().toISOString() }, { onConflict: 'student_id,teacher_id,user_id' });
}
