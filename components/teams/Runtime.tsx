'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { Room, RoomEvent, Track, type Participant } from 'livekit-client';
import { supabaseBrowser } from '@/lib/supabase/browser';
import { callInfo, logCall, touchSeen, sendAttachment } from '@/app/teams-actions';
import { quiet } from '@/lib/quiet';
import Avatar from './Avatar';
import Icon from './Icons';

// Lives in the root layout, so presence, ringing and calls keep working while the user moves between pages.
type Kind = 'audio' | 'video';
type CallS = { id: string; convId: string; kind: Kind; title: string; peerId?: string; dir: 'out' | 'in'; phase: 'ringing' | 'connecting' | 'live'; mini: boolean };
type Incoming = { id: string; convId: string; kind: Kind; name: string; callerId: string; peerId?: string };
type Rt = { meId: string | null; online: Set<string>; unread: number; addUnread: (n: number) => void; activeConv: React.MutableRefObject<string | null>; startCall: (c: { id: string; title: string; peerId?: string }, k: Kind) => Promise<void>; busy: boolean };
const Ctx = createContext<Rt | null>(null);
export const useRt = () => { const c = useContext(Ctx); if (!c) throw new Error('Runtime is missing'); return c; };
const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

function useRing(on: boolean) {
  useEffect(() => {
    if (!on) return; let ctx: AudioContext | null = null; try { ctx = new AudioContext(); } catch { return; }
    const beep = () => { if (!ctx) return; const o = ctx.createOscillator(); const g = ctx.createGain(); o.frequency.value = 440; g.gain.value = 0.04; o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + 0.35); };
    beep(); const t = setInterval(beep, 2000); return () => { clearInterval(t); ctx?.close().catch(() => {}); };
  }, [on]);
}

function Tile({ p, big }: { p: Participant; big?: boolean }) {
  const vref = useRef<HTMLVideoElement>(null); const aref = useRef<HTMLAudioElement>(null);
  const cam = p.getTrackPublication(Track.Source.Camera); const scr = p.getTrackPublication(Track.Source.ScreenShare); const mic = p.getTrackPublication(Track.Source.Microphone);
  const vt = scr?.track ?? (cam && !cam.isMuted ? cam.track : undefined); const at = p.isLocal ? undefined : mic?.track;
  useEffect(() => { const el = vref.current; if (!el || !vt) return; vt.attach(el); return () => { vt.detach(el); }; }, [vt]);
  useEffect(() => { const el = aref.current; if (!el || !at) return; at.attach(el); return () => { at.detach(el); }; }, [at]);
  const muted = !mic || mic.isMuted;
  return (<div className={`relative overflow-hidden rounded-xl bg-neutral-800 ${big ? 'w-full h-full' : 'w-full aspect-video'} flex items-center justify-center`}>
    {vt ? <video ref={vref} autoPlay playsInline muted className={`w-full h-full ${scr?.track ? 'object-contain' : 'object-cover'} ${p.isLocal && !scr?.track ? '-scale-x-100' : ''}`} /> : <Avatar id={p.identity} name={p.name || 'Member'} size={big ? 110 : 56} />}
    {!p.isLocal && <audio ref={aref} autoPlay />}
    <div className="absolute bottom-2 start-2 flex items-center gap-1 text-xs bg-black/60 text-white rounded px-2 py-1">{muted && <Icon n="micoff" size={12} />}{p.isLocal ? 'You' : p.name || 'Member'}</div></div>);
}

export default function Runtime({ children }: { children: React.ReactNode }) {
  const sb = useMemo(() => supabaseBrowser(), []);
  const [meId, setMeId] = useState<string | null>(null); const [online, setOnline] = useState<Set<string>>(new Set()); const [unread, setUnread] = useState(0);
  const activeConv = useRef<string | null>(null);
  const [call, setCall] = useState<CallS | null>(null); const callRef = useRef<CallS | null>(null); callRef.current = call;
  const [incoming, setIncoming] = useState<Incoming | null>(null); const room = useRef<Room | null>(null); const [, force] = useReducer((x: number) => x + 1, 0);
  const [secs, setSecs] = useState(0); const [mic, setMic] = useState(true); const [cam, setCam] = useState(false); const [share, setShare] = useState(false); const [err, setErr] = useState(''); const [toast, setToast] = useState('');
  const liveAt = useRef<number | null>(null); const hadRemote = useRef(false); const ringTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const api = useRef<{ start: Rt['startCall'] }>({ start: async () => {} });
  // Call recording (audio of everyone on the call). The other side is told, and the file is shared into the chat when recording stops.
  const recR = useRef<{ mr: MediaRecorder; ctx: AudioContext; dest: MediaStreamAudioDestinationNode; src: Map<string, { node: MediaStreamAudioSourceNode; tid: string }>; chunks: Blob[]; convId: string; mime: string; timer: ReturnType<typeof setTimeout> } | null>(null);
  const [rec, setRec] = useState(false); const [peerRec, setPeerRec] = useState(false);
  const tell = (on: boolean) => { try { void room.current?.localParticipant.publishData(new TextEncoder().encode(JSON.stringify({ t: 'rec', on })), { reliable: true }).catch(() => {}); } catch { /* call already closed */ } };
  function wireRec() {
    const r = recR.current; const rm = room.current; if (!r || !rm) return; const list: { id: string; t: MediaStreamTrack }[] = [];
    const lm = rm.localParticipant.getTrackPublication(Track.Source.Microphone)?.track?.mediaStreamTrack; if (lm) list.push({ id: 'local', t: lm });
    rm.remoteParticipants.forEach(p => { const mt = p.getTrackPublication(Track.Source.Microphone)?.track?.mediaStreamTrack; if (mt) list.push({ id: p.identity, t: mt }); });
    list.forEach(({ id, t }) => { const old = r.src.get(id); if (old && old.tid === t.id) return; old?.node.disconnect(); const node = r.ctx.createMediaStreamSource(new MediaStream([t])); node.connect(r.dest); r.src.set(id, { node, tid: t.id }); });
  }
  function startRec() {
    const c = callRef.current; const rm = room.current; if (!c || !rm || recR.current || c.phase !== 'live') return;
    try {
      const ctx = new AudioContext(); void ctx.resume().catch(() => {}); const dest = ctx.createMediaStreamDestination(); const mime = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const mr = new MediaRecorder(dest.stream, { mimeType: mime, audioBitsPerSecond: 24000 }); const chunks: Blob[] = []; mr.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
      recR.current = { mr, ctx, dest, src: new Map(), chunks, convId: c.convId, mime, timer: setTimeout(() => stopRec(true), 20 * 60 * 1000) }; // 20 minutes keeps the file small enough to share
      wireRec(); mr.start(1000); setRec(true); tell(true);
    } catch { recR.current = null; say('Recording is not supported on this device.'); }
  }
  function stopRec(sendIt: boolean) {
    const r = recR.current; if (!r) return; recR.current = null; clearTimeout(r.timer); setRec(false); tell(false);
    r.mr.onstop = async () => {
      r.src.forEach(x => x.node.disconnect()); void r.ctx.close().catch(() => {}); if (!sendIt) return;
      const f = new File(r.chunks, `call-recording.${r.mime === 'audio/webm' ? 'webm' : 'm4a'}`, { type: r.mime });
      if (f.size < 2000) { say('The recording was empty.'); return; } if (f.size > 4.3 * 1024 * 1024) { say('The recording is too large to share (limit about 4 MB).'); return; }
      const fd = new FormData(); fd.set('cid', r.convId); fd.set('file', f); const res = await quiet(() => sendAttachment(fd)); say(res.error ? res.error : 'Call recording shared in the chat.');
    };
    if (r.mr.state !== 'inactive') r.mr.stop();
  }

  useEffect(() => {
    let on = true;
    const load = async () => {
      const { data: { user } } = await sb.auth.getUser(); if (!on) return; if (!user) { setMeId(null); return; }
      setMeId(user.id); const { data: n } = await sb.rpc('my_unread_total'); if (on) setUnread((n as number) ?? 0);
    };
    load(); const { data: sub } = sb.auth.onAuthStateChange(ev => { if (ev === 'SIGNED_IN' || ev === 'SIGNED_OUT') load(); });
    return () => { on = false; sub.subscription.unsubscribe(); };
  }, [sb]);

  const say = useCallback((m: string) => { setToast(m); setTimeout(() => setToast(''), 3500); }, []);
  function finish(note?: string) {
    if (recR.current) stopRec(true); setPeerRec(false); clearTimeout(ringTimer.current); const rm = room.current; room.current = null; rm?.disconnect(); liveAt.current = null; hadRemote.current = false;
    setSecs(0); setShare(false); setErr(''); setCall(null); callRef.current = null; if (note) say(note);
  }
  function goLive() { if (callRef.current && callRef.current.phase !== 'live') { clearTimeout(ringTimer.current); liveAt.current = Date.now(); setCall(c => c && { ...c, phase: 'live' }); callRef.current = { ...callRef.current, phase: 'live' }; } }
  async function leave() {
    const c = callRef.current; if (!c) return; const rm = room.current; const dur = liveAt.current ? Math.round((Date.now() - liveAt.current) / 1000) : 0; const alone = !rm || rm.remoteParticipants.size === 0;
    if (alone) await sb.from('calls').update({ status: 'ended', ended_at: new Date().toISOString() }).eq('id', c.id);
    if (c.dir === 'out' && dur > 0) void quiet(() => logCall(c.convId, `${c.kind === 'video' ? 'Video' : 'Audio'} call · ${mmss(dur)}`));
    finish();
  }
  async function join(c: CallS) {
    try {
      const r = await fetch('/api/live/call', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ callId: c.id }) }); const j = await r.json(); if (!r.ok) throw new Error(j.error ?? 'Could not join the call.');
      const rm = new Room({ adaptiveStream: true, dynacast: true }); room.current = rm;
      rm.on(RoomEvent.ParticipantConnected, () => { hadRemote.current = true; goLive(); force(); })
        .on(RoomEvent.ParticipantDisconnected, () => { force(); if (rm.remoteParticipants.size === 0 && hadRemote.current) void leave(); })
        .on(RoomEvent.TrackSubscribed, () => { force(); wireRec(); }).on(RoomEvent.TrackUnsubscribed, force).on(RoomEvent.TrackMuted, force).on(RoomEvent.TrackUnmuted, force)
        .on(RoomEvent.LocalTrackPublished, () => { force(); wireRec(); }).on(RoomEvent.LocalTrackUnpublished, force)
        .on(RoomEvent.DataReceived, (payload: Uint8Array) => { try { const m = JSON.parse(new TextDecoder().decode(payload)) as { t?: string; on?: boolean }; if (m.t === 'rec') setPeerRec(!!m.on); } catch { /* not ours */ } })
        .on(RoomEvent.Reconnecting, () => setErr('Connection lost. Reconnecting…')).on(RoomEvent.Reconnected, () => setErr(''))
        .on(RoomEvent.Disconnected, () => { if (room.current === rm) finish('The call has ended.'); });
      await rm.connect(j.url, j.token);
      await rm.localParticipant.setMicrophoneEnabled(true); setMic(true);
      if (c.kind === 'video') { await rm.localParticipant.setCameraEnabled(true); setCam(true); } else setCam(false);
      if (rm.remoteParticipants.size > 0) { hadRemote.current = true; goLive(); }
      if (c.dir === 'out') ringTimer.current = setTimeout(async () => { const cc = callRef.current; if (cc && cc.id === c.id && cc.phase === 'ringing') { await sb.from('calls').update({ status: 'missed' }).eq('id', c.id); void quiet(() => logCall(c.convId, `Missed ${c.kind} call`)); finish('No answer.'); } }, 45000);
      force();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not join the call.';
      await sb.from('calls').update({ status: 'ended' }).eq('id', c.id); finish(/permission|denied|NotAllowed/i.test(msg) ? 'Please allow microphone and camera access in your browser, then try again.' : msg);
    }
  }
  async function startCall(c: { id: string; title: string; peerId?: string }, kind: Kind) {
    if (callRef.current) { say('You are already in a call.'); return; } if (!meId) return;
    const { data, error } = await sb.from('calls').insert({ conversation_id: c.id, caller_id: meId, kind }).select('id').single(); if (error || !data) { say('Could not start the call.'); return; }
    const s: CallS = { id: data.id, convId: c.id, kind, title: c.title, peerId: c.peerId, dir: 'out', phase: 'ringing', mini: false }; setCall(s); callRef.current = s; await join(s);
  }
  api.current.start = startCall;
  async function accept() {
    const i = incoming; if (!i || callRef.current) return; setIncoming(null); await sb.from('calls').update({ status: 'active' }).eq('id', i.id);
    const s: CallS = { id: i.id, convId: i.convId, kind: i.kind, title: i.name, peerId: i.peerId, dir: 'in', phase: 'connecting', mini: false }; setCall(s); callRef.current = s; await join(s);
  }
  async function decline() { const i = incoming; setIncoming(null); if (i?.peerId) await sb.from('calls').update({ status: 'declined' }).eq('id', i.id); }
  async function toggle(k: 'mic' | 'cam' | 'share') {
    const lp = room.current?.localParticipant; if (!lp) return;
    try { if (k === 'mic') { await lp.setMicrophoneEnabled(!mic); setMic(!mic); } if (k === 'cam') { await lp.setCameraEnabled(!cam); setCam(!cam); } if (k === 'share') { await lp.setScreenShareEnabled(!share); setShare(!share); } }
    catch { setErr(k === 'share' ? 'Screen sharing is blocked or not supported on this device.' : `Could not access the ${k === 'mic' ? 'microphone' : 'camera'}.`); }
  }

  // presence + heartbeat + unread counter + incoming calls
  useEffect(() => {
    if (!meId) return;
    const pr = sb.channel('academy-presence', { config: { presence: { key: meId } } });
    pr.on('presence', { event: 'sync' }, () => setOnline(new Set(Object.keys(pr.presenceState())))).subscribe(async s => { if (s === 'SUBSCRIBED') await pr.track({ at: Date.now() }); });
    void quiet(() => touchSeen()); const hb = setInterval(() => void quiet(() => touchSeen()), 120000);
    const ch = sb.channel('rt-core')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, p => { const m = p.new as { sender_id: string; conversation_id: string; attachment_type: string | null }; if (m.sender_id !== meId && m.conversation_id !== activeConv.current && m.attachment_type !== 'call') setUnread(u => u + 1); })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'calls' }, async p => {
        const r = p.new as { id: string; caller_id: string; status: string; created_at: string }; if (r.caller_id === meId || r.status !== 'ringing' || Date.now() - new Date(r.created_at).getTime() > 60000 || callRef.current) return;
        const info = await quiet(() => callInfo(r.id)); if (!info || info.status !== 'ringing') return;
        setIncoming({ id: info.id, convId: info.convId, kind: info.kind, name: info.group ? `${info.name} · ${info.title}` : info.name, callerId: info.callerId, peerId: info.group ? undefined : info.callerId });
        setTimeout(() => setIncoming(i => (i && i.id === info.id ? null : i)), 45000);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'calls' }, p => {
        const r = p.new as { id: string; status: string }; setIncoming(i => (i && i.id === r.id && r.status !== 'ringing' ? null : i));
        const c = callRef.current; if (c && c.id === r.id && c.dir === 'out' && c.peerId && r.status === 'declined') finish('Call declined.');
      }).subscribe();
    return () => { clearInterval(hb); sb.removeChannel(pr); sb.removeChannel(ch); };
  }, [sb, meId]);
  useEffect(() => { if (call?.phase !== 'live') return; const t = setInterval(() => setSecs(s => s + 1), 1000); return () => clearInterval(t); }, [call?.phase]);
  useEffect(() => () => { room.current?.disconnect(); }, []);
  useRing(!!incoming || call?.phase === 'ringing');

  const startStable = useCallback((c: { id: string; title: string; peerId?: string }, k: Kind) => api.current.start(c, k), []);
  const addUnread = useCallback((n: number) => setUnread(u => Math.max(0, u + n)), []);
  const value = useMemo<Rt>(() => ({ meId, online, unread, addUnread, activeConv, startCall: startStable, busy: !!call }), [meId, online, unread, addUnread, startStable, call]);

  const parts: Participant[] = room.current ? [room.current.localParticipant, ...Array.from(room.current.remoteParticipants.values())] : [];
  const remotes = parts.slice(1);
  const btn = 'flex items-center justify-center rounded-full w-12 h-12 text-white transition-colors';
  return (<Ctx.Provider value={value}>{children}
    {incoming && !call && (<div role="alertdialog" aria-label="Incoming call" className="fixed top-4 start-1/2 -translate-x-1/2 z-[95] card shadow-2xl p-4 flex items-center gap-4 w-[min(92vw,420px)]" dir="ltr">
      <Avatar id={incoming.callerId} name={incoming.name} size={52} /><div className="flex-1 min-w-0"><div className="font-semibold truncate">{incoming.name}</div><div className="text-sm opacity-70">Incoming {incoming.kind} call…</div></div>
      <button onClick={decline} aria-label="Decline" className={`${btn} bg-red-600 hover:bg-red-700`}><Icon n="phone" rot={135} /></button>
      <button onClick={accept} aria-label="Accept" className={`${btn} bg-green-600 hover:bg-green-700`}><Icon n={incoming.kind === 'video' ? 'video' : 'phone'} /></button></div>)}
    {call && (<div dir="ltr" className={call.mini ? 'fixed bottom-4 end-4 z-[95] w-72 rounded-xl bg-neutral-900 text-white p-3 shadow-2xl' : 'fixed inset-0 z-[95] bg-neutral-900 text-white flex flex-col'}>
      <div className={`flex items-center justify-between gap-2 ${call.mini ? 'mb-2' : 'px-4 py-3'}`}><div className="min-w-0"><div className="font-semibold truncate">{call.title}</div>
        <div className="text-xs opacity-80">{call.phase === 'ringing' ? 'Calling…' : call.phase === 'connecting' ? 'Connecting…' : mmss(secs)}{err ? ` · ${err}` : ''}</div></div>
        {call.mini && <button onClick={() => setCall({ ...call, mini: false })} aria-label="Expand call" className="p-2 rounded hover:bg-white/10"><Icon n="maximize" size={18} /></button>}</div>
      {(rec || peerRec) && !call.mini && <div role="status" className="bg-red-600 text-white text-xs text-center py-1 px-3">● {rec ? 'You are recording this call. The other person has been told.' : 'The other person is recording this call.'}</div>}
      <div className={call.mini ? 'hidden' : 'flex-1 min-h-0 relative p-3'}>
        {remotes.length === 0 ? (<div className="h-full flex flex-col items-center justify-center gap-4 text-center">{call.peerId ? <Avatar id={call.peerId} name={call.title} size={120} /> : <div className="text-5xl">👥</div>}
          <div className="text-lg">{call.phase === 'ringing' ? `Calling ${call.title}…` : 'Waiting for others to join…'}</div></div>)
          : remotes.length === 1 ? <div className="h-full"><Tile p={remotes[0]} big /></div>
          : <div className="h-full grid gap-3 auto-rows-fr" style={{ gridTemplateColumns: `repeat(${Math.min(3, Math.ceil(Math.sqrt(parts.length)))},minmax(0,1fr))` }}>{parts.map(p => <Tile key={p.identity} p={p} />)}</div>}
        {parts[0] && remotes.length < 2 && <div className="absolute bottom-5 end-5 w-36 sm:w-56"><Tile p={parts[0]} /></div>}</div>
      <div className={`flex items-center justify-center gap-3 ${call.mini ? '' : 'py-4'}`}>
        <button onClick={() => toggle('mic')} aria-label={mic ? 'Mute' : 'Unmute'} title={mic ? 'Mute' : 'Unmute'} className={`${btn} ${mic ? 'bg-white/15 hover:bg-white/25' : 'bg-white text-neutral-900'}`}><Icon n={mic ? 'mic' : 'micoff'} /></button>
        {!call.mini && <><button onClick={() => toggle('cam')} aria-label={cam ? 'Turn camera off' : 'Turn camera on'} title={cam ? 'Turn camera off' : 'Turn camera on'} className={`${btn} ${cam ? 'bg-white/15 hover:bg-white/25' : 'bg-white text-neutral-900'}`}><Icon n={cam ? 'video' : 'videooff'} /></button>
          <button onClick={() => toggle('share')} aria-label={share ? 'Stop sharing' : 'Share screen'} title={share ? 'Stop sharing' : 'Share screen'} className={`${btn} ${share ? 'bg-green-600' : 'bg-white/15 hover:bg-white/25'}`}><Icon n="screen" /></button>
          <button onClick={() => (rec ? stopRec(true) : startRec())} disabled={call.phase !== 'live'} aria-label={rec ? 'Stop recording and share it in the chat' : 'Record the call'} title={rec ? 'Stop recording and share it in the chat' : 'Record the call'} className={`${btn} ${rec ? 'bg-red-600 animate-pulse' : 'bg-white/15 hover:bg-white/25'} disabled:opacity-40`}>{rec ? <span className="w-4 h-4 bg-white rounded-sm" /> : <span className="w-4 h-4 rounded-full border-2 border-white flex items-center justify-center"><span className="w-2 h-2 rounded-full bg-red-500" /></span>}</button>
          <button onClick={() => setCall({ ...call, mini: true })} aria-label="Minimize" title="Minimize" className={`${btn} bg-white/15 hover:bg-white/25`}><Icon n="minimize" /></button></>}
        <button onClick={() => void leave()} aria-label="Leave call" title="Leave call" className={`${btn} bg-red-600 hover:bg-red-700 w-14`}><Icon n="phone" rot={135} /></button></div></div>)}
    {toast && <div role="status" className="fixed bottom-6 start-1/2 -translate-x-1/2 z-[96] bg-neutral-900 text-white text-sm rounded-full px-4 py-2 shadow-lg">{toast}</div>}
  </Ctx.Provider>);
}
