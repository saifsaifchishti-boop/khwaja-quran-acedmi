import Link from 'next/link';
import Image from 'next/image';
import { getLang, t } from '@/lib/i18n';
import { supabaseServer } from '@/lib/supabase/server';
import Icon, { type IconName } from '@/components/teams/Icons';
import { pick, lines } from '@/lib/admission';
export const dynamic = 'force-dynamic';
export default async function Home() {
  const l = await getLang(); const d = t(l); const sb = await supabaseServer(); const L = (en: string, ur: string) => (l === 'ur' ? ur : en);
  const { data: courses } = await sb.from('courses').select('id,title_en,title_ur,desc_en,desc_ur,level,duration,frequency,fee,currency').order('sort_order').limit(6);
  const { data: c } = await sb.from('settings').select('value').eq('key', 'contact').single();
  const { data: ad } = await sb.from('settings').select('value').eq('key', 'admission').maybeSingle(); const adm = pick(ad?.value as any);
  const { data: pol } = await sb.from('pages').select('slug,title_en,title_ur').eq('published', true).order('slug');
  const ct = (c?.value ?? {}) as Record<string, string>; const wa = (ct.whatsapp ?? '').replace(/\D/g, '');
  const steps = [
    [L('Apply', 'درخواست دیں'), L('Fill in the short registration form.', 'مختصر رجسٹریشن فارم پُر کریں۔')],
    [L('Approval', 'منظوری'), L('The academy reviews your application personally.', 'اکیڈمی آپ کی درخواست خود دیکھتی ہے۔')],
    [L('Get your ID', 'اپنی ID حاصل کریں'), L('You receive a short, easy student ID and a temporary password.', 'آپ کو آسان مختصر طالب علم ID اور عارضی پاسورڈ ملتا ہے۔')],
    [L('Start learning', 'پڑھائی شروع کریں'), L('Meet your teacher in live video classes.', 'لائیو ویڈیو کلاس میں اپنے استاد سے ملیں۔')],
  ];
  const feats: { icon: IconName; en: string; ur: string; txt: string; txtUr: string }[] = [
    { icon: 'video', en: 'Live video classes', ur: 'لائیو ویڈیو کلاسز', txt: 'One-to-one calls with camera, microphone and screen sharing.', txtUr: 'کیمرہ، مائیکروفون اور اسکرین شیئرنگ کے ساتھ ون ٹو ون کالز۔' },
    { icon: 'chat', en: 'Chat with your teacher', ur: 'استاد سے چیٹ', txt: 'Messages, voice notes and files, with seen receipts.', txtUr: 'پیغامات، وائس نوٹس اور فائلیں، پیغام دیکھے جانے کی نشانی کے ساتھ۔' },
    { icon: 'book', en: 'Quran reader in class', ur: 'کلاس میں قرآن ریڈر', txt: 'Teachers can share an ayah with the student during the lesson.', txtUr: 'استاد سبق کے دوران طالب علم کے ساتھ آیت شیئر کر سکتے ہیں۔' },
    { icon: 'checksq', en: 'Attendance and homework', ur: 'حاضری اور ہوم ورک', txt: 'Track every class, task and result in one place.', txtUr: 'ہر کلاس، کام اور نتیجہ ایک ہی جگہ دیکھیں۔' },
    { icon: 'card', en: 'Fee cards and payments', ur: 'فیس کارڈ اور ادائیگیاں', txt: 'Clear fee cards, payment accounts and receipts.', txtUr: 'واضح فیس کارڈ، ادائیگی کے اکاؤنٹس اور رسیدیں۔' },
    { icon: 'award', en: 'Certificates', ur: 'سرٹیفکیٹس', txt: 'Certificates that anyone can verify online.', txtUr: 'ایسے سرٹیفکیٹ جنہیں کوئی بھی آن لائن تصدیق کر سکتا ہے۔' },
  ];
  const strip: { icon: IconName; en: string; ur: string; sub: string; subUr: string }[] = [
    { icon: 'user', en: 'Qualified Teachers', ur: 'اہل اساتذہ', sub: 'Experienced & Certified', subUr: 'تجربہ کار اور سند یافتہ' },
    { icon: 'clock', en: 'Flexible Timing', ur: 'لچکدار اوقات', sub: 'Learn at Your Convenience', subUr: 'اپنی سہولت سے سیکھیں' },
    { icon: 'video', en: 'Online Classes', ur: 'آن لائن کلاسز', sub: 'From Anywhere in the World', subUr: 'دنیا میں کہیں سے بھی' },
    { icon: 'shield', en: 'Safe & Secure', ur: 'محفوظ ماحول', sub: 'Your Privacy Matters', subUr: 'آپ کی پرائیویسی اہم ہے' },
  ];
  const tints = ['bg-[#e8efe9] dark:bg-[#15251c]', 'bg-[#e6f0fb] dark:bg-[#14222f]', 'bg-[#fbf1e1] dark:bg-[#2a2216]', 'bg-[#efe9fb] dark:bg-[#211b2e]'];
  const dots = ['bg-[#0A4A30]', 'bg-[#2f5fd0]', 'bg-[#8a5a12]', 'bg-[#4a3a8a]']; const cicons: IconName[] = ['book', 'book', 'award', 'star'];
  const why: { icon: IconName; en: string; ur: string; sub: string; subUr: string }[] = [
    { icon: 'user', en: 'Personalized Learning', ur: 'ذاتی توجہ', sub: 'One-to-one and group classes', subUr: 'ون ٹو ون اور گروپ کلاسز' },
    { icon: 'help', en: 'Dedicated Support', ur: 'مخصوص معاونت', sub: 'Always here to help', subUr: 'مدد کے لیے ہمیشہ حاضر' },
    { icon: 'checksq', en: 'Track Your Progress', ur: 'اپنی پیش رفت دیکھیں', sub: 'Attendance, homework and results', subUr: 'حاضری، ہوم ورک اور نتائج' },
  ];
  const rtl = l === 'ur'; const arrow = rtl ? '←' : '→';
  return (
    <main>
      <section className="relative overflow-hidden bg-[var(--hero)]">
        <div className={`hidden md:block absolute inset-y-0 w-[62%] ${rtl ? 'left-0' : 'right-0'}`} aria-hidden>
          <Image src="/hero.jpg" alt="" fill priority sizes="62vw" className="object-cover dark:brightness-75" />
          <div className="absolute inset-0" style={{ background: `linear-gradient(to ${rtl ? 'left' : 'right'}, var(--hero) 0%, transparent 42%)` }} /></div>
        <div className="relative max-w-7xl mx-auto px-4 py-10 md:py-16 md:min-h-[388px]">
          <div className="md:max-w-[52%]">
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--card)] px-4 py-1.5 text-sm"><span className="w-2.5 h-2.5 rounded-full bg-green-600" />{L('Online Quran Learning Platform', 'آن لائن قرآن لرننگ پلیٹ فارم')}</span>
            <h1 className="font-serif font-bold text-4xl md:text-[52px] leading-[1.15] mt-5">{L('Learn Quran Online', 'قرآن آن لائن سیکھیں')}<br /><span className="text-[#0A4A30] dark:text-gold">{L('with Qualified Teachers', 'اہل اساتذہ کے ساتھ')}</span></h1>
            <p className="mt-5 text-lg opacity-85 max-w-xl">{L('Khwaja Quran Academy provides one-to-one and group Quran classes with experienced and certified teachers. Learn at your own pace, from the comfort of your home.', 'خواجہ قرآن اکیڈمی تجربہ کار اور سند یافتہ اساتذہ کے ساتھ ون ٹو ون اور گروپ قرآن کلاسز فراہم کرتی ہے۔ اپنی رفتار سے، اپنے گھر کی سہولت میں سیکھیں۔')}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/register" className="btn !min-h-[52px] !px-6 gap-2"><Icon n="users" size={18} />{L('Start Learning', 'سیکھنا شروع کریں')} <span aria-hidden>{arrow}</span></Link>
              <Link href="/demo" className="btn btn-ghost !min-h-[52px] !px-6 gap-2 !bg-[var(--card)]"><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden><circle cx="12" cy="12" r="11" fill="currentColor" /><path d="M10 8l6 4-6 4z" fill="var(--card)" /></svg>{L('Free Demo Class', 'مفت ڈیمو کلاس')}</Link></div></div>
          <div className="md:hidden relative h-56 mt-8 rounded-2xl overflow-hidden"><Image src="/hero.jpg" alt="" fill sizes="100vw" className="object-cover dark:brightness-75" /></div></div></section>

      <section className="max-w-7xl mx-auto px-4 py-4"><div className="card grid grid-cols-2 lg:grid-cols-4 gap-4 p-4">{strip.map(x => (
        <div key={x.en} className="flex items-center gap-3"><span className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-[#12261b] text-[#0A4A30] dark:text-gold flex items-center justify-center shrink-0"><Icon n={x.icon} size={24} /></span>
          <span className="min-w-0"><b className="block text-[15px]">{L(x.en, x.ur)}</b><span className="block text-sm opacity-70">{L(x.sub, x.subUr)}</span></span></div>))}</div></section>

      <section className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex flex-wrap items-end justify-between gap-3"><div>
          <p className="text-xs font-bold tracking-[0.2em] text-[#0A4A30] dark:text-gold uppercase">{L('Our Courses', 'ہمارے کورسز')}</p>
          <h2 className="font-serif font-bold text-3xl mt-1">{L('What Do You Want to Learn?', 'آپ کیا سیکھنا چاہتے ہیں؟')}</h2>
          <p className="opacity-75 mt-1">{L('Choose from a variety of courses and start your Quranic journey today.', 'مختلف کورسز میں سے منتخب کریں اور آج ہی اپنا قرآنی سفر شروع کریں۔')}</p></div>
          <Link href="/courses" className="underline text-[#0A4A30] dark:text-gold font-medium">{L('View All Courses', 'تمام کورسز دیکھیں')} {arrow}</Link></div>
        {!courses?.length ? <p className="mt-6 opacity-80">{d.noCourses}</p> :
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">{courses.slice(0, 4).map((x, k) => (
            <article key={x.id} className={`rounded-2xl border border-[var(--line)] p-5 flex flex-col ${tints[k % 4]}`}>
              <div className="flex items-center gap-3"><span className={`w-14 h-14 rounded-full text-white flex items-center justify-center shrink-0 ${dots[k % 4]}`}><Icon n={cicons[k % 4]} size={26} /></span>
                <h3 className="font-serif font-bold text-lg leading-tight">{l === 'ur' && x.title_ur ? x.title_ur : x.title_en}</h3></div>
              <p className="mt-3 text-sm opacity-80 line-clamp-2 flex-1">{(l === 'ur' && x.desc_ur ? x.desc_ur : x.desc_en) || ''}</p>
              {Number(x.fee) > 0 && <p className="mt-2 text-sm font-bold">{x.currency} {Number(x.fee).toLocaleString()}</p>}
              <Link href={`/register?course=${x.id}`} className="btn btn-sm self-start mt-3 gap-2">{L('Enroll Now', 'داخلہ لیں')} <span aria-hidden>{arrow}</span></Link></article>))}</div>}
      </section>

      <section id="about" className="bg-[#0A4A30] text-cream scroll-mt-20"><div className="max-w-7xl mx-auto px-4 py-10 grid lg:grid-cols-[260px_1fr] gap-8 items-center">
        <div><p className="text-xs font-bold tracking-[0.2em] text-gold-light uppercase">{L('Why choose us', 'ہمیں کیوں چنیں')}</p><h2 className="font-serif font-bold text-3xl mt-1">{L('Our Commitment', 'ہمارا عزم')}</h2></div>
        <div className="grid sm:grid-cols-3 gap-4">{why.map(x => (
          <div key={x.en} className="rounded-xl bg-white/10 border border-white/10 p-4 flex items-center gap-4"><span className="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center shrink-0"><Icon n={x.icon} size={24} /></span>
            <span><b className="block">{L(x.en, x.ur)}</b><span className="block text-sm opacity-80">{L(x.sub, x.subUr)}</span></span></div>))}</div></div></section>

      <section className="max-w-7xl mx-auto px-4 py-10">
        <h2 className="font-serif text-2xl font-bold">{L('Everything in one place', 'سب کچھ ایک ہی جگہ')}</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">{feats.map(f => (
          <article key={f.en} className="card p-5 flex gap-4"><span className="shrink-0 w-12 h-12 rounded-xl bg-emerald-100 dark:bg-[#12261b] text-emerald dark:text-gold flex items-center justify-center"><Icon n={f.icon} size={24} /></span>
            <div><h3 className="font-bold">{L(f.en, f.ur)}</h3><p className="text-sm opacity-80 mt-1">{L(f.txt, f.txtUr)}</p></div></article>))}</div>
      </section>

      <section id="demo" className="max-w-7xl mx-auto px-4 py-12"><div className="card p-6 md:p-8 flex flex-wrap items-center justify-between gap-5 border-s-4 border-[var(--gold)]">
        <div className="max-w-2xl"><h2 className="text-3xl font-bold">{L('Try a free demo class', 'مفت ڈیمو کلاس آزمائیں')}</h2>
          <p className="mt-2 opacity-85">{L('Meet a teacher in a live one-to-one video class before you decide. Fill in a short form and we will arrange it. Our service runs 24/7, so we can find a time that suits you.', 'فیصلے سے پہلے لائیو ون ٹو ون ویڈیو کلاس میں استاد سے ملیں۔ مختصر فارم پُر کریں، ہم وقت طے کر لیں گے۔ ہماری سروس ۲۴ گھنٹے دستیاب ہے، اس لیے آپ کے مناسب وقت کا انتظام ہو جاتا ہے۔')}</p></div>
        <Link href="/demo" className="btn btn-gold !px-7 !py-3 text-lg">{L('Apply for a demo class', 'ڈیمو کلاس کے لیے درخواست دیں')}</Link></div></section>

      <section id="admission" className="bg-emerald-100 dark:bg-[#12261b] scroll-mt-16"><div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-3xl font-bold">{L('Admission', 'داخلہ')}</h2><p className="opacity-80 mt-1">{L('Everything you need to know before you apply.', 'درخواست دینے سے پہلے جو کچھ جاننا ضروری ہے۔')}</p></div>
          <Link href="/register" className="btn btn-gold !px-6">{d.register}</Link></div>
        <div className="grid lg:grid-cols-3 gap-4 mt-6">{([
          [L('Requirements', 'ضروریات'), 'clipboard', lines(L(adm.requirements_en, adm.requirements_ur)), false],
          [L('How to take admission', 'داخلہ لینے کا طریقہ'), 'checksq', lines(L(adm.steps_en, adm.steps_ur)), true],
          [L('Fees and how to pay', 'فیس اور ادائیگی کا طریقہ'), 'card', lines(L(adm.fees_en, adm.fees_ur)), true]] as [string, IconName, string[], boolean][]).map(([h, ic, items, num]) => (
          <article key={h} className="card p-5"><h3 className="font-bold text-lg flex items-center gap-2 text-emerald dark:text-gold"><Icon n={ic} size={22} />{h}</h3>
            {num ? <ol className="mt-3 space-y-2 list-decimal ps-5">{items.map(x => <li key={x}>{x}</li>)}</ol> : <ul className="mt-3 space-y-2">{items.map(x => <li key={x} className="flex gap-2"><span className="text-emerald dark:text-gold">✓</span><span>{x}</span></li>)}</ul>}</article>))}</div></div></section>

      <section className="max-w-7xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-bold">{d.benefitsTitle}</h2>
        <ul className="grid sm:grid-cols-2 gap-3 mt-4">{[d.b1, d.b2, d.b3, d.b4].map(b => <li key={b} className="card p-4">✓ {b}</li>)}</ul></section>

      <section id="teachers" className="bg-emerald text-cream"><div className="max-w-7xl mx-auto px-4 py-10 flex flex-wrap items-center justify-between gap-4">
        <div><h2 className="text-2xl font-bold">{L('Are you a Quran teacher?', 'کیا آپ قرآن کے استاد ہیں؟')}</h2><p className="mt-1 opacity-90">{L('Apply to teach with the academy. We review every application personally.', 'اکیڈمی کے ساتھ پڑھانے کے لیے درخواست دیں۔ ہم ہر درخواست خود دیکھتے ہیں۔')}</p></div>
        <div className="flex gap-3 flex-wrap"><Link href="/teach" className="btn btn-gold">{d.teacherApply}</Link><Link href="/teacher/login" className="btn bg-cream !text-emerald">{d.teacherLogin}</Link></div></div></section>

      <section id="policies" className="bg-emerald-100 dark:bg-[#12261b] scroll-mt-16"><div className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold">{L('Policies and rules', 'پالیسیاں اور قواعد')}</h2><p className="opacity-80 mt-1">{L('Please read these before you apply. They protect students, parents and teachers.', 'درخواست سے پہلے انہیں ضرور پڑھیں۔ یہ طلبہ، والدین اور اساتذہ سب کی حفاظت کرتی ہیں۔')}</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-5">{(pol ?? []).length === 0 ? <p className="opacity-70">{L('Policies will be published soon.', 'پالیسیاں جلد شائع کی جائیں گی۔')}</p> : (pol ?? []).map(x => (
          <Link key={x.slug} href={`/p/${x.slug}`} className="card p-4 flex items-center gap-3 hover:border-[var(--gold)]"><span className="w-10 h-10 rounded-full bg-emerald text-cream flex items-center justify-center shrink-0"><Icon n="shield" size={20} /></span><b className="flex-1">{(l === 'ur' && x.title_ur) || x.title_en}</b><span aria-hidden>→</span></Link>))}</div></div></section>

      <section className="max-w-7xl mx-auto px-4 py-10"><h2 className="text-2xl font-bold">{d.faqTitle}</h2>
        <div className="mt-4 space-y-3">{[[d.q1, d.a1], [d.q2, d.a2], [d.q3, d.a3]].map(([q, a]) => (
          <details key={q} className="card p-4"><summary className="font-semibold cursor-pointer">{q}</summary><p className="mt-2 opacity-90">{a}</p></details>))}</div></section>

      <footer id="contact" className="bg-emerald text-cream"><div className="max-w-7xl mx-auto px-4 py-10">
        <h2 className="text-xl font-bold">{d.contactTitle}</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          {wa && <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" className="btn btn-gold">WhatsApp</a>}
          {ct.email && <a href={`mailto:${ct.email}`} className="btn bg-cream !text-emerald">{L('Email us', 'ای میل کریں')}</a>}
          {ct.phone && <a href={`tel:${ct.phone.replace(/\s/g, '')}`} className="btn btn-ghost !text-cream !border-cream">{L('Call', 'کال کریں')}</a>}
          <Link href="/login" className="btn btn-ghost !text-cream !border-cream">{d.studentLogin}</Link></div>
        <ul className="mt-4 space-y-1 text-sm">{ct.email && <li>✉ {ct.email}</li>}{ct.whatsapp && <li>WhatsApp: {ct.whatsapp}</li>}{ct.phone && <li>☎ {ct.phone}</li>}{ct.address && <li>{ct.address}</li>}{ct.hours && <li>{ct.hours}</li>}</ul>
        <p className="mt-6 text-sm opacity-80">© {new Date().getFullYear()} {d.brand}</p></div></footer>
      <a href={wa ? `https://wa.me/${wa}` : '#contact'} {...(wa ? { target: '_blank', rel: 'noopener noreferrer' } : {})} aria-label={L('Contact us', 'ہم سے رابطہ کریں')} className="fixed bottom-5 end-5 z-30 w-14 h-14 rounded-full bg-[#0A4A30] text-white flex items-center justify-center shadow-xl hover:scale-105 transition"><Icon n="chat" size={26} /></a>
    </main>);
}
