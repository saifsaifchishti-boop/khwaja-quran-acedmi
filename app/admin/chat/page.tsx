import AdminShell from '@/components/AdminShell';
import ChatApp from '@/components/teams/ChatApp';
import { requireRole } from '@/lib/auth';
import { loadChat } from '@/lib/chat-data';
export const dynamic = 'force-dynamic';
export default async function Page({ searchParams }: { searchParams: Promise<{ c?: string; call?: string }> }) {
  const { c, call } = await searchParams; const { sb, user } = await requireRole('admin'); const d = await loadChat(sb, { id: user.id, role: 'admin' });
  return (<AdminShell bleed><ChatApp me={d.me} items={d.items} directory={d.directory} canGroup initialId={c} autoCall={call === 'audio' || call === 'video' ? call : undefined} /></AdminShell>);
}
