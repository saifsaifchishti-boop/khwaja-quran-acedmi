'use client';
import { useActionState, useTransition } from 'react';
import { adminAvatarAction, adminSetAvatar, type PhotoState } from '@/app/avatar-actions';
import Avatar from './Avatar';
export type PersonRow = { userId: string; name: string; kind: string; code: string; has: boolean; v: string | null; locked: boolean };
export default function PeopleRow({ p }: { p: PersonRow }) {
  const [st, act, pending] = useActionState<PhotoState, FormData>(adminSetAvatar, {}); const [busy, go] = useTransition();
  return (<li className="p-3 flex flex-wrap items-center gap-3"><Avatar id={p.userId} name={p.name} size={46} has={p.has} v={p.v} />
    <div className="flex-1 min-w-[160px]"><div className="font-semibold">{p.name}</div><div className="text-xs opacity-70">{p.kind} · <span className="font-mono">{p.code}</span> · {p.has ? (p.locked ? 'Photo locked' : 'Photo unlocked') : 'No photo'}</div></div>
    <form action={act} className="flex items-center gap-2"><input type="hidden" name="user_id" value={p.userId} /><input type="file" name="photo" accept="image/jpeg,image/png,image/webp" required className="text-xs max-w-[190px]" aria-label={`New photo for ${p.name}`} />
      <button disabled={pending} className="btn btn-sm">{pending ? '…' : p.has ? 'Replace' : 'Upload'}</button></form>
    {p.has && <div className="flex gap-2"><button disabled={busy} onClick={() => go(() => adminAvatarAction(p.userId, p.locked ? 'unlock' : 'lock'))} className="btn btn-ghost btn-sm">{p.locked ? 'Unlock' : 'Lock'}</button>
      <button disabled={busy} onClick={() => { if (confirm(`Remove the photo of ${p.name}?`)) go(() => adminAvatarAction(p.userId, 'remove')); }} className="btn btn-red btn-sm">Remove</button></div>}
    {st.error && <p role="alert" className="w-full text-red-600 text-sm">{st.error}</p>}{st.ok && <p className="w-full text-green-700 text-sm">Photo updated.</p>}</li>);
}
