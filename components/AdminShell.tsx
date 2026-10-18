import { requireRole } from '@/lib/auth';
import AppShell from '@/components/teams/AppShell';
import { ADMIN_NAV } from '@/components/teams/nav';
export default async function AdminShell({ children, skipMfa, bleed }: { children: React.ReactNode; skipMfa?: boolean; bleed?: boolean }) {
  const ctx = await requireRole('admin', { skipMfa }); // server-side check on every admin page
  return <AppShell role="admin" nav={ADMIN_NAV} ctx={ctx} bleed={bleed}>{children}</AppShell>;
}
