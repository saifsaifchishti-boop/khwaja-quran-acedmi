'use server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireRole, audit } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { genPassword } from '@/lib/accounts';
import { sendTemplate } from '@/lib/email';
import { s, num } from '@/lib/fmt';
export type Cred = { ok?: boolean; error?: string; code?: string; email?: string; password?: string; emailed?: boolean };
// Admin creates the login directly: the password is chosen by the admin (or auto-generated), shown ONCE, and must be changed at first login.
function pickPassword(fd: FormData): { pw?: string; error?: string } {
  const typed = s(fd, 'password'); if (!typed) return { pw: genPassword() };
  return typed.length >= 8 ? { pw: typed } : { error: 'Password must be at least 8 characters (or leave it empty to auto-generate).' };
}
async function makeUser(db: ReturnType<typeof supabaseAdmin>, email: string, pw: string) {
  const { data, error } = await db.auth.admin.createUser({ email, password: pw, email_confirm: true, user_metadata: { must_change_password: true } });
  if (error || !data.user) return { error: /already|registered|exists/i.test(error?.message ?? '') ? 'This email already has an account. Use a different email, or reset that password.' : (error?.message ?? 'Could not create login') };
  return { id: data.user.id };
}
export async function createStudentAccount(_: Cred, fd: FormData): Promise<Cred> {
  const { user, db } = await (async () => { const r = await requireRole('admin'); return { user: r.user, db: supabaseAdmin() }; })();
  const id = z.string().uuid().parse(fd.get('id')); const p = pickPassword(fd); if (!p.pw) return { error: p.error };
  const { data: a } = await db.from('student_applications').select('*').eq('id', id).single(); if (!a || a.status !== 'approved') return { error: 'Application must be approved first.' };
  const { data: ex } = await db.from('students').select('id').eq('application_id', id).maybeSingle(); if (ex) return { error: 'Account already created.' };
  const u = await makeUser(db, a.email, p.pw); if (!u.id) return { error: u.error };
  const { data: code } = await db.rpc('next_student_code'); const full = `${a.first_name} ${a.last_name}`;
  await db.from('profiles').upsert({ id: u.id, role: 'student', full_name: full });
  if (a.photo_path) await db.from('profiles').update({ avatar_path: a.photo_path, avatar_locked: true }).eq('id', u.id); // admission photo becomes the permanent DP
  const { data: st, error: e2 } = await db.from('students').insert({ user_id: u.id, student_code: code as string, application_id: id, full_name: full, email: a.email, whatsapp: a.whatsapp,
    timezone: s(fd, 'timezone') ?? a.timezone, course_id: s(fd, 'course_id') ?? a.course_id, status: 'active' }).select('id,student_code').single();
  if (e2 || !st) { await db.auth.admin.deleteUser(u.id); return { error: e2?.message ?? 'Could not create student' }; }
  const fee = num(fd, 'fee'); if (fee > 0) await db.from('fees').insert({ student_id: st.id, title: s(fd, 'fee_title') ?? 'Course fee', amount: fee, discount: num(fd, 'discount'), due_date: s(fd, 'due_date'), created_by: user.id });
  await audit(user.id, 'student.account_created', 'student', st.id, { code: st.student_code });
  const emailed = fd.get('send_email') === 'on' ? await sendTemplate('account_credentials', a.email, { name: a.first_name, code: st.student_code, password: p.pw }) : false;
  revalidatePath('/admin/applications'); return { ok: true, code: st.student_code, email: a.email, password: p.pw, emailed };
}
export async function createTeacherAccount(_: Cred, fd: FormData): Promise<Cred> {
  const { user } = await requireRole('admin'); const db = supabaseAdmin();
  const id = z.string().uuid().parse(fd.get('id')); const p = pickPassword(fd); if (!p.pw) return { error: p.error };
  const { data: a } = await db.from('teacher_applications').select('*').eq('id', id).single(); if (!a || a.status !== 'approved') return { error: 'Approve the application first.' };
  const { data: ex } = await db.from('teachers').select('id').eq('application_id', id).maybeSingle(); if (ex) return { error: 'Account already created.' };
  const u = await makeUser(db, a.email, p.pw); if (!u.id) return { error: u.error };
  const { data: code } = await db.rpc('next_teacher_code'); await db.from('profiles').upsert({ id: u.id, role: 'teacher', full_name: a.full_name });
  const { data: t, error: e2 } = await db.from('teachers').insert({ user_id: u.id, teacher_code: code as string, application_id: id, full_name: a.full_name, email: a.email, whatsapp: a.whatsapp, gender: a.gender, timezone: a.timezone }).select('id,teacher_code').single();
  if (e2 || !t) { await db.auth.admin.deleteUser(u.id); return { error: e2?.message ?? 'Could not create teacher' }; }
  await audit(user.id, 'teacher.account_created', 'teacher', t.id, { code: t.teacher_code });
  const emailed = fd.get('send_email') === 'on' ? await sendTemplate('account_credentials', a.email, { name: a.full_name, code: t.teacher_code, password: p.pw }) : false;
  revalidatePath('/admin/teachers'); return { ok: true, code: t.teacher_code, email: a.email, password: p.pw, emailed };
}
export async function resetPassword(_: Cred, fd: FormData): Promise<Cred> {
  const { user } = await requireRole('admin'); const db = supabaseAdmin();
  const kind = z.enum(['student', 'teacher']).parse(fd.get('kind')); const id = z.string().uuid().parse(fd.get('id')); const p = pickPassword(fd); if (!p.pw) return { error: p.error };
  const { data: row } = await db.from(kind === 'student' ? 'students' : 'teachers').select(kind === 'student' ? 'user_id,email,full_name,student_code' : 'user_id,email,full_name,teacher_code').eq('id', id).single() as { data: any };
  if (!row?.user_id) return { error: 'No login found for this person.' };
  const { error } = await db.auth.admin.updateUserById(row.user_id, { password: p.pw, user_metadata: { must_change_password: true } }); if (error) return { error: error.message };
  await audit(user.id, `${kind}.password_reset`, kind, id);
  const code = row.student_code ?? row.teacher_code; const emailed = fd.get('send_email') === 'on' ? await sendTemplate('account_credentials', row.email, { name: row.full_name, code, password: p.pw }) : false;
  return { ok: true, code, email: row.email, password: p.pw, emailed };
}
