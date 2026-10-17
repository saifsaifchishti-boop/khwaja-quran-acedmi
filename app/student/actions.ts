'use server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { allow } from '@/lib/ratelimit';
import { sendTemplate, adminEmail } from '@/lib/email';
import { money } from '@/lib/fees';
const OK = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
export type PayState = { ok?: boolean; error?: string };
export async function submitPayment(_: PayState, fd: FormData): Promise<PayState> {
  const { sb, user } = await requireRole('student');
  if (!(await allow(`pay:${user.id}`, 600, 10))) return { error: 'Too many submissions. Please wait a few minutes.' };
  const p = z.object({ fee_id: z.string().uuid(), method_id: z.string().uuid(), amount: z.coerce.number().positive().max(10_000_000), txn_ref: z.string().trim().min(3).max(80), paid_on: z.string().optional() }).safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: 'Please fill amount, method and transaction number correctly.' };
  const { data: stu } = await sb.from('students').select('id,full_name').eq('user_id', user.id).single(); // RLS: only own row
  if (!stu) return { error: 'Student record not found.' };
  const { data: fee } = await sb.from('fees').select('id,title,currency').eq('id', p.data.fee_id).eq('student_id', stu.id).single();
  if (!fee) return { error: 'Fee card not found.' };
  let proof_path: string | null = null; const file = fd.get('proof');
  if (file instanceof File && file.size > 0) {
    if (!OK.includes(file.type) || file.size > 3 * 1024 * 1024) return { error: 'Proof must be JPG/PNG/WebP/PDF under 3 MB.' };
    proof_path = `${user.id}/${crypto.randomUUID()}.${file.type === 'application/pdf' ? 'pdf' : file.type.split('/')[1]}`;
    const { error } = await sb.storage.from('payment-proofs').upload(proof_path, file, { contentType: file.type });
    if (error) return { error: 'Upload failed. Try again.' };
  }
  const { error } = await sb.from('payments').insert({ fee_id: fee.id, student_id: stu.id, method_id: p.data.method_id, amount: p.data.amount, txn_ref: p.data.txn_ref, paid_on: p.data.paid_on || undefined, proof_path, status: 'pending', source: 'student_submitted' });
  if (error) return { error: 'Could not submit payment.' };
  await sendTemplate('payment_submitted_admin', await adminEmail(), { name: stu.full_name, amount: money(p.data.amount, fee.currency), fee: fee.title });
  revalidatePath('/student/fees'); return { ok: true };
}
