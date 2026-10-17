import 'server-only';
import { redirect } from 'next/navigation';
import { supabaseServer } from './supabase/server';
import { supabaseAdmin } from './supabase/admin';

export type Role = 'admin' | 'teacher' | 'student';
const LOGIN: Record<Role, string> = { admin: '/admin/login', teacher: '/teacher/login', student: '/login' };

// Server-side role gate. Admin accounts additionally need MFA (AAL2) when ADMIN_REQUIRE_MFA=true.
export async function requireRole(role: Role, opts: { skipMfa?: boolean } = {}) {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect(LOGIN[role]);
  const { data: p } = await sb.from('profiles').select('role').eq('id', user.id).single();
  if (p?.role !== role) redirect(LOGIN[role]);
  if (role === 'admin' && !opts.skipMfa && process.env.ADMIN_REQUIRE_MFA === 'true') {
    const { data: a } = await sb.auth.mfa.getAuthenticatorAssuranceLevel();
    if (a?.currentLevel !== 'aal2') redirect('/admin/security');
  }
  return { sb, user };
}
export async function audit(actor: string, action: string, entity: string, entity_id: string, meta: object = {}) {
  await supabaseAdmin().from('audit_logs').insert({ actor, action, entity, entity_id, meta });
}
export async function notify(user_id: string | null | undefined, title: string, body?: string, href?: string) {
  if (!user_id) return;
  try { await supabaseAdmin().from('notifications').insert({ user_id, title, body, href }); } catch (e) { console.error('notify failed'); }
}
