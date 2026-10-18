import Link from 'next/link';
import Image from 'next/image';
import { getLang, t } from '@/lib/i18n';
import { toggleLang } from '@/lib/actions-lang';
import MenuDots from './MenuDots';
export default async function Header() {
  const l = await getLang(); const d = t(l); const L = (en: string, ur: string) => (l === 'ur' ? ur : en);
  const items = [
    { href: '/', label: d.home }, { href: '/register', label: L('Admission', 'داخلہ') }, { href: '/#admission', label: L('Admission information', 'داخلے کی معلومات') }, { href: '/courses', label: d.courses },
    { href: '/login', label: d.studentLogin }, { href: '/teach', label: d.teacherApply }, { href: '/teacher/login', label: d.teacherLogin }, { href: '/#policies', label: L('Policies', 'پالیسیاں') },
    { href: '/#contact', label: d.contact }, { href: '/admin/login', label: d.adminLogin },
  ];
  return (
    <header className="card rounded-none border-x-0 border-t-0 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto flex items-center gap-3 px-4 py-2">
        <Link href="/" className="flex items-center gap-2 font-bold text-emerald dark:text-gold shrink-0">
          <Image src="/logo.svg" alt="" width={44} height={44} /><span className="hidden lg:inline">{d.brand}</span></Link>
        <Link href="/register" className="btn btn-gold btn-sm !px-4 font-bold">{L('Admission', 'داخلہ')}</Link>
        <nav className="hidden md:flex items-center gap-4 text-sm flex-1">
          <Link href="/#admission">{L('Admission info', 'داخلے کی معلومات')}</Link><Link href="/courses">{d.courses}</Link><Link href="/#policies">{L('Policies', 'پالیسیاں')}</Link><Link href="/#contact">{d.contact}</Link>
          <span className="flex-1" />
          <Link href="/login" className="btn btn-ghost btn-sm">{d.studentLogin}</Link><Link href="/teacher/login" className="btn btn-ghost btn-sm">{d.teacherLogin}</Link>
        </nav>
        <div className="flex items-center gap-3 ms-auto md:ms-6">
          <MenuDots items={items} label={d.menu} lightLabel={d.light} darkLabel={d.dark} langLabel={d.language} langAction={toggleLang} />
          <form action={toggleLang}><button className="btn btn-ghost btn-sm !text-xs" aria-label="Language">{l === 'ur' ? 'English' : 'اردو'}</button></form>
        </div>
      </div>
    </header>);
}
