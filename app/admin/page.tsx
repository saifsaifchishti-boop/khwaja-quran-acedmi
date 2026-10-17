import AdminShell from '@/components/AdminShell';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { feeSummary, money } from '@/lib/fees';
export const dynamic = 'force-dynamic';
export default async function Page() {
  const db = supabaseAdmin();
  const cnt = async (q: PromiseLike<{ count: number | null }>) => (await q).count ?? 0;
  const head = { count: 'exact' as const, head: true };
  const [students, active, pend, appr, rej, courses, pendPay] = await Promise.all([
    cnt(db.from('students').select('id', head)), cnt(db.from('students').select('id', head).eq('status', 'active')),
    cnt(db.from('student_applications').select('id', head).eq('status', 'pending')), cnt(db.from('student_applications').select('id', head).eq('status', 'approved')),
    cnt(db.from('student_applications').select('id', head).eq('status', 'rejected')), cnt(db.from('courses').select('id', head).eq('published', true).eq('archived', false)),
    cnt(db.from('payments').select('id', head).eq('status', 'pending'))]);
  const { data: fees } = await db.from('fees').select('id,amount,discount'); const { data: pays } = await db.from('payments').select('fee_id,amount,status');
  let collected = 0, outstanding = 0; (fees ?? []).forEach(f => { const x = feeSummary(f, pays ?? []); collected += x.paid; outstanding += x.balance; });
  const { data: logs } = await db.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(8);
  const Stat = ({ l, v }: { l: string; v: string | number }) => <div className="card p-4"><div className="text-sm opacity-70">{l}</div><div className="text-2xl font-bold">{v}</div></div>;
  return (<AdminShell><h1 className="text-2xl font-bold mb-4">Dashboard</h1>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Stat l="Students" v={students} /><Stat l="Active students" v={active} /><Stat l="Pending applications" v={pend} /><Stat l="Approved / Rejected" v={`${appr} / ${rej}`} />
      <Stat l="Published courses" v={courses} /><Stat l="Payments awaiting review" v={pendPay} /><Stat l="Fees collected" v={money(collected)} /><Stat l="Outstanding" v={money(outstanding)} /></div>
    <h2 className="font-bold mt-8 mb-2">Recent activity</h2>
    <ul className="card divide-y divide-[var(--line)]">{(logs ?? []).length === 0 && <li className="p-3 opacity-70">No activity yet.</li>}
      {(logs ?? []).map(l => <li key={l.id} className="p-3 text-sm flex justify-between"><span>{l.action} <span className="opacity-60">{l.entity}</span></span><time className="opacity-60">{new Date(l.created_at).toLocaleString()}</time></li>)}</ul></AdminShell>);
}
