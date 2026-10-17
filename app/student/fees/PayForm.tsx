'use client';
import { useActionState } from 'react';
import { submitPayment, type PayState } from '../actions';
export default function PayForm({ feeId, balance, methods }: { feeId: string; balance: number; methods: { id: string; title: string }[] }) {
  const [st, act, p] = useActionState<PayState, FormData>(submitPayment, {});
  return (<details className="mt-3"><summary className="btn btn-sm cursor-pointer inline-flex">I have paid — submit details</summary>
    <form action={act} className="mt-3 grid sm:grid-cols-2 gap-3"><input type="hidden" name="fee_id" value={feeId} />
      <div><label className="lbl">Method used</label><select name="method_id" required className="inp">{methods.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}</select></div>
      <div><label className="lbl">Amount sent</label><input name="amount" type="number" step="0.01" min="1" defaultValue={balance} required className="inp" /></div>
      <div><label className="lbl">Transaction number / reference</label><input name="txn_ref" required minLength={3} className="inp" dir="ltr" /></div>
      <div><label className="lbl">Payment date</label><input name="paid_on" type="date" className="inp" /></div>
      <div className="sm:col-span-2"><label className="lbl">Screenshot / receipt (JPG, PNG, PDF, max 3 MB)</label><input name="proof" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="inp" /></div>
      {st.error && <p role="alert" className="text-red-600 text-sm sm:col-span-2">{st.error}</p>}{st.ok && <p role="status" className="text-emerald dark:text-gold font-semibold sm:col-span-2">Submitted. The academy will verify it.</p>}
      <button disabled={p} className="btn sm:col-span-2">{p ? '…' : 'Submit for verification'}</button></form></details>);
}
