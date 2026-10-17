import Link from 'next/link';
import StudentShell from '@/components/StudentShell';
import { fmtDT, DAYS } from '@/lib/fmt';
export const dynamic = 'force-dynamic';
export default function Page() {
  return (<StudentShell>{async ({ sb, user }) => {
    const { data: me } = await sb.from('students').select('timezone').eq('user_id', user.id).single(); const tz = me?.timezone ?? 'UTC';
    const { data: ses } = await sb.from('class_sessions').select('id,starts_at,ends_at,status,teachers(full_name)').neq('status', 'cancelled').gte('ends_at', new Date().toISOString()).order('starts_at').limit(40);
    const { data: sch } = await sb.from('class_schedules').select('weekday,start_time,duration_min,tz,active,teachers(full_name)').eq('active', true);
    return (<><h1 className="text-2xl font-bold">Timetable</h1><p className="text-sm opacity-70 mb-3">Times are shown in your time zone: <b>{tz}</b> (change it in Profile).</p>
      <ul className="card divide-y divide-[var(--line)]">{(ses ?? []).length === 0 && <li className="p-3 opacity-70">No upcoming classes scheduled.</li>}{(ses ?? []).map((c: any) => (
        <li key={c.id} className="p-3 flex flex-wrap justify-between gap-2"><span>{fmtDT(c.starts_at, tz)} — {c.teachers?.full_name}</span><Link href={`/class/${c.id}`} className="btn btn-sm">Join / details</Link></li>))}</ul>
      {(sch ?? []).length > 0 && <p className="text-sm opacity-70 mt-4">Weekly pattern: {(sch ?? []).map((x: any) => `${DAYS[x.weekday]} ${String(x.start_time).slice(0, 5)} (${x.tz}), ${x.duration_min} min`).join('; ')}</p>}</>);
  }}</StudentShell>);
}
