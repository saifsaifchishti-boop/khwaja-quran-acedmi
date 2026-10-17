import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getLang } from '@/lib/i18n';
export default async function Footer() {
  const l = await getLang(); let pages: { slug: string; title_en: string; title_ur: string }[] = [];
  try { const { data } = await supabaseAdmin().from('pages').select('slug,title_en,title_ur').eq('published', true).order('slug'); pages = data ?? []; } catch {}
  if (!pages.length) return null; // links appear only for pages the owner has published
  return (<footer className="max-w-6xl mx-auto px-4 py-6 text-sm flex flex-wrap gap-4 opacity-80">{pages.map(p => <Link key={p.slug} href={`/p/${p.slug}`} className="underline">{(l === 'ur' && p.title_ur) || p.title_en}</Link>)}</footer>);
}
