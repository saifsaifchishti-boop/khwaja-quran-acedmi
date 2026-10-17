'use client';
import { useActionState } from 'react';
import { setNewPassword } from '../actions';
export default function Page() {
  const [st, act, pending] = useActionState(setNewPassword, {});
  return (<main className="max-w-md mx-auto px-4 py-12"><form action={act} className="card p-6 space-y-4"><h1 className="text-2xl font-bold">Choose your new password / نیا پاسورڈ منتخب کریں</h1>
    <p className="text-sm opacity-80">For your safety, please replace the temporary password the academy gave you.</p>
    <div><label className="lbl" htmlFor="password">New password (10+ characters)</label><input id="password" name="password" type="password" minLength={10} required autoComplete="new-password" className="inp" dir="ltr" /></div>
    <div><label className="lbl" htmlFor="confirm">Confirm</label><input id="confirm" name="confirm" type="password" required autoComplete="new-password" className="inp" dir="ltr" /></div>
    {st.error && <p role="alert" className="text-red-600 text-sm">{st.error}</p>}<button disabled={pending} className="btn w-full">Save and continue</button></form></main>);
}
