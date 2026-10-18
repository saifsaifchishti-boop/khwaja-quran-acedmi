'use server';
import { z } from 'zod';
import { saveAvatarFile } from '@/lib/avatars';
import { redirect } from 'next/navigation';
import { randomBytes } from 'crypto';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { allow, clientIp } from '@/lib/ratelimit';
import { sendTemplate, adminEmail } from '@/lib/email';

const S = z.object({
  first_name: z.string().trim().min(1).max(60), last_name: z.string().trim().min(1).max(60), father_name: z.string().trim().min(1).max(100),
  gender: z.enum(['male', 'female']), dob: z.string().refine(v => !isNaN(Date.parse(v)) && new Date(v) < new Date(), 'invalid'),
  email: z.string().trim().toLowerCase().email().max(200),
  whatsapp: z.string().trim().regex(/^\+[1-9]\d{7,14}$/, 'Use + and country code, no spaces'),
  mobile: z.string().trim().max(20).optional(), country: z.string().trim().min(2).max(80), state: z.string().trim().max(80).optional(),
  city: z.string().trim().min(1).max(80), timezone: z.string().trim().min(1).max(60), address: z.string().trim().max(250).optional(),
  language: z.string().trim().min(1).max(40), course_id: z.string().uuid(),
  level: z.string().max(80).optional(), experience: z.string().max(1000).optional(),
  preferred_days: z.string().max(100).optional(), preferred_time: z.string().max(100).optional(),
  duration_min: z.coerce.number().int().min(15).max(180).optional(), teacher_gender_pref: z.string().max(20).optional(),
  notes: z.string().max(1500).optional(), guardian_name: z.string().trim().max(100).optional(), guardian_phone: z.string().trim().max(25).optional(),
  consent_policy: z.literal('on'), consent_data: z.literal('on'),
});
export type FormState = { errors?: Record<string, string>; message?: string };

export async function submitApplication(_: FormState, fd: FormData): Promise<FormState> {
  if (fd.get('website')) return { message: 'Rejected' }; // honeypot
  if (!(await allow(`reg:${await clientIp()}`, 3600, 8))) return { message: 'Too many attempts. Please try again later.' };
  const raw = Object.fromEntries([...fd.entries()].filter(([, v]) => typeof v === 'string' && v !== ''));
  const p = S.safeParse(raw);
  if (!p.success) {
    const errors: Record<string, string> = {};
    p.error.issues.forEach(i => { errors[String(i.path[0])] = i.message; });
    return { errors, message: 'Please correct the highlighted fields.' };
  }
  const v = p.data;
  const sb = supabaseAdmin();
  let photo_path: string | undefined; const ph = fd.get('photo');
  if (ph instanceof File && ph.size > 0) { const r = await saveAvatarFile(sb, 'applications', ph); if (!r.path) return { errors: { photo: r.error ?? 'Invalid picture.' } }; photo_path = r.path; }
  const since = new Date(Date.now() - 86400000).toISOString();
  const { count: dup } = await sb.from('student_applications').select('id', { count: 'exact', head: true })
    .ilike('email', v.email).in('status', ['pending', 'info_requested']);
  if (dup) return { errors: { email: 'An application with this email is already under review.' } };
  const { count: recent } = await sb.from('student_applications').select('id', { count: 'exact', head: true }).gte('created_at', since);
  if ((recent ?? 0) > 300) return { message: 'Too many applications right now. Please try later.' };
  const ref = 'KQA-' + randomBytes(4).toString('hex').toUpperCase();
  const { consent_policy, consent_data, ...rest } = v;
  const { error } = await sb.from('student_applications').insert({ ...rest, ref, photo_path, consent_policy: true, consent_data: true });
  if (error) { console.error('application insert failed', error.code); return { message: 'Could not save your application. Please try again.' }; }
  await sendTemplate('application_received', v.email, { name: v.first_name, ref });
  await sendTemplate('application_admin_alert', await adminEmail(), { name: `${v.first_name} ${v.last_name}`, ref });
  redirect(`/register/done?ref=${ref}`);
}
