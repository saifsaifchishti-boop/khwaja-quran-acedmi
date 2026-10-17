import { describe, it, expect } from 'vitest';
import { SURAHS, JUZ_START, TOTAL_AYAHS, juzOf, validRef, normalizeArabic } from '@/lib/quran-meta';
import { feeSummary } from '@/lib/fees';
import { render } from '@/lib/render';
import { EMAIL_DEFAULTS } from '@/lib/email-defaults';
import { csvCell } from '@/lib/fmt';
describe('quran metadata', () => {
  it('has 114 surahs and 6236 ayahs', () => { expect(SURAHS.length).toBe(114); expect(SURAHS.reduce((a, [, n]) => a + n, 0)).toBe(TOTAL_AYAHS); });
  it('has 30 juz starting at 1:1', () => { expect(JUZ_START.length).toBe(30); expect(juzOf(1, 1)).toBe(1); expect(juzOf(2, 141)).toBe(1); expect(juzOf(2, 142)).toBe(2); expect(juzOf(114, 6)).toBe(30); });
  it('validates references', () => { expect(validRef(2, 286)).toBe(true); expect(validRef(2, 287)).toBe(false); expect(validRef(115, 1)).toBe(false); });
  it('normalises Arabic for search only', () => { expect(normalizeArabic('ٱلرَّحْمَٰنِ')).toBe(normalizeArabic('الرحمن')); });
});
describe('fees', () => {
  it('computes balance from approved payments only', () => {
    const f = { id: 'a', amount: 1000, discount: 100 }; const s = feeSummary(f, [{ fee_id: 'a', amount: 300, status: 'approved' }, { fee_id: 'a', amount: 200, status: 'pending' }, { fee_id: 'a', amount: 50, status: 'rejected' }]);
    expect(s).toEqual({ total: 900, paid: 300, pending: 200, balance: 600 });
  });
});
describe('email templates', () => {
  it('escapes HTML in variables when asked', () => { expect(render('Hi {{name}}', { name: '<b>x</b>' }, true)).toBe('Hi &lt;b&gt;x&lt;/b&gt;'); });
  it('every default has en+ur subject and body', () => { for (const [k, t] of Object.entries(EMAIL_DEFAULTS)) { expect(t.subject_en && t.body_en && t.subject_ur && t.body_ur, k).toBeTruthy(); } });
});
describe('csv', () => { it('neutralises spreadsheet formulas', () => { expect(csvCell('=1+1')).toBe(`"'=1+1"`); expect(csvCell('a"b')).toBe('"a""b"'); }); });
