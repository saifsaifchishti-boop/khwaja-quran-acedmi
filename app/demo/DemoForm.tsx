'use client';
import { useActionState } from 'react';
import { requestDemo, type DemoState } from './actions';
const COUNTRIES = ['Pakistan', 'India', 'Bangladesh', 'United Kingdom', 'United States', 'Canada', 'Australia', 'Saudi Arabia', 'United Arab Emirates', 'Other'];
export default function DemoForm({ courses }: { courses: { id: string; title_en: string }[] }) {
  const [st, act, pending] = useActionState<DemoState, FormData>(requestDemo, {}); const tz = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC';
  const err = (n: string) => st.errors?.[n] && <p role="alert" className="text-red-600 text-sm mt-1">{st.errors[n]}</p>;
  if (st.ok) return (<div className="card p-6 text-center"><h2 className="text-xl font-bold text-emerald dark:text-gold">Thank you!</h2><p className="mt-2">We received your request. The academy will contact you on WhatsApp or email to arrange your free demo class.</p></div>);
  return (<form action={act} className="card p-5 grid sm:grid-cols-2 gap-4"><input name="website" className="hidden" tabIndex={-1} autoComplete="off" aria-hidden />
    <div><label className="lbl" htmlFor="full_name">Student name *</label><input id="full_name" name="full_name" required className="inp" />{err('full_name')}</div>
    <div><label className="lbl" htmlFor="email">Email *</label><input id="email" name="email" type="email" required className="inp" />{err('email')}</div>
    <div><label className="lbl" htmlFor="whatsapp">WhatsApp (with country code) *</label><input id="whatsapp" name="whatsapp" type="tel" required placeholder="+923001234567" className="inp" />{err('whatsapp')}</div>
    <div><label className="lbl" htmlFor="country">Country *</label><select id="country" name="country" required className="inp" defaultValue="">{[''].concat(COUNTRIES).map(c => <option key={c} value={c}>{c || 'Select'}</option>)}</select>{err('country')}</div>
    <div><label className="lbl" htmlFor="course_id">Course you are interested in</label><select id="course_id" name="course_id" className="inp" defaultValue=""><option value="">Not sure yet</option>{courses.map(c => <option key={c.id} value={c.id}>{c.title_en}</option>)}</select></div>
    <div><label className="lbl" htmlFor="timezone">Time zone *</label><input id="timezone" name="timezone" required defaultValue={tz} className="inp" /></div>
    <div className="sm:col-span-2"><label className="lbl" htmlFor="notes">Anything we should know? (optional)</label><textarea id="notes" name="notes" rows={2} className="inp" /></div>
    <label className="sm:col-span-2 flex gap-2 items-start"><input type="checkbox" name="consent" required className="size-5 mt-1" />I agree that the academy may contact me about this demo class.</label>
    {st.message && <p role="alert" className="sm:col-span-2 text-red-600">{st.message}</p>}<button disabled={pending} className="btn btn-gold sm:col-span-2">{pending ? 'Sending…' : 'Request my free demo class'}</button></form>);
}
