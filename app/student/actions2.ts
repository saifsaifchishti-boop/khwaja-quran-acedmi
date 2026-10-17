'use server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireRole, audit } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { putFile } from '@/lib/files';
import { allow } from '@/lib/ratelimit';
import { s } from '@/lib/fmt';
export type R = { ok?: boolean; error?: string };
async function me() {
  const { sb, user } = await requireRole('student');
  const { data: st } = await sb.from('students').select('id,user_id').eq('user_id', user.id).single(); if (!st) throw new Error('Student record missing');
  return { sb, user, sid: st.id as string };
}
export async function submitHomework(_: R, fd: FormData): Promise<R> {
  const { sb, user, sid } = await me(); const aid = z.string().uuid().parse(fd.get('assignment_id'));
  if (!(await allow(`hw:${user.id}`, 600, 20))) return { error: 'Too many submissions. Wait a few minutes.' };
  const { data: a } = await sb.from('assignments').select('id,teacher_id').eq('id', aid).single(); if (!a) return { error: 'Homework not found.' };
  const body = s(fd, 'body'); let file_path: string | null = null; const f = fd.get('file');
  if (f instanceof File && f.size > 0) { const r = await putFile(`submissions/${sid}`, f, 8); if (r.error) return { error: r.error }; file_path = r.path!; }
  if (!body && !file_path) return { error: 'Write an answer or attach a file.' };
  const db = supabaseAdmin(); const { data: ex } = await db.from('submissions').select('id,graded_at').eq('assignment_id', aid).maybeSingle();
  if (ex?.graded_at) return { error: 'This homework was already reviewed.' };
  const row = { assignment_id: aid, student_id: sid, body: body?.slice(0, 5000) ?? null, ...(file_path ? { file_path } : {}), submitted_at: new Date().toISOString() };
  const { error } = ex ? await db.from('submissions').update(row).eq('id', ex.id) : await db.from('submissions').insert(row);
  if (error) return { error: 'Could not submit.' }; revalidatePath('/student/homework'); return { ok: true };
}
export async function updateProfile(_: R, fd: FormData): Promise<R> {
  const { user, sid } = await me();
  const p = z.object({ whatsapp: z.string().trim().regex(/^\+[1-9]\d{7,14}$/, 'WhatsApp: use + and country code'), timezone: z.string().trim().min(1).max(60) }).safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: p.error.issues[0].message };
  try { new Intl.DateTimeFormat('en', { timeZone: p.data.timezone }); } catch { return { error: 'Unknown time zone.' }; }
  await supabaseAdmin().from('students').update(p.data).eq('id', sid); await audit(user.id, 'student.profile_updated', 'student', sid); revalidatePath('/student', 'layout'); return { ok: true };
}
export async function changePassword(_: R, fd: FormData): Promise<R> {
  const { sb } = await me(); const pw = String(fd.get('password') ?? ''); if (pw.length < 10 || pw !== String(fd.get('confirm') ?? '')) return { error: 'Password must be 10+ characters and match the confirmation.' };
  const { error } = await sb.auth.updateUser({ password: pw }); return error ? { error: error.message } : { ok: true };
}
export async function signOutEverywhere() { const { sb } = await me(); await sb.auth.signOut({ scope: 'global' }); }
export async function openTicket(_: R, fd: FormData): Promise<R> {
  const { sb, user, sid } = await me(); if (!(await allow(`tix:${user.id}`, 3600, 5))) return { error: 'Too many tickets. Try later.' };
  const subject = s(fd, 'subject'), body = s(fd, 'body'); if (!subject || !body) return { error: 'Fill subject and message.' };
  const { error } = await sb.from('support_tickets').insert({ student_id: sid, subject: subject.slice(0, 150), body: body.slice(0, 3000) }); if (error) return { error: 'Could not send.' };
  revalidatePath('/student/support'); return { ok: true };
}
export async function markNotificationsRead() { const { sb, user } = await me(); await sb.from('notifications').update({ read_at: new Date().toISOString() }).eq('user_id', user.id).is('read_at', null); revalidatePath('/student', 'layout'); }
