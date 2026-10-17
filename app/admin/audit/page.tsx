import Link from 'next/link';
import AdminShell from '@/components/AdminShell';
import { supabaseAdmin } from '@/lib/supabase/admin';
export const dynamic = 'force-dynamic';
const PER = 50;
export default async function Page({ searchParams }: { searchParams: Promise<{ page?: string; q?: string }> }) {
  const sp = await searchParams; const page = Math.max(1, Number(sp.page) || 1); const q = (sp.q ?? '').trim().replace(/[%,()]/g, '');
  let qb = supabaseAdmin().from('audit_logs').select('*', { count: 'exact' }); if (q) qb = qb.ilike('action', `%${q}%`);
  const { data, count } = await qb.order('id', { ascending: false }).range((page - 1) * PER, page * PER - 1); const pages = Math.max(1, Math.ceil((count ?? 0) / PER));
  return (<AdminShell><h1 className="text-2xl font-bold mb-3">Audit log</h1><form className="flex gap-2 mb-3"><input name="q" defaultValue={q} placeholder="Filter by action (e.g. payment)" className="inp" /><button className="btn">Filter</button></form>
    <ul className="card divide-y divide-[var(--line)] text-xs">{(data ?? []).map(l => <li key={l.id} className="p-2 flex flex-wrap gap-x-3"><time className="opacity-60">{new Date(l.created_at).toLocaleString()}</time><b>{l.action}</b><span>{l.entity} {l.entity_id}</span><span className="font-mono opacity-60">{l.actor?.slice(0, 8)}</span>{l.meta && Object.keys(l.meta).length > 0 && <code className="opacity-70">{JSON.stringify(l.meta)}</code>}</li>)}</ul>
    <div className="flex gap-2 mt-3 items-center">{page > 1 && <Link className="btn btn-sm btn-ghost" href={`?page=${page - 1}&q=${q}`}>←</Link>}<span className="text-sm">Page {page}/{pages}</span>{page < pages && <Link className="btn btn-sm btn-ghost" href={`?page=${page + 1}&q=${q}`}>→</Link>}</div></AdminShell>);
}
