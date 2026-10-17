'use client';
import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/browser';
// Landing page for BOTH activation invites and password-reset links (Supabase puts the session in the URL hash).
export default function Page() {
  const [ready, setReady] = useState(false); const [msg, setMsg] = useState('');
  useEffect(() => { const sb = supabaseBrowser(); sb.auth.getSession().then(({ data }) => setReady(!!data.session)); }, []);
  async function go(fd: FormData) {
    const pw = String(fd.get('pw')); if (pw.length < 10) return setMsg('Use at least 10 characters.');
    if (pw !== fd.get('pw2')) return setMsg('Passwords do not match.');
    const { error } = await supabaseBrowser().auth.updateUser({ password: pw });
    if (error) return setMsg(error.message);
    const sb = supabaseBrowser(); const { data: { user } } = await sb.auth.getUser();
    const { data: pr } = user ? await sb.from('profiles').select('role').eq('id', user.id).single() : { data: null };
    await sb.auth.signOut(); window.location.href = pr?.role === 'teacher' ? '/teacher/login' : pr?.role === 'admin' ? '/admin/login' : '/login';
  }
  return (<main className="max-w-md mx-auto px-4 py-12"><form action={go} className="card p-6 space-y-4"><h1 className="text-2xl font-bold">Set your password</h1>
    {!ready && <p className="text-sm">Open this page from the link in your email. If it has expired, ask the academy to resend it.</p>}
    <div><label className="lbl" htmlFor="pw">New password</label><input id="pw" name="pw" type="password" minLength={10} required className="inp" dir="ltr" /></div>
    <div><label className="lbl" htmlFor="pw2">Repeat password</label><input id="pw2" name="pw2" type="password" minLength={10} required className="inp" dir="ltr" /></div>
    {msg && <p role="alert" className="text-red-600 text-sm">{msg}</p>}<button disabled={!ready} className="btn w-full">Save password</button></form></main>);
}
