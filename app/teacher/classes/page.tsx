import Link from 'next/link';
import TeacherShell from '@/components/TeacherShell';
import { fmtDT } from '@/lib/fmt';
import { markAttendance, completeSession } from '../actions';
export const dynamic = 'force-dynamic';
export default function Page() {
  return (<TeacherShell>{async ({ sb, user }) => {
    const { data: t } = await sb.from('teachers').select('timezone').eq('user_id', user.id).single();
    const from = new Date(Date.now() - 14 * 86400000).toISOString();
    const { data: ses } = await sb.from('class_sessions').select('*, students(full_name), attendance(status)').gte('starts_at', from).order('starts_at').limit(120);
    return (<><h1 className="text-2xl font-bold mb-4">Classes</h1><div className="space-y-3">{(ses ?? []).map((c: any) => (
      <div key={c.id} className="card p-4 flex flex-wrap gap-3 items-center justify-between"><div><b>{c.students?.full_name}</b><div className="text-sm opacity-70">{fmtDT(c.starts_at, t?.timezone)} · {c.status}{c.attendance?.[0] ? ` · ${c.attendance[0].status}` : ''}</div></div>
        <div className="flex gap-2 flex-wrap items-center">
          <form action={markAttendance} className="flex gap-1"><input type="hidden" name="session_id" value={c.id} />
            <select name="status" defaultValue={c.attendance?.[0]?.status ?? 'present'} className="inp !min-h-9 !w-28">{['present', 'absent', 'late', 'excused'].map(x => <option key={x}>{x}</option>)}</select><button className="btn btn-sm btn-ghost">Mark</button></form>
          {c.status === 'scheduled' && <><Link href={`/class/${c.id}`} className="btn btn-sm">Open class</Link>
            <form action={completeSession}><input type="hidden" name="session_id" value={c.id} /><button className="btn btn-sm btn-gold">Complete</button></form></>}</div></div>))}</div></>);
  }}</TeacherShell>);
}
