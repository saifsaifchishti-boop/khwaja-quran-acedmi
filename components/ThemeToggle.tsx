'use client';
import { useEffect, useState } from 'react';
// Light / dark switch for the top bar. The choice is remembered in this browser.
export default function ThemeToggle({ label }: { label: string }) {
  const [dark, setDark] = useState(false);
  useEffect(() => setDark(document.documentElement.classList.contains('dark')), []);
  const flip = () => { const m = !dark; setDark(m); try { localStorage.setItem('theme', m ? 'dark' : 'light'); } catch {} document.documentElement.classList.toggle('dark', m); };
  return (<button onClick={flip} aria-label={label} title={label} className="p-2 rounded-full hover:bg-white/10 text-white">
    {dark
      ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
      : <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>}
  </button>);
}
