import type { IconName } from './Icons';
export type NavItem = { href: string; label: string; icon: IconName };
export const ADMIN_NAV: NavItem[] = [
  { href: '/admin', label: 'Home', icon: 'home' }, { href: '/admin/chat', label: 'Chat', icon: 'chat' },
  { href: '/admin/applications', label: 'Applications', icon: 'file' }, { href: '/admin/students', label: 'Students', icon: 'users' }, { href: '/admin/teachers', label: 'Teachers', icon: 'briefcase' },
  { href: '/admin/people', label: 'Photos', icon: 'image' }, { href: '/admin/admission', label: 'Admission info', icon: 'clipboard' }, { href: '/admin/classes', label: 'Classes', icon: 'calendar' }, { href: '/admin/courses', label: 'Courses', icon: 'book' },
  { href: '/admin/fees', label: 'Fees', icon: 'card' }, { href: '/admin/payments', label: 'Payments', icon: 'dollar' }, { href: '/admin/marquee', label: 'Marquee', icon: 'megaphone' },
  { href: '/admin/emails', label: 'Emails', icon: 'mail' }, { href: '/admin/pages', label: 'Policies', icon: 'shield' }, { href: '/admin/inbox', label: 'Inbox', icon: 'inbox' },
  { href: '/admin/reports', label: 'Reports', icon: 'chart' }, { href: '/admin/audit', label: 'Audit', icon: 'clock' }, { href: '/admin/security', label: 'Security', icon: 'lock' }, { href: '/admin/settings', label: 'Settings', icon: 'gear' },
];
export const PINNED = 2; // the first items stay visible in the side bar; everything else opens from the three-dot button
export const TEACHER_NAV: NavItem[] = [
  { href: '/teacher', label: 'Students', icon: 'users' }, { href: '/teacher/chat', label: 'Chat', icon: 'chat' }, { href: '/teacher/classes', label: 'Classes', icon: 'calendar' }, { href: '/teacher/quran', label: 'Quran', icon: 'book' },
];
export const STUDENT_NAV: NavItem[] = [
  { href: '/student', label: 'Home', icon: 'home' }, { href: '/student/chat', label: 'Chat', icon: 'chat' }, { href: '/student/timetable', label: 'Classes', icon: 'video' },
  { href: '/student/attendance', label: 'Attendance', icon: 'checksq' }, { href: '/student/homework', label: 'Homework', icon: 'clipboard' }, { href: '/student/materials', label: 'Materials', icon: 'folder' },
  { href: '/student/feedback', label: 'Feedback', icon: 'star' }, { href: '/student/certificates', label: 'Certificates', icon: 'award' }, { href: '/student/fees', label: 'Fees', icon: 'card' },
  { href: '/student/profile', label: 'Profile', icon: 'user' }, { href: '/student/support', label: 'Support', icon: 'help' },
];
