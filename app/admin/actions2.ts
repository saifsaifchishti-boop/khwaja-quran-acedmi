'use server';
import { revalidatePath } from 'next/cache';
import { randomBytes } from 'crypto';
import { z } from 'zod';
import { requireRole, audit, notify } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { sendTemplate, retryFailed } from '@/lib/email';
import { sendFeeReminders } from '@/lib/reminders';
import { s } from '@/lib/fmt';
async function admin() { const { user } = await requireRole('admin'); return { user, db: supabaseAdmin() }; }
const uuid = z.string().uuid();
const redirectTo = () => `${process.env.NEXT_PUBLIC_SITE_URL}/auth/set-password`;

// ---- Teacher applications / accounts
export async function decideTeacherApplication(statusIn: string, fd: FormData) {
  const { user, db } = await admin(); const id = uuid.parse(fd.get('id')); const status = z.enum(['approved', 'rejected', 'info_requested']).parse(statusIn);
  const { data: a } = await db.from('teacher_applications').select('full_name,email,ref').eq('id', id).single();
  await db.from('teacher_applications').update({ status, admin_note: s(fd, 'admin_note'), decided_by: user.id, decided_at: new Date().toISOString() }).eq('id', id);
  await audit(user.id, `teacher_application.${status}`, 'teacher_application', id);
  if (a) await sendTemplate(status === 'approved' ? 'teacher_approved' : status === 'rejected' ? 'teacher_rejected' : 'application_info', a.email, { name: a.full_name, ref: a.ref, note: s(fd, 'admin_note') ?? '' });
  revalidatePath('/admin/teachers');
}
export async function createTeacherAccount(fd: FormData) {
  const { user, db } = await admin(); const id = uuid.parse(fd.get('id'));
  const { data: a } = await db.from('teacher_applications').select('*').eq('id', id).single(); if (!a || a.status !== 'approved') throw new Error('Approve the application first.');
  const { data: ex } = await db.from('teachers').select('id').eq('application_id', id).maybeSingle(); if (ex) throw new Error('Account already created.');
  const { data: inv, error } = await db.auth.admin.inviteUserByEmail(a.email, { redirectTo: redirectTo() }); if (error || !inv.user) throw new Error(error?.message ?? 'Invite failed');
  const { data: code } = await db.rpc('next_teacher_code'); await db.from('profiles').upsert({ id: inv.user.id, role: 'teacher', full_name: a.full_name });
  const { data: t, error: e2 } = await db.from('teachers').insert({ user_id: inv.user.id, teacher_code: code as string, application_id: id, full_name: a.full_name, email: a.email, whatsapp: a.whatsapp, gender: a.gender, timezone: a.timezone }).select('id,teacher_code').single();
  if (e2 || !t) throw new Error(e2?.message ?? 'Could not create teacher'); await audit(user.id, 'teacher.account_created', 'teacher', t.id, { code: t.teacher_code }); revalidatePath('/admin/teachers');
}
export async function setTeacherStatus(statusIn: string, fd: FormData) {
  const { user, db } = await admin(); const id = uuid.parse(fd.get('id')); const status = z.enum(['active', 'suspended', 'inactive']).parse(statusIn);
  await db.from('teachers').update({ status }).eq('id', id); await audit(user.id, `teacher.${status}`, 'teacher', id); revalidatePath('/admin/teachers');
}
export async function assignTeacher(fd: FormData) {
  const { user, db } = await admin(); const teacher_id = uuid.parse(fd.get('teacher_id')); const student_id = uuid.parse(fd.get('student_id'));
  await db.from('teacher_assignments').upsert({ teacher_id, student_id, active: true }, { onConflict: 'teacher_id,student_id' }); await audit(user.id, 'assignment.created', 'student', student_id, { teacher_id }); revalidatePath('/admin/teachers'); revalidatePath('/admin/classes');
}
export async function unassignTeacher(fd: FormData) {
  const { user, db } = await admin(); const id = uuid.parse(fd.get('id'));
  await db.from('teacher_assignments').update({ active: false }).eq('id', id); await audit(user.id, 'assignment.ended', 'assignment', id); revalidatePath('/admin/teachers');
}
// ---- Classes
export async function saveSchedule(fd: FormData) {
  const { user, db } = await admin(); const teacher_id = uuid.parse(fd.get('teacher_id')); const student_id = uuid.parse(fd.get('student_id'));
  const { data: a } = await db.from('teacher_assignments').select('id').eq('teacher_id', teacher_id).eq('student_id', student_id).eq('active', true).maybeSingle(); if (!a) throw new Error('Assign this teacher to the student first.');
  const tz = s(fd, 'tz') ?? 'Asia/Karachi'; try { new Intl.DateTimeFormat('en', { timeZone: tz }); } catch { throw new Error('Unknown time zone'); }
  const row = { teacher_id, student_id, weekday: z.coerce.number().int().min(0).max(6).parse(fd.get('weekday')), start_time: z.string().regex(/^\d{2}:\d{2}$/).parse(fd.get('start_time')), duration_min: z.coerce.number().int().min(10).max(240).parse(fd.get('duration_min')), tz, starts_on: s(fd, 'starts_on') ?? new Date().toISOString().slice(0, 10), ends_on: s(fd, 'ends_on') };
  const { data: sch, error } = await db.from('class_schedules').insert(row).select('id').single(); if (error || !sch) throw new Error(error?.message ?? 'Could not save schedule');
  const { data: r } = await db.rpc('generate_sessions', { p_schedule: sch.id, p_weeks: z.coerce.number().int().min(1).max(26).parse(fd.get('weeks') ?? 8) });
  await audit(user.id, 'schedule.created', 'class_schedule', sch.id, (r ?? {}) as object);
  const { data: st } = await db.from('students').select('user_id').eq('id', student_id).single(); await notify(st?.user_id, 'Your class timetable was updated', undefined, '/student/timetable'); revalidatePath('/admin/classes');
}
export async function extendSchedule(fd: FormData) {
  const { user, db } = await admin(); const id = uuid.parse(fd.get('id')); await db.rpc('generate_sessions', { p_schedule: id, p_weeks: 8 }); await audit(user.id, 'schedule.extended', 'class_schedule', id); revalidatePath('/admin/classes');
}
export async function stopSchedule(fd: FormData) {
  const { user, db } = await admin(); const id = uuid.parse(fd.get('id')); await db.from('class_schedules').update({ active: false }).eq('id', id);
  await db.from('class_sessions').update({ status: 'cancelled', cancel_reason: 'Schedule stopped' }).eq('schedule_id', id).eq('status', 'scheduled').gt('starts_at', new Date().toISOString());
  await audit(user.id, 'schedule.stopped', 'class_schedule', id); revalidatePath('/admin/classes');
}
export async function cancelSession(fd: FormData) {
  const { user, db } = await admin(); const id = uuid.parse(fd.get('id'));
  const { data: x } = await db.from('class_sessions').update({ status: 'cancelled', cancel_reason: s(fd, 'reason') }).eq('id', id).select('students(full_name,email,user_id)').single();
  const st = (x as any)?.students; if (st) { await sendTemplate('class_notice', st.email, { name: st.full_name, message: `A class was cancelled. ${s(fd, 'reason') ?? ''}` }); await notify(st.user_id, 'A class was cancelled', s(fd, 'reason') ?? undefined, '/student/timetable'); }
  await audit(user.id, 'session.cancelled', 'class_session', id); revalidatePath('/admin/classes');
}
// ---- Students
export async function updateStudent(fd: FormData) {
  const { user, db } = await admin(); const id = uuid.parse(fd.get('id'));
  const p = z.object({ full_name: z.string().trim().min(2).max(120), whatsapp: z.string().trim().max(20).optional(), timezone: z.string().trim().min(1).max(60) }).parse(Object.fromEntries(fd));
  await db.from('students').update({ ...p, course_id: s(fd, 'course_id') }).eq('id', id); await audit(user.id, 'student.updated', 'student', id); revalidatePath('/admin/students');
}
export async function setStudentStatus(statusIn: string, fd: FormData) {
  const { user, db } = await admin(); const id = uuid.parse(fd.get('id')); const status = z.enum(['active', 'suspended', 'inactive']).parse(statusIn);
  await db.from('students').update({ status }).eq('id', id); await audit(user.id, `student.${status}`, 'student', id); revalidatePath('/admin/students');
}
export async function issueCertificate(fd: FormData) {
  const { user, db } = await admin(); const student_id = uuid.parse(fd.get('student_id')); const title = s(fd, 'title'); if (!title) return;
  const code = 'KQC-' + randomBytes(5).toString('hex').toUpperCase(); await db.from('certificates').insert({ code, student_id, title, issued_by: user.id, issued_on: s(fd, 'issued_on') ?? undefined, note: s(fd, 'note') });
  await audit(user.id, 'certificate.issued', 'student', student_id, { code }); revalidatePath('/admin/students');
}
export async function revokeCertificate(fd: FormData) { const { user, db } = await admin(); const id = uuid.parse(fd.get('id')); await db.from('certificates').update({ revoked: true }).eq('id', id); await audit(user.id, 'certificate.revoked', 'certificate', id); revalidatePath('/admin/students'); }
// ---- Emails, pages, tickets
export async function saveEmailTemplate(fd: FormData) {
  const { user, db } = await admin(); const key = z.string().regex(/^[a-z_]+$/).parse(fd.get('key'));
  await db.from('email_templates').upsert({ key, subject_en: s(fd, 'subject_en') ?? '', body_en: s(fd, 'body_en') ?? '', subject_ur: s(fd, 'subject_ur') ?? '', body_ur: s(fd, 'body_ur') ?? '', enabled: fd.get('enabled') === 'on', updated_at: new Date().toISOString() });
  await audit(user.id, 'email_template.saved', 'email_template', key); revalidatePath('/admin/emails');
}
export async function resetEmailTemplate(fd: FormData) { const { user, db } = await admin(); const key = z.string().regex(/^[a-z_]+$/).parse(fd.get('key')); await db.from('email_templates').delete().eq('key', key); await audit(user.id, 'email_template.reset', 'email_template', key); revalidatePath('/admin/emails'); }
export async function retryEmails() { const { user } = await admin(); const r = await retryFailed(); await audit(user.id, 'email.retry', 'email_logs', '', r); revalidatePath('/admin/emails'); }
export async function runFeeReminders() { const { user } = await admin(); const n = await sendFeeReminders(); await audit(user.id, 'fees.reminders_sent', 'fees', '', { n }); revalidatePath('/admin/emails'); }
export async function savePage(fd: FormData) {
  const { user, db } = await admin(); const slug = z.enum(['privacy', 'terms', 'safeguarding']).parse(fd.get('slug'));
  await db.from('pages').update({ title_en: s(fd, 'title_en') ?? slug, title_ur: s(fd, 'title_ur') ?? '', body_en: s(fd, 'body_en') ?? '', body_ur: s(fd, 'body_ur') ?? '', published: fd.get('published') === 'on', updated_at: new Date().toISOString() }).eq('slug', slug);
  await audit(user.id, 'page.saved', 'page', slug); revalidatePath('/admin/pages'); revalidatePath(`/p/${slug}`); revalidatePath('/', 'layout');
}
export async function replyTicket(fd: FormData) {
  const { user, db } = await admin(); const id = uuid.parse(fd.get('id'));
  const { data: t } = await db.from('support_tickets').update({ admin_reply: s(fd, 'reply'), replied_at: new Date().toISOString(), status: fd.get('close') ? 'closed' : 'open' }).eq('id', id).select('students(user_id)').single();
  await notify((t as any)?.students?.user_id, 'The academy replied to your support ticket', undefined, '/student/support'); await audit(user.id, 'ticket.replied', 'ticket', id); revalidatePath('/admin/inbox');
}
export async function resolveReport(fd: FormData) { const { user, db } = await admin(); const id = uuid.parse(fd.get('id')); await db.from('chat_reports').update({ status: 'resolved' }).eq('id', id); await audit(user.id, 'chat_report.resolved', 'chat_report', id); revalidatePath('/admin/inbox'); }
