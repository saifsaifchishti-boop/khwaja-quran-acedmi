import { notFound } from 'next/navigation';
import AdminShell from '@/components/AdminShell';
import CopyButton from '@/components/CopyButton';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { decideApplication } from '../../actions';
import { createStudentAccount } from '../../accounts';
import CredForm from '@/components/CredForm';
export const dynamic = 'force-dynamic';
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const db = supabaseAdmin();
  const { data: a } = await db.from('student_applications').select('*').eq('id', id).single(); if (!a) notFound();
  const { data: courses } = await db.from('courses').select('id,title_en,fee,currency').order('sort_order');
  const { data: st } = await db.from('students').select('student_code,status').eq('application_id', id).maybeSingle();
  const skip = ['id', 'decided_by', 'consent_policy', 'consent_data'];
  return (<AdminShell><div className="flex items-center gap-3 flex-wrap"><h1 className="text-2xl font-bold">Application <span className="font-mono">{a.ref}</span></h1><CopyButton value={a.ref} /><span className="btn btn-sm btn-gold">{a.status}</span></div>
    <dl className="card p-4 mt-4 grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">{Object.entries(a).filter(([k, v]) => !skip.includes(k) && v !== null && v !== '').map(([k, v]) =>
      <div key={k}><dt className="opacity-60">{k.replace(/_/g, ' ')}</dt><dd className="font-medium break-words">{String(v)}</dd></div>)}</dl>
    <form className="card p-4 mt-4 space-y-3"><input type="hidden" name="id" value={a.id} /><h2 className="font-bold">Decision</h2>
      <textarea name="admin_note" defaultValue={a.admin_note ?? ''} placeholder="Note to record (and, once email is enabled, to send to the applicant)" className="inp" rows={3} />
      <div className="flex flex-wrap gap-2"><button formAction={decideApplication.bind(null, 'approved')} className="btn">Approve</button><button formAction={decideApplication.bind(null, 'info_requested')} className="btn btn-gold">Request more info</button><button formAction={decideApplication.bind(null, 'rejected')} className="btn btn-red">Reject</button></div></form>
    {st ? <div className="card p-4 mt-4"><h2 className="font-bold">Account created</h2><p className="mt-2">Student ID: <span className="font-mono font-bold">{st.student_code}</span> <CopyButton value={st.student_code} /></p><p className="text-sm opacity-70 mt-1">Login details were shown once when you created it (use Students → Reset password to issue a new one). Status: {st.status}</p></div>
    : a.status === 'approved' && <CredForm action={createStudentAccount} btn="Create account" className="card p-4 mt-4 space-y-3"><input type="hidden" name="id" value={a.id} /><h2 className="font-bold">Create LMS account &amp; fee card</h2>
      <div className="grid sm:grid-cols-2 gap-3">
        <div><label className="lbl">Course</label><select name="course_id" defaultValue={a.course_id ?? ''} className="inp">{courses?.map(c => <option key={c.id} value={c.id}>{c.title_en}</option>)}</select></div>
        <div><label className="lbl">Time zone</label><input name="timezone" defaultValue={a.timezone} className="inp" /></div>
        <div><label className="lbl">Fee title</label><input name="fee_title" defaultValue="Monthly fee" className="inp" /></div>
        <div><label className="lbl">Fee amount (0 = none yet)</label><input name="fee" type="number" min="0" step="0.01" defaultValue="0" className="inp" /></div>
        <div><label className="lbl">Discount</label><input name="discount" type="number" min="0" step="0.01" defaultValue="0" className="inp" /></div>
        <div><label className="lbl">Due date</label><input name="due_date" type="date" className="inp" /></div></div>
      </CredForm>}</AdminShell>);
}
