'use server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireRole, notify } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { putFile } from '@/lib/files';
import { sendTemplate } from '@/lib/email';
import { validRef } from '@/lib/quran-meta';
import { s } from '@/lib/fmt';

const uuid = z.string().uuid();
async function me() {
  const { sb, user } = await requireRole('teacher');
  const { data: t } = await sb.from('teachers').select('id').eq('user_id', user.id).single();
  if (!t) throw new Error('Teacher record missing');
  return { sb, user, tid: t.id as string };
}
// RLS already hides non-assigned students; this makes the intent explicit and gives a clean error.
async function student(sb: Awaited<ReturnType<typeof me>>['sb'], tid: string, sid: string) {
  const { data: a } = await sb.from('teacher_assignments').select('id').eq('student_id', sid).eq('teacher_id', tid).eq('active', true).maybeSingle();
  if (!a) throw new Error('Not your student.');
  const { data: st } = await sb.from('students').select('id,user_id,email,full_name').eq('id', sid).single();
  if (!st) throw new Error('Not your student.'); return st;
}
export async function markAttendance(fd: FormData) {
  const { sb, tid } = await me(); const id = uuid.parse(fd.get('session_id'));
  const status = z.enum(['present', 'absent', 'late', 'excused']).parse(fd.get('status'));
  const { data: ses } = await sb.from('class_sessions').select('id,student_id').eq('id', id).eq('teacher_id', tid).single(); if (!ses) throw new Error('Session not found');
  await sb.from('attendance').upsert({ session_id: id, student_id: ses.student_id, teacher_id: tid, status, note: s(fd, 'note'), marked_at: new Date().toISOString() }, { onConflict: 'session_id' });
  revalidatePath('/teacher/classes');
}
export async function completeSession(fd: FormData) {
  const { sb, tid } = await me(); const id = uuid.parse(fd.get('session_id'));
  const { data: ses } = await sb.from('class_sessions').select('id').eq('id', id).eq('teacher_id', tid).single(); if (!ses) throw new Error('Session not found');
  await supabaseAdmin().from('class_sessions').update({ status: 'completed' }).eq('id', id); revalidatePath('/teacher/classes');
}
export async function createHomework(fd: FormData) {
  const { sb, tid } = await me(); const sid = uuid.parse(fd.get('student_id')); const st = await student(sb, tid, sid);
  const title = s(fd, 'title'); if (!title) return;
  await sb.from('assignments').insert({ teacher_id: tid, student_id: sid, title, description: s(fd, 'description'), due_at: s(fd, 'due_at') ? new Date(String(fd.get('due_at'))).toISOString() : null });
  await notify(st.user_id, `New homework: ${title}`, undefined, '/student/homework'); revalidatePath(`/teacher/students/${sid}`);
}
export async function gradeSubmission(fd: FormData) {
  const { sb, tid } = await me(); const id = uuid.parse(fd.get('id')); const sid = uuid.parse(fd.get('student_id')); const st = await student(sb, tid, sid);
  await sb.from('submissions').update({ grade: s(fd, 'grade'), feedback: s(fd, 'feedback'), graded_at: new Date().toISOString() }).eq('id', id).eq('student_id', sid);
  await notify(st.user_id, 'Your homework was reviewed', undefined, '/student/homework'); revalidatePath(`/teacher/students/${sid}`);
}
export async function addMaterial(fd: FormData) {
  const { sb, tid } = await me(); const sid = uuid.parse(fd.get('student_id')); const st = await student(sb, tid, sid);
  const title = s(fd, 'title'); if (!title) return;
  let url = s(fd, 'url'); if (url && !/^https:\/\//i.test(url)) url = null;
  let file_path: string | null = null; const f = fd.get('file');
  if (f instanceof File && f.size > 0) { const r = await putFile(`materials/${sid}`, f, 10); if (r.error) throw new Error(r.error); file_path = r.path!; }
  await sb.from('materials').insert({ teacher_id: tid, student_id: sid, title, description: s(fd, 'description'), url, file_path });
  await notify(st.user_id, `New material: ${title}`, undefined, '/student/materials'); revalidatePath(`/teacher/students/${sid}`);
}
export async function addFeedback(fd: FormData) {
  const { sb, tid } = await me(); const sid = uuid.parse(fd.get('student_id')); await student(sb, tid, sid); const body = s(fd, 'body'); if (!body) return;
  await sb.from('feedback').insert({ teacher_id: tid, student_id: sid, body, progress: s(fd, 'progress') }); revalidatePath(`/teacher/students/${sid}`);
}
export async function addAssessment(fd: FormData) {
  const { sb, tid } = await me(); const sid = uuid.parse(fd.get('student_id')); await student(sb, tid, sid); const title = s(fd, 'title'); if (!title) return;
  const n = (k: string) => { const v = s(fd, k); return v === null || isNaN(Number(v)) ? null : Number(v); };
  await sb.from('assessments').insert({ teacher_id: tid, student_id: sid, title, score: n('score'), max_score: n('max_score'), remarks: s(fd, 'remarks') }); revalidatePath(`/teacher/students/${sid}`);
}
export async function sendNotice(fd: FormData) {
  const { sb, tid } = await me(); const sid = uuid.parse(fd.get('student_id')); const st = await student(sb, tid, sid); const message = s(fd, 'message'); if (!message) return;
  await sendTemplate('class_notice', st.email, { name: st.full_name, message: message.slice(0, 1000) }); await notify(st.user_id, 'Class notice', message.slice(0, 200), '/student');
}
// Quran: share an ayah with the student during a class (student's page receives it via Realtime)
export async function shareAyah(sessionId: string, surah: number, ayah: number) {
  const { sb, user, tid } = await me(); uuid.parse(sessionId);
  if (!validRef(surah, ayah)) return { error: 'Invalid ayah' };
  const { data: ses } = await sb.from('class_sessions').select('id').eq('id', sessionId).eq('teacher_id', tid).single(); if (!ses) return { error: 'Session not found' };
  const { error } = await sb.from('quran_shares').insert({ session_id: sessionId, surah, ayah, shared_by: user.id }); return error ? { error: 'Could not share' } : { ok: true };
}
export async function saveBookmark(surah: number, ayah: number, note: string) {
  const { sb, user } = await requireRole('teacher'); if (!validRef(surah, ayah)) return { error: 'Invalid ayah' };
  const { error } = await sb.from('quran_bookmarks').upsert({ user_id: user.id, surah, ayah, note: note.slice(0, 1000) || null }, { onConflict: 'user_id,surah,ayah' }); return error ? { error: 'Failed' } : { ok: true };
}
export async function deleteBookmark(surah: number, ayah: number) {
  const { sb, user } = await requireRole('teacher'); await sb.from('quran_bookmarks').delete().eq('user_id', user.id).eq('surah', surah).eq('ayah', ayah); return { ok: true };
}
