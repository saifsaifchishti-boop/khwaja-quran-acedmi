-- Part 2: email, teachers, teaching data, LMS, Quran, chat, security. Run AFTER 001_init.sql.
create extension if not exists btree_gist;

-- helpers ------------------------------------------------------------
create table teachers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users on delete set null,
  teacher_code text unique not null, application_id uuid,
  full_name text not null, email text not null, whatsapp text, gender text, timezone text not null default 'UTC',
  status acct_status not null default 'active', joined_at timestamptz not null default now());
create or replace function my_student_id() returns uuid language sql stable security definer set search_path=public as
$$ select id from students where user_id = auth.uid() and status='active' limit 1 $$;
create or replace function my_teacher_id() returns uuid language sql stable security definer set search_path=public as
$$ select id from teachers where user_id = auth.uid() and status='active' limit 1 $$;

create table teacher_assignments (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references teachers(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  course_id uuid references courses(id), active boolean not null default true,
  created_at timestamptz default now(), unique (teacher_id, student_id));
create or replace function is_assigned(sid uuid) returns boolean language sql stable security definer set search_path=public as
$$ select exists(select 1 from teacher_assignments a where a.student_id = sid and a.active and a.teacher_id = my_teacher_id()) $$;
create or replace function pair_active(sid uuid, tid uuid) returns boolean language sql stable security definer set search_path=public as
$$ select exists(select 1 from teacher_assignments a where a.student_id = sid and a.teacher_id = tid and a.active) $$;

create sequence teacher_code_seq start 101;
create or replace function next_teacher_code() returns text language sql security definer set search_path=public as
$$ select 'TQ-' || to_char(now(),'YY') || '-' || nextval('teacher_code_seq')::text $$;

create table teacher_applications (
  id uuid primary key default gen_random_uuid(), ref text unique not null, status app_status not null default 'pending',
  full_name text not null, gender text not null check (gender in ('male','female')), email text not null, whatsapp text not null,
  country text not null, city text not null, timezone text not null,
  qualifications text not null, experience_years int, specialties text, languages text, availability text, bio text,
  doc_paths text[] not null default '{}', consent boolean not null,
  admin_note text, decided_by uuid references auth.users, decided_at timestamptz, created_at timestamptz not null default now());
create index on teacher_applications(status, created_at desc);

-- scheduling ---------------------------------------------------------
create table class_schedules (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references teachers(id) on delete cascade, student_id uuid not null references students(id) on delete cascade,
  weekday int not null check (weekday between 0 and 6),            -- 0=Sunday
  start_time time not null, duration_min int not null check (duration_min between 10 and 240),
  tz text not null default 'Asia/Karachi',                          -- zone in which start_time is defined (DST-safe)
  starts_on date not null default current_date, ends_on date, active boolean not null default true, created_at timestamptz default now());
create table class_sessions (
  id uuid primary key default gen_random_uuid(), schedule_id uuid references class_schedules(id) on delete set null,
  teacher_id uuid not null references teachers(id) on delete cascade, student_id uuid not null references students(id) on delete cascade,
  starts_at timestamptz not null, ends_at timestamptz not null check (ends_at > starts_at),
  status text not null default 'scheduled' check (status in ('scheduled','completed','cancelled')), cancel_reason text, created_at timestamptz default now(),
  exclude using gist (teacher_id with =, tstzrange(starts_at, ends_at) with &&) where (status <> 'cancelled'),
  exclude using gist (student_id with =, tstzrange(starts_at, ends_at) with &&) where (status <> 'cancelled'));
create index on class_sessions(student_id, starts_at); create index on class_sessions(teacher_id, starts_at);

create or replace function generate_sessions(p_schedule uuid, p_weeks int) returns jsonb language plpgsql security definer set search_path=public as $$
declare s class_schedules; d date; n int := 0; skipped int := 0; st timestamptz; last_day date;
begin
  select * into s from class_schedules where id = p_schedule and active;
  if not found then return jsonb_build_object('created',0,'skipped',0); end if;
  last_day := least(coalesce(s.ends_on, current_date + p_weeks*7), current_date + p_weeks*7);
  for d in select g::date from generate_series(greatest(s.starts_on, current_date), last_day, interval '1 day') g loop
    if extract(dow from d)::int = s.weekday then
      st := (d + s.start_time) at time zone s.tz;
      begin
        insert into class_sessions(schedule_id,teacher_id,student_id,starts_at,ends_at) values (s.id,s.teacher_id,s.student_id,st, st + make_interval(mins => s.duration_min));
        n := n + 1;
      exception when exclusion_violation then skipped := skipped + 1; end;
    end if;
  end loop;
  return jsonb_build_object('created',n,'skipped',skipped);
end $$;
revoke all on function generate_sessions(uuid,int) from public, anon, authenticated; grant execute on function generate_sessions(uuid,int) to service_role;
revoke all on function next_teacher_code() from public, anon, authenticated; grant execute on function next_teacher_code() to service_role;
grant execute on function next_student_code() to service_role;

-- LMS ----------------------------------------------------------------
create table attendance (
  id uuid primary key default gen_random_uuid(), session_id uuid not null unique references class_sessions(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade, teacher_id uuid not null references teachers(id),
  status text not null check (status in ('present','absent','late','excused')), note text, marked_at timestamptz default now());
create table assignments (
  id uuid primary key default gen_random_uuid(), teacher_id uuid not null references teachers(id), student_id uuid not null references students(id) on delete cascade,
  title text not null, description text, due_at timestamptz, created_at timestamptz default now());
create table submissions (
  id uuid primary key default gen_random_uuid(), assignment_id uuid not null unique references assignments(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade, body text, file_path text, submitted_at timestamptz default now(),
  grade text, feedback text, graded_at timestamptz);
create table materials (
  id uuid primary key default gen_random_uuid(), teacher_id uuid references teachers(id), student_id uuid not null references students(id) on delete cascade,
  title text not null, description text, url text, file_path text, created_at timestamptz default now());
create table feedback (
  id uuid primary key default gen_random_uuid(), teacher_id uuid not null references teachers(id), student_id uuid not null references students(id) on delete cascade,
  session_id uuid references class_sessions(id) on delete set null, body text not null, progress text, created_at timestamptz default now());
create table assessments (
  id uuid primary key default gen_random_uuid(), teacher_id uuid not null references teachers(id), student_id uuid not null references students(id) on delete cascade,
  title text not null, score numeric, max_score numeric, remarks text, assessed_on date default current_date);
create table certificates (
  id uuid primary key default gen_random_uuid(), code text unique not null, student_id uuid not null references students(id) on delete cascade,
  title text not null, issued_on date not null default current_date, issued_by uuid references auth.users, revoked boolean not null default false, note text);
create table notifications (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users on delete cascade,
  title text not null, body text, href text, read_at timestamptz, created_at timestamptz default now());
create index on notifications(user_id, created_at desc);
create table support_tickets (
  id uuid primary key default gen_random_uuid(), student_id uuid not null references students(id) on delete cascade,
  subject text not null, body text not null, status text not null default 'open' check (status in ('open','closed')),
  admin_reply text, replied_at timestamptz, created_at timestamptz default now());

-- chat ---------------------------------------------------------------
create table chat_messages (
  id uuid primary key default gen_random_uuid(), student_id uuid not null references students(id) on delete cascade, teacher_id uuid not null references teachers(id) on delete cascade,
  sender_id uuid not null references auth.users, body text not null default '' check (char_length(body) <= 2000),
  attachment_path text, attachment_name text, deleted_at timestamptz, created_at timestamptz not null default now());
create index on chat_messages(student_id, teacher_id, created_at desc);
create table chat_reads (student_id uuid, teacher_id uuid, user_id uuid references auth.users on delete cascade, last_read_at timestamptz not null default now(), primary key (student_id, teacher_id, user_id));
create table chat_reports (
  id uuid primary key default gen_random_uuid(), message_id uuid references chat_messages(id) on delete set null, student_id uuid, teacher_id uuid,
  reporter uuid references auth.users, reason text not null, status text not null default 'open', created_at timestamptz default now());

-- Quran --------------------------------------------------------------
create table quran_ayahs (surah smallint not null check (surah between 1 and 114), ayah smallint not null check (ayah >= 1), text text not null, text_search text not null default '', primary key (surah, ayah));
create index quran_search_idx on quran_ayahs using gin (to_tsvector('simple', text_search));
create table quran_bookmarks (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users on delete cascade, surah smallint not null, ayah smallint not null, note text, created_at timestamptz default now(), unique (user_id, surah, ayah));
create table quran_shares (id uuid primary key default gen_random_uuid(), session_id uuid not null references class_sessions(id) on delete cascade, surah smallint not null, ayah smallint not null, shared_by uuid references auth.users, created_at timestamptz default now());

-- email / pages / security ------------------------------------------
create table email_templates (key text primary key, subject_en text not null, body_en text not null, subject_ur text not null, body_ur text not null, enabled boolean not null default true, updated_at timestamptz default now());
create table email_logs (id bigint generated always as identity primary key, to_email text not null, template_key text, subject text not null, html text not null,
  status text not null default 'pending' check (status in ('pending','sent','failed')), attempts int not null default 0, error text, created_at timestamptz not null default now(), sent_at timestamptz);
create index on email_logs(status, created_at desc);
create table pages (slug text primary key, title_en text not null, title_ur text not null default '', body_en text not null default '', body_ur text not null default '', published boolean not null default false, updated_at timestamptz default now());
insert into pages(slug,title_en,title_ur) values ('privacy','Privacy Policy','رازداری کی پالیسی'),('terms','Terms of Use','شرائطِ استعمال'),('safeguarding','Child Safeguarding','بچوں کے تحفظ کی پالیسی') on conflict do nothing;
create table rate_limits (key text primary key, hits int not null, window_start timestamptz not null);
create or replace function rate_limit_hit(p_key text, p_window int, p_max int) returns boolean language plpgsql security definer set search_path=public as $$
declare h int;
begin
  insert into rate_limits(key,hits,window_start) values (p_key,1,now())
  on conflict (key) do update set
    hits = case when rate_limits.window_start < now() - make_interval(secs => p_window) then 1 else rate_limits.hits + 1 end,
    window_start = case when rate_limits.window_start < now() - make_interval(secs => p_window) then now() else rate_limits.window_start end
  returning hits into h;
  return h <= p_max;
end $$;
revoke all on function rate_limit_hit(text,int,int) from public, anon, authenticated; grant execute on function rate_limit_hit(text,int,int) to service_role;

-- RLS ----------------------------------------------------------------
do $$ declare t text; begin
  for t in select unnest(array['teachers','teacher_assignments','teacher_applications','class_schedules','class_sessions','attendance','assignments','submissions','materials','feedback','assessments',
    'certificates','notifications','support_tickets','chat_messages','chat_reads','chat_reports','quran_ayahs','quran_bookmarks','quran_shares','email_templates','email_logs','pages','rate_limits'])
  loop execute format('alter table %I enable row level security', t); end loop; end $$;

create policy "teachers read" on teachers for select using (user_id = auth.uid() or is_admin() or id in (select teacher_id from teacher_assignments where student_id = my_student_id() and active));
create policy "teachers admin" on teachers for all using (is_admin()) with check (is_admin());
create policy "students teacher read" on students for select using (is_assigned(id));
create policy "assign read" on teacher_assignments for select using (is_admin() or teacher_id = my_teacher_id() or student_id = my_student_id());
create policy "assign admin" on teacher_assignments for all using (is_admin()) with check (is_admin());
create policy "tapps admin" on teacher_applications for all using (is_admin()) with check (is_admin());   -- inserts happen server-side
create policy "sched read" on class_schedules for select using (is_admin() or teacher_id = my_teacher_id() or student_id = my_student_id());
create policy "sched admin" on class_schedules for all using (is_admin()) with check (is_admin());
create policy "sess read" on class_sessions for select using (is_admin() or teacher_id = my_teacher_id() or student_id = my_student_id());
create policy "sess admin" on class_sessions for all using (is_admin()) with check (is_admin());
-- teacher-owned tables: teacher writes only for assigned students; student reads own
create policy "att rw" on attendance for all using (is_admin() or is_assigned(student_id)) with check (is_admin() or (is_assigned(student_id) and teacher_id = my_teacher_id()));
create policy "att student" on attendance for select using (student_id = my_student_id());
create policy "asg rw" on assignments for all using (is_admin() or is_assigned(student_id)) with check (is_admin() or (is_assigned(student_id) and teacher_id = my_teacher_id()));
create policy "asg student" on assignments for select using (student_id = my_student_id());
create policy "sub read" on submissions for select using (is_admin() or is_assigned(student_id) or student_id = my_student_id());
create policy "sub grade" on submissions for update using (is_assigned(student_id)) with check (is_assigned(student_id));
create policy "mat rw" on materials for all using (is_admin() or is_assigned(student_id)) with check (is_admin() or is_assigned(student_id));
create policy "mat student" on materials for select using (student_id = my_student_id());
create policy "fb rw" on feedback for all using (is_admin() or is_assigned(student_id)) with check (is_admin() or (is_assigned(student_id) and teacher_id = my_teacher_id()));
create policy "fb student" on feedback for select using (student_id = my_student_id());
create policy "as rw" on assessments for all using (is_admin() or is_assigned(student_id)) with check (is_admin() or (is_assigned(student_id) and teacher_id = my_teacher_id()));
create policy "as student" on assessments for select using (student_id = my_student_id());
create policy "cert read" on certificates for select using (is_admin() or student_id = my_student_id());
create policy "cert admin" on certificates for all using (is_admin()) with check (is_admin());
create policy "notif own" on notifications for select using (user_id = auth.uid());
create policy "notif mark" on notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "tix own read" on support_tickets for select using (is_admin() or student_id = my_student_id());
create policy "tix own insert" on support_tickets for insert with check (student_id = my_student_id() and status = 'open' and admin_reply is null);
create policy "tix admin" on support_tickets for all using (is_admin()) with check (is_admin());
-- chat: ONLY the assigned teacher–student pair (admins read via reports, using the server)
create policy "chat read" on chat_messages for select using ((student_id = my_student_id() or teacher_id = my_teacher_id()) and pair_active(student_id, teacher_id));
create policy "chat send" on chat_messages for insert with check (sender_id = auth.uid() and deleted_at is null and pair_active(student_id, teacher_id)
  and ((student_id = my_student_id()) or (teacher_id = my_teacher_id())));
create policy "reads own" on chat_reads for all using (user_id = auth.uid()) with check (user_id = auth.uid() and pair_active(student_id, teacher_id));
create policy "reports admin" on chat_reports for select using (is_admin());
create policy "quran read" on quran_ayahs for select to authenticated using (true);   -- no write policy: dataset is immutable from the app
create policy "bm own" on quran_bookmarks for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "share read" on quran_shares for select using (session_id in (select id from class_sessions where student_id = my_student_id() or teacher_id = my_teacher_id()));
create policy "share send" on quran_shares for insert with check (shared_by = auth.uid() and session_id in (select id from class_sessions where teacher_id = my_teacher_id()));
create policy "etpl admin" on email_templates for all using (is_admin()) with check (is_admin());
create policy "elog admin" on email_logs for select using (is_admin());
create policy "pages read" on pages for select using (published or is_admin());
create policy "pages admin" on pages for all using (is_admin()) with check (is_admin());

alter publication supabase_realtime add table chat_messages, quran_shares, notifications;

-- private bucket for teacher documents, materials, submissions, chat files (all access via server + signed URLs)
insert into storage.buckets(id,name,public) values ('teacher-docs','teacher-docs',false),('lms-files','lms-files',false) on conflict do nothing;
