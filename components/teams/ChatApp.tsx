'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { openDirect, sendAttachment, deleteForEveryone, reportMessage, markRead, createGroup, updateGroup } from '@/app/teams-actions';
import { quiet } from '@/lib/quiet';
import type { ConvT, PersonT } from '@/lib/chat-types';
import Avatar from './Avatar';
import Icon from './Icons';
import { useRt } from './Runtime';

type M = { id: string; conversation_id: string; sender_id: string; body: string; attachment_path: string | null; attachment_name: string | null; attachment_type: string | null; deleted_at: string | null; created_at: string };
const tm = (d: string) => new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const dayLabel = (d: string) => { const x = new Date(d), n = new Date(); const y = new Date(); y.setDate(n.getDate() - 1); return x.toDateString() === n.toDateString() ? 'Today' : x.toDateString() === y.toDateString() ? 'Yesterday' : x.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' }); };
const preview = (l: ConvT['last']) => !l ? 'No messages yet' : l.del ? 'Message deleted' : l.t === 'voice' ? '🎤 Voice message' : l.t === 'image' ? '📷 Photo' : l.t === 'call' ? '📞 ' + l.body : l.t ? '📎 Attachment' : l.body;
const roleLabel = (p: PersonT) => (p.role === 'admin' ? 'Administrator' : p.role === 'teacher' ? 'Teacher' : 'Student') + (p.code ? ` · ${p.code}` : '');

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [onClose]);
  return (<div className="fixed inset-0 z-[70] bg-black/40 flex items-center justify-center p-3" onMouseDown={onClose}><div role="dialog" aria-label={title} onMouseDown={e => e.stopPropagation()} className="card w-full max-w-md max-h-[85vh] flex flex-col shadow-2xl">
    <div className="flex items-center justify-between p-3 border-b border-[var(--line)]"><b>{title}</b><button onClick={onClose} aria-label="Close" className="p-1 rounded hover:bg-black/10"><Icon n="x" size={18} /></button></div>{children}</div></div>);
}

export default function ChatApp({ me, items, directory, canGroup, initialId, autoCall }: { me: PersonT; items: ConvT[]; directory: PersonT[]; canGroup: boolean; initialId?: string; autoCall?: 'audio' | 'video' }) {
  const sb = useMemo(() => supabaseBrowser(), []); const router = useRouter(); const rt = useRt(); const { addUnread, startCall, activeConv } = rt;
  const [convs, setConvs] = useState(items); useEffect(() => setConvs(items), [items]);
  const [aid, setAid] = useState<string | null>(initialId && items.some(c => c.id === initialId) ? initialId : null);
  const aidRef = useRef(aid); aidRef.current = aid; const convsRef = useRef(convs); convsRef.current = convs;
  const active = convs.find(c => c.id === aid) ?? null; const others = active ? active.members.filter(p => p.id !== me.id) : []; const peer = active?.kind === 'dm' ? others[0] : undefined;
  const [msgs, setMsgs] = useState<M[]>([]); const [reads, setReads] = useState<Record<string, string>>({});
  const [text, setText] = useState(''); const [q, setQ] = useState(''); const [err, setErr] = useState(''); const [typing, setTyping] = useState<string | null>(null);
  const [modal, setModal] = useState<null | 'new' | 'group' | 'manage'>(null); const [menu, setMenu] = useState<string | null>(null); const [info, setInfo] = useState<M | null>(null);
  const [rec, setRec] = useState<{ secs: number } | null>(null); const [pick, setPick] = useState(''); const [gTitle, setGTitle] = useState(''); const [gSel, setGSel] = useState<Set<string>>(new Set()); const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null); const chRef = useRef<ReturnType<typeof sb.channel> | null>(null); const tt = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lastTyped = useRef(0); const recRef = useRef<MediaRecorder | null>(null); const chunks = useRef<Blob[]>([]); const recTimer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => { activeConv.current = aid; return () => { activeConv.current = null; }; }, [aid, activeConv]);

  // load the open conversation + live updates (new messages, deletions, read receipts, typing)
  useEffect(() => {
    if (!aid) { setMsgs([]); return; } let live = true; setMsgs([]); setReads({}); setTyping(null);
    (async () => {
      const [{ data: m }, { data: r }] = await Promise.all([sb.from('messages').select('*').eq('conversation_id', aid).order('created_at', { ascending: false }).limit(150), sb.from('message_reads').select('user_id,last_read_at').eq('conversation_id', aid)]);
      if (!live) return; setMsgs(((m ?? []) as M[]).reverse()); setReads(Object.fromEntries((r ?? []).map(x => [x.user_id as string, x.last_read_at as string])));
    })();
    const ch = sb.channel(`conv:${aid}`, { config: { broadcast: { self: false } } })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${aid}` }, p => { const m = p.new as M; setMsgs(a => (a.some(x => x.id === m.id) ? a : [...a, m])); })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${aid}` }, p => { const m = p.new as M; setMsgs(a => a.map(x => (x.id === m.id ? { ...x, ...m } : x))); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'message_reads', filter: `conversation_id=eq.${aid}` }, p => { const r = p.new as { user_id?: string; last_read_at?: string }; if (r?.user_id && r.last_read_at) setReads(a => ({ ...a, [r.user_id!]: r.last_read_at! })); })
      .on('broadcast', { event: 'typing' }, ({ payload }) => { setTyping((payload as { name?: string })?.name ?? 'Someone'); clearTimeout(tt.current); tt.current = setTimeout(() => setTyping(null), 2500); }).subscribe();
    chRef.current = ch; return () => { live = false; sb.removeChannel(ch); };
  }, [aid, sb]);

  // keep the conversation list (last message, order, unread) live
  useEffect(() => {
    const ch = sb.channel('chat-list').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, p => {
      const m = p.new as M; const i = convsRef.current.findIndex(c => c.id === m.conversation_id); if (i < 0) { router.refresh(); return; }
      setConvs(cs => { const k = cs.findIndex(c => c.id === m.conversation_id); if (k < 0) return cs; const c = cs[k]; const mine = m.sender_id === me.id;
        return [{ ...c, last: { body: m.body, at: m.created_at, mine, t: m.attachment_type, del: false }, sortAt: m.created_at, unread: mine || m.conversation_id === aidRef.current || m.attachment_type === 'call' ? c.unread : c.unread + 1 }, ...cs.filter((_, j) => j !== k)]; });
    }).subscribe();
    return () => { sb.removeChannel(ch); };
  }, [sb, me.id, router]);

  // scroll + mark as read while the conversation is open
  useEffect(() => {
    if (!aid) return; endRef.current?.scrollIntoView({ behavior: 'auto' });
    if (document.visibilityState !== 'visible') return;
    const prev = convsRef.current.find(c => c.id === aid)?.unread ?? 0; if (prev) { setConvs(cs => cs.map(c => (c.id === aid ? { ...c, unread: 0 } : c))); addUnread(-prev); }
    void quiet(() => markRead(aid));
  }, [aid, msgs.length, addUnread]);

  const did = useRef(false);
  useEffect(() => { if (autoCall && active && !did.current) { did.current = true; void startCall({ id: active.id, title: active.title, peerId: peer?.id }, autoCall); } }, [autoCall, active, peer?.id, startCall]);

  async function send(e: React.FormEvent) {
    e.preventDefault(); const body = text.trim(); if (!body || !aid) return; setText(''); setErr('');
    const { data, error } = await sb.from('messages').insert({ conversation_id: aid, sender_id: me.id, body }).select().single();
    if (error || !data) { setErr('Your message could not be sent.'); setText(body); } else setMsgs(a => (a.some(x => x.id === data.id) ? a : [...a, data as M]));
  }
  async function attach(f: File) { if (!aid) return; setErr(''); const fd = new FormData(); fd.set('cid', aid); fd.set('file', f); const r = await quiet(() => sendAttachment(fd)); if (r.error) setErr(r.error); }
  async function startRec() {
    try {
      const st = await navigator.mediaDevices.getUserMedia({ audio: true }); const mime = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const r = new MediaRecorder(st, { mimeType: mime }); chunks.current = []; r.ondataavailable = e => { if (e.data.size) chunks.current.push(e.data); }; r.start(); recRef.current = r; setRec({ secs: 0 });
      recTimer.current = setInterval(() => setRec(x => (x ? { secs: x.secs + 1 } : x)), 1000);
    } catch { setErr('Please allow microphone access to record a voice message.'); }
  }
  function stopRec(sendIt: boolean) {
    const r = recRef.current; clearInterval(recTimer.current); setRec(null); recRef.current = null; if (!r) return;
    r.onstop = async () => {
      r.stream.getTracks().forEach(t => t.stop()); if (!sendIt || !aid) return; const mime = r.mimeType.startsWith('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const f = new File(chunks.current, `voice.${mime === 'audio/webm' ? 'webm' : 'm4a'}`, { type: mime }); if (f.size < 800) return;
      const fd = new FormData(); fd.set('cid', aid); fd.set('kind', 'voice'); fd.set('file', f); const res = await quiet(() => sendAttachment(fd)); if (res.error) setErr(res.error);
    };
    r.stop();
  }
  const call = (k: 'audio' | 'video') => { if (active) void rt.startCall({ id: active.id, title: active.title, peerId: peer?.id }, k); };
  const seenBy = (m: M) => others.filter(p => reads[p.id] && Date.parse(reads[p.id]) >= Date.parse(m.created_at));
  const shownConvs = convs.filter(c => !q || c.title.toLowerCase().includes(q.toLowerCase()));
  const shown = msgs;
  const sub = !active ? '' : active.kind === 'group' ? `${active.members.length} members` : !peer ? '' : rt.online.has(peer.id) ? 'Active now' : peer.seen ? `Last seen ${new Date(peer.seen).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}` : 'Offline';

  function openGroupModal(manage: boolean) { setGTitle(manage && active ? active.title : ''); setGSel(new Set(manage && active ? active.members.filter(m => m.id !== me.id).map(m => m.id) : [])); setPick(''); setModal(manage ? 'manage' : 'group'); }
  async function saveGroup() {
    setBusy(true); setErr(''); const ids = [...gSel];
    const r = modal === 'manage' && active ? await updateGroup(active.id, gTitle, ids) : await createGroup(gTitle, ids); setBusy(false);
    if ('error' in r && r.error) { setErr(r.error); return; } setModal(null); router.refresh(); if ('id' in r && r.id) setAid(r.id);
  }
  async function startWith(p: PersonT) { setBusy(true); const r = await openDirect(p.id); setBusy(false); if (!r.id) { setErr(r.error ?? 'Could not open the chat.'); return; } setModal(null); if (!convsRef.current.some(c => c.id === r.id)) router.refresh(); setAid(r.id); }
  const filtDir = directory.filter(p => !pick || p.name.toLowerCase().includes(pick.toLowerCase()) || (p.code ?? '').toLowerCase().includes(pick.toLowerCase()));
  let lastDay = '';

  return (<div className="h-full flex bg-[var(--bg)]" dir="ltr">
    {/* conversation list */}
    <aside className={`${aid ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-[340px] shrink-0 border-e border-[var(--line)] bg-[var(--card)]`}>
      <div className="flex items-center gap-2 p-3"><h1 className="text-xl font-bold flex-1">Chat</h1>
        {canGroup && <button onClick={() => openGroupModal(false)} className="btn btn-ghost btn-sm" title="Create a group"><Icon n="users" size={16} />&nbsp;New group</button>}
        <button onClick={() => { setPick(''); setModal('new'); }} className="btn btn-sm" title="Start a new chat"><Icon n="plus" size={16} />&nbsp;New chat</button></div>
      <div className="px-3 pb-2"><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search chats" aria-label="Search chats" className="inp !min-h-9" /></div>
      <ul className="flex-1 overflow-y-auto">
        {shownConvs.length === 0 && <li className="p-4 text-sm opacity-70">{convs.length === 0 ? 'No chats yet. Use “New chat” to message someone.' : 'No chats match your search.'}</li>}
        {shownConvs.map(c => { const o = c.members.find(m => m.id !== me.id); const on = c.id === aid; return (
          <li key={c.id}><button onClick={() => setAid(c.id)} className={`w-full flex items-center gap-3 px-3 py-3 text-start border-s-[3px] ${on ? 'bg-[var(--bg)] border-[var(--gold)]' : 'border-transparent hover:bg-[var(--bg)]'}`}>
            {c.kind === 'group' ? <span className="w-11 h-11 rounded-full bg-[var(--brand)] text-white flex items-center justify-center shrink-0"><Icon n="users" size={20} /></span> : <Avatar id={o?.id ?? c.id} name={c.title} size={44} has={o?.has} v={o?.v} online={o ? rt.online.has(o.id) : undefined} />}
            <span className="flex-1 min-w-0"><span className="flex justify-between gap-2"><span className={`truncate ${c.unread ? 'font-bold' : 'font-semibold'}`}>{c.title}</span><span className="text-[11px] opacity-60 shrink-0">{c.last ? tm(c.last.at) : ''}</span></span>
              <span className="flex justify-between gap-2 text-sm opacity-75"><span className={`truncate ${c.unread ? 'font-semibold opacity-100' : ''}`}>{c.last?.mine ? 'You: ' : ''}{preview(c.last)}</span>
                {c.unread > 0 && <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-red-600 text-white text-[11px] font-bold flex items-center justify-center">{c.unread}</span>}</span></span></button></li>); })}</ul>
    </aside>
    {/* conversation */}
    <section className={`${aid ? 'flex' : 'hidden md:flex'} flex-1 min-w-0 flex-col`}>
      {!active ? <div className="flex-1 flex items-center justify-center text-center p-6 opacity-70"><div><Icon n="chat" size={48} /><p className="mt-3">Select a chat, or start a new one.</p></div></div> : (<>
        <div className="flex items-center gap-3 px-3 py-2 border-b border-[var(--line)] bg-[var(--card)]">
          <button onClick={() => setAid(null)} aria-label="Back to chats" className="md:hidden p-2 -ms-1"><Icon n="back" size={20} /></button>
          {active.kind === 'group' ? <span className="w-10 h-10 rounded-full bg-[var(--brand)] text-white flex items-center justify-center"><Icon n="users" size={18} /></span> : <Avatar id={peer?.id ?? active.id} name={active.title} size={40} has={peer?.has} v={peer?.v} online={peer ? rt.online.has(peer.id) : undefined} />}
          <div className="flex-1 min-w-0"><div className="font-semibold truncate">{active.title}</div><div className="text-xs opacity-70 truncate">{peer ? `${roleLabel(peer)} · ` : ''}{sub}</div></div>
          {canGroup && active.kind === 'group' && <button onClick={() => openGroupModal(true)} className="btn btn-ghost btn-sm">Manage group</button>}
          <button onClick={() => call('audio')} disabled={rt.busy} aria-label="Audio call" title="Audio call" className="p-2.5 rounded-full hover:bg-[var(--bg)] disabled:opacity-40"><Icon n="phone" size={20} /></button>
          <button onClick={() => call('video')} disabled={rt.busy} aria-label="Video call" title="Video call" className="p-2.5 rounded-full hover:bg-[var(--bg)] disabled:opacity-40"><Icon n="video" size={20} /></button></div>
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1" aria-live="polite" onClick={() => setMenu(null)}>
          {shown.map(m => {
            const mine = m.sender_id === me.id; const day = new Date(m.created_at).toDateString(); const sep = day !== lastDay; lastDay = day; const sender = active.members.find(p => p.id === m.sender_id); const seen = seenBy(m);
            if (m.attachment_type === 'call') return (<div key={m.id}>{sep && <div className="text-center text-xs opacity-60 my-3">{dayLabel(m.created_at)}</div>}<div className="text-center text-xs opacity-70 py-1">📞 {m.body} · {tm(m.created_at)}</div></div>);
            return (<div key={m.id}>{sep && <div className="text-center text-xs opacity-60 my-3">{dayLabel(m.created_at)}</div>}
              <div className={`group flex items-end gap-2 ${mine ? 'justify-end' : 'justify-start'}`}>
                {!mine && active.kind === 'group' && <Avatar id={m.sender_id} name={sender?.name ?? 'Member'} size={28} has={sender?.has} v={sender?.v} />}
                <div className={`relative max-w-[82%] rounded-2xl px-3 py-2 text-sm ${mine ? 'bg-[var(--brand)] text-white rounded-ee-sm' : 'bg-[var(--card)] border border-[var(--line)] rounded-es-sm'}`}>
                  {!mine && active.kind === 'group' && <div className="text-xs font-semibold opacity-80 mb-0.5">{sender?.name ?? 'Member'}</div>}
                  {m.deleted_at ? <i className="opacity-70">This message was deleted</i> : <>
                    {m.body && <p className="whitespace-pre-wrap break-words">{m.body}</p>}
                    {m.attachment_path && m.attachment_type === 'image' && /* eslint-disable-next-line @next/next/no-img-element */ <a href={`/api/chat/media?id=${m.id}`} target="_blank" rel="noopener noreferrer"><img src={`/api/chat/media?id=${m.id}`} alt={m.attachment_name ?? 'Photo'} loading="lazy" className="max-h-60 rounded-lg" /></a>}
                    {m.attachment_path && (m.attachment_type === 'voice' || m.attachment_type === 'audio') && <audio controls preload="none" src={`/api/chat/media?id=${m.id}`} className="h-9 max-w-full" />}
                    {m.attachment_path && m.attachment_type === 'file' && <a className="underline flex items-center gap-1" href={`/api/chat/media?id=${m.id}`} target="_blank" rel="noopener noreferrer"><Icon n="clip" size={14} />{m.attachment_name ?? 'File'}</a>}</>}
                  <div className="text-[10px] opacity-70 mt-1 flex items-center justify-end gap-1">{tm(m.created_at)}
                    {mine && !m.deleted_at && (seen.length ? <span title="Seen" className="text-[#7ee7ff] font-bold">✓✓</span> : <span title="Sent">✓</span>)}</div>
                  {!m.deleted_at && <button onClick={e => { e.stopPropagation(); setMenu(menu === m.id ? null : m.id); }} aria-label="Message options" className={`absolute top-1 ${mine ? '-start-8' : '-end-8'} p-1 rounded-full opacity-0 group-hover:opacity-100 focus:opacity-100 bg-[var(--card)] border border-[var(--line)] text-[var(--fg)]`}><Icon n="more" size={14} /></button>}
                  {menu === m.id && (<div role="menu" className={`card absolute z-20 top-8 ${mine ? '-start-2 -translate-x-full' : '-end-2 translate-x-full'} w-44 p-1 text-[var(--fg)] shadow-lg`} onClick={e => e.stopPropagation()}>
                    <button role="menuitem" className="w-full flex items-center gap-2 px-2 py-2 rounded hover:bg-[var(--bg)]" onClick={() => { setInfo(m); setMenu(null); }}><Icon n="info" size={16} />Message info</button>
                    {mine && <button role="menuitem" className="w-full flex items-center gap-2 px-2 py-2 rounded hover:bg-[var(--bg)] text-red-700" onClick={() => { setMenu(null); if (confirm('Delete this message for everyone?')) void deleteForEveryone(m.id); }}><Icon n="trash" size={16} />Delete for everyone</button>}
                    {!mine && <button role="menuitem" className="w-full flex items-center gap-2 px-2 py-2 rounded hover:bg-[var(--bg)]" onClick={() => { setMenu(null); const r = prompt('Why are you reporting this message?'); if (r !== null) void reportMessage(m.id, r).then(() => alert('Thank you. The message was reported to the academy.')); }}><Icon n="flag" size={16} />Report</button>}</div>)}
                </div></div></div>);
          })}
          {typing && <p className="text-xs opacity-70 px-2">{typing} is typing…</p>}<div ref={endRef} /></div>
        {err && <p role="alert" className="px-4 pb-1 text-red-600 text-sm">{err}</p>}
        {rec ? (<div className="p-3 border-t border-[var(--line)] bg-[var(--card)] flex items-center gap-3"><span className="w-3 h-3 rounded-full bg-red-600 animate-pulse" /><span className="font-mono text-sm flex-1">Recording {String(Math.floor(rec.secs / 60)).padStart(2, '0')}:{String(rec.secs % 60).padStart(2, '0')}</span>
          <button onClick={() => stopRec(false)} className="btn btn-ghost btn-sm">Cancel</button><button onClick={() => stopRec(true)} className="btn btn-sm"><Icon n="send" size={16} />&nbsp;Send</button></div>)
          : (<form onSubmit={send} className="p-3 border-t border-[var(--line)] bg-[var(--card)] flex items-center gap-2">
            <label className="p-2.5 rounded-full hover:bg-[var(--bg)] cursor-pointer" title="Attach a file or photo"><Icon n="clip" size={20} /><input type="file" className="hidden" accept="image/*,application/pdf,audio/*" onChange={e => { const f = e.target.files?.[0]; if (f) void attach(f); e.target.value = ''; }} /></label>
            <input value={text} maxLength={2000} onChange={e => { setText(e.target.value); if (Date.now() - lastTyped.current > 1500) { lastTyped.current = Date.now(); chRef.current?.send({ type: 'broadcast', event: 'typing', payload: { name: me.name } }); } }} placeholder="Type a message" aria-label="Message" className="inp !rounded-full" />
            {text.trim() ? <button className="p-3 rounded-full bg-[var(--brand)] text-white" aria-label="Send"><Icon n="send" size={18} /></button> : <button type="button" onClick={() => void startRec()} className="p-3 rounded-full bg-[var(--brand)] text-white" aria-label="Record a voice message" title="Record a voice message"><Icon n="mic" size={18} /></button>}</form>)}
      </>)}
    </section>
    {info && (<Modal title="Message info" onClose={() => setInfo(null)}><div className="p-4 text-sm space-y-3 overflow-y-auto">
      <p className="whitespace-pre-wrap break-words border-s-4 border-[var(--gold)] ps-3">{info.body || info.attachment_name || 'Attachment'}</p>
      <p><b>Sent:</b> {new Date(info.created_at).toLocaleString()}</p>
      {others.length > 0 && <div><b>Seen by</b><ul className="mt-1 space-y-1">{others.map(p => { const r = reads[p.id]; const s = r && Date.parse(r) >= Date.parse(info.created_at); return (<li key={p.id} className="flex items-center gap-2"><Avatar id={p.id} name={p.name} size={26} has={p.has} v={p.v} /><span className="flex-1">{p.name}</span><span className="opacity-70">{s ? `Seen (chat opened ${new Date(r).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })})` : 'Not seen yet'}</span></li>); })}</ul></div>}</div></Modal>)}
    {modal === 'new' && (<Modal title="New chat" onClose={() => setModal(null)}><div className="p-3"><input autoFocus value={pick} onChange={e => setPick(e.target.value)} placeholder="Search by name or ID" aria-label="Search people" className="inp" /></div>
      <ul className="overflow-y-auto pb-2">{filtDir.length === 0 && <li className="px-4 py-3 text-sm opacity-70">No one to show. You can message administrators{me.role === 'student' ? ' and your assigned teacher' : me.role === 'teacher' ? ' and your assigned students' : ''}.</li>}
        {filtDir.slice(0, 200).map(p => <li key={p.id}><button disabled={busy} onClick={() => void startWith(p)} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--bg)] text-start"><Avatar id={p.id} name={p.name} size={38} has={p.has} v={p.v} online={rt.online.has(p.id)} /><span className="min-w-0"><span className="block font-semibold truncate">{p.name}</span><span className="block text-xs opacity-70">{roleLabel(p)}</span></span></button></li>)}</ul></Modal>)}
    {(modal === 'group' || modal === 'manage') && (<Modal title={modal === 'manage' ? 'Manage group' : 'New group'} onClose={() => setModal(null)}>
      <div className="p-3 space-y-2"><input value={gTitle} onChange={e => setGTitle(e.target.value)} maxLength={80} placeholder="Group name" aria-label="Group name" className="inp" /><input value={pick} onChange={e => setPick(e.target.value)} placeholder="Search people to add" aria-label="Search people" className="inp" />
        <p className="text-xs opacity-70">Only administrators can create groups and change who is in them.</p></div>
      <ul className="overflow-y-auto flex-1">{filtDir.slice(0, 300).map(p => <li key={p.id}><label className="flex items-center gap-3 px-4 py-2 hover:bg-[var(--bg)] cursor-pointer"><input type="checkbox" className="size-5" checked={gSel.has(p.id)} onChange={e => setGSel(s => { const n = new Set(s); if (e.target.checked) n.add(p.id); else n.delete(p.id); return n; })} /><Avatar id={p.id} name={p.name} size={32} has={p.has} v={p.v} /><span className="min-w-0"><span className="block font-semibold truncate">{p.name}</span><span className="block text-xs opacity-70">{roleLabel(p)}</span></span></label></li>)}</ul>
      <div className="p-3 border-t border-[var(--line)] flex items-center justify-between gap-2"><span className="text-sm">{gSel.size} selected</span><button disabled={busy || !gTitle.trim()} onClick={() => void saveGroup()} className="btn btn-sm">{busy ? 'Saving…' : 'Save group'}</button></div>
      {err && <p role="alert" className="px-3 pb-3 text-red-600 text-sm">{err}</p>}</Modal>)}
  </div>);
}
