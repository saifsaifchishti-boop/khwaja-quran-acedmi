import AdminShell from '@/components/AdminShell';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { setDemoStatus } from '../demo-actions';
export const dynamic = 'force-dynamic';
export default async function Page() {
  const { data } = await supabaseAdmin().from('demo_requests').select('*, courses(title_en)').order('created_at', { ascending: false }).limit(200);
  return (<AdminShell><h1 className="text-2xl font-bold mb-4">Demo class requests</h1>
    <ul className="space-y-3">{(data ?? []).length === 0 && <li className="card p-4 opacity-70">No requests yet.</li>}{(data ?? []).map((r: any) => (
      <li key={r.id} className="card p-4"><div className="flex flex-wrap justify-between gap-2"><b>{r.full_name}</b><span className="text-xs opacity-70">{new Date(r.created_at).toLocaleString()} · <b className="uppercase">{r.status}</b></span></div>
        <div className="text-sm mt-1">{r.email} · <a className="underline" href={`https://wa.me/${String(r.whatsapp).replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">{r.whatsapp}</a> · {r.country} · {r.timezone}</div>
        <div className="text-sm opacity-80">Course: {r.courses?.title_en ?? 'Not sure yet'}{r.notes ? ` · ${r.notes}` : ''}</div>
        <form action={setDemoStatus} className="mt-3 flex flex-wrap gap-2 items-center"><input type="hidden" name="id" value={r.id} /><input name="note" defaultValue={r.admin_note ?? ''} placeholder="Private note" className="inp !w-auto flex-1 min-w-[160px]" />
          <select name="status" defaultValue={r.status} className="inp !w-auto">{['new', 'contacted', 'scheduled', 'done', 'cancelled'].map(s => <option key={s}>{s}</option>)}</select><button className="btn btn-sm">Save</button></form></li>))}</ul></AdminShell>);
}
