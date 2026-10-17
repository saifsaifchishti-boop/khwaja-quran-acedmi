import AdminShell from '@/components/AdminShell';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { saveContact } from '../actions';
export const dynamic = 'force-dynamic';
export default async function Page() {
  const { data } = await supabaseAdmin().from('settings').select('value').eq('key', 'contact').single(); const c = (data?.value ?? {}) as Record<string, string>;
  return (<AdminShell><h1 className="text-2xl font-bold mb-4">Public contact details</h1><form action={saveContact} className="card p-4 grid sm:grid-cols-2 gap-3">
    {[['email', 'Email'], ['whatsapp', 'WhatsApp'], ['phone', 'Phone'], ['address', 'Address'], ['hours', 'Office hours']].map(([k, l]) => <div key={k}><label className="lbl">{l}</label><input name={k} defaultValue={c[k] ?? ''} className="inp" /></div>)}
    <button className="btn sm:col-span-2">Save</button></form></AdminShell>);
}
