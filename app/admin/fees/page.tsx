import AdminShell from '@/components/AdminShell';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { feeSummary, money } from '@/lib/fees';
import { createFee, updateFee } from '../actions';
export const dynamic = 'force-dynamic';
function FeeForm({ f, students }: { f?: Record<string, any>; students?: { id: string; full_name: string; student_code: string }[] }) {
  return (<form action={f ? updateFee : createFee} className="card p-3 grid sm:grid-cols-3 gap-3">{f && <input type="hidden" name="id" value={f.id} />}
    {students && <div className="sm:col-span-3"><label className="lbl">Student</label><select name="student_id" required className="inp"><option value="">Select…</option>{students.map(s => <option key={s.id} value={s.id}>{s.student_code} — {s.full_name}</option>)}</select></div>}
    <div><label className="lbl">Title</label><input name="title" defaultValue={f?.title ?? ''} required className="inp" /></div>
    <div><label className="lbl">Amount</label><input name="amount" type="number" step="0.01" min="0" defaultValue={f?.amount ?? ''} required className="inp" /></div>
    <div><label className="lbl">Discount</label><input name="discount" type="number" step="0.01" min="0" defaultValue={f?.discount ?? 0} className="inp" /></div>
    <div><label className="lbl">Due date</label><input name="due_date" type="date" defaultValue={f?.due_date ?? ''} className="inp" /></div>
    {!f && <div><label className="lbl">Currency</label><input name="currency" defaultValue="PKR" className="inp" /></div>}
    <div><label className="lbl">Note</label><input name="note" defaultValue={f?.note ?? ''} className="inp" /></div><button className="btn sm:col-span-3">{f ? 'Save (logged in audit trail)' : 'Create fee card'}</button></form>);
}
export default async function Page() {
  const db = supabaseAdmin();
  const { data: students } = await db.from('students').select('id,full_name,student_code').order('student_code');
  const { data: fees } = await db.from('fees').select('*, students(full_name,student_code)').order('created_at', { ascending: false }).limit(100);
  const { data: pays } = await db.from('payments').select('fee_id,amount,status');
  const today = new Date().toISOString().slice(0, 10);
  return (<AdminShell><h1 className="text-2xl font-bold mb-4">Fee cards</h1><h2 className="font-bold mb-2">New fee card</h2><FeeForm students={students ?? []} />
    <h2 className="font-bold mt-8 mb-2">All fee cards</h2><div className="space-y-3">{(fees ?? []).map((f: any) => { const x = feeSummary(f, pays ?? []); const overdue = x.balance > 0 && f.due_date && f.due_date < today;
      return (<details key={f.id} className="card p-3"><summary className="cursor-pointer flex flex-wrap gap-x-4 font-semibold"><span>{f.students?.student_code} {f.students?.full_name}</span><span>{f.title}</span>
        <span>Paid {money(x.paid, f.currency)} / {money(x.total, f.currency)}</span><span>{x.balance === 0 ? '✓ Paid' : `Balance ${money(x.balance, f.currency)}`}</span>{overdue && <span className="text-red-600">OVERDUE</span>}</summary><div className="mt-3"><FeeForm f={f} /></div></details>); })}
      {!fees?.length && <p className="opacity-70">No fee cards yet.</p>}</div></AdminShell>);
}
