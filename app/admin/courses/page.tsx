import AdminShell from '@/components/AdminShell';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { saveCourse } from '../actions';
export const dynamic = 'force-dynamic';
function CourseForm({ c }: { c?: Record<string, any> }) {
  const f = (n: string, l: string, t = 'text') => <div><label className="lbl">{l}</label><input name={n} type={t} defaultValue={c?.[n] ?? ''} className="inp" step={t === 'number' ? '0.01' : undefined} /></div>;
  return (<form action={saveCourse} className="card p-4 space-y-3">{c && <input type="hidden" name="id" value={c.id} />}
    <div className="grid sm:grid-cols-2 gap-3">{f('title_en', 'Title (English)')}{f('title_ur', 'Title (Urdu)')}
      <div><label className="lbl">Description (English)</label><textarea name="desc_en" defaultValue={c?.desc_en ?? ''} className="inp" rows={2} /></div>
      <div><label className="lbl">Description (Urdu)</label><textarea name="desc_ur" defaultValue={c?.desc_ur ?? ''} className="inp" rows={2} /></div>
      {f('level', 'Level')}{f('duration', 'Duration')}{f('frequency', 'Class frequency')}{f('language', 'Language')}{f('fee', 'Fee', 'number')}{f('currency', 'Currency')}{f('sort_order', 'Order', 'number')}</div>
    <div className="flex gap-6"><label className="flex gap-2"><input type="checkbox" name="published" defaultChecked={c?.published} className="size-5" />Published</label>
      <label className="flex gap-2"><input type="checkbox" name="archived" defaultChecked={c?.archived} className="size-5" />Archived</label></div>
    <button className="btn">{c ? 'Save' : 'Add course'}</button></form>);
}
export default async function Page() {
  const { data } = await supabaseAdmin().from('courses').select('*').order('sort_order');
  return (<AdminShell><h1 className="text-2xl font-bold mb-4">Courses</h1><h2 className="font-bold mb-2">Add course</h2><CourseForm />
    <h2 className="font-bold mt-8 mb-2">All courses (only “Published” ones are visible to the public)</h2>
    <div className="space-y-3">{(data ?? []).map(c => <details key={c.id} className="card p-3"><summary className="cursor-pointer font-semibold">{c.title_en} — {c.archived ? 'archived' : c.published ? 'published' : 'draft'}</summary><div className="mt-3"><CourseForm c={c} /></div></details>)}</div></AdminShell>);
}
