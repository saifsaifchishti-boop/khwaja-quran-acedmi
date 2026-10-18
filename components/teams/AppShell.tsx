import Link from 'next/link';
import Image from 'next/image';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import NavRail from './NavRail';
import UserMenu from './UserMenu';
import type { NavItem } from './nav';
// Shared Microsoft-Teams-style frame: top bar, app rail on the left (bottom on phones), content on the right.
export default async function AppShell({ role, nav, ctx, children, bleed }: { role: 'admin' | 'teacher' | 'student'; nav: NavItem[]; ctx: { sb: SupabaseClient; user: User }; children: React.ReactNode; bleed?: boolean }) {
  const { sb, user } = ctx;
  const { data: p } = await sb.from('profiles').select('full_name,avatar_path').eq('id', user.id).maybeSingle();
  const name = (p?.full_name as string | null) ?? (role === 'admin' ? 'Administrator' : role === 'teacher' ? 'Teacher' : 'Student');
  const has = !!p?.avatar_path; const v = has ? String(p!.avatar_path).slice(-12) : null;
  return (<div className="h-[100dvh] flex flex-col" dir="ltr">
    <header className="h-12 shrink-0 bg-[#0A4A30] text-white flex items-center gap-3 px-3">
      <Link href={role === 'admin' ? '/admin' : role === 'teacher' ? '/teacher' : '/student'} className="flex items-center gap-2 font-semibold min-w-0"><Image src="/logo.svg" alt="" width={30} height={30} /><span className="truncate">Khwaja Quran Majeed Academy</span></Link>
      <span className="ms-auto text-xs opacity-80 capitalize hidden sm:inline">{role} portal</span><UserMenu id={user.id} name={name} role={role} has={has} v={v} /></header>
    <div className="flex flex-col-reverse md:flex-row flex-1 min-h-0">
      <NavRail items={nav} />
      <main className={`flex-1 min-w-0 min-h-0 ${bleed ? '' : 'overflow-y-auto'}`}>
        {role !== 'admin' && !has && <Link href="/account/photo" className="block bg-[var(--gold)] text-black text-sm text-center py-2 px-3 font-medium">Please add your profile photo. It becomes your permanent picture, so choose a clear one.</Link>}
        {bleed ? <div className="h-full">{children}</div> : <div className="max-w-6xl mx-auto px-4 py-6">{children}</div>}</main></div></div>);
}
