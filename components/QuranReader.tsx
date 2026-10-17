'use client';
import { useEffect, useState, useTransition, useRef } from 'react';
import { loadSurah, loadJuz, searchQuran, type Ayah } from '@/app/teacher/quran/actions';
import { saveBookmark, deleteBookmark, shareAyah } from '@/app/teacher/actions';
import { SURAHS, juzOf } from '@/lib/quran-meta';
type BM = { surah: number; ayah: number; note: string | null };
export default function QuranReader({ sessionId, bookmarks: bm0, compact }: { sessionId?: string; bookmarks: BM[]; compact?: boolean }) {
  const [ayahs, setAyahs] = useState<Ayah[]>([]); const [surah, setSurah] = useState(1); const [sel, setSel] = useState<Ayah | null>(null); const [mode, setMode] = useState<'verse' | 'flow'>('verse');
  const [zoom, setZoom] = useState(32); const [pres, setPres] = useState(false); const [q, setQ] = useState(''); const [bms, setBms] = useState(bm0); const [note, setNote] = useState(''); const [msg, setMsg] = useState('');
  const [pending, start] = useTransition(); const box = useRef<HTMLDivElement>(null);
  const open = (s: number) => start(async () => { setSurah(s); setAyahs(await loadSurah(s)); setSel(null); setMsg(''); });
  useEffect(() => { open(1); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const idx = sel ? ayahs.findIndex(a => a.surah === sel.surah && a.ayah === sel.ayah) : -1;
  const go = (d: number) => { const n = ayahs[idx + d]; if (n) pick(n); };
  const pick = (a: Ayah) => { setSel(a); setNote(bms.find(b => b.surah === a.surah && b.ayah === a.ayah)?.note ?? ''); document.getElementById(`a-${a.surah}-${a.ayah}`)?.scrollIntoView({ block: 'center' }); };
  const marked = sel && bms.some(b => b.surah === sel.surah && b.ayah === sel.ayah);
  const doSearch = (e: React.FormEvent) => { e.preventDefault(); start(async () => { const r = await searchQuran(q); setAyahs(r.ayahs); if (r.surah) setSurah(r.surah); setSel(null); setMsg(r.ayahs.length ? `${r.ayahs.length} ayah(s)` : 'No results'); }); };
  useEffect(() => { const k = (e: KeyboardEvent) => { if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return; if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') go(1); if (e.key === 'ArrowUp' || e.key === 'ArrowRight') go(-1); if (e.key === 'Escape') setPres(false); }; addEventListener('keydown', k); return () => removeEventListener('keydown', k); });
  const fmt = (a: Ayah) => `${a.text} (${SURAHS[a.surah - 1][0]} ${a.surah}:${a.ayah})`;
  if (pres && sel) return (<div className="fixed inset-0 z-50 bg-[var(--bg)] flex flex-col items-center justify-center p-6 text-center"><p className="quran leading-[2.2]" dir="rtl" style={{ fontSize: Math.max(zoom, 40) }}>{sel.text}</p>
    <p className="mt-4 opacity-70">{SURAHS[sel.surah - 1][0]} · {sel.surah}:{sel.ayah}</p><div className="flex gap-2 mt-6"><button className="btn btn-ghost" onClick={() => go(-1)}>◀ Prev</button><button className="btn btn-ghost" onClick={() => go(1)}>Next ▶</button><button className="btn" onClick={() => setPres(false)}>Exit</button></div></div>);
  return (<div className="space-y-3" dir="ltr"><form onSubmit={doSearch} className="flex flex-wrap gap-2"><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search: Baqarah · 2:255 · juz 30 · Arabic text" aria-label="Search the Quran" className="inp flex-1 min-w-52" />
      <button className="btn btn-sm">Search</button></form>
    <div className="flex flex-wrap gap-2 items-center"><select value={surah} onChange={e => open(+e.target.value)} aria-label="Surah" className="inp !w-auto">{SURAHS.map(([n, c], i) => <option key={n} value={i + 1}>{i + 1}. {n} ({c})</option>)}</select>
      <select defaultValue="" onChange={e => { const j = +e.target.value; if (j) start(async () => { setAyahs(await loadJuz(j)); setSel(null); }); }} aria-label="Juz" className="inp !w-auto"><option value="">Juz…</option>{Array.from({ length: 30 }, (_, i) => <option key={i} value={i + 1}>Juz {i + 1}</option>)}</select>
      <button className="btn btn-ghost btn-sm" onClick={() => setMode(mode === 'verse' ? 'flow' : 'verse')}>{mode === 'verse' ? 'Mushaf flow' : 'Verse list'}</button>
      <button className="btn btn-ghost btn-sm" onClick={() => setZoom(z => Math.max(20, z - 4))} aria-label="Smaller">A−</button><button className="btn btn-ghost btn-sm" onClick={() => setZoom(z => Math.min(80, z + 4))} aria-label="Larger">A+</button>
      {sel && <button className="btn btn-gold btn-sm" onClick={() => setPres(true)}>Presentation</button>}{pending && <span className="text-sm opacity-70">Loading…</span>}{msg && <span className="text-sm opacity-70">{msg}</span>}</div>
    {sel && <div className="card p-3 flex flex-wrap gap-2 items-center"><b className="text-sm">{SURAHS[sel.surah - 1][0]} {sel.surah}:{sel.ayah} · Juz {juzOf(sel.surah, sel.ayah)}</b>
      <button className="btn btn-ghost btn-sm" onClick={() => go(-1)}>◀</button><button className="btn btn-ghost btn-sm" onClick={() => go(1)}>▶</button>
      <button className="btn btn-ghost btn-sm" onClick={async () => { await navigator.clipboard.writeText(fmt(sel)); setMsg('Copied'); }}>Copy</button>
      {sessionId && <button className="btn btn-sm" onClick={() => start(async () => { const r = await shareAyah(sessionId, sel.surah, sel.ayah); setMsg(r.error ?? 'Shared with student'); })}>Share with student</button>}
      <input value={note} onChange={e => setNote(e.target.value)} placeholder="Private note" aria-label="Private note" className="inp !min-h-9 flex-1 min-w-40" />
      <button className="btn btn-sm btn-ghost" onClick={() => start(async () => { await saveBookmark(sel.surah, sel.ayah, note); setBms(b => [...b.filter(x => !(x.surah === sel.surah && x.ayah === sel.ayah)), { surah: sel.surah, ayah: sel.ayah, note }]); setMsg('Bookmark saved'); })}>{marked ? 'Update bookmark' : 'Bookmark'}</button>
      {marked && <button className="btn btn-sm btn-red" onClick={() => start(async () => { await deleteBookmark(sel.surah, sel.ayah); setBms(b => b.filter(x => !(x.surah === sel.surah && x.ayah === sel.ayah))); })}>Remove</button>}</div>}
    <div ref={box} className={`card p-4 overflow-y-auto ${compact ? 'max-h-[50vh]' : 'max-h-[65vh]'} quran`} dir="rtl" style={{ fontSize: zoom, lineHeight: 2.2 }}>
      {ayahs.length === 0 && !pending && <p className="text-base opacity-70" dir="ltr">No Quran text loaded. Import the Tanzil dataset first (README → “Quran data”).</p>}
      {mode === 'flow' ? <p>{ayahs.map(a => <span key={`${a.surah}:${a.ayah}`} id={`a-${a.surah}-${a.ayah}`} onClick={() => pick(a)} className={`cursor-pointer rounded px-0.5 ${sel?.surah === a.surah && sel.ayah === a.ayah ? 'bg-[var(--gold)]/40' : ''}`}>{a.text} <span className="text-[0.5em] opacity-60">﴿{a.ayah}﴾</span> </span>)}</p>
        : ayahs.map(a => <div key={`${a.surah}:${a.ayah}`} id={`a-${a.surah}-${a.ayah}`} onClick={() => pick(a)} className={`cursor-pointer py-2 border-b border-[var(--line)] ${sel?.surah === a.surah && sel.ayah === a.ayah ? 'bg-[var(--gold)]/30' : ''} ${bms.some(b => b.surah === a.surah && b.ayah === a.ayah) ? 'border-s-4 border-s-[var(--gold)]' : ''}`}>{a.text} <span className="text-[0.5em] opacity-60">﴿{a.ayah}﴾</span>{ayahs[0].surah !== a.surah || ayahs.length > 0 && new Set(ayahs.map(x => x.surah)).size > 1 ? <span className="text-xs opacity-50" dir="ltr"> {a.surah}:{a.ayah}</span> : null}</div>)}</div>
    {bms.length > 0 && !compact && <details className="card p-3"><summary className="cursor-pointer font-semibold">My bookmarks ({bms.length})</summary><ul className="text-sm mt-2 space-y-1">{bms.map(b => <li key={`${b.surah}:${b.ayah}`}><button className="underline" onClick={() => start(async () => { setSurah(b.surah); const l = await loadSurah(b.surah); setAyahs(l); const a = l.find(x => x.ayah === b.ayah); if (a) setTimeout(() => pick(a), 50); })}>{SURAHS[b.surah - 1][0]} {b.surah}:{b.ayah}</button> {b.note && <span className="opacity-70">— {b.note}</span>}</li>)}</ul></details>}
    <p className="text-xs opacity-60">Text: Tanzil Uthmani (unmodified) — tanzil.net. Surah names are transliterations. Page-number view needs a page-mapping dataset (not included).</p></div>);
}
