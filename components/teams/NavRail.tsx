'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from './Icons';
import { useRt } from './Runtime';
import type { NavItem } from './nav';
// Teams-style app bar: icon with a small label, the current page is clearly highlighted (filled pill + gold bar).
export default function NavRail({ items }: { items: NavItem[] }) {
  const path = usePathname(); const { unread } = useRt();
  const isActive = (h: string) => path === h || (h.split('/').length > 2 && path.startsWith(h + '/'));
  return (<nav aria-label="Main" className="shrink-0 bg-[#073624] text-white flex md:flex-col md:w-[78px] w-full overflow-x-auto md:overflow-y-auto md:overflow-x-hidden md:py-2 border-t md:border-t-0 border-white/10">
    {items.map(i => { const on = isActive(i.href); return (
      <Link key={i.href} href={i.href} aria-current={on ? 'page' : undefined} title={i.label}
        className={`relative flex flex-col items-center justify-center gap-1 shrink-0 w-[74px] md:w-full py-2.5 text-[11px] leading-none transition-colors ${on ? 'bg-white/15 text-white font-semibold' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
        {on && <span className="absolute md:start-0 md:top-2 md:bottom-2 md:w-[3px] md:h-auto start-3 end-3 bottom-0 h-[3px] rounded bg-[var(--gold)]" />}
        <span className="relative"><Icon n={i.icon} size={22} fill={on && (i.icon === 'chat' || i.icon === 'home')} />
          {i.icon === 'chat' && unread > 0 && <span className="absolute -top-2 -end-3 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">{unread > 99 ? '99+' : unread}</span>}</span>
        <span className="truncate max-w-full px-1">{i.label}</span></Link>); })}
  </nav>);
}
