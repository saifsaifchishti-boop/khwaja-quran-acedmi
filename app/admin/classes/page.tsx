import AdminShell from '@/components/AdminShell';
import PairSplit from '@/components/PairSplit'; // splits the teacher|student selector into the two hidden fields
import { supabaseAdmin } from '@/lib/supabase/admin';
import { fmtDT, DAYS } from '@/lib/fmt';
import { saveSchedule, extendSchedule, stopSchedule, cancelSession } from '../actions2';
export const dynamic = 'force-dynamic';
export default async function Page() {
  const db = supabaseAdmin();
  const [{ data: asg }, { data: sch }, { data: ses }] = await Promise.all([
    db.from('teacher_assignments').select('teacher_id,student_id,teachers(full_name),students(full_name,student_code)').eq('active', true).limit(300),
    db.from('class_schedules').select('*, teachers(full_name), students(full_name)').eq('active', true).order('created_at', { ascending: false }).limit(100),
    db.from('class_sessions').select('*, teachers(full_name), students(full_name)').eq('status', 'scheduled').gte('starts_at', new Date().toISOString()).order('starts_at').limit(60)]);
  return (<AdminShell><h1 className="text-2xl font-bold mb-4">Classes &amp; timetable</h1>
    <form action={saveSchedule} className="card p-4 grid sm:grid-cols-4 gap-3"><div className="sm:col-span-4"><label className="lbl">Teacher → student (assign them first under Teachers)</label>
      <select required className="inp" name="pair" aria-label="pair" defaultValue=""><option value="">Select pair…</option>{(asg ?? []).map((a: any) => <option key={a.teacher_id + a.student_id} value={`${a.teacher_id}|${a.student_id}`}>{a.teachers?.full_name} → {a.students?.student_code} {a.students?.full_name}</option>)}</select></div>
      <PairSplit />
      <div><label className="lbl">Weekday</label><select name="weekday" className="inp">{DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}</select></div>
      <div><label className="lbl">Start time</label><input name="start_time" type="time" required className="inp" /></div><div><label className="lbl">Minutes</label><input name="duration_min" type="number" defaultValue={30} min={10} max={240} className="inp" /></div>
      <div><label className="lbl">Time zone of that start time</label><input name="tz" defaultValue="Asia/Karachi" className="inp" dir="ltr" /></div>
      <div><label className="lbl">Starts on</label><input name="starts_on" type="date" className="inp" /></div><div><label className="lbl">Ends on (optional)</label><input name="ends_on" type="date" className="inp" /></div><div><label className="lbl">Generate weeks</label><input name="weeks" type="number" defaultValue={8} min={1} max={26} className="inp" /></div>
      <button className="btn self-end">Create weekly schedule</button><p className="sm:col-span-4 text-xs opacity-70">Sessions are generated in the given zone (daylight-saving safe). A slot that overlaps another class of the same teacher or student is skipped automatically.</p></form>
    <h2 className="font-bold mt-8 mb-2">Weekly schedules</h2><ul className="card divide-y divide-[var(--line)] text-sm">{(sch ?? []).map((x: any) => <li key={x.id} className="p-3 flex flex-wrap justify-between gap-2"><span>{x.teachers?.full_name} → {x.students?.full_name}: {DAYS[x.weekday]} {String(x.start_time).slice(0, 5)} ({x.tz}), {x.duration_min} min</span>
      <span className="flex gap-1"><form action={extendSchedule}><input type="hidden" name="id" value={x.id} /><button className="btn btn-sm btn-ghost">+8 weeks</button></form><form action={stopSchedule}><input type="hidden" name="id" value={x.id} /><button className="btn btn-sm btn-red">Stop</button></form></span></li>)}</ul>
    <h2 className="font-bold mt-8 mb-2">Upcoming sessions</h2><ul className="card divide-y divide-[var(--line)] text-sm">{(ses ?? []).map((c: any) => <li key={c.id} className="p-3 flex flex-wrap justify-between gap-2"><span>{fmtDT(c.starts_at, 'Asia/Karachi')} PKT — {c.teachers?.full_name} / {c.students?.full_name}</span>
      <form action={cancelSession} className="flex gap-1"><input type="hidden" name="id" value={c.id} /><input name="reason" placeholder="Reason (sent to student)" className="inp !min-h-9" /><button className="btn btn-sm btn-red">Cancel</button></form></li>)}</ul></AdminShell>);
}
