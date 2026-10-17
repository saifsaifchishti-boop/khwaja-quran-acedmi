import AdminShell from '@/components/AdminShell';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { replyTicket, resolveReport } from '../actions2';
export const dynamic = 'force-dynamic';
export default async function Page() {
  const db = supabaseAdmin();
  const [{ data: tix }, { data: reps }] = await Promise.all([db.from('support_tickets').select('*, students(full_name,student_code)').order('created_at', { ascending: false }).limit(50), db.from('chat_reports').select('*').eq('status', 'open').order('created_at', { ascending: false }).limit(30)]);
  const repRows = await Promise.all((reps ?? []).map(async r => { // Admin sees ONLY the reported message and its neighbours, never the whole private chat.
    const { data: m } = r.message_id ? await db.from('chat_messages').select('body,created_at,sender_id,attachment_name').eq('id', r.message_id).maybeSingle() : { data: null };
    const { data: names } = await Promise.all([db.from('students').select('full_name').eq('id', r.student_id).maybeSingle(), db.from('teachers').select('full_name').eq('id', r.teacher_id).maybeSingle()]).then(([a, b]) => ({ data: [a.data?.full_name, b.data?.full_name] }));
    return { ...r, m, student: names?.[0], teacher: names?.[1] }; }));
  return (<AdminShell><h1 className="text-2xl font-bold mb-4">Inbox</h1><h2 className="font-bold mb-2">Safeguarding — reported chat messages ({repRows.length})</h2>
    <div className="space-y-3">{repRows.length === 0 && <p className="opacity-70">No open reports.</p>}{repRows.map(r => <div key={r.id} className="card p-3 text-sm border-red-300"><p><b>{r.student}</b> ↔ <b>{r.teacher}</b> · {new Date(r.created_at).toLocaleString()}</p><p className="mt-1">Reason: {r.reason}</p>
      <p className="mt-1 p-2 rounded bg-[var(--bg)] whitespace-pre-wrap">{r.m ? (r.m.body || (r.m.attachment_name ? `📎 ${r.m.attachment_name}` : '(deleted)')) : '(message removed)'}</p>
      <form action={resolveReport} className="mt-2"><input type="hidden" name="id" value={r.id} /><button className="btn btn-sm">Mark resolved</button></form></div>)}</div>
    <h2 className="font-bold mt-8 mb-2">Student support tickets</h2><div className="space-y-3">{(tix ?? []).map((t: any) => <div key={t.id} className="card p-3 text-sm"><p><b>{t.students?.full_name}</b> ({t.students?.student_code}) · {t.status} · {new Date(t.created_at).toLocaleString()}</p><p className="font-semibold">{t.subject}</p><p className="whitespace-pre-wrap">{t.body}</p>
      <form action={replyTicket} className="mt-2 flex flex-wrap gap-2"><input type="hidden" name="id" value={t.id} /><input name="reply" defaultValue={t.admin_reply ?? ''} placeholder="Reply" className="inp flex-1 min-w-48" /><label className="flex gap-1 items-center"><input type="checkbox" name="close" className="size-4" />Close</label><button className="btn btn-sm">Send reply</button></form></div>)}</div></AdminShell>);
}
