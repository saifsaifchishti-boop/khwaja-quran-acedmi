import { supabaseServer } from '@/lib/supabase/server';
import { getLang } from '@/lib/i18n';
import { toggleLang } from '@/lib/actions-lang';
import ThemeToggle from './ThemeToggle';
// Dark green strip at the very top: Bismillah, the announcements (admin → Marquee) or the 24/7 note, language and theme.
export default async function TopBar() {
  const l = await getLang(); const L = (en: string, ur: string) => (l === 'ur' ? ur : en);
  let live: string[] = [];
  try {
    const sb = await supabaseServer();
    const { data: s } = await sb.from('settings').select('value').eq('key', 'marquee').single();
    const cfg = (s?.value ?? { enabled: false }) as { enabled: boolean; speed: number; direction: 'ltr' | 'rtl' };
    if (cfg.enabled) {
      const today = new Date().toISOString().slice(0, 10);
      const { data: items } = await sb.from('marquee_items').select('text,starts_on,ends_on').eq('active', true).order('sort_order');
      live = (items ?? []).filter(i => (!i.starts_on || i.starts_on <= today) && (!i.ends_on || i.ends_on >= today)).map(i => i.text as string);
    }
  } catch { /* the bar still shows without announcements */ }
  const speed = 40; const dur = Math.max(10, Math.round(2000 / speed));
  const half = (cls = '') => (<div className={`flex shrink-0 ${cls}`} aria-hidden={cls ? true : undefined}>{live.map((t, k) => <span key={k} className="px-8 text-sm whitespace-nowrap" dir="auto">{t} <span className="text-gold">✦</span></span>)}</div>);
  return (
    <div className="bg-[#0A4A30] text-cream" dir="ltr">
      <div className="max-w-7xl mx-auto px-4 h-12 flex items-center gap-4">
        <span className="quran text-xl text-gold-light shrink-0" dir="rtl">بسم اللہ الرحمن الرحیم</span>
        <div className="flex-1 min-w-0 overflow-hidden hidden sm:block" role="region" aria-label="Announcements">
          {live.length ? <div className="kqa-track" style={{ ['--dur' as string]: `${dur}s` }}>{half()}{half('kqa-dup')}</div>
            : <p className="text-sm text-center opacity-90 truncate">{L('Online Quran classes, available 24/7', 'آن لائن قرآن کلاسز، ۲۴ گھنٹے دستیاب')}</p>}
        </div>
        <span className="ms-auto sm:ms-0 inline-flex items-center gap-1.5 text-xs bg-white/10 rounded-full px-2.5 py-1 shrink-0"><span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />24/7</span>
        <form action={toggleLang} className="shrink-0"><button className="flex items-center gap-1.5 text-sm px-2 py-1.5 rounded hover:bg-white/10" aria-label="Language">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></svg>
          {l === 'ur' ? 'English' : 'اردو'}<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden><path d="M6 9l6 6 6-6" /></svg></button></form>
        <ThemeToggle label={L('Light / dark mode', 'روشن / تاریک موڈ')} />
      </div>
    </div>);
}
