import { notFound } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import LiveRoom from '@/components/LiveRoom';
import SharedAyah from '@/components/SharedAyah';
import QuranReader from '@/components/QuranReader';
import { fmtDT } from '@/lib/fmt';
export const dynamic = 'force-dynamic';
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const sb = await supabaseServer(); const { data: { user } } = await sb.auth.getUser(); if (!user) notFound();
  const { data: ses } = await sb.from('class_sessions').select('*, teachers(full_name,timezone,user_id), students(full_name,timezone,user_id)').eq('id', id).maybeSingle(); // RLS: participants only
  if (!ses) notFound();
  const t = ses.teachers as any, s = ses.students as any; const isTeacher = t?.user_id === user.id; const tz = isTeacher ? t.timezone : s.timezone;
  const { data: bm } = isTeacher ? await sb.from('quran_bookmarks').select('surah,ayah,note').eq('user_id', user.id) : { data: [] };
  return (<main className="max-w-5xl mx-auto px-4 py-6 space-y-4" dir="ltr"><h1 className="text-2xl font-bold">Class: {isTeacher ? s.full_name : t.full_name}</h1>
    <p className="text-sm opacity-70">{fmtDT(ses.starts_at, tz)} ({tz}) · {ses.status}</p>
    {ses.status === 'cancelled' ? <p>This class was cancelled.</p> : <LiveRoom sessionId={id} />}
    {isTeacher ? <QuranReader sessionId={id} bookmarks={bm ?? []} compact /> : <SharedAyah sessionId={id} />}</main>);
}
