import StudentShell from '@/components/StudentShell';
import ChatApp from '@/components/teams/ChatApp';
import { loadChat } from '@/lib/chat-data';
export const dynamic = 'force-dynamic';
export default async function Page({ searchParams }: { searchParams: Promise<{ c?: string; call?: string }> }) {
  const { c, call } = await searchParams;
  return (<StudentShell bleed>{async ({ sb, user }) => { const d = await loadChat(sb, { id: user.id, role: 'student' });
    return <ChatApp me={d.me} items={d.items} directory={d.directory} canGroup={false} initialId={c} autoCall={call === 'audio' || call === 'video' ? call : undefined} />; }}</StudentShell>);
}
