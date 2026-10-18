import 'server-only';
import { randomUUID } from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
const EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
// Validates type, size and the real file signature, then stores the picture in the private "avatars" bucket.
export async function saveAvatarFile(db: SupabaseClient, folder: string, f: File): Promise<{ path?: string; error?: string }> {
  if (!EXT[f.type]) return { error: 'Please choose a JPG, PNG or WebP picture.' };
  if (f.size > 2 * 1024 * 1024) return { error: 'The picture must be smaller than 2 MB.' };
  const b = new Uint8Array(await f.slice(0, 12).arrayBuffer());
  const jpg = b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff; const png = b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47;
  const webp = b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50;
  if (!(jpg || png || webp)) return { error: 'This file is not a valid picture.' };
  const path = `${folder}/${randomUUID()}.${EXT[f.type]}`;
  const { error } = await db.storage.from('avatars').upload(path, f, { contentType: f.type });
  return error ? { error: 'Upload failed. Please try again.' } : { path };
}
