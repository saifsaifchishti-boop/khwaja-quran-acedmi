// Usage: npm run import-quran -- path/to/quran-uthmani.txt
// Source: Tanzil.net "Uthmani" text, plain-text format "surah|ayah|text". Download it yourself from https://tanzil.net/download/ (see README for the licence terms you must keep).
// The text is imported byte-for-byte; only a search column (diacritics stripped) is derived. Nothing is typed or edited here.
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
const COUNTS = [7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6];
const norm = s => s.normalize('NFKD').replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u08D3-\u08FF\u0640]/g, '').replace(/[\u0671\u0622\u0623\u0625]/g, '\u0627').replace(/\u0649/g, '\u064A').replace(/\s+/g, ' ').trim();
const file = process.argv[2]; if (!file) { console.error('Give the path to the Tanzil Uthmani text file.'); process.exit(1); }
const rows = []; const seen = new Map();
for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
  if (!line.trim() || line.startsWith('#')) continue;
  const i1 = line.indexOf('|'), i2 = line.indexOf('|', i1 + 1); if (i1 < 0 || i2 < 0) continue;
  const surah = +line.slice(0, i1), ayah = +line.slice(i1 + 1, i2), text = line.slice(i2 + 1);
  if (!(surah >= 1 && surah <= 114 && ayah >= 1)) throw new Error(`Bad line: ${line.slice(0, 30)}`);
  rows.push({ surah, ayah, text, text_search: norm(text) }); seen.set(surah, (seen.get(surah) ?? 0) + 1);
}
if (rows.length !== 6236) throw new Error(`Expected 6236 ayahs, found ${rows.length}. Aborting — wrong file?`);
COUNTS.forEach((c, i) => { if (seen.get(i + 1) !== c) throw new Error(`Surah ${i + 1}: expected ${c} ayahs, found ${seen.get(i + 1)}`); });
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
for (let i = 0; i < rows.length; i += 500) { const { error } = await db.from('quran_ayahs').upsert(rows.slice(i, i + 500), { onConflict: 'surah,ayah' }); if (error) throw error; process.stdout.write('.'); }
console.log(`\nImported ${rows.length} ayahs. Verified against the 114-surah structure.`);
