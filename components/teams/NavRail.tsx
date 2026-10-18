'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from './Icons';
import { useRt } from './Runtime';
import { PINNED, type NavItem } from './nav';
const match = (path: string, h: string) => path === h || (h.split('/').length > 2 && path.startsWith(h + '/'));
// Current page name, shown in the top bar so people always know where they are.
export function CurrentPage({ items }: { items: NavItem[] }) {
  const path = usePathname(); const cur = items.filter(i => match(path, i.href)).sort((a, b) => b.href.length - a.href.length)[0];
  return cur ? <span className="hidden sm:flex items-center gap-1 text-sm opacity-90 min-w-0"><span aria-hidden>›</span><b className="truncate">{cur.label}</b></span> : null;
}
// Teams-style side bar: a few pinned buttons, the page you are on, and a three-dot button that opens the full ordered menu.
export default function NavRail({ items }: { items: NavItem[] }) {
  const path = usePathname(); const { unread } = useRt(); const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false); window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, []);
  const cur = items.filter(i => match(path, i.href)).sort((a, b) => b.href.length - a.href.length)[0];
  const shown = items.slice(0, PINNED); if (cur && !shown.includes(cur)) shown.push(cur);
  const badge = (i: NavItem) => i.icon === 'chat' && unread > 0 && <span className="absolute -top-2 -end-3 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">{unread > 99 ? '99+' : unread}</span>;
  return (<>
    <nav aria-label="Main" className="shrink-0 bg-[#073624] text-white flex md:flex-col md:w-[78px] w-full md:py-2 border-t md:border-t-0 border-white/10 justify-around md:justify-start">
      <button onClick={() => setOpen(true)} aria-label="Open the full menu" aria-expanded={open} title="Menu" className="flex flex-col items-center justify-center gap-1 w-[74px] md:w-full py-2.5 text-[11px] leading-none text-white/80 hover:bg-white/10 hover:text-white">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden><circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" /></svg><span>Menu</span></button>
      {shown.map(i => { const on = match(path, i.href); return (
        <Link key={i.href} href={i.href} aria-current={on ? 'page' : undefined} title={i.label}
          className={`relative flex flex-col items-center justify-center gap-1 w-[74px] md:w-full py-2.5 text-[11px] leading-none transition-colors ${on ? 'bg-white/15 text-white font-semibold' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
          {on && <span className="absolute md:start-0 md:top-2 md:bottom-2 md:w-[3px] md:h-auto start-3 end-3 bottom-0 h-[3px] rounded bg-[var(--gold)]" />}
          <span className="relative"><Icon n={i.icon} size={22} fill={on && (i.icon === 'chat' || i.icon === 'home')} />{badge(i)}</span><span className="truncate max-w-full px-1">{i.label}</span></Link>); })}
    </nav>
    {open && (<div className="fixed inset-0 z-[85]" role="dialog" aria-modal="true" aria-label="Menu">
      <button aria-label="Close menu" onClick={() => setOpen(false)} className="absolute inset-0 bg-black/45" />
      <aside className="absolute inset-y-0 start-0 w-[min(86vw,320px)] bg-[#073624] text-white flex flex-col shadow-2xl" dir="ltr">
        <div className="flex items-center justify-between px-4 h-12 border-b border-white/10"><b>Menu</b><button onClick={() => setOpen(false)} aria-label="Close menu" className="p-2 rounded hover:bg-white/10"><Icon n="x" size={18} /></button></div>
        <ul className="flex-1 overflow-y-auto py-2">{items.map(i => { const on = match(path, i.href); return (
          <li key={i.href}><Link href={i.href} aria-current={on ? 'page' : undefined} className={`relative flex items-center gap-3 ps-5 pe-4 py-3 ${on ? 'bg-white/20 font-semibold' : 'hover:bg-white/10 text-white/85'}`}>
            {on && <span className="absolute start-0 top-1.5 bottom-1.5 w-1 rounded-e bg-[var(--gold)]" />}
            <span className="relative"><Icon n={i.icon} size={20} />{badge(i)}</span><span className="flex-1">{i.label}</span>{on && <span className="text-[11px] rounded-full bg-[var(--gold)] text-black px-2 py-0.5 font-semibold">You are here</span>}</Link></li>); })}</ul></aside></div>)}
  </>);
}
