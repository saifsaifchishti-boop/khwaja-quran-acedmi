'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { openDirect } from '@/app/teams-actions';
import Avatar from './Avatar';
import Icon from './Icons';
import { useRt } from './Runtime';
export type RosterStudent = { studentId: string; userId: string | null; name: string; code: string; course: string; tz: string; has: boolean; v: string | null };
// The teacher's students, each with live online status and one-tap chat / audio call / video call.
export default function Roster({ students }: { students: RosterStudent[] }) {
  const rt = useRt(); const router = useRouter(); const [busy, setBusy] = useState(''); const [err, setErr] = useState('');
  async function go(s: RosterStudent, mode: 'chat' | 'audio' | 'video') {
    if (!s.userId) return; setBusy(s.studentId); setErr(''); const r = await openDirect(s.userId); setBusy('');
    if (!r.id) { setErr(r.error ?? 'Could not open the chat.'); return; }
    if (mode === 'chat') router.push(`/teacher/chat?c=${r.id}`); else await rt.startCall({ id: r.id, title: s.name, peerId: s.userId }, mode);
  }
  return (<div>{err && <p role="alert" className="text-red-600 text-sm mb-2">{err}</p>}
    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">{students.length === 0 && <p className="opacity-70">No students are assigned to you yet.</p>}
      {students.map(s => (<div key={s.studentId} className="card p-4"><div className="flex items-center gap-3"><Avatar id={s.userId ?? s.studentId} name={s.name} size={52} has={s.has} v={s.v} online={s.userId ? rt.online.has(s.userId) : undefined} />
        <div className="min-w-0"><div className="font-semibold truncate">{s.name}</div><div className="text-xs opacity-70 font-mono">{s.code}</div><div className="text-xs opacity-70 truncate">{s.course} · {s.tz}</div></div></div>
        <div className="flex items-center gap-2 mt-3"><button disabled={!s.userId || busy === s.studentId} onClick={() => void go(s, 'chat')} className="btn btn-sm flex-1"><Icon n="chat" size={16} />&nbsp;Chat</button>
          <button disabled={!s.userId || busy === s.studentId || rt.busy} onClick={() => void go(s, 'audio')} aria-label={`Audio call ${s.name}`} title="Audio call" className="btn btn-ghost btn-sm !px-3"><Icon n="phone" size={16} /></button>
          <button disabled={!s.userId || busy === s.studentId || rt.busy} onClick={() => void go(s, 'video')} aria-label={`Video call ${s.name}`} title="Video call" className="btn btn-ghost btn-sm !px-3"><Icon n="video" size={16} /></button>
          <Link href={`/teacher/students/${s.studentId}`} className="btn btn-ghost btn-sm">Records</Link></div></div>))}</div></div>);
}
