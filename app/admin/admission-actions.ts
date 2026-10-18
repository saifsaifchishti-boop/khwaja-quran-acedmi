'use server';
import { revalidatePath } from 'next/cache';
import { requireRole, audit } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
export async function saveAdmission(fd: FormData) {
  const { user } = await requireRole('admin');
  const keys = ['requirements_en', 'requirements_ur', 'steps_en', 'steps_ur', 'fees_en', 'fees_ur'];
  const value = Object.fromEntries(keys.map(k => [k, String(fd.get(k) ?? '').slice(0, 4000)]));
  await supabaseAdmin().from('settings').upsert({ key: 'admission', value });
  await audit(user.id, 'settings.admission', 'settings', 'admission'); revalidatePath('/'); revalidatePath('/register'); revalidatePath('/admin/admission');
}
