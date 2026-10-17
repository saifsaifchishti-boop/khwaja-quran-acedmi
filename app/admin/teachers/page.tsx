import AdminShell from '@/components/AdminShell';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { signed } from '@/lib/files';
import { createTeacherAccount, resetPassword } from '../accounts';
import CredForm from '@/components/CredForm';
import { decideTeacherApplication, setTeacherStatus, assignTeacher, unassignTeacher } from '../actions2';
export const dynamic = 'force-dynamic';
export default async function Page() {
  const db = supabaseAdmin();
  const [{ data: apps }, { data: teachers }, { data: students }, { data: asg }] = await Promise.all([
    db.from('teacher_applications').select('*').in('status', ['pending', 'info_requested', 'approved']).order('created_at', { ascending: false }).limit(50),
    db.from('teachers').select('*').order('joined_at', { ascending: false }), db.from('students').select('id,full_name,student_code').eq('status', 'active').order('full_name').limit(500),
    db.from('teacher_assignments').select('id,teachers(full_name,teacher_code),students(full_name,student_code)').eq('active', true).limit(300)]);
  const { data: made } = await db.from('teachers').select('application_id'); const madeSet = new Set((made ?? []).map(m => m.application_id));
  const docs = new Map<string, (string | null)[]>(); for (const a of apps ?? []) docs.set(a.id, await Promise.all((a.doc_paths ?? []).map((p: string) => signed(p, 'teacher-docs'))));
  return (<AdminShell><h1 className="text-2xl font-bold mb-4">Teachers</h1><h2 className="font-bold mb-2">Applications</h2>
    <div className="space-y-3">{(apps ?? []).length === 0 && <p className="opacity-70">No open applications.</p>}{(apps ?? []).map(a => (
      <div key={a.id} className="card p-4 text-sm space-y-2"><div className="flex flex-wrap gap-x-4"><b>{a.full_name}</b><span className="font-mono">{a.ref}</span><span>{a.email}</span><span>{a.whatsapp}</span><span>{a.city}, {a.country} ({a.timezone})</span><b>{a.status}</b></div>
        <p><b>Qualifications:</b> {a.qualifications}</p><p>{a.experience_years ?? '?'} yrs · {a.specialties} · {a.languages} · {a.availability}</p><p>{a.bio}</p>
        <div className="flex gap-3">{(docs.get(a.id) ?? []).map((u, i) => u && <a key={i} href={u} target="_blank" rel="noopener noreferrer" className="underline">Document {i + 1}</a>)}</div>
        <form className="flex flex-wrap gap-2"><input type="hidden" name="id" value={a.id} /><input name="admin_note" defaultValue={a.admin_note ?? ''} placeholder="Note to applicant (emailed)" className="inp flex-1 min-w-48" />
          <button formAction={decideTeacherApplication.bind(null, 'approved')} className="btn btn-sm">Approve</button><button formAction={decideTeacherApplication.bind(null, 'info_requested')} className="btn btn-sm btn-ghost">Ask info</button><button formAction={decideTeacherApplication.bind(null, 'rejected')} className="btn btn-sm btn-red">Reject</button></form>
        {a.status === 'approved' && !madeSet.has(a.id) && <CredForm action={createTeacherAccount} btn="Create teacher account" className="space-y-2"><input type="hidden" name="id" value={a.id} /></CredForm>}</div>))}</div>
    <h2 className="font-bold mt-8 mb-2">Teachers</h2><ul className="card divide-y divide-[var(--line)] text-sm">{(teachers ?? []).map(t => (
      <li key={t.id} className="p-3 flex flex-wrap gap-3 items-center justify-between"><span><b>{t.full_name}</b> <span className="font-mono">{t.teacher_code}</span> · {t.email} · {t.timezone} · {t.status}</span>
        <form className="flex gap-1"><input type="hidden" name="id" value={t.id} /><button formAction={setTeacherStatus.bind(null, t.status === 'active' ? 'suspended' : 'active')} className="btn btn-sm btn-ghost">{t.status === 'active' ? 'Suspend' : 'Reactivate'}</button></form><details className="w-full"><summary className="cursor-pointer underline">Reset password</summary><CredForm action={resetPassword} btn="Set new password" className="space-y-2 mt-2"><input type="hidden" name="kind" value="teacher" /><input type="hidden" name="id" value={t.id} /></CredForm></details></li>))}</ul>
    <h2 className="font-bold mt-8 mb-2">Assign a teacher to a student</h2><form action={assignTeacher} className="card p-3 grid sm:grid-cols-3 gap-3">
      <select name="teacher_id" required className="inp"><option value="">Teacher…</option>{(teachers ?? []).filter(t => t.status === 'active').map(t => <option key={t.id} value={t.id}>{t.teacher_code} — {t.full_name}</option>)}</select>
      <select name="student_id" required className="inp"><option value="">Student…</option>{(students ?? []).map(x => <option key={x.id} value={x.id}>{x.student_code} — {x.full_name}</option>)}</select><button className="btn">Assign</button></form>
    <ul className="card divide-y divide-[var(--line)] text-sm mt-3">{(asg ?? []).map((a: any) => <li key={a.id} className="p-3 flex justify-between"><span>{a.teachers?.full_name} ({a.teachers?.teacher_code}) → {a.students?.full_name} ({a.students?.student_code})</span>
      <form action={unassignTeacher}><input type="hidden" name="id" value={a.id} /><button className="btn btn-sm btn-red">End</button></form></li>)}</ul></AdminShell>);
}
