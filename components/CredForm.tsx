'use client';
import { useActionState } from 'react';
import CopyButton from './CopyButton';
import type { Cred } from '@/app/admin/accounts';
// Form that creates/resets a login and then shows the details ONCE so the admin can send them (WhatsApp/SMS/email).
export default function CredForm({ action, children, btn, className = 'space-y-3' }: { action: (s: Cred, fd: FormData) => Promise<Cred>; children?: React.ReactNode; btn: string; className?: string }) {
  const [st, act, pending] = useActionState(action, {});
  return (<form action={act} className={className}>{children}
    <div><label className="lbl">Password (leave empty to auto-generate)</label><input name="password" className="inp" dir="ltr" autoComplete="off" /></div>
    <label className="flex gap-2 items-center text-sm"><input type="checkbox" name="send_email" className="size-4" />Also email these login details</label>
    {st.error && <p role="alert" className="text-red-600 text-sm">{st.error}</p>}
    {st.ok && <div className="rounded-lg border-2 border-[var(--gold)] p-3 text-sm space-y-1" dir="ltr" role="status"><b>Done. Send these details now — the password is shown only once.</b>
      <p>ID: <span className="font-mono font-bold">{st.code}</span> <CopyButton value={st.code ?? ''} /></p><p>Email: <span className="font-mono">{st.email}</span></p>
      <p>Password: <span className="font-mono font-bold">{st.password}</span> <CopyButton value={st.password ?? ''} /></p>
      <p className="opacity-70">They must choose a new password at first login.{st.emailed ? ' An email was sent.' : ''}</p></div>}
    <button disabled={pending} className="btn btn-sm">{pending ? '…' : btn}</button></form>);
}
