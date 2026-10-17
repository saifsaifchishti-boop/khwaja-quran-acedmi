'use client';
import { useEffect } from 'react';
export default function PairSplit() {
  useEffect(() => { const sel = document.querySelector<HTMLSelectElement>('select[name=pair]'); if (!sel) return; const f = sel.form!;
    const set = () => { const [t, s] = sel.value.split('|'); (f.elements.namedItem('teacher_id') as HTMLInputElement).value = t ?? ''; (f.elements.namedItem('student_id') as HTMLInputElement).value = s ?? ''; };
    sel.addEventListener('change', set); return () => sel.removeEventListener('change', set); }, []);
  return <><input type="hidden" name="teacher_id" /><input type="hidden" name="student_id" /></>;
}
