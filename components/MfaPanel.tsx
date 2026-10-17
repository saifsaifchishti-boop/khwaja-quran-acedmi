'use client';
import { useEffect, useMemo, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/browser';
// TOTP two-factor for admins using Supabase Auth MFA.
export default function MfaPanel() {
  const sb = useMemo(() => supabaseBrowser(), []); const [factors, setFactors] = useState<{ id: string; status: string }[]>([]); const [aal, setAal] = useState(''); const [qr, setQr] = useState(''); const [fid, setFid] = useState(''); const [code, setCode] = useState(''); const [msg, setMsg] = useState('');
  const load = async () => { const f = await sb.auth.mfa.listFactors(); setFactors((f.data?.totp ?? []).map(x => ({ id: x.id, status: x.status }))); const a = await sb.auth.mfa.getAuthenticatorAssuranceLevel(); setAal(a.data?.currentLevel ?? ''); };
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const verified = factors.find(f => f.status === 'verified');
  async function enroll() { setMsg(''); const { data, error } = await sb.auth.mfa.enroll({ factorType: 'totp' }); if (error) return setMsg(error.message); setQr(data.totp.qr_code); setFid(data.id); }
  async function verify(id: string) { const ch = await sb.auth.mfa.challenge({ factorId: id }); if (ch.error) return setMsg(ch.error.message); const v = await sb.auth.mfa.verify({ factorId: id, challengeId: ch.data.id, code }); if (v.error) return setMsg('Wrong code. Try again.'); setMsg('Verified.'); setQr(''); setCode(''); await load(); location.href = '/admin'; }
  async function remove(id: string) { if (!confirm('Remove this authenticator?')) return; await sb.auth.mfa.unenroll({ factorId: id }); await load(); }
  return (<div className="card p-4 space-y-3" dir="ltr"><p>Status: <b>{verified ? (aal === 'aal2' ? 'Two-factor active (this session verified)' : 'Enrolled — enter a code to verify this session') : 'Not enrolled'}</b></p>
    {verified && aal !== 'aal2' && <div className="flex gap-2"><input value={code} onChange={e => setCode(e.target.value)} inputMode="numeric" maxLength={6} placeholder="6-digit code" aria-label="Code" className="inp !w-40" /><button className="btn" onClick={() => verify(verified.id)}>Verify</button></div>}
    {verified && <button className="btn btn-sm btn-red" onClick={() => remove(verified.id)}>Remove authenticator</button>}
    {!verified && !qr && <button className="btn" onClick={enroll}>Set up authenticator app</button>}
    {qr && <div className="space-y-2"><p className="text-sm">Scan with Google Authenticator / Microsoft Authenticator / Authy, then enter the code.</p><img src={qr} alt="QR code" className="size-44 bg-white p-2" />
      <div className="flex gap-2"><input value={code} onChange={e => setCode(e.target.value)} inputMode="numeric" maxLength={6} placeholder="6-digit code" aria-label="Code" className="inp !w-40" /><button className="btn" onClick={() => verify(fid)}>Confirm</button></div></div>}
    {msg && <p role="status" className="text-sm">{msg}</p>}</div>);
}
