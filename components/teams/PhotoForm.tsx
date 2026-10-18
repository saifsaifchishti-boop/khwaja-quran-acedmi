'use client';
import { useActionState, useState } from 'react';
import { setMyAvatar, type PhotoState } from '@/app/avatar-actions';
import Avatar from './Avatar';
export default function PhotoForm({ id, name, has, v, locked, home }: { id: string; name: string; has: boolean; v: string | null; locked: boolean; home: string }) {
  const [st, act, pending] = useActionState<PhotoState, FormData>(setMyAvatar, {}); const [prev, setPrev] = useState<string | null>(null);
  return (<main className="max-w-md mx-auto px-4 py-10"><div className="card p-6 space-y-4 text-center"><h1 className="text-2xl font-bold">My profile photo</h1>
    <div className="flex justify-center">{prev ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={prev} alt="Preview" className="rounded-full object-cover" width={120} height={120} style={{ width: 120, height: 120 }} /> : <Avatar id={id} name={name} size={120} has={has} v={v} />}</div>
    {st.ok ? (<><p className="text-green-700 font-semibold">Your photo has been saved and locked.</p><a href={home} className="btn w-full">Continue</a></>)
      : locked ? (<><p>Your photo is locked. To change it, please contact the administrator.</p><a href={home} className="btn w-full">Back</a></>)
      : (<form action={act} className="space-y-3 text-start"><p className="text-sm opacity-80">Choose a clear, recent photo of your face. <b>Once saved, your photo is permanent</b> and can only be changed by the administrator.</p>
        <input type="file" name="photo" accept="image/jpeg,image/png,image/webp" required className="inp" onChange={e => { const f = e.target.files?.[0]; setPrev(f ? URL.createObjectURL(f) : null); }} />
        {st.error && <p role="alert" className="text-red-600 text-sm">{st.error}</p>}<button disabled={pending} className="btn w-full">{pending ? 'Saving…' : 'Save my photo'}</button><a href={home} className="block text-center text-sm underline">Not now</a></form>)}
  </div></main>);
}
