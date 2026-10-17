import Link from 'next/link';
import { getLang, t } from '@/lib/i18n';
import { supabaseServer } from '@/lib/supabase/server';
import { money } from '@/lib/fees';
export const dynamic = 'force-dynamic';
export default async function Courses() {
  const l = await getLang(); const d = t(l); const sb = await supabaseServer();
  const { data } = await sb.from('courses').select('*').order('sort_order');
  return (
    <main className="max-w-6xl mx-auto px-4 py-10"><h1 className="text-3xl font-bold">{d.coursesTitle}</h1>
      {!data?.length ? <p className="mt-4">{d.noCourses}</p> :
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">{data.map(c => (
          <article key={c.id} className="card p-5 flex flex-col">
            <h2 className="font-bold text-lg text-emerald dark:text-gold">{l === 'ur' && c.title_ur ? c.title_ur : c.title_en}</h2>
            <p className="mt-2 text-sm flex-1">{(l === 'ur' && c.desc_ur ? c.desc_ur : c.desc_en)}</p>
            <dl className="mt-3 text-sm space-y-1 opacity-90">{c.level && <div>{c.level}</div>}{c.duration && <div>{c.duration}</div>}{c.frequency && <div>{c.frequency}</div>}{Number(c.fee) > 0 && <div className="font-semibold">{money(c.fee, c.currency)}</div>}</dl>
            <Link href={`/register?course=${c.id}`} className="btn mt-4">{d.apply}</Link></article>))}</div>}
    </main>);
}
