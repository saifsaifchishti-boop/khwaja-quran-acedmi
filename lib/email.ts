import 'server-only';
import { supabaseAdmin } from './supabase/admin';
import { EMAIL_DEFAULTS } from './email-defaults';
import { render } from './render';
import nodemailer from 'nodemailer';

const paras = (s: string) => s.split('\n').filter(l => l.trim() !== '').map(l => `<p style="margin:0 0 10px">${l}</p>`).join('');

export async function buildEmail(key: string, vars: Record<string, string | number | null | undefined>) {
  const db = supabaseAdmin();
  const { data: o } = await db.from('email_templates').select('*').eq('key', key).maybeSingle();
  const d = EMAIL_DEFAULTS[key]; if (!d) return null;
  if (o && !o.enabled) return null;
  const T = o ?? d; const all = { site: process.env.NEXT_PUBLIC_SITE_URL ?? '', ...vars };
  const subject = render(T.subject_en, all);
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#1b2a22;max-width:560px">${paras(render(T.body_en, all, true))}`
    + `<hr style="border:none;border-top:1px solid #e4dfd0;margin:16px 0"/><div dir="rtl" style="font-size:16px;line-height:2">${paras(render(T.body_ur, all, true))}</div></div>`;
  return { subject, html };
}
async function deliver(id: number, to: string, subject: string, html: string, attempts: number) {
  const db = supabaseAdmin(); let status: 'sent' | 'failed' = 'failed'; let error: string | null = null;
  try {
    const { GMAIL_USER, GMAIL_APP_PASSWORD } = process.env;
    if (GMAIL_USER && GMAIL_APP_PASSWORD) { // Gmail SMTP (App Password). Replies from recipients arrive in this Gmail inbox.
      const tr = nodemailer.createTransport({ host: 'smtp.gmail.com', port: 465, secure: true, auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD } });
      await tr.sendMail({ from: `"${process.env.EMAIL_FROM_NAME ?? 'Khwaja Quran Majeed Academy'}" <${GMAIL_USER}>`, to, subject, html });
      status = 'sent';
    } else {
    if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) throw new Error('Email not configured (set GMAIL_USER + GMAIL_APP_PASSWORD, or RESEND_API_KEY + EMAIL_FROM)');
    const r = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [to], subject, html }) });
    if (!r.ok) throw new Error(`Resend ${r.status}: ${(await r.text()).slice(0, 200)}`);
    status = 'sent';
    }
  } catch (e) { error = e instanceof Error ? e.message : 'send failed'; }
  await db.from('email_logs').update({ status, error, attempts: attempts + 1, sent_at: status === 'sent' ? new Date().toISOString() : null }).eq('id', id);
  return status === 'sent';
}
// Never throws: a failed email must not break the action that triggered it. Failures stay in email_logs and can be retried.
export async function sendTemplate(key: string, to: string | null | undefined, vars: Record<string, string | number | null | undefined> = {}) {
  try {
    if (!to) return false; const m = await buildEmail(key, vars); if (!m) return false;
    const { data } = await supabaseAdmin().from('email_logs').insert({ to_email: to, template_key: key, subject: m.subject, html: m.html }).select('id').single();
    return data ? await deliver(data.id, to, m.subject, m.html, 0) : false;
  } catch (e) { console.error('sendTemplate', key); return false; }
}
export async function adminEmail() {
  const { data } = await supabaseAdmin().from('settings').select('value').eq('key', 'contact').maybeSingle();
  return (data?.value as { email?: string } | null)?.email || process.env.ADMIN_NOTIFY_EMAIL || null;
}
export async function retryFailed(max = 25) {
  const db = supabaseAdmin(); const { data } = await db.from('email_logs').select('*').eq('status', 'failed').lt('attempts', 5).order('created_at').limit(max);
  let ok = 0; for (const l of data ?? []) if (await deliver(l.id, l.to_email, l.subject, l.html, l.attempts)) ok++;
  return { tried: data?.length ?? 0, ok };
}
