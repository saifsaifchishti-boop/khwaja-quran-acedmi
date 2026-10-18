'use client';
import { useState } from 'react';
// Round profile picture with initials fallback and an optional green "online" dot (Teams style).
export default function Avatar({ id, name, size = 36, online, has = true, v }: { id: string; name: string; size?: number; online?: boolean; has?: boolean; v?: string | null }) {
  const [bad, setBad] = useState(false);
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || '?';
  let h = 0; for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 360;
  return (<span className="relative inline-block shrink-0" style={{ width: size, height: size }}>
    {has && !bad
      // eslint-disable-next-line @next/next/no-img-element
      ? <img src={`/api/avatar/${id}${v ? `?v=${v}` : ''}`} alt="" width={size} height={size} onError={() => setBad(true)} className="rounded-full object-cover w-full h-full" />
      : <span className="rounded-full w-full h-full flex items-center justify-center text-white font-semibold select-none" style={{ background: `hsl(${h} 42% 36%)`, fontSize: Math.max(11, size * 0.38) }}>{initials}</span>}
    {online !== undefined && <span aria-label={online ? 'Online' : 'Offline'} className="absolute -bottom-0.5 -end-0.5 rounded-full border-2 border-[var(--card)]" style={{ width: Math.max(9, size * 0.28), height: Math.max(9, size * 0.28), background: online ? '#22c55e' : '#9ca3af' }} />}
  </span>);
}
