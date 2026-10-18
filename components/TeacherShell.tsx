import { requireRole } from '@/lib/auth';
import AppShell from '@/components/teams/AppShell';
import { TEACHER_NAV } from '@/components/teams/nav';
export default async function TeacherShell({ children, bleed }: { children: (ctx: Awaited<ReturnType<typeof requireRole>>) => Promise<React.ReactNode> | React.ReactNode; bleed?: boolean }) {
  const ctx = await requireRole('teacher');
  return <AppShell role="teacher" nav={TEACHER_NAV} ctx={ctx} bleed={bleed}>{await children(ctx)}</AppShell>;
}
