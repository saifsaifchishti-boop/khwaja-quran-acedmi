import Link from 'next/link';
import Image from 'next/image';
import { getLang, t } from '@/lib/i18n';
import { supabaseServer } from '@/lib/supabase/server';
export const dynamic = 'force-dynamic';
export default async function Home() {
  const l = await getLang(); const d = t(l); const sb = await supabaseServer();
  const { data: courses } = await sb.from('courses').select('id,title_en,title_ur,desc_en,desc_ur,level,duration,frequency').order('sort_order').limit(6);
  const { data: c } = await sb.from('settings').select('value').eq('key', 'contact').single();
  const ct = (c?.value ?? {}) as Record<string, string>;
  return (
    <main>
      <section className="bg-emerald text-cream">
        <div className="max-w-6xl mx-auto px-4 py-12 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">{d.brand}</h1>
            <p className="mt-3 text-lg">{d.tagline}</p><p className="mt-2 opacity-90">{d.heroSub}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/register" className="btn btn-gold">{d.register}</Link>
              <Link href="/login" className="btn bg-cream !text-emerald">{d.studentLogin}</Link>
              <a href="#teachers" className="btn btn-ghost !text-cream !border-cream">{d.teacherApply}</a>
              <a href="#contact" className="btn btn-ghost !text-cream !border-cream">{d.contact}</a>
            </div>
          </div>
          <div className="flex justify-center"><Image src="/logo.svg" alt={d.brand} width={240} height={240} priority /></div>
        </div>
      </section>
      <section className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between"><h2 className="text-2xl font-bold">{d.coursesTitle}</h2><Link href="/courses" className="underline">{d.courses} →</Link></div>
        {!courses?.length ? <p className="mt-4 opacity-80">{d.noCourses}</p> :
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">{courses.map(x => (
            <article key={x.id} className="card p-5"><h3 className="font-bold text-lg text-emerald dark:text-gold">{l === 'ur' && x.title_ur ? x.title_ur : x.title_en}</h3>
              <p className="mt-2 text-sm opacity-90">{(l === 'ur' && x.desc_ur ? x.desc_ur : x.desc_en) || ''}</p>
              <p className="mt-2 text-xs opacity-70">{[x.level, x.duration, x.frequency].filter(Boolean).join(' · ')}</p></article>))}</div>}
      </section>
      <section className="bg-emerald-100 dark:bg-[#12261b]"><div className="max-w-6xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-bold">{d.benefitsTitle}</h2>
        <ul className="grid sm:grid-cols-2 gap-3 mt-4">{[d.b1, d.b2, d.b3, d.b4].map(b => <li key={b} className="card p-4">✓ {b}</li>)}</ul></div></section>
      <section id="teachers" className="max-w-6xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-bold">{d.teacherApply}</h2>
        <p className="mt-2 opacity-90">{l === 'ur' ? 'استاد کی درخواست کا فارم اگلے مرحلے میں شامل ہوگا۔' : 'The teacher application form arrives in the next build stage.'}</p></section>
      <section className="max-w-6xl mx-auto px-4 py-10"><h2 className="text-2xl font-bold">{d.faqTitle}</h2>
        <div className="mt-4 space-y-3">{[[d.q1, d.a1], [d.q2, d.a2], [d.q3, d.a3]].map(([q, a]) => (
          <details key={q} className="card p-4"><summary className="font-semibold cursor-pointer">{q}</summary><p className="mt-2 opacity-90">{a}</p></details>))}</div></section>
      <footer id="contact" className="bg-emerald text-cream"><div className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-xl font-bold">{d.contactTitle}</h2>
        <ul className="mt-3 space-y-1">{ct.email && <li>✉ {ct.email}</li>}{ct.whatsapp && <li>WhatsApp: {ct.whatsapp}</li>}{ct.phone && <li>☎ {ct.phone}</li>}{ct.address && <li>{ct.address}</li>}{ct.hours && <li>{ct.hours}</li>}</ul>
        <p className="mt-6 text-sm opacity-80">© {new Date().getFullYear()} {d.brand}</p></div></footer>
    </main>);
}
