import Link from 'next/link';
import Image from 'next/image';
import { getLang, t } from '@/lib/i18n';
import { toggleLang } from '@/lib/actions-lang';
import MenuDots from './MenuDots';
import PublicNav from './PublicNav';
import Icon from './teams/Icons';
export default async function Header() {
  const l = await getLang(); const d = t(l); const L = (en: string, ur: string) => (l === 'ur' ? ur : en);
  const nav = [
    { href: '/', label: d.home, icon: 'home' as const }, { href: '/courses', label: d.courses, icon: 'book' as const }, { href: '/#teachers', label: L('Teachers', 'اساتذہ'), icon: 'users' as const },
    { href: '/demo', label: L('Free Demo', 'مفت ڈیمو'), icon: 'video' as const }, { href: '/#about', label: L('About Us', 'ہمارے بارے میں'), icon: 'info' as const }, { href: '/#contact', label: d.contact, icon: 'mail' as const },
  ];
  const items = [
    { href: '/', label: d.home }, { href: '/register', label: L('Admission', 'داخلہ') }, { href: '/demo', label: L('Free Demo Class', 'مفت ڈیمو کلاس') }, { href: '/#admission', label: L('Admission information', 'داخلے کی معلومات') }, { href: '/courses', label: d.courses },
    { href: '/login', label: d.studentLogin }, { href: '/teach', label: d.teacherApply }, { href: '/teacher/login', label: d.teacherLogin }, { href: '/#policies', label: L('Policies', 'پالیسیاں') },
    { href: '/#contact', label: d.contact }, { href: '/admin/login', label: d.adminLogin },
  ];
  return (
    <header className="bg-[var(--card)] border-b border-[var(--line)] sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex items-center gap-4 px-4 py-2.5" dir="ltr">
        <Link href="/" className="flex items-center gap-3 shrink-0" aria-label={d.brand}>
          <Image src="/logo.svg" alt="" width={64} height={64} priority />
          <span className="hidden sm:block leading-none">
            <span className="block font-serif text-[26px] font-bold text-[#0A4A30] dark:text-gold">Khwaja Quran</span>
            <span className="flex items-center gap-2 mt-1 text-[#0A4A30] dark:text-gold"><span className="h-px w-5 bg-current opacity-60" /><span className="text-[13px] tracking-[0.4em] font-semibold">ACADEMY</span><span className="h-px w-5 bg-current opacity-60" /></span>
            <span className="block mt-1 text-[9px] tracking-[0.3em] opacity-70">ONLINE QURAN TEACHING</span></span></Link>
        <PublicNav items={nav} />
        <div className="flex items-center gap-2 ms-auto lg:ms-0">
          <Link href="/login" className="btn btn-ghost !min-h-[46px] hidden sm:inline-flex">{L('Login', 'لاگ اِن')}</Link>
          <Link href="/register" className="btn !min-h-[46px] gap-2"><Icon n="user" size={18} /><span>{L('Register Now', 'رجسٹر کریں')}</span></Link>
          <MenuDots items={items} label={d.menu} lightLabel={d.light} darkLabel={d.dark} langLabel={d.language} langAction={toggleLang} />
        </div>
      </div>
    </header>);
}
