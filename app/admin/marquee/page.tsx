import AdminShell from '@/components/AdminShell';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { saveMarqueeItem, deleteMarqueeItem, saveMarqueeSettings } from '../actions';
export const dynamic = 'force-dynamic';
const PRESETS = [['Bismillah', 'بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ'], ['Kalima Tayyibah', 'لَآ اِلٰهَ اِلَّا اللّٰهُ مُحَمَّدٌ رَّسُوْلُ اللّٰهِ']];
function Item({ i }: { i?: Record<string, any> }) {
  return (<form action={saveMarqueeItem} className="card p-3 grid gap-2 sm:grid-cols-6 items-end">{i && <input type="hidden" name="id" value={i.id} />}
    <div className="sm:col-span-6"><label className="lbl">Exact text (Arabic / Urdu / English)</label><textarea name="text" defaultValue={i?.text ?? ''} rows={2} dir="auto" className="inp quran text-lg" required /></div>
    <div><label className="lbl">Type</label><select name="kind" defaultValue={i?.kind ?? 'announcement'} className="inp">{['bismillah', 'kalima', 'durood', 'salawat', 'announcement', 'notice'].map(k => <option key={k}>{k}</option>)}</select></div>
    <div><label className="lbl">Order</label><input name="sort_order" type="number" defaultValue={i?.sort_order ?? 0} className="inp" /></div>
    <div><label className="lbl">Start</label><input name="starts_on" type="date" defaultValue={i?.starts_on ?? ''} className="inp" /></div>
    <div><label className="lbl">End</label><input name="ends_on" type="date" defaultValue={i?.ends_on ?? ''} className="inp" /></div>
    <label className="flex gap-2 items-center"><input type="checkbox" name="active" defaultChecked={i?.active ?? true} className="size-5" />Enabled</label>
    <div className="flex gap-2"><button className="btn btn-sm">{i ? 'Save' : 'Add'}</button>{i && <button formAction={deleteMarqueeItem} className="btn btn-sm btn-red" formNoValidate>Delete</button>}</div></form>);
}
export default async function Page() {
  const db = supabaseAdmin(); const { data: items } = await db.from('marquee_items').select('*').order('sort_order');
  const { data: s } = await db.from('settings').select('value').eq('key', 'marquee').single(); const cfg = (s?.value ?? {}) as any;
  return (<AdminShell><h1 className="text-2xl font-bold mb-4">Announcement marquee</h1>
    <form action={saveMarqueeSettings} className="card p-4 flex flex-wrap gap-4 items-end"><label className="flex gap-2 items-center"><input type="checkbox" name="enabled" defaultChecked={cfg.enabled} className="size-5" />Show marquee on site</label>
      <div><label className="lbl">Speed (5–200)</label><input name="speed" type="number" defaultValue={cfg.speed ?? 40} className="inp w-28" /></div>
      <div><label className="lbl">Direction</label><select name="direction" defaultValue={cfg.direction ?? 'rtl'} className="inp"><option value="rtl">Right → Left</option><option value="ltr">Left → Right</option></select></div><button className="btn">Save settings</button></form>
    <h2 className="font-bold mt-6 mb-2">Preview</h2><p className="text-sm opacity-70 mb-2">The live strip at the very top of this page is the preview of what is currently published. Quick-add a standard phrase:</p>
    <div className="flex flex-wrap gap-2 mb-4">{PRESETS.map(([k, t]) => <form key={k} action={saveMarqueeItem}><input type="hidden" name="text" value={t} /><input type="hidden" name="kind" value={k.toLowerCase().split(' ')[0]} /><input type="hidden" name="active" value="on" /><button className="btn btn-ghost btn-sm">+ {k}</button></form>)}</div>
    <h2 className="font-bold mb-2">New item</h2><Item /><h2 className="font-bold mt-6 mb-2">Items</h2><div className="space-y-3">{(items ?? []).map(i => <Item key={i.id} i={i} />)}</div></AdminShell>);
}
