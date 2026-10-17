import AdminShell from '@/components/AdminShell';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { EMAIL_DEFAULTS } from '@/lib/email-defaults';
import { saveEmailTemplate, resetEmailTemplate, retryEmails, runFeeReminders } from '../actions2';
export const dynamic = 'force-dynamic';
export default async function Page() {
  const db = supabaseAdmin(); const { data: ov } = await db.from('email_templates').select('*'); const o = new Map<string, any>((ov ?? []).map((x: any) => [x.key, x] as [string, any]));
  const { data: logs } = await db.from('email_logs').select('id,to_email,template_key,subject,status,attempts,error,created_at').order('created_at', { ascending: false }).limit(40);
  const ready = !!process.env.RESEND_API_KEY && !!process.env.EMAIL_FROM;
  return (<AdminShell><h1 className="text-2xl font-bold mb-2">Emails</h1>{!ready && <p className="card p-3 mb-3 text-red-700">RESEND_API_KEY / EMAIL_FROM are not set — emails are logged as “failed” and can be retried once configured.</p>}
    <div className="flex gap-2 mb-4"><form action={retryEmails}><button className="btn btn-sm">Retry failed emails</button></form><form action={runFeeReminders}><button className="btn btn-sm btn-ghost">Send fee reminders now</button></form></div>
    <p className="text-sm opacity-70 mb-3">Each email is sent in English with the Urdu text below it. Use {'{{placeholders}}'} listed under each template.</p>
    <div className="space-y-3">{Object.entries(EMAIL_DEFAULTS).map(([key, d]) => { const t: any = o.get(key) ?? d; return (<details key={key} className="card p-3"><summary className="cursor-pointer font-semibold">{key} {o.has(key) ? '(customised)' : ''}</summary>
      <form action={saveEmailTemplate} className="grid gap-2 mt-3"><input type="hidden" name="key" value={key} /><p className="text-xs opacity-70">Variables: {d.vars}, site</p>
        <input name="subject_en" defaultValue={t.subject_en} className="inp" aria-label="Subject English" /><textarea name="body_en" defaultValue={t.body_en} rows={5} className="inp" aria-label="Body English" />
        <input name="subject_ur" defaultValue={t.subject_ur} className="inp" dir="rtl" aria-label="Subject Urdu" /><textarea name="body_ur" defaultValue={t.body_ur} rows={5} className="inp" dir="rtl" aria-label="Body Urdu" />
        <label className="flex gap-2 items-center"><input type="checkbox" name="enabled" defaultChecked={(t as any).enabled ?? true} className="size-5" />Enabled</label>
        <div className="flex gap-2"><button className="btn btn-sm">Save</button>{o.has(key) && <button formAction={resetEmailTemplate} formNoValidate className="btn btn-sm btn-ghost">Reset to default</button>}</div></form></details>); })}</div>
    <h2 className="font-bold mt-8 mb-2">Recent emails</h2><ul className="card divide-y divide-[var(--line)] text-xs">{(logs ?? []).map(l => <li key={l.id} className="p-2 flex flex-wrap gap-x-3"><b className={l.status === 'sent' ? 'text-green-700' : l.status === 'failed' ? 'text-red-600' : ''}>{l.status}</b><span>{l.to_email}</span><span>{l.subject}</span><span className="opacity-60">{new Date(l.created_at).toLocaleString()}</span>{l.error && <span className="text-red-600">{l.error}</span>}</li>)}</ul></AdminShell>);
}
