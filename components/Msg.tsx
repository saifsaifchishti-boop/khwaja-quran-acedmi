'use client';
import { useActionState } from 'react';
import type { R } from '@/app/student/actions2';
// Generic small form wrapper for useActionState actions returning {ok?,error?}
export default function AForm({ action, children, okText = 'Saved.', className = 'card p-4 space-y-3' }: { action: (s: R, fd: FormData) => Promise<R>; children: React.ReactNode; okText?: string; className?: string }) {
  const [st, act, pending] = useActionState(action, {});
  return (<form action={act} className={className}>{children}{st.error && <p role="alert" className="text-red-600 text-sm">{st.error}</p>}{st.ok && <p role="status" className="text-green-700 text-sm">{okText}</p>}
    <button disabled={pending} className="btn btn-sm">{pending ? '…' : 'Submit'}</button></form>);
}
