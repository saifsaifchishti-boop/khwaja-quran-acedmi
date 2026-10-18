import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type { ConvT, PersonT, Role } from '@/lib/chat-types';

// Resolves display names, codes and photo flags for a set of user ids (service role: names only, never private data).
export async function loadPeople(ids: string[]): Promise<Record<string, PersonT>> {
  const out: Record<string, PersonT> = {}; const uniq = [...new Set(ids)].filter(Boolean); if (!uniq.length) return out;
  const db = supabaseAdmin();
  const [{ data: pr }, { data: st }, { data: te }] = await Promise.all([
    db.from('profiles').select('id,role,full_name,avatar_path,last_seen').in('id', uniq),
    db.from('students').select('user_id,full_name,student_code').in('user_id', uniq),
    db.from('teachers').select('user_id,full_name,teacher_code').in('user_id', uniq)]);
  const sm = new Map((st ?? []).map(x => [x.user_id as string, x])); const tm = new Map((te ?? []).map(x => [x.user_id as string, x]));
  for (const p of pr ?? []) {
    const s = sm.get(p.id), t = tm.get(p.id);
    out[p.id] = { id: p.id, role: p.role as Role, name: (s?.full_name ?? t?.full_name ?? p.full_name ?? (p.role === 'admin' ? 'Administrator' : 'Member')) as string,
      code: (s?.student_code ?? t?.teacher_code ?? null) as string | null, has: !!p.avatar_path, v: p.avatar_path ? String(p.avatar_path).slice(-12) : null, seen: p.last_seen ?? null };
  }
  return out;
}

async function directoryFor(sb: SupabaseClient, me: { id: string; role: Role }): Promise<string[]> {
  const db = supabaseAdmin(); const ids = new Set<string>();
  if (me.role === 'admin') {
    const { data } = await db.from('profiles').select('id').limit(2000); (data ?? []).forEach(p => ids.add(p.id));
  } else {
    const { data: ad } = await db.from('profiles').select('id').eq('role', 'admin'); (ad ?? []).forEach(p => ids.add(p.id));
    if (me.role === 'teacher') { const { data } = await sb.from('teacher_assignments').select('students(user_id)').eq('active', true); (data ?? []).forEach((a: any) => a.students?.user_id && ids.add(a.students.user_id)); }
    else { const { data } = await sb.from('teacher_assignments').select('teachers(user_id)').eq('active', true); (data ?? []).forEach((a: any) => a.teachers?.user_id && ids.add(a.teachers.user_id)); }
  }
  ids.delete(me.id); return [...ids];
}

export async function loadChat(sb: SupabaseClient, me: { id: string; role: Role }) {
  const { data: mem } = await sb.from('conversation_members').select('conversation_id, conversations(id,kind,title,last_message_at)').eq('user_id', me.id);
  const convs = (mem ?? []).map((m: any) => m.conversations).filter(Boolean) as { id: string; kind: 'dm' | 'group'; title: string | null; last_message_at: string }[];
  const cids = convs.map(c => c.id);
  const [{ data: allMem }, { data: lasts }, { data: unr }, dirIds] = await Promise.all([
    cids.length ? sb.from('conversation_members').select('conversation_id,user_id').in('conversation_id', cids) : Promise.resolve({ data: [] as any[] }),
    sb.rpc('my_last_messages'), sb.rpc('my_unread_counts'), directoryFor(sb, me)]);
  const people = await loadPeople([me.id, ...(allMem ?? []).map((x: any) => x.user_id), ...dirIds]);
  const lastBy = new Map((lasts ?? []).map((m: any) => [m.conversation_id as string, m])); const unrBy = new Map((unr ?? []).map((u: any) => [u.conversation_id as string, u.n as number]));
  const items: ConvT[] = convs.map(c => {
    const members = (allMem ?? []).filter((x: any) => x.conversation_id === c.id).map((x: any) => people[x.user_id]).filter(Boolean) as PersonT[];
    const other = members.find(p => p.id !== me.id); const l: any = lastBy.get(c.id);
    return { id: c.id, kind: c.kind, title: c.kind === 'group' ? (c.title ?? 'Group') : (other?.name ?? 'Chat'), members,
      last: l ? { body: l.body, at: l.created_at, mine: l.sender_id === me.id, t: l.attachment_type, del: !!l.deleted_at } : null, unread: unrBy.get(c.id) ?? 0, sortAt: l?.created_at ?? c.last_message_at };
  }).sort((a, b) => +new Date(b.sortAt) - +new Date(a.sortAt));
  const directory = dirIds.map(i => people[i]).filter(Boolean).sort((a, b) => a.name.localeCompare(b.name));
  return { me: people[me.id] ?? { id: me.id, name: 'Me', role: me.role, code: null, has: false, v: null, seen: null }, items, directory };
}
