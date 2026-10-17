import StudentShell from '@/components/StudentShell';
export const dynamic = 'force-dynamic';
export default function Page() {
  return (<StudentShell>{async ({ sb }) => {
    const [{ data: fb }, { data: as }] = await Promise.all([sb.from('feedback').select('*, teachers(full_name)').order('created_at', { ascending: false }).limit(50), sb.from('assessments').select('*').order('assessed_on', { ascending: false }).limit(50)]);
    return (<><h1 className="text-2xl font-bold mb-3">Teacher feedback &amp; results</h1>
      <h2 className="font-bold mb-2">Feedback</h2><ul className="card divide-y divide-[var(--line)] text-sm">{(fb ?? []).length === 0 && <li className="p-3 opacity-70">No feedback yet.</li>}{(fb ?? []).map((f: any) => <li key={f.id} className="p-3">{f.body}{f.progress && <div className="opacity-70">Progress: {f.progress}</div>}<div className="opacity-60 text-xs">{f.teachers?.full_name} · {new Date(f.created_at).toLocaleDateString()}</div></li>)}</ul>
      <h2 className="font-bold mt-6 mb-2">Assessment results</h2><ul className="card divide-y divide-[var(--line)] text-sm">{(as ?? []).length === 0 && <li className="p-3 opacity-70">No results yet.</li>}{(as ?? []).map(a => <li key={a.id} className="p-3 flex justify-between"><span>{a.title} <span className="opacity-60">{a.remarks}</span></span><b>{a.score ?? '—'} / {a.max_score ?? '—'}</b></li>)}</ul></>);
  }}</StudentShell>);
}
