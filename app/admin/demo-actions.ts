'use server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireRole, audit } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
export async function setDemoStatus(fd: FormData) {
  const { user } = await requireRole('admin'); const id = z.string().uuid().parse(fd.get('id')); const status = z.enum(['new', 'contacted', 'scheduled', 'done', 'cancelled']).parse(fd.get('status'));
  await supabaseAdmin().from('demo_requests').update({ status, admin_note: String(fd.get('note') ?? '').slice(0, 500) || null }).eq('id', id);
  await audit(user.id, `demo.${status}`, 'demo_request', id); revalidatePath('/admin/demos');
}
