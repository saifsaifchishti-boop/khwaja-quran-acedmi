import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { logout } from '@/app/login/actions';
import { getLang, t } from '@/lib/i18n';
export default async function StudentShell({ children }: { children: (ctx: Awaited<ReturnType<typeof requireRole>>) => Promise<React.ReactNode> | React.ReactNode }) {
  const ctx = await requireRole('student'); const d = t(await getLang());
  return (<div className="max-w-5xl mx-auto px-4 py-6"><nav className="flex gap-2 mb-6 flex-wrap"><Link href="/student" className="btn btn-ghost btn-sm">{d.home}</Link>{[['/student/timetable','Timetable'],['/student/attendance','Attendance'],['/student/homework','Homework'],['/student/materials','Materials'],['/student/feedback','Feedback'],['/student/chat','Chat'],['/student/certificates','Certificates'],['/student/fees','Fees'],['/student/profile','Profile'],['/student/support','Support']].map(([h,l])=><Link key={h} href={h} className="btn btn-ghost btn-sm">{l}</Link>)}
    <form action={logout} className="ms-auto"><button className="btn btn-sm btn-red">{d.logout}</button></form></nav>{await children(ctx)}</div>);
}
