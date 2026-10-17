import Link from 'next/link';
import TeacherShell from '@/components/TeacherShell';
import { fmtDT } from '@/lib/fmt';
export const dynamic = 'force-dynamic';
export default function Page() {
  return (<TeacherShell>{async ({ sb, user }) => {
    const { data: t } = await sb.from('teachers').select('*').eq('user_id', user.id).single();
    const { data: asg } = await sb.from('teacher_assignments').select('student_id, students(id,full_name,student_code,timezone,courses(title_en))').eq('active', true);
    const { data: next } = await sb.from('class_sessions').select('id,starts_at,status,students(full_name)').eq('status', 'scheduled').gte('ends_at', new Date().toISOString()).order('starts_at').limit(6);
    return (<><h1 className="text-2xl font-bold">{t?.full_name} <span className="font-mono text-base opacity-70">{t?.teacher_code}</span></h1>
      <h2 className="font-bold mt-6 mb-2">My students ({asg?.length ?? 0})</h2>
      <div className="grid sm:grid-cols-2 gap-3">{(asg ?? []).length === 0 && <p className="opacity-70">No students assigned yet.</p>}{(asg ?? []).map((a: any) => (
        <Link key={a.student_id} href={`/teacher/students/${a.student_id}`} className="card p-4 block"><b>{a.students?.full_name}</b> <span className="font-mono text-sm opacity-70">{a.students?.student_code}</span>
          <div className="text-sm opacity-70">{a.students?.courses?.title_en ?? '—'} · {a.students?.timezone}</div></Link>))}</div>
      <h2 className="font-bold mt-6 mb-2">Upcoming classes (your time zone: {t?.timezone})</h2>
      <ul className="card divide-y divide-[var(--line)]">{(next ?? []).length === 0 && <li className="p-3 opacity-70">Nothing scheduled.</li>}{(next ?? []).map((c: any) => (
        <li key={c.id} className="p-3 flex justify-between gap-2 flex-wrap"><span>{fmtDT(c.starts_at, t?.timezone)} — {c.students?.full_name}</span><Link href={`/class/${c.id}`} className="btn btn-sm">Open class</Link></li>))}</ul></>);
  }}</TeacherShell>);
}
