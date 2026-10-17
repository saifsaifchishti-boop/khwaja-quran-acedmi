import { notFound } from 'next/navigation';
import TeacherShell from '@/components/TeacherShell';
import { signed } from '@/lib/files';
import { fmtDT } from '@/lib/fmt';
import { createHomework, gradeSubmission, addMaterial, addFeedback, addAssessment, sendNotice } from '../../actions';
export const dynamic = 'force-dynamic';
const I = (n: string, l: string, type = 'text') => <div><label className="lbl">{l}</label><input name={n} type={type} className="inp" /></div>;
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (<TeacherShell>{async ({ sb }) => {
    const { data: st } = await sb.from('students').select('*, courses(title_en)').eq('id', id).maybeSingle(); // RLS: only assigned students are visible
    if (!st) notFound();
    const [{ data: hw }, { data: subs }, { data: mats }, { data: fb }, { data: as }, { data: att }] = await Promise.all([
      sb.from('assignments').select('*').eq('student_id', id).order('created_at', { ascending: false }).limit(20),
      sb.from('submissions').select('*').eq('student_id', id), sb.from('materials').select('*').eq('student_id', id).order('created_at', { ascending: false }).limit(20),
      sb.from('feedback').select('*').eq('student_id', id).order('created_at', { ascending: false }).limit(10), sb.from('assessments').select('*').eq('student_id', id).order('assessed_on', { ascending: false }).limit(10),
      sb.from('attendance').select('status').eq('student_id', id)]);
    const subBy = new Map<string, any>((subs ?? []).map((x: any) => [x.assignment_id, x] as [string, any]));
    const subFiles = new Map<string, string | null>(); for (const x of subs ?? []) subFiles.set(x.id, await signed(x.file_path));
    const cnt = (k: string) => (att ?? []).filter(a => a.status === k).length;
    const H = ({ children }: { children: React.ReactNode }) => <h2 className="font-bold mt-8 mb-2">{children}</h2>;
    return (<><h1 className="text-2xl font-bold">{st.full_name} <span className="font-mono text-base opacity-70">{st.student_code}</span></h1>
      <p className="text-sm opacity-70">{(st as any).courses?.title_en ?? '—'} · {st.timezone} · Attendance: {cnt('present')} present, {cnt('late')} late, {cnt('absent')} absent, {cnt('excused')} excused</p>
      <H>Homework</H><form action={createHomework} className="card p-3 grid sm:grid-cols-3 gap-3"><input type="hidden" name="student_id" value={id} />{I('title', 'Title')}{I('due_at', 'Due', 'datetime-local')}<div><label className="lbl">Details</label><input name="description" className="inp" /></div><button className="btn btn-sm sm:col-span-3">Assign</button></form>
      <div className="space-y-3 mt-3">{(hw ?? []).map(h => { const sub = subBy.get(h.id); return (<div key={h.id} className="card p-3 text-sm"><b>{h.title}</b> <span className="opacity-70">due {h.due_at ? fmtDT(h.due_at, st.timezone) : '—'}</span>
        {!sub && <p className="opacity-70">Not submitted yet.</p>}
        {sub && <><p className="mt-1 whitespace-pre-wrap">{sub.body}</p>{subFiles.get(sub.id) && <a className="underline" href={subFiles.get(sub.id)!} target="_blank" rel="noopener noreferrer">Open attachment</a>}
          <form action={gradeSubmission} className="flex gap-2 mt-2 flex-wrap"><input type="hidden" name="id" value={sub.id} /><input type="hidden" name="student_id" value={id} />
            <input name="grade" defaultValue={sub.grade ?? ''} placeholder="Grade" className="inp !w-28" /><input name="feedback" defaultValue={sub.feedback ?? ''} placeholder="Feedback" className="inp flex-1 min-w-40" /><button className="btn btn-sm">Save review</button></form></>}</div>); })}</div>
      <H>Learning materials</H><form action={addMaterial} className="card p-3 grid sm:grid-cols-2 gap-3"><input type="hidden" name="student_id" value={id} />{I('title', 'Title')}{I('url', 'Link (https only)')}{I('description', 'Description')}
        <div><label className="lbl">File (PDF/image/audio, ≤10 MB)</label><input name="file" type="file" className="inp" accept="image/*,application/pdf,audio/*" /></div><button className="btn btn-sm sm:col-span-2">Add material</button></form>
      <ul className="mt-3 text-sm space-y-1">{(mats ?? []).map(m => <li key={m.id}>• {m.title}</li>)}</ul>
      <H>Feedback &amp; progress</H><form action={addFeedback} className="card p-3 grid sm:grid-cols-3 gap-3"><input type="hidden" name="student_id" value={id} />{I('progress', 'Progress (e.g. Surah Al-Baqarah 1–20)')}
        <div className="sm:col-span-2"><label className="lbl">Feedback</label><input name="body" required className="inp" /></div><button className="btn btn-sm sm:col-span-3">Save feedback</button></form>
      <ul className="mt-3 text-sm space-y-1">{(fb ?? []).map(f => <li key={f.id}>{new Date(f.created_at).toLocaleDateString()} — {f.body} {f.progress && <i className="opacity-70">({f.progress})</i>}</li>)}</ul>
      <H>Assessments</H><form action={addAssessment} className="card p-3 grid sm:grid-cols-4 gap-3"><input type="hidden" name="student_id" value={id} />{I('title', 'Title')}{I('score', 'Score', 'number')}{I('max_score', 'Out of', 'number')}{I('remarks', 'Remarks')}<button className="btn btn-sm sm:col-span-4">Record</button></form>
      <ul className="mt-3 text-sm space-y-1">{(as ?? []).map(a => <li key={a.id}>{a.title}: {a.score ?? '—'}/{a.max_score ?? '—'} {a.remarks && `— ${a.remarks}`}</li>)}</ul>
      <H>Send class notice (email + in-app)</H><form action={sendNotice} className="card p-3 flex gap-2"><input type="hidden" name="student_id" value={id} /><input name="message" required maxLength={1000} className="inp" /><button className="btn btn-sm">Send</button></form></>);
  }}</TeacherShell>);
}
