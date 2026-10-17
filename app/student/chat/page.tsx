import StudentShell from '@/components/StudentShell';
import ChatRoom from '@/components/ChatRoom';
export const dynamic = 'force-dynamic';
export default function Page() {
  return (<StudentShell>{async ({ sb, user }) => {
    const { data: st } = await sb.from('students').select('id').eq('user_id', user.id).single();
    const { data: asg } = await sb.from('teacher_assignments').select('teacher_id, teachers(full_name)').eq('active', true).limit(1).maybeSingle();
    if (!st || !asg) return <p className="opacity-70">Chat opens once a teacher is assigned to you.</p>;
    const { data: msgs } = await sb.from('chat_messages').select('*').eq('teacher_id', asg.teacher_id).order('created_at', { ascending: false }).limit(100);
    return (<><h1 className="text-2xl font-bold mb-3">Chat with your teacher</h1><p className="text-xs opacity-70 mb-2">Only you and your assigned teacher can see this chat. Use “report” on any message that worries you.</p>
      <ChatRoom studentId={st.id} teacherId={asg.teacher_id} userId={user.id} peerName={(asg as any).teachers?.full_name ?? 'Teacher'} initial={(msgs ?? []).reverse()} /></>);
  }}</StudentShell>);
}
