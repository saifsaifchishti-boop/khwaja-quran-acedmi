import Link from 'next/link';
import Image from 'next/image';
import { getLang, t } from '@/lib/i18n';
import { toggleLang } from '@/lib/actions-lang';
import MenuDots from './MenuDots';
export default async function Header() {
  const l = await getLang(); const d = t(l);
  const items = [
    { href: '/', label: d.home }, { href: '/courses', label: d.courses }, { href: '/register', label: d.register },
    { href: '/login', label: d.studentLogin }, { href: '/teach', label: d.teacherApply }, { href: '/teacher/login', label: d.teacherLogin }, { href: '/#contact', label: d.contact },
    { href: '/#contact', label: d.help }, { href: '/admin/login', label: d.adminLogin },
  ];
  return (
    <header className="card rounded-none border-x-0 border-t-0 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 px-4 py-2">
        <Link href="/" className="flex items-center gap-2 font-bold text-emerald dark:text-gold">
          <Image src="/logo.svg" alt="" width={44} height={44} /><span className="hidden sm:inline">{d.brand}</span>
        </Link>
        <nav className="hidden md:flex items-center gap-4 text-sm">
          <Link href="/courses">{d.courses}</Link><Link href="/#contact">{d.contact}</Link>
          <Link href="/login" className="btn btn-ghost btn-sm">{d.studentLogin}</Link>
          <Link href="/register" className="btn btn-sm">{d.register}</Link>
        </nav>
        <div className="flex items-center gap-2">
          <form action={toggleLang}><button className="btn btn-gold btn-sm" aria-label="Language">{l === 'ur' ? 'English' : 'اردو'}</button></form>
          <MenuDots items={items} label={d.menu} lightLabel={d.light} darkLabel={d.dark} langLabel={d.language} langAction={toggleLang} />
        </div>
      </div>
    </header>);
}
