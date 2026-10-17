'use client';
import { useActionState } from 'react';
import type { LoginState } from '@/app/login/actions';
export default function LoginForm({ action, title, idName, idLabel, idType, pwLabel, btn, extra }: {
  action: (s: LoginState, fd: FormData) => Promise<LoginState>; title: string; idName: string; idLabel: string; idType: string; pwLabel: string; btn: string; extra?: React.ReactNode; }) {
  const [st, act, pending] = useActionState(action, {});
  return (<main className="max-w-md mx-auto px-4 py-12"><form action={act} className="card p-6 space-y-4">
    <h1 className="text-2xl font-bold text-center">{title}</h1>
    <div><label className="lbl" htmlFor={idName}>{idLabel}</label><input id={idName} name={idName} type={idType} required autoComplete="username" className="inp" dir="ltr" /></div>
    <div><label className="lbl" htmlFor="password">{pwLabel}</label><input id="password" name="password" type="password" required autoComplete="current-password" className="inp" dir="ltr" /></div>
    {st.error && <p role="alert" className="text-red-600 text-sm">{st.error}</p>}
    <button disabled={pending} className="btn w-full">{pending ? '…' : btn}</button>{extra}</form></main>);
}
