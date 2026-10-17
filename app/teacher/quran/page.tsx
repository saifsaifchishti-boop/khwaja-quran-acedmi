import TeacherShell from '@/components/TeacherShell';
import QuranReader from '@/components/QuranReader';
export const dynamic = 'force-dynamic';
export default function Page() {
  return (<TeacherShell>{async ({ sb, user }) => {
    const { data: bm } = await sb.from('quran_bookmarks').select('surah,ayah,note').eq('user_id', user.id).order('created_at');
    return (<><h1 className="text-2xl font-bold mb-3">Quran reader</h1><QuranReader bookmarks={bm ?? []} /></>);
  }}</TeacherShell>);
}
