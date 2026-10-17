'use server';
import { requireRole } from '@/lib/auth';
import { JUZ_START, SURAHS, normalizeArabic, validRef } from '@/lib/quran-meta';
export type Ayah = { surah: number; ayah: number; text: string };
export async function loadSurah(surah: number): Promise<Ayah[]> {
  const { sb } = await requireRole('teacher'); if (!validRef(surah, 1)) return [];
  const { data } = await sb.from('quran_ayahs').select('surah,ayah,text').eq('surah', surah).order('ayah'); return data ?? [];
}
export async function loadJuz(juz: number): Promise<Ayah[]> {
  const { sb } = await requireRole('teacher'); if (juz < 1 || juz > 30) return [];
  const [s0, a0] = JUZ_START[juz - 1]; const [s1, a1] = JUZ_START[juz] ?? [115, 1];
  const { data } = await sb.from('quran_ayahs').select('surah,ayah,text').gte('surah', s0).lte('surah', Math.min(s1, 114)).order('surah').order('ayah');
  return (data ?? []).filter(x => (x.surah > s0 || x.ayah >= a0) && (x.surah < s1 || x.ayah < a1));
}
// Search: "2", "2:255", surah name, "juz 30", or Arabic text (diacritics ignored).
export async function searchQuran(q: string): Promise<{ kind: string; ayahs: Ayah[]; surah?: number; juz?: number }> {
  const { sb } = await requireRole('teacher'); q = q.trim().slice(0, 100); if (!q) return { kind: 'none', ayahs: [] };
  let m = q.match(/^(\d{1,3})\s*[:.\s]\s*(\d{1,3})$/);
  if (m && validRef(+m[1], +m[2])) { const { data } = await sb.from('quran_ayahs').select('surah,ayah,text').eq('surah', +m[1]).eq('ayah', +m[2]); return { kind: 'ayah', ayahs: data ?? [], surah: +m[1] }; }
  m = q.match(/^juz\s*(\d{1,2})$/i); if (m && +m[1] >= 1 && +m[1] <= 30) return { kind: 'juz', ayahs: await loadJuz(+m[1]), juz: +m[1] };
  if (/^\d{1,3}$/.test(q) && +q >= 1 && +q <= 114) return { kind: 'surah', ayahs: await loadSurah(+q), surah: +q };
  const norm = (x: string) => x.toLowerCase().replace(/[^a-z]/g, ''); const nq = norm(q);
  if (nq.length >= 3) { const i = SURAHS.findIndex(([n]) => norm(n).includes(nq) || norm(n).replace(/^a[a-z]?/, '').includes(nq)); if (i >= 0) return { kind: 'surah', ayahs: await loadSurah(i + 1), surah: i + 1 }; }
  const n = normalizeArabic(q); if (!/[\u0600-\u06FF]/.test(n)) return { kind: 'none', ayahs: [] };
  const { data } = await sb.from('quran_ayahs').select('surah,ayah,text').ilike('text_search', `%${n.replace(/[%_]/g, '')}%`).order('surah').order('ayah').limit(50);
  return { kind: 'text', ayahs: data ?? [] };
}
