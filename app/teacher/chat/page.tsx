import Link from 'next/link';
import TeacherShell from '@/components/TeacherShell';
import ChatRoom from '@/components/ChatRoom';
export const dynamic = 'force-dynamic';
export default async function Page({ searchParams }: { searchParams: Promise<{ s?: string }> }) {
  const { s } = await searchParams;
  return (<TeacherShell>{async ({ sb, user }) => {
    const { data: t } = await sb.from('teachers').select('id').eq('user_id', user.id).single();
    const { data: asg } = await sb.from('teacher_assignments').select('student_id, students(full_name)').eq('active', true);
    const cur = (asg ?? []).find(a => a.student_id === s);
    const { data: msgs } = cur ? await sb.from('chat_messages').select('*').eq('student_id', cur.student_id).order('created_at', { ascending: false }).limit(100) : { data: [] };
    return (<><h1 className="text-2xl font-bold mb-3">Chat</h1><div className="flex flex-wrap gap-2 mb-3">{(asg ?? []).map((a: any) => <Link key={a.student_id} href={`/teacher/chat?s=${a.student_id}`} className={`btn btn-sm ${a.student_id === s ? '' : 'btn-ghost'}`}>{a.students?.full_name}</Link>)}</div>
      {cur && t ? <ChatRoom studentId={cur.student_id} teacherId={t.id} userId={user.id} peerName={(cur as any).students?.full_name ?? 'Student'} initial={(msgs ?? []).reverse()} /> : <p className="opacity-70">Select a student.</p>}</>);
  }}</TeacherShell>);
}
