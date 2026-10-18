import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import PhotoForm from '@/components/teams/PhotoForm';
export const dynamic = 'force-dynamic';
export default async function Page() {
  const sb = await supabaseServer(); const { data: { user } } = await sb.auth.getUser(); if (!user) redirect('/login');
  const { data: p } = await supabaseAdmin().from('profiles').select('role,full_name,avatar_path,avatar_locked').eq('id', user.id).single();
  const role = p?.role ?? 'student'; const home = role === 'admin' ? '/admin' : role === 'teacher' ? '/teacher' : '/student';
  return <PhotoForm id={user.id} name={p?.full_name ?? 'Me'} has={!!p?.avatar_path} v={p?.avatar_path ? String(p.avatar_path).slice(-12) : null} locked={role !== 'admin' && !!p?.avatar_locked} home={home} />;
}
