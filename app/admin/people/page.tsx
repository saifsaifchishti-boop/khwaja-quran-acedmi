import AdminShell from '@/components/AdminShell';
import PeopleRow, { type PersonRow } from '@/components/teams/PeopleRow';
import { supabaseAdmin } from '@/lib/supabase/admin';
export const dynamic = 'force-dynamic';
export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = '' } = await searchParams; const db = supabaseAdmin(); const like = `%${q.replace(/[%_,]/g, '')}%`;
  const [{ data: st }, { data: te }, { data: rp }] = await Promise.all([
    db.from('students').select('user_id,full_name,student_code').not('user_id', 'is', null).or(`full_name.ilike.${like},student_code.ilike.${like}`).order('full_name').limit(200),
    db.from('teachers').select('user_id,full_name,teacher_code').not('user_id', 'is', null).or(`full_name.ilike.${like},teacher_code.ilike.${like}`).order('full_name').limit(200),
    db.from('message_reports').select('id,reason,status,created_at,message_id,messages(body,attachment_type)').order('created_at', { ascending: false }).limit(30)]);
  const ids = [...(st ?? []), ...(te ?? [])].map(x => x.user_id as string); const { data: pr } = ids.length ? await db.from('profiles').select('id,avatar_path,avatar_locked').in('id', ids) : { data: [] as any[] };
  const pm = new Map((pr ?? []).map((p: any) => [p.id, p]));
  const row = (x: any, kind: string, code: string): PersonRow => { const p: any = pm.get(x.user_id); return { userId: x.user_id, name: x.full_name, kind, code, has: !!p?.avatar_path, v: p?.avatar_path ? String(p.avatar_path).slice(-12) : null, locked: !!p?.avatar_locked }; };
  const rows = [...(te ?? []).map(x => row(x, 'Teacher', x.teacher_code)), ...(st ?? []).map(x => row(x, 'Student', x.student_code))];
  return (<AdminShell><h1 className="text-2xl font-bold mb-1">Profile photos</h1>
    <p className="text-sm opacity-70 mb-4">Students and teachers can set their photo once; it is then locked. Use this page to upload, replace, lock, unlock or remove a photo.</p>
    <form className="mb-4 flex gap-2"><input name="q" defaultValue={q} placeholder="Search by name or ID" className="inp max-w-xs" /><button className="btn btn-sm">Search</button></form>
    <ul className="card divide-y divide-[var(--line)]">{rows.length === 0 && <li className="p-4 opacity-70">No people found.</li>}{rows.map(p => <PeopleRow key={p.userId} p={p} />)}</ul>
    <h2 className="text-xl font-bold mt-10 mb-2">Reported chat messages</h2>
    <ul className="card divide-y divide-[var(--line)]">{(rp ?? []).length === 0 && <li className="p-4 opacity-70">No reports.</li>}{(rp ?? []).map((r: any) => (<li key={r.id} className="p-3 text-sm"><div className="opacity-70 text-xs">{new Date(r.created_at).toLocaleString()} · {r.status}</div><div><b>Reason:</b> {r.reason}</div><div className="opacity-80"><b>Message:</b> {r.messages?.body || (r.messages?.attachment_type ? `[${r.messages.attachment_type}]` : '[deleted]')}</div></li>))}</ul></AdminShell>);
}
