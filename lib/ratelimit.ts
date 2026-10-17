import 'server-only';
import { headers } from 'next/headers';
import { supabaseAdmin } from './supabase/admin';
// DB-backed fixed-window limiter (function rate_limit_hit in 002_part2.sql). Fails open if the DB call errors.
export async function clientIp() {
  const h = await headers();
  return (h.get('x-forwarded-for')?.split(',')[0] ?? h.get('x-real-ip') ?? 'unknown').trim();
}
export async function allow(key: string, windowSec: number, max: number): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin().rpc('rate_limit_hit', { p_key: key, p_window: windowSec, p_max: max });
    if (error) { console.error('ratelimit', error.code); return true; }
    return data === true;
  } catch { return true; }
}
