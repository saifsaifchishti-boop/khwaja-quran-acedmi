import Link from 'next/link';
import AdminShell from '@/components/AdminShell';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { resetPassword } from '../accounts';
import CredForm from '@/components/CredForm';
import { updateStudent, setStudentStatus, issueCertificate, revokeCertificate } from '../actions2';
export const dynamic = 'force-dynamic';
const PER = 20;
export default async function Page({ searchParams }: { searchParams: Promise<{ page?: string; q?: string }> }) {
  const sp = await searchParams; const page = Math.max(1, Number(sp.page) || 1); const q = (sp.q ?? '').trim().replace(/[%,()]/g, '');
  const db = supabaseAdmin(); let qb = db.from('students').select('*, courses(title_en), certificates(id,code,title,revoked)', { count: 'exact' });
  if (q) qb = qb.or(`full_name.ilike.%${q}%,email.ilike.%${q}%,student_code.ilike.%${q}%`);
  const { data, count } = await qb.order('enrolled_at', { ascending: false }).range((page - 1) * PER, page * PER - 1); const { data: courses } = await db.from('courses').select('id,title_en').order('title_en'); const pages = Math.max(1, Math.ceil((count ?? 0) / PER));
  return (<AdminShell><h1 className="text-2xl font-bold mb-4">Students ({count ?? 0})</h1>
    <form className="flex gap-2 mb-4"><input name="q" defaultValue={q} placeholder="Search name, email or ID" className="inp" /><button className="btn">Search</button></form>
    <div className="space-y-3">{(data ?? []).map((s: any) => (<details key={s.id} className="card p-3"><summary className="cursor-pointer"><b>{s.full_name}</b> <span className="font-mono text-sm">{s.student_code}</span> · {s.email} · <b className={s.status === 'active' ? 'text-green-700' : 'text-red-600'}>{s.status}</b></summary>
      <form action={updateStudent} className="grid sm:grid-cols-4 gap-3 mt-3"><input type="hidden" name="id" value={s.id} /><div><label className="lbl">Name</label><input name="full_name" defaultValue={s.full_name} className="inp" /></div>
        <div><label className="lbl">WhatsApp</label><input name="whatsapp" defaultValue={s.whatsapp ?? ''} className="inp" dir="ltr" /></div><div><label className="lbl">Time zone</label><input name="timezone" defaultValue={s.timezone} className="inp" dir="ltr" /></div>
        <div><label className="lbl">Course</label><select name="course_id" defaultValue={s.course_id ?? ''} className="inp"><option value="">—</option>{(courses ?? []).map(c => <option key={c.id} value={c.id}>{c.title_en}</option>)}</select></div><button className="btn btn-sm sm:col-span-4">Save</button></form>
      <form className="flex gap-2 mt-3"><input type="hidden" name="id" value={s.id} />{s.status === 'active' ? <button formAction={setStudentStatus.bind(null, 'suspended')} className="btn btn-sm btn-red">Suspend</button> : <button formAction={setStudentStatus.bind(null, 'active')} className="btn btn-sm">Reactivate</button>}{s.status !== 'inactive' && <button formAction={setStudentStatus.bind(null, 'inactive')} className="btn btn-sm btn-ghost">Mark inactive</button>}</form>
      <h3 className="font-semibold mt-4 text-sm">Reset password</h3><CredForm action={resetPassword} btn="Set new password" className="space-y-2 mt-1"><input type="hidden" name="kind" value="student" /><input type="hidden" name="id" value={s.id} /></CredForm>
      <h3 className="font-semibold mt-4 text-sm">Certificates</h3><ul className="text-sm">{(s.certificates ?? []).map((c: any) => <li key={c.id} className="flex gap-2 items-center">{c.title} <span className="font-mono">{c.code}</span>{c.revoked ? <i>revoked</i> : <form action={revokeCertificate}><input type="hidden" name="id" value={c.id} /><button className="underline text-red-600">revoke</button></form>}</li>)}</ul>
      <form action={issueCertificate} className="flex flex-wrap gap-2 mt-2"><input type="hidden" name="student_id" value={s.id} /><input name="title" required placeholder="Certificate title" className="inp flex-1 min-w-48" /><input name="issued_on" type="date" className="inp !w-auto" /><button className="btn btn-sm btn-gold">Issue</button></form></details>))}</div>
    <div className="flex gap-2 mt-4 items-center">{page > 1 && <Link className="btn btn-sm btn-ghost" href={`?page=${page - 1}&q=${q}`}>← Prev</Link>}<span className="text-sm">Page {page} / {pages}</span>{page < pages && <Link className="btn btn-sm btn-ghost" href={`?page=${page + 1}&q=${q}`}>Next →</Link>}</div></AdminShell>);
}
