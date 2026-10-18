import { requireRole } from '@/lib/auth';
import AppShell from '@/components/teams/AppShell';
import { STUDENT_NAV } from '@/components/teams/nav';
export default async function StudentShell({ children, bleed }: { children: (ctx: Awaited<ReturnType<typeof requireRole>>) => Promise<React.ReactNode> | React.ReactNode; bleed?: boolean }) {
  const ctx = await requireRole('student');
  return <AppShell role="student" nav={STUDENT_NAV} ctx={ctx} bleed={bleed}>{await children(ctx)}</AppShell>;
}
