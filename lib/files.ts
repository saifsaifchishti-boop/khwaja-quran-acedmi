import 'server-only';
import { supabaseAdmin } from './supabase/admin';
export const FILE_OK = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'audio/mpeg', 'audio/mp4', 'audio/webm', 'audio/ogg'];
export const EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'application/pdf': 'pdf', 'audio/mpeg': 'mp3', 'audio/mp4': 'm4a', 'audio/webm': 'webm', 'audio/ogg': 'ogg' };
// Upload after the caller has been authorized. Returns storage path or an error string.
export async function putFile(prefix: string, f: File, maxMb = 8): Promise<{ path?: string; error?: string }> {
  if (!FILE_OK.includes(f.type)) return { error: 'Allowed: JPG, PNG, WebP, PDF, MP3/M4A/WebM/OGG audio.' };
  if (f.size > maxMb * 1024 * 1024) return { error: `File must be under ${maxMb} MB.` };
  const path = `${prefix}/${crypto.randomUUID()}.${EXT[f.type]}`;
  const { error } = await supabaseAdmin().storage.from('lms-files').upload(path, f, { contentType: f.type });
  return error ? { error: 'Upload failed.' } : { path };
}
export async function signed(path: string | null | undefined, bucket = 'lms-files', secs = 600) {
  if (!path) return null; const { data } = await supabaseAdmin().storage.from(bucket).createSignedUrl(path, secs); return data?.signedUrl ?? null;
}
