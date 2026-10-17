import { supabaseServer } from '@/lib/supabase/server';
// Two identical halves + translateX(-50%) = seamless loop, no reset jump.
export default async function Marquee() {
  const sb = await supabaseServer();
  const { data: s } = await sb.from('settings').select('value').eq('key', 'marquee').single();
  const cfg = (s?.value ?? { enabled: false }) as { enabled: boolean; speed: number; direction: 'ltr' | 'rtl' };
  if (!cfg.enabled) return null;
  const today = new Date().toISOString().slice(0, 10);
  const { data: items } = await sb.from('marquee_items').select('text,starts_on,ends_on').eq('active', true).order('sort_order');
  const live = (items ?? []).filter(i => (!i.starts_on || i.starts_on <= today) && (!i.ends_on || i.ends_on >= today));
  if (!live.length) return null;
  const half = (cls = '') => (
    <div className={`flex shrink-0 ${cls}`} aria-hidden={cls ? true : undefined}>
      {live.map((i, k) => <span key={k} className="quran px-10 text-lg whitespace-nowrap" dir="auto">{i.text} <span className="text-gold">✦</span></span>)}
    </div>);
  const dur = Math.max(10, Math.round(2000 / Math.max(cfg.speed || 40, 5)));
  return (
    <div className="bg-emerald text-cream overflow-hidden py-2" role="region" aria-label="Announcements" dir="ltr">
      <div className={`kqa-track ${cfg.direction === 'ltr' ? 'kqa-rev' : ''}`} style={{ ['--dur' as string]: `${dur}s` }}>
        {half()}{half('kqa-dup')}
      </div>
    </div>);
}
