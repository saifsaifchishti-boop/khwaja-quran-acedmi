import StudentShell from '@/components/StudentShell';
import CopyButton from '@/components/CopyButton';
export const dynamic = 'force-dynamic';
export default function Page() {
  return (<StudentShell>{async ({ sb }) => {
    const { data } = await sb.from('certificates').select('*').eq('revoked', false).order('issued_on', { ascending: false });
    const site = process.env.NEXT_PUBLIC_SITE_URL ?? '';
    return (<><h1 className="text-2xl font-bold mb-3">Certificates</h1><div className="space-y-3">{(data ?? []).length === 0 && <p className="opacity-70">No certificates issued yet.</p>}{(data ?? []).map(c => (
      <div key={c.id} className="card p-4"><b>{c.title}</b><div className="text-sm">Issued {c.issued_on} · Code <span className="font-mono">{c.code}</span> <CopyButton value={c.code} /></div>
        <div className="text-sm opacity-70">Anyone can verify it at {site}/verify/{c.code}</div></div>))}</div></>);
  }}</StudentShell>);
}
