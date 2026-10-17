'use server';
import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { allow, clientIp } from '@/lib/ratelimit';
import { sendTemplate } from '@/lib/email';
export type LoginState = { error?: string };
async function signIn(email: string, password: string, role: 'admin' | 'student' | 'teacher'): Promise<LoginState | null> {
  if (!(await allow(`login-ip:${await clientIp()}`, 900, 20)) || !(await allow(`login-id:${email}`, 900, 8))) return { error: 'Too many attempts. Try again in 15 minutes.' };
  const sb = await supabaseServer();
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { error: 'Invalid credentials.' }; // same message for every failure
  const { data: p } = await sb.from('profiles').select('role').eq('id', data.user.id).single();
  if (p?.role !== role) { await sb.auth.signOut(); return { error: 'Invalid credentials.' }; }
  if (role === 'student') {
    const { data: s } = await sb.from('students').select('status').eq('user_id', data.user.id).single();
    if (s?.status !== 'active') { await sb.auth.signOut(); return { error: 'This account is not active. Contact the academy.' }; }
  }
  if (role === 'teacher') {
    const { data: t } = await sb.from('teachers').select('status').eq('user_id', data.user.id).single();
    if (t?.status !== 'active') { await sb.auth.signOut(); return { error: 'This account is not active. Contact the academy.' }; }
  }
  return null;
}
export async function teacherLogin(_: LoginState, fd: FormData): Promise<LoginState> {
  const id = String(fd.get('id') ?? '').trim(); const pw = String(fd.get('password') ?? '');
  if (!id || !pw) return { error: 'Enter your ID/email and password.' };
  let email = id.toLowerCase();
  if (!id.includes('@')) {
    const { data } = await supabaseAdmin().from('teachers').select('email').eq('teacher_code', id.toUpperCase()).maybeSingle();
    if (!data) return { error: 'Invalid credentials.' };
    email = data.email;
  }
  return (await signIn(email, pw, 'teacher')) ?? redirect('/teacher');
}
export async function studentLogin(_: LoginState, fd: FormData): Promise<LoginState> {
  const id = String(fd.get('id') ?? '').trim(); const pw = String(fd.get('password') ?? '');
  if (!id || !pw) return { error: 'Enter your ID/email and password.' };
  let email = id.toLowerCase();
  if (!id.includes('@')) {
    const { data } = await supabaseAdmin().from('students').select('email').eq('student_code', id.toUpperCase()).maybeSingle();
    if (!data) return { error: 'Invalid credentials.' };
    email = data.email;
  }
  return (await signIn(email, pw, 'student')) ?? redirect('/student');
}
export async function adminLogin(_: LoginState, fd: FormData): Promise<LoginState> {
  const email = String(fd.get('email') ?? '').trim().toLowerCase(); const pw = String(fd.get('password') ?? '');
  if (!email || !pw) return { error: 'Enter email and password.' };
  return (await signIn(email, pw, 'admin')) ?? redirect('/admin');
}
export async function logout() { const sb = await supabaseServer(); await sb.auth.signOut(); redirect('/'); }
export async function requestReset(_: LoginState, fd: FormData): Promise<LoginState> {
  const email = String(fd.get('email') ?? '').trim().toLowerCase();
  if (email && (await allow(`reset:${await clientIp()}`, 3600, 5))) {
    const { data } = await supabaseAdmin().auth.admin.generateLink({ type: 'recovery', email, options: { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/set-password` } });
    const link = data?.properties?.action_link; if (link) await sendTemplate('password_reset', email, { name: '', link });
  }
  return { error: 'If that email has an account, a reset link has been sent.' }; // never reveal whether it exists
}
