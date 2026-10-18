import Link from 'next/link';
import StudentShell from '@/components/StudentShell';
import CopyButton from '@/components/CopyButton';
import { feeSummary, money } from '@/lib/fees';
import { fmtDT } from '@/lib/fmt';
export const dynamic = 'force-dynamic';
export default function Page() {
  return (<StudentShell>{async ({ sb, user }) => {
    const { data: s } = await sb.from('students').select('*, courses(title_en,title_ur)').eq('user_id', user.id).single(); // RLS restricts to own row
    const { data: fees } = await sb.from('fees').select('*'); const { data: pays } = await sb.from('payments').select('fee_id,amount,status');
    const { data: next } = await sb.from('class_sessions').select('id,starts_at,status,teachers(full_name)').eq('status', 'scheduled').gte('ends_at', new Date().toISOString()).order('starts_at').limit(3);
    let due = 0; (fees ?? []).forEach(f => { due += feeSummary(f, pays ?? []).balance; });
    return (<><h1 className="text-2xl font-bold">{s?.full_name}</h1>
      <section className="card p-4 mt-4 border-s-4 border-[var(--gold)]"><h2 className="font-bold">Your online classes</h2>
        {(next ?? []).length === 0 ? <p className="mt-2 text-sm opacity-80">No class is scheduled yet. The academy arranges your class time and it will appear here.</p> :
          <ul className="mt-2 divide-y divide-[var(--line)]">{(next ?? []).map((c: any) => (<li key={c.id} className="py-2 flex flex-wrap items-center justify-between gap-2"><span>{fmtDT(c.starts_at, s?.timezone)}{c.teachers?.full_name ? ` — ${c.teachers.full_name}` : ''}</span><Link href={`/class/${c.id}`} className="btn btn-sm">Join class</Link></li>))}</ul>}
        <Link href="/student/timetable" className="text-sm underline mt-2 inline-block">All classes →</Link></section>
      <div className="card p-4 mt-4 grid sm:grid-cols-2 gap-3 text-sm">
        <div>Student ID: <b className="font-mono">{s?.student_code}</b> <CopyButton value={s?.student_code ?? ''} /></div><div>Email: {s?.email}</div>
        <div>Course: {(s as any)?.courses?.title_en ?? '—'}</div><div>Time zone: {s?.timezone}</div><div>Status: {s?.status}</div><div>Enrolled: {s && new Date(s.enrolled_at).toLocaleDateString()}</div></div>
      <Link href="/student/fees" className="card p-4 mt-4 block"><div className="text-sm opacity-70">Outstanding balance</div><div className="text-2xl font-bold">{money(due)}</div><div className="text-sm underline mt-1">Open fee cards →</div></Link></>);
  }}</StudentShell>);
}
