import { getLang, t } from '@/lib/i18n';
import { supabaseServer } from '@/lib/supabase/server';
import RegisterForm from './RegisterForm';
export const dynamic = 'force-dynamic';
export default async function Page({ searchParams }: { searchParams: Promise<{ course?: string }> }) {
  const l = await getLang(); const sp = await searchParams; const sb = await supabaseServer();
  const { data: courses } = await sb.from('courses').select('id,title_en,title_ur').order('sort_order');
  return <RegisterForm d={t(l)} lang={l} courses={courses ?? []} preset={sp.course} />;
}
