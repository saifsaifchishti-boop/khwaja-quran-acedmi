import StudentShell from '@/components/StudentShell';
import AForm from '@/components/Msg';
import { updateProfile, changePassword, signOutEverywhere } from '../actions2';
export const dynamic = 'force-dynamic';
export default function Page() {
  return (<StudentShell>{async ({ sb, user }) => {
    const { data: s } = await sb.from('students').select('*').eq('user_id', user.id).single();
    return (<><h1 className="text-2xl font-bold mb-3">Profile</h1><p className="text-sm opacity-70 mb-3">Name, email and course are changed by the academy — contact support.</p>
      <AForm action={updateProfile}><div><label className="lbl">WhatsApp</label><input name="whatsapp" defaultValue={s?.whatsapp ?? ''} className="inp" dir="ltr" /></div>
        <div><label className="lbl">Time zone (IANA, e.g. Asia/Karachi)</label><input name="timezone" defaultValue={s?.timezone ?? ''} className="inp" dir="ltr" /></div></AForm>
      <h2 className="font-bold mt-8 mb-2">Change password</h2><AForm action={changePassword} okText="Password updated."><input name="password" type="password" minLength={10} autoComplete="new-password" placeholder="New password (10+ characters)" className="inp" dir="ltr" required />
        <input name="confirm" type="password" autoComplete="new-password" placeholder="Confirm" className="inp" dir="ltr" required /></AForm>
      <form action={signOutEverywhere} className="mt-6"><button className="btn btn-sm btn-red">Sign out of all devices</button></form></>);
  }}</StudentShell>);
}
