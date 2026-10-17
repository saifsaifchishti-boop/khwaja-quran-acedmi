import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { logout } from '@/app/login/actions';
const NAV: [string, string][] = [['/admin', 'Dashboard'], ['/admin/applications', 'Applications'], ['/admin/students', 'Students'], ['/admin/teachers', 'Teachers'], ['/admin/classes', 'Classes'], ['/admin/courses', 'Courses'], ['/admin/fees', 'Fee cards'], ['/admin/payments', 'Payments'], ['/admin/marquee', 'Marquee'], ['/admin/emails', 'Emails'], ['/admin/pages', 'Policies'], ['/admin/inbox', 'Inbox'], ['/admin/reports', 'Reports'], ['/admin/audit', 'Audit'], ['/admin/security', 'Security'], ['/admin/settings', 'Settings']];
export default async function AdminShell({ children, skipMfa }: { children: React.ReactNode; skipMfa?: boolean }) {
  await requireRole('admin', { skipMfa }); // server-side check on every admin page
  return (<div className="max-w-6xl mx-auto px-4 py-6" dir="ltr"><nav className="flex flex-wrap gap-2 items-center mb-6">
    {NAV.map(([h, l]) => <Link key={h} href={h} className="btn btn-ghost btn-sm">{l}</Link>)}
    <form action={logout} className="ms-auto"><button className="btn btn-sm btn-red">Log out</button></form></nav>{children}</div>);
}
