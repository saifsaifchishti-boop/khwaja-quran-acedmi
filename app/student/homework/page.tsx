import StudentShell from '@/components/StudentShell';
import AForm from '@/components/Msg';
import { fmtDT } from '@/lib/fmt';
import { submitHomework } from '../actions2';
export const dynamic = 'force-dynamic';
export default function Page() {
  return (<StudentShell>{async ({ sb, user }) => {
    const { data: me } = await sb.from('students').select('timezone').eq('user_id', user.id).single(); const tz = me?.timezone ?? 'UTC';
    const { data: hw } = await sb.from('assignments').select('*').order('created_at', { ascending: false }).limit(50);
    const { data: subs } = await sb.from('submissions').select('assignment_id,body,grade,feedback,graded_at,submitted_at');
    const by = new Map<string, any>((subs ?? []).map((x: any) => [x.assignment_id, x] as [string, any]));
    return (<><h1 className="text-2xl font-bold mb-3">Homework</h1><div className="space-y-4">{(hw ?? []).length === 0 && <p className="opacity-70">No homework yet.</p>}{(hw ?? []).map(h => { const sub = by.get(h.id); return (
      <div key={h.id} className="card p-4"><b>{h.title}</b> <span className="text-sm opacity-70">due {h.due_at ? fmtDT(h.due_at, tz) : '—'}</span><p className="text-sm mt-1">{h.description}</p>
        {sub?.graded_at ? <p className="mt-2 text-sm">Reviewed — grade: <b>{sub.grade ?? '—'}</b>. {sub.feedback}</p> : (
          <AForm action={submitHomework} okText="Submitted." className="mt-3 space-y-2"><input type="hidden" name="assignment_id" value={h.id} /><textarea name="body" defaultValue={sub?.body ?? ''} rows={3} placeholder="Your answer" className="inp" />
            <input name="file" type="file" accept="image/*,application/pdf,audio/*" className="inp" />{sub && <p className="text-xs opacity-70">Submitted {fmtDT(sub.submitted_at, tz)} — you may resubmit until it is reviewed.</p>}</AForm>)}</div>); })}</div></>);
  }}</StudentShell>);
}
