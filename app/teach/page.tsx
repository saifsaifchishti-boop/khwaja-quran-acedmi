'use client';
import { useActionState } from 'react';
import { submitTeacherApplication, type TState } from './actions';
const TZ = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC';
export default function Page() {
  const [st, act, pending] = useActionState<TState, FormData>(submitTeacherApplication, {});
  const F = (n: string, l: string, o: { type?: string; req?: boolean; def?: string; ph?: string } = {}) => (<div><label className="lbl" htmlFor={n}>{l}</label>
    <input id={n} name={n} type={o.type ?? 'text'} required={o.req} defaultValue={o.def} placeholder={o.ph} className="inp" />{st.errors?.[n] && <p role="alert" className="text-red-600 text-sm">{st.errors[n]}</p>}</div>);
  const T = (n: string, l: string, req = false) => (<div className="sm:col-span-2"><label className="lbl" htmlFor={n}>{l}</label><textarea id={n} name={n} rows={3} required={req} className="inp" />{st.errors?.[n] && <p role="alert" className="text-red-600 text-sm">{st.errors[n]}</p>}</div>);
  return (<main className="max-w-3xl mx-auto px-4 py-8"><h1 className="text-2xl font-bold mb-4">Teacher Application / استاد کی درخواست</h1>
    <form action={act} className="card p-5 grid sm:grid-cols-2 gap-4"><input name="website" className="hidden" tabIndex={-1} autoComplete="off" aria-hidden />
      {F('full_name', 'Full name', { req: true })}
      <div><label className="lbl" htmlFor="gender">Gender</label><select id="gender" name="gender" required className="inp"><option value="male">Male</option><option value="female">Female</option></select></div>
      {F('email', 'Email', { type: 'email', req: true })}{F('whatsapp', 'WhatsApp (+countrycode)', { req: true, ph: '+923001234567' })}
      {F('country', 'Country', { req: true })}{F('city', 'City', { req: true })}{F('timezone', 'Time zone', { req: true, def: TZ })}{F('experience_years', 'Years of teaching experience', { type: 'number' })}
      {T('qualifications', 'Qualifications / ijazah / certificates', true)}{F('specialties', 'Specialties (Tajweed, Hifz, Nazra…)')}{F('languages', 'Languages you teach in')}
      {T('availability', 'Availability (days and times)')}{T('bio', 'Short introduction')}
      <div className="sm:col-span-2 card p-3 bg-emerald-100 dark:bg-[#12261b]"><h2 className="font-bold">Documents</h2><p className="text-sm opacity-80">Upload clear photos or PDFs. JPG, PNG or PDF, up to 5 MB each, up to 8 files in total. Only the academy administrators can see them.</p>
        <p className="text-sm mt-2"><b>Please include:</b> national ID card (front and back), qualification certificates, ijazah or sanad (if you have one), teaching experience letters (if any) and a short CV.</p></div>
      <div><label className="lbl" htmlFor="photo">Your photo (becomes your permanent profile picture)</label><input id="photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp" className="inp" />{st.errors?.photo && <p role="alert" className="text-red-600 text-sm">{st.errors.photo}</p>}</div>
      <div><label className="lbl" htmlFor="docs">Documents (up to 8 files)</label><input id="docs" name="docs" type="file" multiple accept="image/jpeg,image/png,application/pdf" className="inp" /></div>
      <label className="sm:col-span-2 flex gap-2 items-start"><input type="checkbox" name="consent" required className="size-5 mt-1" />I consent to the academy processing my information and documents for this application.</label>
      {st.message && <p role="alert" className="sm:col-span-2 text-red-600">{st.message}</p>}
      <button disabled={pending} className="btn sm:col-span-2">{pending ? '…' : 'Submit application'}</button></form></main>);
}
