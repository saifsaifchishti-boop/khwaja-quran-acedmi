import AdminShell from '@/components/AdminShell';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { saveAdmission } from '../admission-actions';
import { pick } from '@/lib/admission';
export const dynamic = 'force-dynamic';
export default async function Page() {
  const { data } = await supabaseAdmin().from('settings').select('value').eq('key', 'admission').maybeSingle(); const a = pick(data?.value as any);
  const S = ({ k, title }: { k: 'requirements' | 'steps' | 'fees'; title: string }) => (<div className="card p-4"><h2 className="font-bold mb-2">{title}</h2><div className="grid md:grid-cols-2 gap-3">
    <div><label className="lbl" htmlFor={`${k}_en`}>English (one point per line)</label><textarea id={`${k}_en`} name={`${k}_en`} rows={9} defaultValue={a[`${k}_en` as const]} className="inp" /></div>
    <div><label className="lbl" htmlFor={`${k}_ur`}>اردو (ہر سطر میں ایک نکتہ)</label><textarea id={`${k}_ur`} name={`${k}_ur`} rows={9} defaultValue={a[`${k}_ur` as const]} dir="rtl" className="inp" /></div></div></div>);
  return (<AdminShell><h1 className="text-2xl font-bold mb-1">Admission information</h1>
    <p className="text-sm opacity-70 mb-4">This text appears on the home page under “Admission”. Write one point per line. Leave a box empty to restore the default text. Fee amounts themselves come from each course (Admin &gt; Courses).</p>
    <form action={saveAdmission} className="space-y-4"><S k="requirements" title="Admission requirements" /><S k="steps" title="How to take admission" /><S k="fees" title="Fees and how to pay" /><button className="btn">Save</button></form></AdminShell>);
}
