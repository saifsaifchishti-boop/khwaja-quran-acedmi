import AdminShell from '@/components/AdminShell';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { savePage } from '../actions2';
export const dynamic = 'force-dynamic';
export default async function Page() {
  const { data } = await supabaseAdmin().from('pages').select('*').order('slug');
  return (<AdminShell><h1 className="text-2xl font-bold mb-2">Policy pages</h1><p className="text-sm opacity-70 mb-4">Write the text with your own approved wording (or your lawyer’s). A page appears in the site footer only after you tick “Published”. Blank line = new paragraph.</p>
    <div className="space-y-3">{(data ?? []).map(p => (<details key={p.slug} className="card p-3"><summary className="cursor-pointer font-semibold">{p.title_en} — /p/{p.slug} {p.published ? '(published)' : '(draft)'}</summary>
      <form action={savePage} className="grid gap-2 mt-3"><input type="hidden" name="slug" value={p.slug} /><input name="title_en" defaultValue={p.title_en} className="inp" /><textarea name="body_en" defaultValue={p.body_en} rows={8} className="inp" />
        <input name="title_ur" defaultValue={p.title_ur} className="inp" dir="rtl" /><textarea name="body_ur" defaultValue={p.body_ur} rows={8} className="inp" dir="rtl" />
        <label className="flex gap-2 items-center"><input type="checkbox" name="published" defaultChecked={p.published} className="size-5" />Published</label><button className="btn btn-sm">Save</button></form></details>))}</div></AdminShell>);
}
