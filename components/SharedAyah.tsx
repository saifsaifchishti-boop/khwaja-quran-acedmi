'use client';
import { useEffect, useMemo, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { SURAHS } from '@/lib/quran-meta';
// Student side: shows the ayah the teacher shares during class (Supabase Realtime on quran_shares; RLS limits it to this session).
export default function SharedAyah({ sessionId }: { sessionId: string }) {
  const sb = useMemo(() => supabaseBrowser(), []); const [a, setA] = useState<{ surah: number; ayah: number; text: string } | null>(null);
  useEffect(() => {
    const show = async (s: number, n: number) => { const { data } = await sb.from('quran_ayahs').select('surah,ayah,text').eq('surah', s).eq('ayah', n).maybeSingle(); if (data) setA(data); };
    sb.from('quran_shares').select('surah,ayah').eq('session_id', sessionId).order('created_at', { ascending: false }).limit(1).then(({ data }) => { if (data?.[0]) show(data[0].surah, data[0].ayah); });
    const ch = sb.channel(`share:${sessionId}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'quran_shares', filter: `session_id=eq.${sessionId}` }, p => show((p.new as any).surah, (p.new as any).ayah)).subscribe();
    return () => { sb.removeChannel(ch); };
  }, [sb, sessionId]);
  return (<div className="card p-4 text-center" aria-live="polite"><h2 className="font-bold mb-2" dir="ltr">Ayah shared by your teacher</h2>
    {a ? <><p className="quran text-4xl leading-[2.2]" dir="rtl">{a.text}</p><p className="text-sm opacity-70" dir="ltr">{SURAHS[a.surah - 1][0]} · {a.surah}:{a.ayah}</p></> : <p className="opacity-70" dir="ltr">Nothing shared yet.</p>}</div>);
}
