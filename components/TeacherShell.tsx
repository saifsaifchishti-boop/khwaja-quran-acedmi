import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { logout } from '@/app/login/actions';
const NAV: [string, string][] = [['/teacher', 'Home'], ['/teacher/classes', 'Classes'], ['/teacher/chat', 'Chat'], ['/teacher/quran', 'Quran']];
export default async function TeacherShell({ children }: { children: (ctx: Awaited<ReturnType<typeof requireRole>>) => Promise<React.ReactNode> | React.ReactNode }) {
  const ctx = await requireRole('teacher');
  return (<div className="max-w-6xl mx-auto px-4 py-6" dir="ltr"><nav className="flex flex-wrap gap-2 mb-6">{NAV.map(([h, l]) => <Link key={h} href={h} className="btn btn-ghost btn-sm">{l}</Link>)}
    <form action={logout} className="ms-auto"><button className="btn btn-sm btn-red">Log out</button></form></nav>{await children(ctx)}</div>);
}
