import Link from 'next/link';
import StudentShell from '@/components/StudentShell';
import CopyButton from '@/components/CopyButton';
import { feeSummary, money } from '@/lib/fees';
export const dynamic = 'force-dynamic';
export default function Page() {
  return (<StudentShell>{async ({ sb, user }) => {
    const { data: s } = await sb.from('students').select('*, courses(title_en,title_ur)').eq('user_id', user.id).single(); // RLS restricts to own row
    const { data: fees } = await sb.from('fees').select('*'); const { data: pays } = await sb.from('payments').select('fee_id,amount,status');
    let due = 0; (fees ?? []).forEach(f => { due += feeSummary(f, pays ?? []).balance; });
    return (<><h1 className="text-2xl font-bold">{s?.full_name}</h1>
      <div className="card p-4 mt-4 grid sm:grid-cols-2 gap-3 text-sm">
        <div>Student ID: <b className="font-mono">{s?.student_code}</b> <CopyButton value={s?.student_code ?? ''} /></div><div>Email: {s?.email}</div>
        <div>Course: {(s as any)?.courses?.title_en ?? '—'}</div><div>Time zone: {s?.timezone}</div><div>Status: {s?.status}</div><div>Enrolled: {s && new Date(s.enrolled_at).toLocaleDateString()}</div></div>
      <Link href="/student/fees" className="card p-4 mt-4 block"><div className="text-sm opacity-70">Outstanding balance</div><div className="text-2xl font-bold">{money(due)}</div><div className="text-sm underline mt-1">Open fee cards →</div></Link>
      <p className="mt-6 text-sm opacity-70">Timetable, attendance, homework and materials arrive in the next build stage.</p></>);
  }}</StudentShell>);
}
