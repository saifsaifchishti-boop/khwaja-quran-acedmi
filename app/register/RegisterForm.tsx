'use client';
import { useActionState } from 'react';
import { submitApplication, type FormState } from './actions';
import type { Dict } from '@/lib/i18n';
const COUNTRIES = ['Pakistan', 'India', 'Bangladesh', 'United Kingdom', 'United States', 'Canada', 'Australia', 'Saudi Arabia', 'United Arab Emirates', 'Other'];
export default function RegisterForm({ d, lang, courses, preset }: { d: Dict; lang: string; courses: { id: string; title_en: string; title_ur: string }[]; preset?: string }) {
  const [st, action, pending] = useActionState<FormState, FormData>(submitApplication, {});
  const tz = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC';
  const F = ({ n, label, type = 'text', req = true, ph }: { n: string; label: string; type?: string; req?: boolean; ph?: string }) => (
    <div><label className="lbl" htmlFor={n}>{label}{req && ' *'}</label>
      <input id={n} name={n} type={type} required={req} placeholder={ph} className="inp" aria-invalid={!!st.errors?.[n]} />
      {st.errors?.[n] && <p role="alert" className="text-red-600 text-sm mt-1">{st.errors[n]}</p>}</div>);
  const Sel = ({ n, label, opts, req = true }: { n: string; label: string; opts: [string, string][]; req?: boolean }) => (
    <div><label className="lbl" htmlFor={n}>{label}{req && ' *'}</label>
      <select id={n} name={n} required={req} className="inp" defaultValue={n === 'course_id' ? preset ?? '' : ''}><option value="">{d.select}</option>{opts.map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select>
      {st.errors?.[n] && <p role="alert" className="text-red-600 text-sm mt-1">{st.errors[n]}</p>}</div>);
  const Sec = ({ t, children }: { t: string; children: React.ReactNode }) => (
    <section className="card overflow-hidden"><h2 className="bg-emerald text-cream text-center py-3 font-bold">{t}</h2><div className="p-4 grid gap-4 sm:grid-cols-2">{children}</div></section>);
  return (
    <main className="max-w-3xl mx-auto px-4 py-8"><h1 className="text-3xl font-bold mb-6">{d.regTitle}</h1>
      <form action={action} className="space-y-6" noValidate={false}>
        <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
        <Sec t={d.secStudent}>
          <F n="first_name" label={d.firstName} /><F n="last_name" label={d.lastName} /><F n="father_name" label={d.fatherName} />
          <Sel n="gender" label={d.gender} opts={[['male', d.male], ['female', d.female]]} />
          <F n="dob" label={d.dob} type="date" /><F n="email" label={d.email} type="email" />
          <F n="guardian_name" label={d.guardianName} req={false} /><F n="guardian_phone" label={d.guardianPhone} req={false} />
        </Sec>
        <Sec t={d.secPersonal}>
          <Sel n="country" label={d.country} opts={COUNTRIES.map(c => [c, c])} /><F n="state" label={d.state} req={false} /><F n="city" label={d.city} />
          <div><label className="lbl" htmlFor="timezone">{d.timezone} *</label><input id="timezone" name="timezone" defaultValue={tz} required className="inp" /></div>
          <F n="whatsapp" label={d.whatsapp} type="tel" ph="+923001234567" /><F n="mobile" label={d.mobile} type="tel" req={false} />
          <div className="sm:col-span-2"><F n="address" label={d.address} req={false} /></div>
        </Sec>
        <Sec t={d.secSubject}>
          <Sel n="language" label={d.prefLang} opts={[['Urdu', 'اردو / Urdu'], ['English', 'English'], ['Arabic', 'العربية / Arabic']]} />
          <Sel n="course_id" label={d.course} opts={courses.map(c => [c.id, lang === 'ur' && c.title_ur ? c.title_ur : c.title_en])} />
          <F n="level" label={d.level} req={false} /><F n="preferred_days" label={d.days} req={false} /><F n="preferred_time" label={d.time} req={false} />
          <F n="duration_min" label={d.duration} type="number" req={false} />
          <Sel n="teacher_gender_pref" label={d.teacherPref} opts={[['any', d.any], ['male', d.male], ['female', d.female]]} req={false} />
          <div className="sm:col-span-2"><label className="lbl" htmlFor="experience">{d.experience}</label><textarea id="experience" name="experience" rows={2} className="inp" /></div>
          <div className="sm:col-span-2"><label className="lbl" htmlFor="notes">{d.notes}</label><textarea id="notes" name="notes" rows={3} className="inp" /></div>
        </Sec>
        <Sec t={d.secConsent}>
          <label className="sm:col-span-2 flex gap-2 items-start"><input type="checkbox" name="consent_policy" required className="mt-2 size-5" />{d.agreePolicy} *</label>
          <label className="sm:col-span-2 flex gap-2 items-start"><input type="checkbox" name="consent_data" required className="mt-2 size-5" />{d.agreeData} *</label>
        </Sec>
        {st.message && <p role="alert" className="text-red-600 font-semibold">{st.message}</p>}
        <button disabled={pending} className="btn w-full">{pending ? '…' : d.submit}</button>
      </form></main>);
}
