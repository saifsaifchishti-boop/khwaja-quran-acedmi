import { supabaseServer } from '@/lib/supabase/server';
import DemoForm from './DemoForm';
export const dynamic = 'force-dynamic';
export default async function Page() {
  const { data: courses } = await (await supabaseServer()).from('courses').select('id,title_en').order('sort_order');
  return (<main className="max-w-2xl mx-auto px-4 py-8"><h1 className="text-3xl font-bold">Free demo class</h1>
    <p className="mt-2 mb-5 opacity-80">Try a live one-to-one class before you join. Fill in this short form and the academy will contact you to arrange it. Our classes run 24/7, so we can find a time that suits you.</p><DemoForm courses={courses ?? []} /></main>);
}
