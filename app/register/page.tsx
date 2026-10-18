import { getLang, t } from '@/lib/i18n';
import { supabaseServer } from '@/lib/supabase/server';
import { pick, lines } from '@/lib/admission';
import RegisterForm from './RegisterForm';
export const dynamic = 'force-dynamic';
export default async function Page({ searchParams }: { searchParams: Promise<{ course?: string }> }) {
  const l = await getLang(); const sp = await searchParams; const sb = await supabaseServer();
  const { data: courses } = await sb.from('courses').select('id,title_en,title_ur,fee,currency').order('sort_order');
  const { data: ad } = await sb.from('settings').select('value').eq('key', 'admission').maybeSingle(); const adm = pick(ad?.value as any);
  return <RegisterForm d={t(l)} lang={l} courses={courses ?? []} preset={sp.course} feeLines={lines(l === 'ur' ? adm.fees_ur : adm.fees_en)} />;
}
