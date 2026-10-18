'use server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { supabaseServer } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireRole, audit } from '@/lib/auth';
import { saveAvatarFile } from '@/lib/avatars';
export type PhotoState = { ok?: boolean; error?: string };

// A student or teacher can set their picture ONCE. After that it is locked: only an administrator can change it.
export async function setMyAvatar(_: PhotoState, fd: FormData): Promise<PhotoState> {
  const sb = await supabaseServer(); const { data: { user } } = await sb.auth.getUser(); if (!user) return { error: 'Please sign in.' };
  const db = supabaseAdmin(); const { data: p } = await db.from('profiles').select('role,avatar_locked').eq('id', user.id).single();
  if (p?.role !== 'admin' && p?.avatar_locked) return { error: 'Your picture is locked. Please contact the administrator to change it.' };
  const f = fd.get('photo'); if (!(f instanceof File) || f.size === 0) return { error: 'Please choose a picture.' };
  const r = await saveAvatarFile(db, `u/${user.id}`, f); if (!r.path) return { error: r.error };
  await db.from('profiles').update({ avatar_path: r.path, avatar_locked: p?.role !== 'admin' }).eq('id', user.id);
  revalidatePath('/', 'layout'); return { ok: true };
}
export async function adminSetAvatar(_: PhotoState, fd: FormData): Promise<PhotoState> {
  const { user } = await requireRole('admin'); const uid = z.string().uuid().parse(fd.get('user_id')); const db = supabaseAdmin();
  const f = fd.get('photo'); if (!(f instanceof File) || f.size === 0) return { error: 'Please choose a picture.' };
  const r = await saveAvatarFile(db, `u/${uid}`, f); if (!r.path) return { error: r.error };
  await db.from('profiles').update({ avatar_path: r.path, avatar_locked: true }).eq('id', uid); await audit(user.id, 'avatar.changed', 'profile', uid);
  revalidatePath('/admin/people'); return { ok: true };
}
export async function adminAvatarAction(uid: string, action: 'lock' | 'unlock' | 'remove') {
  const { user } = await requireRole('admin'); z.string().uuid().parse(uid); const db = supabaseAdmin();
  if (action === 'remove') await db.from('profiles').update({ avatar_path: null, avatar_locked: false }).eq('id', uid);
  else await db.from('profiles').update({ avatar_locked: action === 'lock' }).eq('id', uid);
  await audit(user.id, `avatar.${action}`, 'profile', uid); revalidatePath('/admin/people');
}
