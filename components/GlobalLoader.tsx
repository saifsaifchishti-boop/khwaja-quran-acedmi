'use client';
import { useEffect, useState } from 'react';
// Shows a top progress bar + a rotating Bismillah / Kalima pill whenever the site is waiting on the server
// (page navigation, form submit, server action). It counts in-flight fetch() calls, so no per-button work is needed.
const PHRASES = ['بسم اللہ الرحمن الرحیم', 'لا الٰہ الا اللہ محمد رسول اللہ', 'لوڈ ہو رہا ہے… Loading…'];
export default function GlobalLoader() {
  const [busy, setBusy] = useState(false); const [i, setI] = useState(0);
  useEffect(() => {
    let n = 0; let t: ReturnType<typeof setTimeout> | undefined; const orig = window.fetch;
    const upd = () => { clearTimeout(t); t = setTimeout(() => setBusy(n > 0), n > 0 ? 200 : 250); };
    window.fetch = async (...a: Parameters<typeof fetch>) => { n++; upd(); try { return await orig(...a); } finally { n = Math.max(0, n - 1); upd(); } };
    return () => { window.fetch = orig; clearTimeout(t); };
  }, []);
  useEffect(() => { if (!busy) return; const x = setInterval(() => setI(v => (v + 1) % PHRASES.length), 1400); return () => clearInterval(x); }, [busy]);
  if (!busy) return null;
  return (<div role="status" aria-live="polite" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000, pointerEvents: 'none' }}>
    <style>{`@keyframes kqbar{0%{transform:translateX(-100%)}100%{transform:translateX(250%)}}@media (prefers-reduced-motion:reduce){.kqbar{animation:none!important;width:100%!important}}`}</style>
    <div style={{ height: 4, background: 'rgba(0,0,0,.08)', overflow: 'hidden' }}><div className="kqbar" style={{ height: '100%', width: '40%', background: 'linear-gradient(90deg,#0b6b4d,#c9962e)', animation: 'kqbar 1.1s linear infinite' }} /></div>
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}><span className="quran" dir="rtl" style={{ background: '#0b6b4d', color: '#fff', padding: '6px 18px', borderRadius: 999, fontSize: 20, boxShadow: '0 4px 14px rgba(0,0,0,.25)' }}>{PHRASES[i]}</span></div></div>);
}
