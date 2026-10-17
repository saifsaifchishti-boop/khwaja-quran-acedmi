'use client';
import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { sendAttachment, deleteForEveryone, reportMessage, markRead } from '@/app/chat-actions';
type Msg = { id: string; sender_id: string; body: string; attachment_name: string | null; attachment_path: string | null; deleted_at: string | null; created_at: string };
export default function ChatRoom({ studentId, teacherId, userId, peerName, initial }: { studentId: string; teacherId: string; userId: string; peerName: string; initial: Msg[] }) {
  const sb = useMemo(() => supabaseBrowser(), []);
  const [msgs, setMsgs] = useState<Msg[]>(initial); const [text, setText] = useState(''); const [typing, setTyping] = useState(false); const [q, setQ] = useState(''); const [err, setErr] = useState('');
  const [, start] = useTransition(); const chRef = useRef<ReturnType<typeof sb.channel> | null>(null); const endRef = useRef<HTMLDivElement>(null); const tt = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    const ch = sb.channel(`chat:${studentId}:${teacherId}`, { config: { broadcast: { self: false } } })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `student_id=eq.${studentId}` }, p => { const m = p.new as Msg & { teacher_id: string }; if (m.teacher_id === teacherId) { setMsgs(a => a.some(x => x.id === m.id) ? a : [...a, m]); markRead(studentId, teacherId); } })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chat_messages', filter: `student_id=eq.${studentId}` }, p => { const m = p.new as Msg; setMsgs(a => a.map(x => x.id === m.id ? { ...x, ...m } : x)); })
      .on('broadcast', { event: 'typing' }, () => { setTyping(true); clearTimeout(tt.current); tt.current = setTimeout(() => setTyping(false), 2500); })
      .subscribe(); chRef.current = ch; markRead(studentId, teacherId);
    return () => { sb.removeChannel(ch); };
  }, [sb, studentId, teacherId]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs.length]);
  async function send(e: React.FormEvent) {
    e.preventDefault(); const body = text.trim(); if (!body) return; setText(''); setErr('');
    const { data, error } = await sb.from('chat_messages').insert({ student_id: studentId, teacher_id: teacherId, sender_id: userId, body }).select().single();
    if (error) setErr('Message not sent.'); else setMsgs(a => a.some(x => x.id === data.id) ? a : [...a, data as Msg]);
  }
  const shown = q ? msgs.filter(m => !m.deleted_at && m.body.toLowerCase().includes(q.toLowerCase())) : msgs;
  return (<div className="card flex flex-col h-[70vh]" dir="ltr"><div className="p-3 border-b border-[var(--line)] flex gap-2 items-center"><b className="flex-1">{peerName}</b>
      <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search" aria-label="Search messages" className="inp !min-h-9 !w-40" /></div>
    <div className="flex-1 overflow-y-auto p-3 space-y-2" aria-live="polite">{shown.map(m => { const mine = m.sender_id === userId; return (
      <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${mine ? 'bg-[var(--brand)] text-white' : 'bg-[var(--bg)] border border-[var(--line)]'}`}>
        {m.deleted_at ? <i className="opacity-70">This message was deleted</i> : <>{m.body && <p className="whitespace-pre-wrap break-words">{m.body}</p>}{m.attachment_path && <a className="underline" href={`/api/chat/file?id=${m.id}`} target="_blank" rel="noopener noreferrer">📎 {m.attachment_name ?? 'file'}</a>}</>}
        <div className="text-[10px] opacity-70 mt-1 flex gap-2">{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          {mine && !m.deleted_at && <button onClick={() => start(async () => { await deleteForEveryone(m.id); })} className="underline">delete</button>}
          {!mine && !m.deleted_at && <button onClick={() => { const r = prompt('Why are you reporting this message?'); if (r !== null) start(async () => { await reportMessage(m.id, r); alert('Reported to the academy.'); }); }} className="underline">report</button>}</div></div></div>); })}
      {typing && <p className="text-xs opacity-70">{peerName} is typing…</p>}<div ref={endRef} /></div>
    <form onSubmit={send} className="p-3 border-t border-[var(--line)] flex gap-2 items-center"><label className="btn btn-ghost btn-sm cursor-pointer" aria-label="Attach file">📎<input type="file" className="hidden" accept="image/*,application/pdf,audio/*" onChange={async e => {
        const f = e.target.files?.[0]; if (!f) return; const fd = new FormData(); fd.set('file', f); fd.set('student_id', studentId); fd.set('teacher_id', teacherId); const r = await sendAttachment(fd); if (r.error) setErr(r.error); e.target.value = ''; }} /></label>
      <input value={text} maxLength={2000} onChange={e => { setText(e.target.value); chRef.current?.send({ type: 'broadcast', event: 'typing', payload: {} }); }} placeholder="Type a message" aria-label="Message" className="inp" /><button className="btn">Send</button></form>
    {err && <p role="alert" className="px-3 pb-2 text-red-600 text-sm">{err}</p>}</div>);
}
