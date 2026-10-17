'use client';
import { useEffect, useRef, useState } from 'react';
import { Room, RoomEvent, Track, type RemoteTrack } from 'livekit-client';
type St = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'ended';
export default function LiveRoom({ sessionId }: { sessionId: string }) {
  const room = useRef<Room | null>(null); const remote = useRef<HTMLDivElement>(null); const local = useRef<HTMLDivElement>(null);
  const [st, setSt] = useState<St>('idle'); const [err, setErr] = useState(''); const [cam, setCam] = useState(true); const [mic, setMic] = useState(true); const [share, setShare] = useState(false); const [mini, setMini] = useState(false);
  const [secs, setSecs] = useState(0); const [cams, setCams] = useState<MediaDeviceInfo[]>([]); const [mics, setMics] = useState<MediaDeviceInfo[]>([]);
  useEffect(() => { if (st !== 'connected') return; const t = setInterval(() => setSecs(s => s + 1), 1000); return () => clearInterval(t); }, [st]);
  useEffect(() => () => { room.current?.disconnect(); }, []);
  async function join() {
    setErr(''); setSt('connecting');
    try {
      const r = await fetch('/api/live/token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId }) }); const j = await r.json(); if (!r.ok) throw new Error(j.error ?? 'Could not join');
      const rm = new Room({ adaptiveStream: true, dynacast: true }); room.current = rm;
      const add = (t: RemoteTrack) => { if (t.kind === Track.Kind.Video || t.kind === Track.Kind.Audio) { const el = t.attach(); el.setAttribute('playsinline', 'true'); if (t.kind === Track.Kind.Video) { (el as HTMLElement).className = 'w-full rounded-lg bg-black'; } remote.current?.appendChild(el); } };
      rm.on(RoomEvent.TrackSubscribed, add).on(RoomEvent.TrackUnsubscribed, t => t.detach().forEach(e => e.remove()))
        .on(RoomEvent.Reconnecting, () => setSt('reconnecting')).on(RoomEvent.Reconnected, () => setSt('connected')).on(RoomEvent.Disconnected, () => setSt('ended'))
        .on(RoomEvent.LocalTrackPublished, p => { if (p.track && p.source === Track.Source.Camera && local.current) { local.current.replaceChildren(); const el = p.track.attach(); (el as HTMLElement).className = 'w-full rounded-lg bg-black'; local.current.appendChild(el); } });
      await rm.connect(j.url, j.token); await rm.localParticipant.setMicrophoneEnabled(true); await rm.localParticipant.setCameraEnabled(true); setSt('connected');
      setCams(await Room.getLocalDevices('videoinput').catch(() => [])); setMics(await Room.getLocalDevices('audioinput').catch(() => []));
    } catch (e) { setErr(e instanceof Error ? e.message : 'Could not join'); setSt('idle'); }
  }
  const leave = () => { room.current?.disconnect(); setSt('ended'); };
  const tog = async (k: 'cam' | 'mic' | 'share') => { const lp = room.current?.localParticipant; if (!lp) return;
    if (k === 'cam') { await lp.setCameraEnabled(!cam); setCam(!cam); } if (k === 'mic') { await lp.setMicrophoneEnabled(!mic); setMic(!mic); }
    if (k === 'share') { try { await lp.setScreenShareEnabled(!share); setShare(!share); } catch { setErr('Screen sharing was blocked or is unsupported on this device.'); } } };
  const mm = String(Math.floor(secs / 60)).padStart(2, '0'), ss = String(secs % 60).padStart(2, '0');
  if (st === 'idle' || st === 'ended') return (<div className="card p-4 space-y-2" dir="ltr">{st === 'ended' && <p>The call has ended ({mm}:{ss}).</p>}<button onClick={join} className="btn">{st === 'ended' ? 'Rejoin class' : 'Join live class'}</button>{err && <p role="alert" className="text-red-600 text-sm">{err}</p>}
    <p className="text-xs opacity-70">Your browser will ask permission for camera and microphone. Classes are not recorded.</p></div>);
  return (<div dir="ltr" className={mini ? 'fixed bottom-3 end-3 z-50 w-56 card p-2' : 'card p-3 space-y-3'}>
    <div className="flex justify-between text-sm"><span>{st === 'connecting' ? 'Connecting…' : st === 'reconnecting' ? '⚠ Reconnecting…' : '● Live'}</span><span className="font-mono">{mm}:{ss}</span></div>
    <div ref={remote} className={mini ? 'hidden' : 'grid gap-2'} /><div ref={local} className={mini ? 'hidden' : 'w-40'} />
    <div className="flex flex-wrap gap-2"><button className="btn btn-sm" onClick={() => tog('mic')}>{mic ? 'Mute' : 'Unmute'}</button><button className="btn btn-sm" onClick={() => tog('cam')}>{cam ? 'Camera off' : 'Camera on'}</button>
      <button className="btn btn-sm btn-ghost" onClick={() => tog('share')}>{share ? 'Stop sharing' : 'Share screen'}</button><button className="btn btn-sm btn-ghost" onClick={() => setMini(!mini)}>{mini ? 'Expand' : 'Minimize'}</button><button className="btn btn-sm btn-red" onClick={leave}>Leave</button></div>
    {!mini && <div className="flex flex-wrap gap-2 text-sm">{cams.length > 1 && <select aria-label="Camera" onChange={e => room.current?.switchActiveDevice('videoinput', e.target.value)} className="inp !min-h-9 !w-auto">{cams.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || 'Camera'}</option>)}</select>}
      {mics.length > 1 && <select aria-label="Microphone" onChange={e => room.current?.switchActiveDevice('audioinput', e.target.value)} className="inp !min-h-9 !w-auto">{mics.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || 'Microphone'}</option>)}</select>}</div>}
    {err && <p role="alert" className="text-red-600 text-sm">{err}</p>}</div>);
}
