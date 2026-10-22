'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon, { type IconName } from './teams/Icons';
export default function PublicNav({ items }: { items: { href: string; label: string; icon: IconName }[] }) {
  const p = usePathname() ?? '/';
  return (<nav aria-label="Main" className="hidden lg:flex items-center gap-7 mx-auto">{items.map(i => {
    const on = i.href === '/' ? p === '/' : i.href.includes('#') ? false : p.startsWith(i.href);
    return (<Link key={i.href} href={i.href} aria-current={on ? 'page' : undefined} className={`flex items-center gap-2 py-2 border-b-2 text-[15px] font-medium transition-colors ${on ? 'border-[var(--brand)] text-[var(--brand)]' : 'border-transparent hover:text-[var(--brand)]'}`}><Icon n={i.icon} size={18} />{i.label}</Link>);
  })}</nav>);
}
