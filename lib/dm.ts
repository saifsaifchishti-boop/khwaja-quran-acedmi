import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
// Opens (or finds) the one-to-one chat between two people. Used when the administrator assigns a student to a teacher.
export async function ensureDirect(db: SupabaseClient, a: string, b: string): Promise<string | null> {
  if (!a || !b || a === b) return null; const key = [a, b].sort().join(':');
  const { data: ex } = await db.from('conversations').select('id').eq('dm_key', key).maybeSingle(); if (ex) return ex.id;
  const { data: c } = await db.from('conversations').insert({ kind: 'dm', dm_key: key, created_by: a }).select('id').single(); if (!c) return null;
  await db.from('conversation_members').insert([{ conversation_id: c.id, user_id: a }, { conversation_id: c.id, user_id: b }]); return c.id;
}
