'use client';
import { useEffect, useState } from 'react';
// Shows a loading card in the middle of the page whenever the site is waiting on the server
// (page navigation, form submit, server action). It counts in-flight fetch() calls, so no per-button work is needed.
const PHRASES = ['Loading the page…', 'Please wait a moment…', 'Almost there…'];
export default function GlobalLoader() {
  const [busy, setBusy] = useState(false); const [i, setI] = useState(0);
  useEffect(() => {
    let n = 0; let t: ReturnType<typeof setTimeout> | undefined; const orig = window.fetch;
    const upd = () => { clearTimeout(t); t = setTimeout(() => setBusy(n > 0), n > 0 ? 350 : 200); };
    window.fetch = async (...a: Parameters<typeof fetch>) => {
      const u = typeof a[0] === 'string' ? a[0] : a[0] instanceof URL ? a[0].href : (a[0] as Request).url;
      if (u.includes('/realtime/') || u.includes('/api/avatar/') || u.includes('/api/live/')) return orig(...a); // background traffic never shows the loader
      if (((window as unknown as { __kqQuiet?: number }).__kqQuiet ?? 0) > 0) return orig(...a);
      n++; upd(); try { return await orig(...a); } finally { n = Math.max(0, n - 1); upd(); } };
    return () => { window.fetch = orig; clearTimeout(t); };
  }, []);
  useEffect(() => { if (!busy) return; const x = setInterval(() => setI(v => (v + 1) % PHRASES.length), 1600); return () => clearInterval(x); }, [busy]);
  if (!busy) return null;
  return (<div role="status" aria-live="polite" style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.28)', backdropFilter: 'blur(2px)' }}>
    <style>{`@keyframes kqspin{to{transform:rotate(360deg)}}@media (prefers-reduced-motion:reduce){.kqspin{animation-duration:3s!important}}`}</style>
    <div className="card" style={{ padding: '28px 36px', textAlign: 'center', boxShadow: '0 12px 40px rgba(0,0,0,.35)', minWidth: 240 }}>
      <div className="kqspin" style={{ width: 46, height: 46, margin: '0 auto 14px', borderRadius: '50%', border: '4px solid var(--line)', borderTopColor: 'var(--brand)', animation: 'kqspin .9s linear infinite' }} />
      <div className="quran" dir="rtl" style={{ fontSize: 22, color: 'var(--brand)' }}>بسم اللہ الرحمن الرحیم</div>
      <div style={{ marginTop: 6, fontWeight: 600 }}>{PHRASES[i]}</div></div></div>);
}
