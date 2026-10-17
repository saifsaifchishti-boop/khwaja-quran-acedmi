'use server';
import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
export async function setNewPassword(_: { error?: string }, fd: FormData): Promise<{ error?: string }> {
  const sb = await supabaseServer(); const { data: { user } } = await sb.auth.getUser(); if (!user) redirect('/login');
  const pw = String(fd.get('password') ?? ''); if (pw.length < 10 || pw !== String(fd.get('confirm') ?? '')) return { error: 'Password must be at least 10 characters and match the confirmation.' };
  const { error } = await sb.auth.updateUser({ password: pw, data: { must_change_password: false } }); if (error) return { error: error.message };
  const { data: p } = await sb.from('profiles').select('role').eq('id', user.id).single();
  redirect(p?.role === 'teacher' ? '/teacher' : p?.role === 'admin' ? '/admin' : '/student');
}
