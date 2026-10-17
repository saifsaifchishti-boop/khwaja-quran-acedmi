'use server';
import { z } from 'zod';
import { redirect } from 'next/navigation';
import { randomBytes } from 'crypto';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { allow, clientIp } from '@/lib/ratelimit';
import { sendTemplate, adminEmail } from '@/lib/email';

const S = z.object({
  full_name: z.string().trim().min(2).max(100), gender: z.enum(['male', 'female']), email: z.string().trim().toLowerCase().email().max(200),
  whatsapp: z.string().trim().regex(/^\+[1-9]\d{7,14}$/, 'Use + and country code, no spaces'),
  country: z.string().trim().min(2).max(80), city: z.string().trim().min(1).max(80), timezone: z.string().trim().min(1).max(60),
  qualifications: z.string().trim().min(5).max(2000), experience_years: z.coerce.number().int().min(0).max(70).optional(),
  specialties: z.string().max(500).optional(), languages: z.string().max(200).optional(), availability: z.string().max(500).optional(), bio: z.string().max(2000).optional(),
  consent: z.literal('on'),
});
const OK = ['image/jpeg', 'image/png', 'application/pdf'];
export type TState = { errors?: Record<string, string>; message?: string };
export async function submitTeacherApplication(_: TState, fd: FormData): Promise<TState> {
  if (fd.get('website')) return { message: 'Rejected' };
  if (!(await allow(`tapp:${await clientIp()}`, 3600, 5))) return { message: 'Too many attempts. Please try later.' };
  const raw = Object.fromEntries([...fd.entries()].filter(([, v]) => typeof v === 'string' && v !== ''));
  const p = S.safeParse(raw);
  if (!p.success) { const errors: Record<string, string> = {}; p.error.issues.forEach(i => { errors[String(i.path[0])] = i.message; }); return { errors, message: 'Please correct the highlighted fields.' }; }
  const db = supabaseAdmin();
  const { count } = await db.from('teacher_applications').select('id', { count: 'exact', head: true }).ilike('email', p.data.email).in('status', ['pending', 'info_requested']);
  if (count) return { errors: { email: 'An application with this email is already under review.' } };
  const files = fd.getAll('docs').filter((f): f is File => f instanceof File && f.size > 0).slice(0, 4);
  const folder = crypto.randomUUID(); const paths: string[] = [];
  for (const f of files) {
    if (!OK.includes(f.type) || f.size > 5 * 1024 * 1024) return { message: 'Documents must be JPG/PNG/PDF, max 5 MB each (up to 4 files).' };
    const path = `${folder}/${crypto.randomUUID()}.${f.type === 'application/pdf' ? 'pdf' : f.type.split('/')[1]}`;
    const { error } = await db.storage.from('teacher-docs').upload(path, f, { contentType: f.type });
    if (error) return { message: 'Document upload failed. Try again.' };
    paths.push(path);
  }
  const ref = 'KQT-' + randomBytes(4).toString('hex').toUpperCase();
  const { consent, ...rest } = p.data;
  const { error } = await db.from('teacher_applications').insert({ ...rest, ref, consent: true, doc_paths: paths });
  if (error) { console.error('tapp insert', error.code); return { message: 'Could not save your application.' }; }
  await sendTemplate('teacher_app_received', p.data.email, { name: p.data.full_name, ref });
  await sendTemplate('application_admin_alert', await adminEmail(), { name: `${p.data.full_name} (teacher)`, ref });
  redirect(`/teach/done?ref=${ref}`);
}
