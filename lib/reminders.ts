import 'server-only';
import { supabaseAdmin } from './supabase/admin';
import { sendTemplate } from './email';
import { feeSummary, money } from './fees';
// Emails students whose fee card has a balance and is overdue or due within 3 days; at most one reminder per fee per 7 days.
export async function sendFeeReminders() {
  const db = supabaseAdmin(); const horizon = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
  const { data: fees } = await db.from('fees').select('id,title,amount,discount,currency,due_date,students(full_name,email,status)').not('due_date', 'is', null).lte('due_date', horizon);
  const { data: pays } = await db.from('payments').select('fee_id,amount,status'); let sent = 0;
  for (const f of fees ?? []) {
    const st = f.students as any; if (!st || st.status !== 'active') continue; const sum = feeSummary(f, pays ?? []); if (sum.balance <= 0) continue;
    const { count } = await db.from('email_logs').select('id', { count: 'exact', head: true }).eq('template_key', 'fee_reminder').eq('to_email', st.email).ilike('subject', `%${f.title.replace(/[%_]/g, '')}%`).gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString());
    if (count) continue; if (await sendTemplate('fee_reminder', st.email, { name: st.full_name, fee: f.title, amount: money(sum.balance, f.currency), due: f.due_date })) sent++;
  }
  return sent;
}
