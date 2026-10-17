import AdminShell from '@/components/AdminShell';
import CopyButton from '@/components/CopyButton';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { money } from '@/lib/fees';
import { savePaymentMethod, deletePaymentMethod, reviewPayment, recordManualPayment } from '../actions';
export const dynamic = 'force-dynamic';
const KINDS = ['bank', 'jazzcash', 'easypaisa', 'paypal', 'wise', 'western_union', 'other'];
function Method({ m }: { m?: Record<string, any> }) {
  const f = (n: string, l: string) => <div><label className="lbl">{l}</label><input name={n} defaultValue={m?.[n] ?? ''} className="inp" /></div>;
  return (<form action={savePaymentMethod} className="card p-3 grid sm:grid-cols-3 gap-3">{m && <input type="hidden" name="id" value={m.id} />}
    <div><label className="lbl">Type</label><select name="kind" defaultValue={m?.kind ?? 'bank'} className="inp">{KINDS.map(k => <option key={k}>{k}</option>)}</select></div>
    {f('title', 'Display title (e.g. JazzCash)')}{f('account_name', 'Account holder name')}{f('account_number', 'Account / mobile number')}{f('iban', 'IBAN (optional)')}{f('currency', 'Currency')}{f('sort_order', 'Order')}
    <div className="sm:col-span-3"><label className="lbl">Instructions shown to students</label><textarea name="instructions" defaultValue={m?.instructions ?? ''} rows={2} className="inp" /></div>
    <label className="flex gap-2 items-center"><input type="checkbox" name="active" defaultChecked={m?.active ?? true} className="size-5" />Active</label>
    <div className="flex gap-2"><button className="btn btn-sm">{m ? 'Save' : 'Add method'}</button>{m && <button formAction={deletePaymentMethod} formNoValidate className="btn btn-sm btn-red">Disable</button>}</div></form>);
}
export default async function Page() {
  const db = supabaseAdmin();
  const { data: methods } = await db.from('payment_methods').select('*').order('sort_order');
  const { data: pend } = await db.from('payments').select('*, students(full_name,student_code), fees(title,currency)').eq('status', 'pending').order('created_at');
  const { data: recent } = await db.from('payments').select('*, students(full_name,student_code)').neq('status', 'pending').order('created_at', { ascending: false }).limit(15);
  const { data: fees } = await db.from('fees').select('id,title,students(full_name,student_code)').order('created_at', { ascending: false }).limit(200);
  const withUrls = await Promise.all((pend ?? []).map(async p => ({ ...p, url: p.proof_path ? (await db.storage.from('payment-proofs').createSignedUrl(p.proof_path, 600)).data?.signedUrl : null })));
  return (<AdminShell><h1 className="text-2xl font-bold mb-4">Payments</h1>
    <h2 className="font-bold mb-2">Awaiting verification ({withUrls.length})</h2>
    <div className="space-y-3">{withUrls.length === 0 && <p className="opacity-70">Nothing to review.</p>}{withUrls.map(p => (
      <form key={p.id} action={reviewPayment} className="card p-4 space-y-2"><input type="hidden" name="id" value={p.id} />
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm"><b>{p.students?.full_name} ({p.students?.student_code})</b><span>{p.fees?.title}</span><span className="font-bold">{money(p.amount, p.fees?.currency)}</span>
          <span>Txn: <span className="font-mono">{p.txn_ref ?? '—'}</span> {p.txn_ref && <CopyButton value={p.txn_ref} />}</span><span>Paid on: {p.paid_on}</span>{p.url && <a href={p.url} target="_blank" rel="noopener noreferrer" className="underline">View proof</a>}</div>
        <input name="review_note" placeholder="Note (optional)" className="inp" />
        <div className="flex gap-2"><button name="status" value="approved" className="btn btn-sm">Verify &amp; issue receipt</button><button name="status" value="rejected" className="btn btn-sm btn-red">Reject</button></div></form>))}</div>
    <h2 className="font-bold mt-8 mb-2">Record a manual payment (cash / received directly)</h2>
    <form action={recordManualPayment} className="card p-4 grid sm:grid-cols-3 gap-3"><div className="sm:col-span-3"><label className="lbl">Fee card</label>
      <select name="fee_id" required className="inp"><option value="">Select…</option>{(fees ?? []).map((f: any) => <option key={f.id} value={f.id}>{f.students?.student_code} — {f.students?.full_name} — {f.title}</option>)}</select></div>
      <div><label className="lbl">Amount</label><input name="amount" type="number" step="0.01" min="0.01" required className="inp" /></div>
      <div><label className="lbl">Method</label><select name="method_id" className="inp"><option value="">Cash / other</option>{(methods ?? []).map(m => <option key={m.id} value={m.id}>{m.title}</option>)}</select></div>
      <div><label className="lbl">Reference</label><input name="txn_ref" className="inp" /></div><div><label className="lbl">Paid on</label><input name="paid_on" type="date" className="inp" /></div>
      <button className="btn sm:col-span-3">Record (marked “manual”)</button></form>
    <h2 className="font-bold mt-8 mb-2">Payment accounts shown to students</h2><Method /><div className="space-y-3 mt-4">{(methods ?? []).map(m => <details key={m.id} className="card p-3"><summary className="cursor-pointer font-semibold">{m.title} {m.active ? '' : '(disabled)'}</summary><div className="mt-3"><Method m={m} /></div></details>)}</div>
    <h2 className="font-bold mt-8 mb-2">Recent decisions</h2><ul className="card divide-y divide-[var(--line)] text-sm">{(recent ?? []).map((p: any) => <li key={p.id} className="p-3 flex flex-wrap gap-x-4"><span>{p.students?.student_code}</span><span>{money(p.amount)}</span><span className="font-semibold">{p.status}</span><span className="opacity-70">{p.source}</span>{p.receipt_no && <span className="font-mono">{p.receipt_no}</span>}</li>)}</ul></AdminShell>);
}
