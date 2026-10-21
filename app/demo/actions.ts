'use server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { allow, clientIp } from '@/lib/ratelimit';
const S = z.object({
  full_name: z.string().trim().min(2).max(100), email: z.string().trim().toLowerCase().email().max(200),
  whatsapp: z.string().trim().regex(/^\+[1-9]\d{7,14}$/, 'Use + and the country code, no spaces'),
  country: z.string().trim().min(2).max(80), timezone: z.string().trim().min(1).max(60), course_id: z.string().uuid().optional(), notes: z.string().max(500).optional(), consent: z.literal('on'),
});
export type DemoState = { errors?: Record<string, string>; message?: string; ok?: boolean };
export async function requestDemo(_: DemoState, fd: FormData): Promise<DemoState> {
  if (fd.get('website')) return { message: 'Rejected' };
  if (!(await allow(`demo:${await clientIp()}`, 3600, 5))) return { message: 'Too many requests. Please try again later.' };
  const raw = Object.fromEntries([...fd.entries()].filter(([, v]) => typeof v === 'string' && v !== '')); const p = S.safeParse(raw);
  if (!p.success) { const errors: Record<string, string> = {}; p.error.issues.forEach(i => { errors[String(i.path[0])] = i.message; }); return { errors, message: 'Please correct the highlighted fields.' }; }
  const { consent, ...rest } = p.data; const { error } = await supabaseAdmin().from('demo_requests').insert(rest);
  if (error) return { message: 'Could not save your request. Please try again.' }; return { ok: true };
}
