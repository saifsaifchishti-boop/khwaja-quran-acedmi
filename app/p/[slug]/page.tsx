import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getLang } from '@/lib/i18n';
export const dynamic = 'force-dynamic';
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const l = await getLang();
  const { data: p } = await supabaseAdmin().from('pages').select('*').eq('slug', slug).eq('published', true).maybeSingle(); if (!p) notFound();
  const title = (l === 'ur' && p.title_ur) || p.title_en; const body = (l === 'ur' && p.body_ur) || p.body_en;
  return (<main className="max-w-3xl mx-auto px-4 py-8"><h1 className="text-2xl font-bold mb-4">{title}</h1>{body.split(/\n\s*\n/).map((x: string, i: number) => <p key={i} className="mb-3 whitespace-pre-wrap">{x}</p>)}</main>);
}
