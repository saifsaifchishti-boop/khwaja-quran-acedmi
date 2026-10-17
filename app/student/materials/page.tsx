import StudentShell from '@/components/StudentShell';
import { signed } from '@/lib/files';
export const dynamic = 'force-dynamic';
export default function Page() {
  return (<StudentShell>{async ({ sb }) => {
    const { data } = await sb.from('materials').select('*').order('created_at', { ascending: false }).limit(60);
    const rows = await Promise.all((data ?? []).map(async m => ({ ...m, f: await signed(m.file_path) })));
    return (<><h1 className="text-2xl font-bold mb-3">Learning materials</h1><ul className="card divide-y divide-[var(--line)]">{rows.length === 0 && <li className="p-3 opacity-70">Nothing shared yet.</li>}{rows.map(m => (
      <li key={m.id} className="p-3"><b>{m.title}</b><p className="text-sm opacity-80">{m.description}</p><div className="flex gap-4 text-sm underline">{m.url && <a href={m.url} target="_blank" rel="noopener noreferrer">Open link</a>}{m.f && <a href={m.f} target="_blank" rel="noopener noreferrer">Open file</a>}</div></li>))}</ul></>);
  }}</StudentShell>);
}
