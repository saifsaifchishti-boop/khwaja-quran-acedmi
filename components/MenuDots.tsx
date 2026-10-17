'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
export type MenuItem = { href: string; label: string };
export default function MenuDots({ items, label, lightLabel, darkLabel, langLabel, langAction }: {
  items: MenuItem[]; label: string; lightLabel: string; darkLabel: string; langLabel: string; langAction: (fd: FormData) => Promise<void>; }) {
  const [open, setOpen] = useState(false);
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false); window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, []);
  const theme = (m: 'light' | 'dark') => { localStorage.setItem('theme', m); document.documentElement.classList.toggle('dark', m === 'dark'); setOpen(false); };
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} aria-expanded={open} aria-label={label} className="btn btn-ghost btn-sm text-2xl leading-none">⋮</button>
      {open && (
        <div className="card absolute end-0 mt-2 w-64 p-2 z-50 shadow-lg" role="menu">
          {items.map(i => <Link key={i.href} href={i.href} role="menuitem" onClick={() => setOpen(false)} className="block px-3 py-3 rounded hover:bg-emerald-100 dark:hover:bg-emerald-600">{i.label}</Link>)}
          <form action={langAction}><button role="menuitem" className="w-full text-start px-3 py-3 rounded hover:bg-emerald-100 dark:hover:bg-emerald-600">{langLabel}</button></form>
          <button role="menuitem" onClick={() => theme('light')} className="w-full text-start px-3 py-3 rounded hover:bg-emerald-100 dark:hover:bg-emerald-600">☀ {lightLabel}</button>
          <button role="menuitem" onClick={() => theme('dark')} className="w-full text-start px-3 py-3 rounded hover:bg-emerald-100 dark:hover:bg-emerald-600">☾ {darkLabel}</button>
        </div>)}
    </div>);
}
