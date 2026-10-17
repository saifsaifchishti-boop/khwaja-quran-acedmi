import AdminShell from '@/components/AdminShell';
import { supabaseAdmin } from '@/lib/supabase/admin';
export const dynamic = 'force-dynamic';
export default async function Page() {
  const db = supabaseAdmin(); const since = new Date(Date.now() - 30 * 86400000).toISOString();
  const { data: att } = await db.from('attendance').select('status').gte('marked_at', since); const c = (k: string) => (att ?? []).filter(a => a.status === k).length;
  const { count: done } = await db.from('class_sessions').select('id', { count: 'exact', head: true }).eq('status', 'completed').gte('starts_at', since);
  const { count: hw } = await db.from('assignments').select('id', { count: 'exact', head: true }).gte('created_at', since);
  return (<AdminShell><h1 className="text-2xl font-bold mb-4">Reports</h1><div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">{[['Classes completed (30d)', done ?? 0], ['Present', c('present')], ['Absent', c('absent')], ['Homework set (30d)', hw ?? 0]].map(([l, v]) => <div key={String(l)} className="card p-4"><div className="text-sm opacity-70">{l}</div><div className="text-2xl font-bold">{v}</div></div>)}</div>
    <h2 className="font-bold mb-2">CSV export</h2><div className="flex flex-wrap gap-2">{['students', 'fees', 'payments', 'attendance'].map(t => <a key={t} href={`/api/admin/export?type=${t}`} className="btn btn-sm btn-ghost">Download {t}.csv</a>)}</div></AdminShell>);
}
