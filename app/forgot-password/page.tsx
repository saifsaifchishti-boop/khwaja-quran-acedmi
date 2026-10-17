'use client';
import { useActionState } from 'react';
import { requestReset } from '@/app/login/actions';
export default function Page() {
  const [st, act, p] = useActionState(requestReset, {});
  return (<main className="max-w-md mx-auto px-4 py-12"><form action={act} className="card p-6 space-y-4"><h1 className="text-2xl font-bold">Reset password</h1>
    <div><label className="lbl" htmlFor="email">Email</label><input id="email" name="email" type="email" required className="inp" dir="ltr" /></div>
    {st.error && <p role="status" className="text-sm">{st.error}</p>}<button disabled={p} className="btn w-full">Send link</button></form></main>);
}
