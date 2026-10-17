import { NextResponse } from 'next/server';
import { requireRole, audit } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { csvCell } from '@/lib/fmt';
const SETS: Record<string, { table: string; sel: string; cols: [string, (r: any) => unknown][] }> = {
  students: { table: 'students', sel: '*, courses(title_en)', cols: [['student_code', r => r.student_code], ['name', r => r.full_name], ['email', r => r.email], ['whatsapp', r => r.whatsapp], ['timezone', r => r.timezone], ['course', r => r.courses?.title_en], ['status', r => r.status], ['enrolled_at', r => r.enrolled_at]] },
  fees: { table: 'fees', sel: '*, students(student_code,full_name)', cols: [['student_code', r => r.students?.student_code], ['name', r => r.students?.full_name], ['title', r => r.title], ['amount', r => r.amount], ['discount', r => r.discount], ['currency', r => r.currency], ['due_date', r => r.due_date]] },
  payments: { table: 'payments', sel: '*, students(student_code,full_name), fees(title)', cols: [['receipt_no', r => r.receipt_no], ['student_code', r => r.students?.student_code], ['name', r => r.students?.full_name], ['fee', r => r.fees?.title], ['amount', r => r.amount], ['txn_ref', r => r.txn_ref], ['paid_on', r => r.paid_on], ['status', r => r.status], ['source', r => r.source]] },
  attendance: { table: 'attendance', sel: '*, students(student_code,full_name), teachers(teacher_code), class_sessions(starts_at)', cols: [['starts_at_utc', r => r.class_sessions?.starts_at], ['student_code', r => r.students?.student_code], ['name', r => r.students?.full_name], ['teacher', r => r.teachers?.teacher_code], ['status', r => r.status], ['note', r => r.note]] },
};
export async function GET(req: Request) {
  const { user } = await requireRole('admin'); const type = new URL(req.url).searchParams.get('type') ?? ''; const d = SETS[type]; if (!d) return new NextResponse('Unknown report', { status: 400 });
  const { data } = await supabaseAdmin().from(d.table).select(d.sel).limit(20000); await audit(user.id, 'report.exported', d.table, type, { rows: data?.length ?? 0 });
  const csv = [d.cols.map(([h]) => h).join(','), ...(data ?? []).map(r => d.cols.map(([, f]) => csvCell(f(r))).join(','))].join('\r\n');
  return new NextResponse('\uFEFF' + csv, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="${type}-${new Date().toISOString().slice(0, 10)}.csv"`, 'Cache-Control': 'no-store' } });
}
