import AdminShell from '@/components/AdminShell';
import MfaPanel from '@/components/MfaPanel';
export const dynamic = 'force-dynamic';
export default function Page() {
  return (<AdminShell skipMfa><h1 className="text-2xl font-bold mb-3">Security</h1>
    <p className="text-sm mb-3">{process.env.ADMIN_REQUIRE_MFA === 'true' ? 'Two-factor is REQUIRED for every admin page.' : 'Two-factor is optional right now. Set ADMIN_REQUIRE_MFA=true after enrolling to enforce it.'}</p><MfaPanel /></AdminShell>);
}
