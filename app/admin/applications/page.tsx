import Link from 'next/link';
import AdminShell from '@/components/AdminShell';
import { supabaseAdmin } from '@/lib/supabase/admin';
export const dynamic = 'force-dynamic';
const PAGE = 20;
export default async function Page({ searchParams }: { searchParams: Promise<{ status?: string; q?: string; p?: string }> }) {
  const { status, q, p } = await searchParams; const page = Math.max(1, Number(p) || 1);
  let query = supabaseAdmin().from('student_applications').select('id,ref,status,first_name,last_name,email,country,created_at', { count: 'exact' }).order('created_at', { ascending: false }).range((page - 1) * PAGE, page * PAGE - 1);
  if (status) query = query.eq('status', status);
  if (q) { const t = q.replace(/[%,()]/g, ''); query = query.or(`first_name.ilike.%${t}%,last_name.ilike.%${t}%,email.ilike.%${t}%,ref.ilike.%${t}%`); }
  const { data, count } = await query;
  return (<AdminShell><h1 className="text-2xl font-bold mb-4">Student applications</h1>
    <form className="flex flex-wrap gap-2 mb-4"><input name="q" defaultValue={q} placeholder="Search name, email, ref" className="inp max-w-xs" />
      <select name="status" defaultValue={status ?? ''} className="inp max-w-[200px]"><option value="">All statuses</option>{['pending', 'approved', 'rejected', 'info_requested'].map(s => <option key={s}>{s}</option>)}</select><button className="btn">Filter</button></form>
    <div className="card overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-start border-b border-[var(--line)]">{['Ref', 'Name', 'Email', 'Country', 'Status', 'Date'].map(h => <th key={h} className="p-3 text-start">{h}</th>)}</tr></thead>
      <tbody>{(data ?? []).map(a => <tr key={a.id} className="border-b border-[var(--line)]"><td className="p-3"><Link className="underline font-mono" href={`/admin/applications/${a.id}`}>{a.ref}</Link></td>
        <td className="p-3">{a.first_name} {a.last_name}</td><td className="p-3">{a.email}</td><td className="p-3">{a.country}</td><td className="p-3 font-semibold">{a.status}</td><td className="p-3">{new Date(a.created_at).toLocaleDateString()}</td></tr>)}
        {!data?.length && <tr><td colSpan={6} className="p-4 opacity-70">No applications.</td></tr>}</tbody></table></div>
    <div className="flex gap-2 mt-4 items-center">{page > 1 && <Link className="btn btn-ghost btn-sm" href={`?p=${page - 1}&status=${status ?? ''}&q=${q ?? ''}`}>← Prev</Link>}
      <span className="text-sm">Page {page} · {count ?? 0} total</span>{(count ?? 0) > page * PAGE && <Link className="btn btn-ghost btn-sm" href={`?p=${page + 1}&status=${status ?? ''}&q=${q ?? ''}`}>Next →</Link>}</div></AdminShell>);
}
