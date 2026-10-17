import StudentShell from '@/components/StudentShell';
import { fmtDT } from '@/lib/fmt';
export const dynamic = 'force-dynamic';
export default function Page() {
  return (<StudentShell>{async ({ sb, user }) => {
    const { data: me } = await sb.from('students').select('timezone').eq('user_id', user.id).single();
    const { data } = await sb.from('attendance').select('status,note,class_sessions(starts_at)').order('marked_at', { ascending: false }).limit(100);
    const c = (k: string) => (data ?? []).filter(a => a.status === k).length;
    return (<><h1 className="text-2xl font-bold mb-3">Attendance</h1><p className="mb-3 text-sm">Present {c('present')} · Late {c('late')} · Absent {c('absent')} · Excused {c('excused')}</p>
      <ul className="card divide-y divide-[var(--line)] text-sm">{(data ?? []).length === 0 && <li className="p-3 opacity-70">No attendance recorded yet.</li>}{(data ?? []).map((a: any, i) => <li key={i} className="p-3 flex justify-between"><span>{a.class_sessions?.starts_at ? fmtDT(a.class_sessions.starts_at, me?.timezone) : ''}</span><b>{a.status}</b><span className="opacity-70">{a.note}</span></li>)}</ul></>);
  }}</StudentShell>);
}
