'use client';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
// A large "Loading…" card in the middle of the screen whenever the site is waiting on the server:
// link clicks, page navigation, form submits and server actions.
const PHRASES = ['Please wait while the page loads.', 'Still working, one moment…', 'Almost there…'];
export default function GlobalLoader() {
  const pathname = usePathname(); const [busy, setBusy] = useState(false); const [nav, setNav] = useState(false); const [i, setI] = useState(0); const navT = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => { clearTimeout(navT.current); setNav(false); }, [pathname]);
  useEffect(() => {
    const click = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement | null)?.closest('a'); if (!a) return; const h = a.getAttribute('href');
      if (!h || !h.startsWith('/') || h.startsWith('//') || a.target === '_blank' || a.hasAttribute('download')) return;
      const u = new URL(h, location.href); if (u.pathname === location.pathname && u.search === location.search) return;
      clearTimeout(navT.current); navT.current = setTimeout(() => { setNav(true); navT.current = setTimeout(() => setNav(false), 12000); }, 120);
    };
    document.addEventListener('click', click); return () => document.removeEventListener('click', click);
  }, []);
  useEffect(() => {
    let n = 0; let t: ReturnType<typeof setTimeout> | undefined; const orig = window.fetch;
    const upd = () => { clearTimeout(t); t = setTimeout(() => setBusy(n > 0), n > 0 ? 150 : 200); };
    window.fetch = async (...a: Parameters<typeof fetch>) => {
      const u = typeof a[0] === 'string' ? a[0] : a[0] instanceof URL ? a[0].href : (a[0] as Request).url;
      if (u.includes('/realtime/') || u.includes('/api/avatar/') || u.includes('/api/live/')) return orig(...a); // background traffic never shows the loader
      if (((window as unknown as { __kqQuiet?: number }).__kqQuiet ?? 0) > 0) return orig(...a);
      n++; upd(); try { return await orig(...a); } finally { n = Math.max(0, n - 1); upd(); } };
    return () => { window.fetch = orig; clearTimeout(t); };
  }, []);
  const show = busy || nav;
  useEffect(() => { if (!show) return; const x = setInterval(() => setI(v => (v + 1) % PHRASES.length), 1800); return () => clearInterval(x); }, [show]);
  if (!show) return null;
  return (<div role="status" aria-live="polite" style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.35)', backdropFilter: 'blur(3px)' }}>
    <style>{`@keyframes kqspin{to{transform:rotate(360deg)}}@media (prefers-reduced-motion:reduce){.kqspin{animation-duration:3s!important}}`}</style>
    <div className="card" style={{ padding: '34px 44px', textAlign: 'center', boxShadow: '0 16px 50px rgba(0,0,0,.4)', width: 'min(88vw, 360px)' }}>
      <div className="kqspin" style={{ width: 64, height: 64, margin: '0 auto 16px', borderRadius: '50%', border: '6px solid var(--line)', borderTopColor: 'var(--brand)', animation: 'kqspin .9s linear infinite' }} />
      <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--brand)' }}>Loading…</div>
      <div className="quran" dir="rtl" style={{ fontSize: 22, marginTop: 4 }}>بسم اللہ الرحمن الرحیم</div>
      <div style={{ marginTop: 8, fontSize: 15, opacity: 0.8 }}>{PHRASES[i]}</div></div></div>);
}
