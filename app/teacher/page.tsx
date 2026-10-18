import Link from 'next/link';
import TeacherShell from '@/components/TeacherShell';
import Roster from '@/components/teams/Roster';
import { loadPeople } from '@/lib/chat-data';
import { fmtDT } from '@/lib/fmt';
export const dynamic = 'force-dynamic';
export default function Page() {
  return (<TeacherShell>{async ({ sb, user }) => {
    const { data: t } = await sb.from('teachers').select('*').eq('user_id', user.id).single();
    const { data: asg } = await sb.from('teacher_assignments').select('student_id, students(id,user_id,full_name,student_code,timezone,courses(title_en))').eq('active', true);
    const { data: next } = await sb.from('class_sessions').select('id,starts_at,status,students(full_name)').eq('status', 'scheduled').gte('ends_at', new Date().toISOString()).order('starts_at').limit(6);
    const ppl = await loadPeople((asg ?? []).map((a: any) => a.students?.user_id).filter(Boolean));
    const students = (asg ?? []).map((a: any) => { const s = a.students; const p = s?.user_id ? ppl[s.user_id] : undefined;
      return { studentId: a.student_id as string, userId: (s?.user_id ?? null) as string | null, name: (s?.full_name ?? 'Student') as string, code: (s?.student_code ?? '') as string, course: (s?.courses?.title_en ?? 'No course') as string, tz: (s?.timezone ?? '') as string, has: !!p?.has, v: p?.v ?? null }; });
    return (<><h1 className="text-2xl font-bold">{t?.full_name} <span className="font-mono text-base opacity-70">{t?.teacher_code}</span></h1>
      <h2 className="font-bold mt-6 mb-3">My students ({students.length})</h2><Roster students={students} />
      <h2 className="font-bold mt-8 mb-2">Upcoming classes (your time zone: {t?.timezone})</h2>
      <ul className="card divide-y divide-[var(--line)]">{(next ?? []).length === 0 && <li className="p-3 opacity-70">Nothing is scheduled.</li>}{(next ?? []).map((c: any) => (
        <li key={c.id} className="p-3 flex justify-between gap-2 flex-wrap items-center"><span>{fmtDT(c.starts_at, t?.timezone)} — {c.students?.full_name}</span><Link href={`/class/${c.id}`} className="btn btn-sm">Open class</Link></li>))}</ul></>);
  }}</TeacherShell>);
}
