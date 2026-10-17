import StudentShell from '@/components/StudentShell';
import AForm from '@/components/Msg';
import { openTicket } from '../actions2';
export const dynamic = 'force-dynamic';
export default function Page() {
  return (<StudentShell>{async ({ sb }) => {
    const { data } = await sb.from('support_tickets').select('*').order('created_at', { ascending: false }).limit(30);
    return (<><h1 className="text-2xl font-bold mb-3">Support</h1><AForm action={openTicket} okText="Sent. We will reply here."><input name="subject" required maxLength={150} placeholder="Subject" className="inp" /><textarea name="body" required rows={4} maxLength={3000} placeholder="How can we help?" className="inp" /></AForm>
      <div className="space-y-3 mt-6">{(data ?? []).map(t => <div key={t.id} className="card p-4 text-sm"><b>{t.subject}</b> <span className="opacity-60">({t.status})</span><p className="mt-1 whitespace-pre-wrap">{t.body}</p>{t.admin_reply && <p className="mt-2 p-2 rounded bg-[var(--bg)]"><b>Academy:</b> {t.admin_reply}</p>}</div>)}</div></>);
  }}</StudentShell>);
}
