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
  const quick: { href: string; icon: IconName; en: string; ur: string; sub: string; subUr: string }[] = [
    { href: '/register', icon: 'user', en: 'Register as Student', ur: 'طالب علم رجسٹریشن', sub: 'Apply for admission', subUr: 'داخلے کے لیے درخواست' },
    { href: '/login', icon: 'lock', en: 'Student Login', ur: 'طالب علم لاگ اِن', sub: 'Classes, chat, homework', subUr: 'کلاسز، چیٹ، ہوم ورک' },
    { href: '/teacher/login', icon: 'briefcase', en: 'Teacher Login', ur: 'استاد لاگ اِن', sub: 'Your students and calls', subUr: 'آپ کے طلبہ اور کالز' },
    { href: '/teach', icon: 'book', en: 'Teach With Us', ur: 'ہمارے ساتھ پڑھائیں', sub: 'Apply as a teacher', subUr: 'استاد کے لیے درخواست' },
    { href: '/courses', icon: 'calendar', en: 'Our Courses', ur: 'ہمارے کورسز', sub: 'See what we teach', subUr: 'ہم کیا پڑھاتے ہیں' },
    { href: '/forgot-password', icon: 'help', en: 'Forgot Password', ur: 'پاسورڈ بھول گئے', sub: 'Reset it by email', subUr: 'ای میل سے ری سیٹ کریں' },
    { href: '#contact', icon: 'phone', en: 'Contact Us', ur: 'رابطہ کریں', sub: 'WhatsApp, email, phone', subUr: 'واٹس ایپ، ای میل، فون' },
    { href: '/admin/login', icon: 'shield', en: 'Administrator', ur: 'منتظم', sub: 'Academy staff only', subUr: 'صرف اکیڈمی عملہ' },
  ];
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
  return (
    <main>
      <section className="bg-emerald text-cream" style={{ backgroundImage: 'radial-gradient(circle at 85% 20%, rgba(201,150,47,.25), transparent 45%)' }}>
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-24 md:min-h-[78vh] grid md:grid-cols-2 gap-10 items-center">
          <div>
            <p className="quran text-2xl text-gold-light" dir="rtl">بسم اللہ الرحمن الرحیم</p>
            <h1 className="text-4xl md:text-6xl font-bold mt-3 leading-tight">{d.brand}</h1>
            <p className="mt-4 text-xl md:text-2xl">{d.tagline}</p><p className="mt-3 text-lg opacity-90">{d.heroSub}</p>
            <div className="mt-8 flex flex-wrap gap-3 text-lg">
              <Link href="/register" className="btn btn-gold !px-7 !py-3">{d.register}</Link>
              <Link href="/login" className="btn bg-cream !text-emerald">{d.studentLogin}</Link>
              <Link href="/teacher/login" className="btn btn-ghost !text-cream !border-cream">{d.teacherLogin}</Link>
              <Link href="/teach" className="btn btn-ghost !text-cream !border-cream">{d.teacherApply}</Link>
            </div>
          </div>
          <div className="flex justify-center"><Image src="/logo.svg" alt={d.brand} width={340} height={340} priority /></div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-bold">{L('Quick access', 'فوری رسائی')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">{quick.map(q => (
          <Link key={q.href + q.en} href={q.href} className="card p-4 flex flex-col gap-2 hover:border-[var(--gold)] hover:-translate-y-0.5 transition">
            <span className="w-11 h-11 rounded-full bg-emerald text-cream flex items-center justify-center"><Icon n={q.icon} size={22} /></span>
            <b>{L(q.en, q.ur)}</b><span className="text-sm opacity-70">{L(q.sub, q.subUr)}</span></Link>))}</div>
      </section>

      <section id="admission" className="bg-emerald-100 dark:bg-[#12261b] scroll-mt-16"><div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-3xl font-bold">{L('Admission', 'داخلہ')}</h2><p className="opacity-80 mt-1">{L('Everything you need to know before you apply.', 'درخواست دینے سے پہلے جو کچھ جاننا ضروری ہے۔')}</p></div>
          <Link href="/register" className="btn btn-gold !px-6">{d.register}</Link></div>
        <div className="grid lg:grid-cols-3 gap-4 mt-6">{([
          [L('Requirements', 'ضروریات'), 'clipboard', lines(L(adm.requirements_en, adm.requirements_ur)), false],
          [L('How to take admission', 'داخلہ لینے کا طریقہ'), 'checksq', lines(L(adm.steps_en, adm.steps_ur)), true],
          [L('Fees and how to pay', 'فیس اور ادائیگی کا طریقہ'), 'card', lines(L(adm.fees_en, adm.fees_ur)), true]] as [string, IconName, string[], boolean][]).map(([h, ic, items, num]) => (
          <article key={h} className="card p-5"><h3 className="font-bold text-lg flex items-center gap-2 text-emerald dark:text-gold"><Icon n={ic} size={22} />{h}</h3>
            {num ? <ol className="mt-3 space-y-2 list-decimal ps-5">{items.map(x => <li key={x}>{x}</li>)}</ol> : <ul className="mt-3 space-y-2">{items.map(x => <li key={x} className="flex gap-2"><span className="text-emerald dark:text-gold">✓</span><span>{x}</span></li>)}</ul>}</article>))}</div></div></section>

      <section className="max-w-6xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-bold">{L('Everything in one place', 'سب کچھ ایک ہی جگہ')}</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">{feats.map(f => (
          <article key={f.en} className="card p-5 flex gap-4"><span className="shrink-0 w-12 h-12 rounded-xl bg-emerald-100 dark:bg-[#12261b] text-emerald dark:text-gold flex items-center justify-center"><Icon n={f.icon} size={24} /></span>
            <div><h3 className="font-bold">{L(f.en, f.ur)}</h3><p className="text-sm opacity-80 mt-1">{L(f.txt, f.txtUr)}</p></div></article>))}</div>
      </section>

      <section className="bg-emerald-100 dark:bg-[#12261b]"><div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between"><h2 className="text-2xl font-bold">{d.coursesTitle}</h2><Link href="/courses" className="btn btn-ghost btn-sm">{d.courses} →</Link></div>
        {!courses?.length ? <p className="mt-4 opacity-80">{d.noCourses}</p> :
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">{courses.map(x => (
            <article key={x.id} className="card p-5"><h3 className="font-bold text-lg text-emerald dark:text-gold">{l === 'ur' && x.title_ur ? x.title_ur : x.title_en}</h3>
              <p className="mt-2 text-sm opacity-90">{(l === 'ur' && x.desc_ur ? x.desc_ur : x.desc_en) || ''}</p>
              <p className="mt-2 text-xs opacity-70">{[x.level, x.duration, x.frequency].filter(Boolean).join(' · ')}</p>
              {Number(x.fee) > 0 && <p className="mt-2 font-bold">{L('Fee', 'فیس')}: {x.currency} {Number(x.fee).toLocaleString()}</p>}
              <Link href={`/register?course=${x.id}`} className="btn btn-sm mt-3">{L('Apply for this course', 'اس کورس کے لیے درخواست')}</Link></article>))}</div>}
      </div></section>

      <section className="max-w-6xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-bold">{d.benefitsTitle}</h2>
        <ul className="grid sm:grid-cols-2 gap-3 mt-4">{[d.b1, d.b2, d.b3, d.b4].map(b => <li key={b} className="card p-4">✓ {b}</li>)}</ul></section>

      <section id="teachers" className="bg-emerald text-cream"><div className="max-w-6xl mx-auto px-4 py-10 flex flex-wrap items-center justify-between gap-4">
        <div><h2 className="text-2xl font-bold">{L('Are you a Quran teacher?', 'کیا آپ قرآن کے استاد ہیں؟')}</h2><p className="mt-1 opacity-90">{L('Apply to teach with the academy. We review every application personally.', 'اکیڈمی کے ساتھ پڑھانے کے لیے درخواست دیں۔ ہم ہر درخواست خود دیکھتے ہیں۔')}</p></div>
        <div className="flex gap-3 flex-wrap"><Link href="/teach" className="btn btn-gold">{d.teacherApply}</Link><Link href="/teacher/login" className="btn bg-cream !text-emerald">{d.teacherLogin}</Link></div></div></section>

      <section id="policies" className="bg-emerald-100 dark:bg-[#12261b] scroll-mt-16"><div className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold">{L('Policies and rules', 'پالیسیاں اور قواعد')}</h2><p className="opacity-80 mt-1">{L('Please read these before you apply. They protect students, parents and teachers.', 'درخواست سے پہلے انہیں ضرور پڑھیں۔ یہ طلبہ، والدین اور اساتذہ سب کی حفاظت کرتی ہیں۔')}</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-5">{(pol ?? []).length === 0 ? <p className="opacity-70">{L('Policies will be published soon.', 'پالیسیاں جلد شائع کی جائیں گی۔')}</p> : (pol ?? []).map(x => (
          <Link key={x.slug} href={`/p/${x.slug}`} className="card p-4 flex items-center gap-3 hover:border-[var(--gold)]"><span className="w-10 h-10 rounded-full bg-emerald text-cream flex items-center justify-center shrink-0"><Icon n="shield" size={20} /></span><b className="flex-1">{(l === 'ur' && x.title_ur) || x.title_en}</b><span aria-hidden>→</span></Link>))}</div></div></section>

      <section className="max-w-6xl mx-auto px-4 py-10"><h2 className="text-2xl font-bold">{d.faqTitle}</h2>
        <div className="mt-4 space-y-3">{[[d.q1, d.a1], [d.q2, d.a2], [d.q3, d.a3]].map(([q, a]) => (
          <details key={q} className="card p-4"><summary className="font-semibold cursor-pointer">{q}</summary><p className="mt-2 opacity-90">{a}</p></details>))}</div></section>

      <footer id="contact" className="bg-emerald text-cream"><div className="max-w-6xl mx-auto px-4 py-10">
        <h2 className="text-xl font-bold">{d.contactTitle}</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          {wa && <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" className="btn btn-gold">WhatsApp</a>}
          {ct.email && <a href={`mailto:${ct.email}`} className="btn bg-cream !text-emerald">{L('Email us', 'ای میل کریں')}</a>}
          {ct.phone && <a href={`tel:${ct.phone.replace(/\s/g, '')}`} className="btn btn-ghost !text-cream !border-cream">{L('Call', 'کال کریں')}</a>}
          <Link href="/login" className="btn btn-ghost !text-cream !border-cream">{d.studentLogin}</Link></div>
        <ul className="mt-4 space-y-1 text-sm">{ct.email && <li>✉ {ct.email}</li>}{ct.whatsapp && <li>WhatsApp: {ct.whatsapp}</li>}{ct.phone && <li>☎ {ct.phone}</li>}{ct.address && <li>{ct.address}</li>}{ct.hours && <li>{ct.hours}</li>}</ul>
        <p className="mt-6 text-sm opacity-80">© {new Date().getFullYear()} {d.brand}</p></div></footer>
    </main>);
}
