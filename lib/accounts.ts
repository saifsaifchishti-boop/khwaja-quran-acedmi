import 'server-only';
import { randomInt } from 'crypto';
// 12-char temporary password without look-alike characters (no 0/O, 1/l/I).
export function genPassword() {
  const sets = ['ABCDEFGHJKLMNPQRSTUVWXYZ', 'abcdefghijkmnpqrstuvwxyz', '23456789'];
  const all = sets.join(''); const out = sets.map(s => s[randomInt(s.length)]);
  while (out.length < 12) out.push(all[randomInt(all.length)]);
  for (let i = out.length - 1; i > 0; i--) { const j = randomInt(i + 1); [out[i], out[j]] = [out[j], out[i]]; }
  return out.join('');
}
