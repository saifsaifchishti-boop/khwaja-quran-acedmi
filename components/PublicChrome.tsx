'use client';
import { usePathname } from 'next/navigation';
// The public website header, marquee and footer are hidden inside the signed-in portals, which have their own Teams-style frame.
export default function PublicChrome({ top, bottom, children }: { top: React.ReactNode; bottom: React.ReactNode; children: React.ReactNode }) {
  const p = usePathname() ?? '';
  const app = (p.startsWith('/admin') && p !== '/admin/login') || (p.startsWith('/teacher') && p !== '/teacher/login') || p.startsWith('/student');
  return app ? <>{children}</> : <>{top}{children}{bottom}</>;
}
