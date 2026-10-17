'use server';
import { revalidatePath } from 'next/cache';
import { randomBytes } from 'crypto';
import { requireRole, audit } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { z } from 'zod';
import { money } from '@/lib/fees';
import { sendTemplate } from '@/lib/email';
import { notify } from '@/lib/auth';

const s = (fd: FormData, k: string) => { const v = String(fd.get(k) ?? '').trim(); return v === '' ? null : v; };
const num = (fd: FormData, k: string, def = 0) => { const n = Number(fd.get(k)); return Number.isFinite(n) && n >= 0 ? n : def; };
async function admin() { const { user } = await requireRole('admin'); return { user, db: supabaseAdmin() }; }

// ---- Applications ----
export async function decideApplication(fd: FormData) {
  const { user, db } = await admin();
  const id = z.string().uuid().parse(fd.get('id'));
  const status = z.enum(['approved', 'rejected', 'info_requested']).parse(fd.get('status'));
  const { data: a } = await db.from('student_applications').select('first_name,last_name,email,ref').eq('id', id).single();
  await db.from('student_applications').update({ status, admin_note: s(fd, 'admin_note'), decided_by: user.id, decided_at: new Date().toISOString() }).eq('id', id);
  await audit(user.id, `application.${status}`, 'student_application', id);
  if (a) await sendTemplate(status === 'approved' ? 'application_approved' : status === 'rejected' ? 'application_rejected' : 'application_info', a.email, { name: a.first_name, ref: a.ref, note: s(fd, 'admin_note') ?? '' });
  revalidatePath('/admin/applications'); revalidatePath(`/admin/applications/${id}`);
}
export async function createStudentAccount(fd: FormData) {
  const { user, db } = await admin();
  const id = z.string().uuid().parse(fd.get('id'));
  const { data: a } = await db.from('student_applications').select('*').eq('id', id).single();
  if (!a || a.status !== 'approved') throw new Error('Application must be approved first.');
  const { data: existing } = await db.from('students').select('id').eq('application_id', id).maybeSingle();
  if (existing) throw new Error('Account already created.');
  // Invite = secure activation email; the student sets their own password. No password is ever generated or sent.
  const { data: inv, error } = await db.auth.admin.inviteUserByEmail(a.email, { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/set-password` });
  if (error || !inv.user) throw new Error(error?.message ?? 'Invite failed');
  const { data: seq } = await db.rpc('next_student_code');
  await db.from('profiles').upsert({ id: inv.user.id, role: 'student', full_name: `${a.first_name} ${a.last_name}` });
  const { data: st, error: e2 } = await db.from('students').insert({
    user_id: inv.user.id, student_code: seq as string, application_id: id, full_name: `${a.first_name} ${a.last_name}`,
    email: a.email, whatsapp: a.whatsapp, timezone: s(fd, 'timezone') ?? a.timezone, course_id: s(fd, 'course_id') ?? a.course_id, status: 'active' }).select('id,student_code').single();
  if (e2 || !st) throw new Error(e2?.message ?? 'Could not create student');
  const fee = num(fd, 'fee');
  if (fee > 0) await db.from('fees').insert({ student_id: st.id, title: s(fd, 'fee_title') ?? 'Course fee', amount: fee, discount: num(fd, 'discount'), due_date: s(fd, 'due_date'), created_by: user.id });
  await audit(user.id, 'student.account_created', 'student', st.id, { code: st.student_code });
  revalidatePath('/admin/applications'); revalidatePath(`/admin/applications/${id}`);
}
export async function resendInvite(fd: FormData) {
  const { user, db } = await admin();
  const email = z.string().email().parse(fd.get('email'));
  await db.auth.admin.inviteUserByEmail(email, { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/set-password` });
  await db.auth.resetPasswordForEmail(email, { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/set-password` });
  await audit(user.id, 'student.invite_resent', 'student', email);
}

// ---- Courses ----
export async function saveCourse(fd: FormData) {
  const { user, db } = await admin();
  const id = s(fd, 'id');
  const row = { title_en: s(fd, 'title_en') ?? 'Untitled', title_ur: s(fd, 'title_ur') ?? '', desc_en: s(fd, 'desc_en') ?? '', desc_ur: s(fd, 'desc_ur') ?? '',
    level: s(fd, 'level'), duration: s(fd, 'duration'), frequency: s(fd, 'frequency'), language: s(fd, 'language'), fee: num(fd, 'fee'),
    currency: s(fd, 'currency') ?? 'PKR', sort_order: Math.floor(num(fd, 'sort_order')), published: fd.get('published') === 'on', archived: fd.get('archived') === 'on' };
  if (id) await db.from('courses').update(row).eq('id', id);
  else await db.from('courses').insert({ ...row, slug: (row.title_en.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + randomBytes(2).toString('hex')) });
  await audit(user.id, id ? 'course.updated' : 'course.created', 'course', id ?? 'new');
  revalidatePath('/admin/courses'); revalidatePath('/courses'); revalidatePath('/');
}

// ---- Marquee ----
export async function saveMarqueeItem(fd: FormData) {
  const { user, db } = await admin(); const id = s(fd, 'id');
  const row = { text: s(fd, 'text') ?? '', kind: s(fd, 'kind') ?? 'announcement', sort_order: Math.floor(num(fd, 'sort_order')), active: fd.get('active') === 'on', starts_on: s(fd, 'starts_on'), ends_on: s(fd, 'ends_on') };
  if (!row.text) return;
  if (id) await db.from('marquee_items').update(row).eq('id', id); else await db.from('marquee_items').insert(row);
  await audit(user.id, 'marquee.saved', 'marquee_item', id ?? 'new'); revalidatePath('/', 'layout'); revalidatePath('/admin/marquee');
}
export async function deleteMarqueeItem(fd: FormData) {
  const { user, db } = await admin(); const id = z.string().uuid().parse(fd.get('id'));
  await db.from('marquee_items').delete().eq('id', id); await audit(user.id, 'marquee.deleted', 'marquee_item', id); revalidatePath('/', 'layout'); revalidatePath('/admin/marquee');
}
export async function saveMarqueeSettings(fd: FormData) {
  const { user, db } = await admin();
  await db.from('settings').upsert({ key: 'marquee', value: { enabled: fd.get('enabled') === 'on', speed: Math.min(200, Math.max(5, num(fd, 'speed', 40))), direction: fd.get('direction') === 'ltr' ? 'ltr' : 'rtl' } });
  await audit(user.id, 'marquee.settings', 'settings', 'marquee'); revalidatePath('/', 'layout'); revalidatePath('/admin/marquee');
}
export async function saveContact(fd: FormData) {
  const { user, db } = await admin();
  await db.from('settings').upsert({ key: 'contact', value: Object.fromEntries(['email', 'whatsapp', 'phone', 'address', 'hours'].map(k => [k, s(fd, k) ?? ''])) });
  await audit(user.id, 'settings.contact', 'settings', 'contact'); revalidatePath('/');
}

// ---- Payment methods, fee cards, payments ----
export async function savePaymentMethod(fd: FormData) {
  const { user, db } = await admin(); const id = s(fd, 'id');
  const row = { kind: s(fd, 'kind') ?? 'other', title: s(fd, 'title') ?? 'Payment method', account_name: s(fd, 'account_name'), account_number: s(fd, 'account_number'), iban: s(fd, 'iban'),
    instructions: s(fd, 'instructions'), currency: s(fd, 'currency') ?? 'PKR', sort_order: Math.floor(num(fd, 'sort_order')), active: fd.get('active') === 'on' };
  if (id) await db.from('payment_methods').update(row).eq('id', id); else await db.from('payment_methods').insert(row);
  await audit(user.id, 'payment_method.saved', 'payment_method', id ?? 'new'); revalidatePath('/admin/payments'); revalidatePath('/student/fees');
}
export async function deletePaymentMethod(fd: FormData) {
  const { user, db } = await admin(); const id = z.string().uuid().parse(fd.get('id'));
  await db.from('payment_methods').update({ active: false }).eq('id', id); // soft-disable keeps history intact
  await audit(user.id, 'payment_method.disabled', 'payment_method', id); revalidatePath('/admin/payments');
}
export async function createFee(fd: FormData) {
  const { user, db } = await admin();
  const student_id = z.string().uuid().parse(fd.get('student_id'));
  const { data } = await db.from('fees').insert({ student_id, title: s(fd, 'title') ?? 'Fee', amount: num(fd, 'amount'), discount: num(fd, 'discount'), currency: s(fd, 'currency') ?? 'PKR', due_date: s(fd, 'due_date'), note: s(fd, 'note'), created_by: user.id }).select('id').single();
  await audit(user.id, 'fee.created', 'fee', data?.id ?? '', { discount: num(fd, 'discount') }); revalidatePath('/admin/fees'); revalidatePath('/student');
}
export async function updateFee(fd: FormData) {
  const { user, db } = await admin(); const id = z.string().uuid().parse(fd.get('id'));
  await db.from('fees').update({ title: s(fd, 'title') ?? 'Fee', amount: num(fd, 'amount'), discount: num(fd, 'discount'), due_date: s(fd, 'due_date'), note: s(fd, 'note') }).eq('id', id);
  await audit(user.id, 'fee.updated', 'fee', id, { amount: num(fd, 'amount'), discount: num(fd, 'discount') }); revalidatePath('/admin/fees'); revalidatePath('/student');
}
export async function reviewPayment(fd: FormData) {
  const { user, db } = await admin(); const id = z.string().uuid().parse(fd.get('id'));
  const status = z.enum(['approved', 'rejected']).parse(fd.get('status'));
  const patch: Record<string, unknown> = { status, review_note: s(fd, 'review_note'), verified_by: user.id, verified_at: new Date().toISOString() };
  if (status === 'approved') patch.receipt_no = `RCT-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}${randomBytes(1).toString('hex').toUpperCase()}`;
  const { data: upd } = await db.from('payments').update(patch).eq('id', id).eq('status', 'pending').select('amount,receipt_no,students(full_name,email,user_id),fees(title,currency)').maybeSingle();
  await audit(user.id, `payment.${status}`, 'payment', id);
  if (upd) { const st = upd.students as any; const fe = upd.fees as any; const vars = { name: st?.full_name, amount: money(upd.amount, fe?.currency), fee: fe?.title, receipt: upd.receipt_no, note: s(fd, 'review_note') ?? '' };
    await sendTemplate(status === 'approved' ? 'payment_verified' : 'payment_rejected', st?.email, vars);
    await notify(st?.user_id, status === 'approved' ? `Payment verified — ${upd.receipt_no}` : 'Payment could not be verified', undefined, '/student/fees'); } revalidatePath('/admin/payments'); revalidatePath('/student/fees');
}
export async function recordManualPayment(fd: FormData) {
  const { user, db } = await admin();
  const fee_id = z.string().uuid().parse(fd.get('fee_id'));
  const { data: f } = await db.from('fees').select('student_id').eq('id', fee_id).single(); if (!f) return;
  const { data } = await db.from('payments').insert({ fee_id, student_id: f.student_id, method_id: s(fd, 'method_id'), amount: Math.max(num(fd, 'amount'), 0.01), txn_ref: s(fd, 'txn_ref'),
    paid_on: s(fd, 'paid_on') ?? new Date().toISOString().slice(0, 10), status: 'approved', source: 'manual', verified_by: user.id, verified_at: new Date().toISOString(),
    receipt_no: `RCT-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}${randomBytes(1).toString('hex').toUpperCase()}` }).select('id,amount,receipt_no').single();
  await audit(user.id, 'payment.manual_recorded', 'payment', data?.id ?? '');
  if (data) { const { data: x } = await db.from('fees').select('title,currency,students(full_name,email,user_id)').eq('id', fee_id).single(); const st = (x as any)?.students;
    await sendTemplate('payment_recorded', st?.email, { name: st?.full_name, amount: money(data.amount, (x as any)?.currency), fee: (x as any)?.title, receipt: data.receipt_no });
    await notify(st?.user_id, `Payment recorded — ${data.receipt_no}`, undefined, '/student/fees'); } revalidatePath('/admin/payments'); revalidatePath('/student/fees');
}
export async function proofUrl(path: string) {
  const { db } = await admin();
  const { data } = await db.storage.from('payment-proofs').createSignedUrl(path, 300);
  return data?.signedUrl ?? null;
}
