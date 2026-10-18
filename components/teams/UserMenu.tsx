'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { logout } from '@/app/login/actions';
import Avatar from './Avatar';
import Icon from './Icons';
export default function UserMenu({ id, name, role, code, has, v }: { id: string; name: string; role: string; code?: string | null; has: boolean; v?: string | null }) {
  const [open, setOpen] = useState(false); const box = useRef<HTMLDivElement>(null);
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false); const c = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); }; window.addEventListener('keydown', k); window.addEventListener('mousedown', c); return () => { window.removeEventListener('keydown', k); window.removeEventListener('mousedown', c); }; }, []);
  const theme = (m: 'light' | 'dark') => { localStorage.setItem('theme', m); document.documentElement.classList.toggle('dark', m === 'dark'); setOpen(false); };
  const item = 'flex items-center gap-3 w-full text-start px-3 py-2.5 rounded hover:bg-emerald-100 dark:hover:bg-emerald-600';
  return (<div className="relative" ref={box}>
    <button onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Account menu" className="rounded-full focus-visible:outline"><Avatar id={id} name={name} size={34} has={has} v={v} /></button>
    {open && (<div role="menu" className="card absolute end-0 mt-2 w-72 p-2 z-[80] shadow-xl text-[var(--fg)]">
      <div className="flex items-center gap-3 p-3 border-b border-[var(--line)] mb-1"><Avatar id={id} name={name} size={44} has={has} v={v} /><div className="min-w-0"><div className="font-semibold truncate">{name}</div><div className="text-xs opacity-70 capitalize">{role}{code ? ` · ${code}` : ''}</div></div></div>
      <Link href="/account/photo" role="menuitem" onClick={() => setOpen(false)} className={item}><Icon n="camera" size={18} />My profile photo</Link>
      <Link href="/account/password" role="menuitem" onClick={() => setOpen(false)} className={item}><Icon n="lock" size={18} />Change password</Link>
      <button role="menuitem" onClick={() => theme('light')} className={item}><Icon n="sun" size={18} />Light theme</button>
      <button role="menuitem" onClick={() => theme('dark')} className={item}><Icon n="moon" size={18} />Dark theme</button>
      <form action={logout}><button role="menuitem" className={`${item} text-red-700 dark:text-red-400`}><Icon n="logout" size={18} />Sign out</button></form></div>)}
  </div>);
}
