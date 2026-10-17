import StudentShell from '@/components/StudentShell';
import CopyButton from '@/components/CopyButton';
import PayForm from './PayForm';
import { feeSummary, money } from '@/lib/fees';
export const dynamic = 'force-dynamic';
export default function Page() {
  return (<StudentShell>{async ({ sb }) => {
    const { data: fees } = await sb.from('fees').select('*').order('created_at', { ascending: false });
    const { data: pays } = await sb.from('payments').select('*').order('created_at', { ascending: false });
    const { data: methods } = await sb.from('payment_methods').select('*').eq('active', true).order('sort_order');
    const today = new Date().toISOString().slice(0, 10);
    return (<><h1 className="text-2xl font-bold mb-4">Fees</h1>
      <h2 className="font-bold mb-2">How to pay</h2><div className="grid sm:grid-cols-2 gap-3 mb-6">{!methods?.length && <p className="opacity-70">The academy has not added payment accounts yet.</p>}
        {methods?.map(m => <div key={m.id} className="card p-4 text-sm space-y-1"><div className="font-bold text-lg">{m.title}</div>{m.account_name && <div>Name: {m.account_name}</div>}
          {m.account_number && <div>Account: <span className="font-mono" dir="ltr">{m.account_number}</span> <CopyButton value={m.account_number} /></div>}{m.iban && <div>IBAN: <span className="font-mono" dir="ltr">{m.iban}</span> <CopyButton value={m.iban} /></div>}{m.instructions && <p className="opacity-80">{m.instructions}</p>}</div>)}</div>
      <div className="space-y-4">{!fees?.length && <p className="opacity-70">No fee cards yet.</p>}{fees?.map(f => { const x = feeSummary(f, pays ?? []); const mine = (pays ?? []).filter(p => p.fee_id === f.id);
        return (<section key={f.id} className="card p-4"><div className="flex flex-wrap justify-between gap-2"><h3 className="font-bold text-lg">{f.title}</h3>{f.due_date && <span className={x.balance > 0 && f.due_date < today ? 'text-red-600 font-semibold' : 'opacity-70'}>Due {f.due_date}{x.balance > 0 && f.due_date < today && ' — overdue'}</span>}</div>
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 text-sm"><div><dt className="opacity-60">Total</dt><dd className="font-bold">{money(x.total, f.currency)}</dd></div><div><dt className="opacity-60">Paid</dt><dd className="font-bold">{money(x.paid, f.currency)}</dd></div>
            <div><dt className="opacity-60">Awaiting check</dt><dd className="font-bold">{money(x.pending, f.currency)}</dd></div><div><dt className="opacity-60">Balance</dt><dd className="font-bold">{money(x.balance, f.currency)}</dd></div></dl>
          {Number(f.discount) > 0 && <p className="text-sm mt-1 opacity-70">Includes discount of {money(f.discount, f.currency)}</p>}
          {x.balance > 0 && !!methods?.length && <PayForm feeId={f.id} balance={x.balance} methods={methods.map(m => ({ id: m.id, title: m.title }))} />}
          {mine.length > 0 && <ul className="mt-3 text-sm divide-y divide-[var(--line)]">{mine.map(p => <li key={p.id} className="py-2 flex flex-wrap gap-x-4"><span>{money(p.amount, f.currency)}</span><span>{p.paid_on}</span><b>{p.status === 'approved' ? 'Verified' : p.status === 'pending' ? 'Pending' : 'Rejected'}</b>{p.source === 'manual' && <span className="opacity-60">recorded by academy</span>}
            {p.receipt_no && <span className="font-mono">Receipt {p.receipt_no} <CopyButton value={p.receipt_no} /></span>}{p.status === 'rejected' && p.review_note && <span className="text-red-600">{p.review_note}</span>}</li>)}</ul>}</section>); })}</div></>);
  }}</StudentShell>);
}
