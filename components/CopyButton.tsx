'use client';
import { useState } from 'react';
export default function CopyButton({ value, label = 'Copy' }: { value: string; label?: string }) {
  const [s, setS] = useState<'' | 'ok' | 'fail'>('');
  async function go() {
    try { await navigator.clipboard.writeText(value); setS('ok'); } catch { setS('fail'); }
    setTimeout(() => setS(''), 2000);
  }
  return <button type="button" onClick={go} className="btn btn-ghost btn-sm" aria-live="polite">{s === 'ok' ? '✓ Copied' : s === 'fail' ? 'Copy failed' : label}</button>;
}
