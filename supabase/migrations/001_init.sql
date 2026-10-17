-- Khwaja Quran Majeed Academy — Part 1 schema (public site, admin, students, fees)
create extension if not exists pgcrypto;
create type app_role as enum ('admin','teacher','student');
create type app_status as enum ('pending','approved','rejected','info_requested');
create type acct_status as enum ('active','suspended','inactive');
create type pay_status as enum ('pending','approved','rejected');

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  role app_role not null default 'student',
  full_name text, created_at timestamptz not null default now());

create or replace function is_admin() returns boolean language sql stable security definer set search_path=public as
$$ select exists(select 1 from profiles where id = auth.uid() and role = 'admin') $$;

create table settings (key text primary key, value jsonb not null, updated_at timestamptz default now());
insert into settings(key,value) values
 ('marquee', '{"enabled":true,"speed":40,"direction":"rtl"}'),
 ('contact', '{"email":"","whatsapp":"","phone":"","address":"","hours":""}')
on conflict do nothing;

create table marquee_items (
  id uuid primary key default gen_random_uuid(),
  text text not null, kind text not null default 'announcement',
  sort_order int not null default 0, active boolean not null default true,
  starts_on date, ends_on date, created_at timestamptz default now());

create table courses (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title_en text not null, title_ur text not null default '',
  desc_en text not null default '', desc_ur text not null default '',
  level text, duration text, frequency text, language text,
  fee numeric(12,2) not null default 0 check (fee >= 0), currency text not null default 'PKR',
  published boolean not null default false, archived boolean not null default false,
  sort_order int not null default 0, created_at timestamptz default now());

create sequence app_ref_seq;
create table student_applications (
  id uuid primary key default gen_random_uuid(),
  ref text unique not null,
  status app_status not null default 'pending',
  first_name text not null, last_name text not null, father_name text not null,
  gender text not null check (gender in ('male','female')), dob date not null,
  guardian_name text, guardian_phone text,
  email text not null, whatsapp text not null, mobile text,
  country text not null, state text, city text not null, timezone text not null, address text,
  language text not null, course_id uuid references courses(id),
  level text, experience text, preferred_days text, preferred_time text,
  duration_min int, teacher_gender_pref text, notes text,
  consent_policy boolean not null, consent_data boolean not null,
  admin_note text, decided_by uuid references auth.users, decided_at timestamptz,
  created_at timestamptz not null default now());
create index on student_applications(status, created_at desc);
create index on student_applications(lower(email));

create sequence student_code_seq start 1001;
create table students (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users on delete set null,
  student_code text unique not null,
  application_id uuid references student_applications(id),
  full_name text not null, email text not null, whatsapp text, timezone text not null default 'UTC',
  course_id uuid references courses(id),
  status acct_status not null default 'active',
  enrolled_at timestamptz not null default now());

create table payment_methods (
  id uuid primary key default gen_random_uuid(),
  kind text not null,               -- bank, jazzcash, easypaisa, paypal, wise, western_union, other
  title text not null, account_name text, account_number text, iban text,
  instructions text, currency text default 'PKR',
  active boolean not null default true, sort_order int not null default 0,
  created_at timestamptz default now());

create table fees (                  -- the "fee card" shown to a student
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  title text not null,
  amount numeric(12,2) not null check (amount >= 0),
  discount numeric(12,2) not null default 0 check (discount >= 0),
  currency text not null default 'PKR',
  due_date date, note text,
  created_by uuid references auth.users, created_at timestamptz default now());
create index on fees(student_id);

create sequence receipt_seq start 1;
create table payments (
  id uuid primary key default gen_random_uuid(),
  fee_id uuid not null references fees(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  method_id uuid references payment_methods(id),
  amount numeric(12,2) not null check (amount > 0),
  txn_ref text, proof_path text, paid_on date default current_date,
  status pay_status not null default 'pending',
  source text not null default 'student_submitted' check (source in ('student_submitted','manual','gateway')),
  receipt_no text unique, review_note text,
  verified_by uuid references auth.users, verified_at timestamptz,
  created_at timestamptz not null default now());
create index on payments(student_id); create index on payments(status);

create table audit_logs (
  id bigint generated always as identity primary key,
  actor uuid, action text not null, entity text, entity_id text, meta jsonb,
  created_at timestamptz not null default now());

-- RLS ---------------------------------------------------------------
alter table profiles enable row level security;
alter table settings enable row level security;
alter table marquee_items enable row level security;
alter table courses enable row level security;
alter table student_applications enable row level security;
alter table students enable row level security;
alter table payment_methods enable row level security;
alter table fees enable row level security;
alter table payments enable row level security;
alter table audit_logs enable row level security;

create policy "own profile read" on profiles for select using (id = auth.uid() or is_admin());
create policy "admin all profiles" on profiles for all using (is_admin()) with check (is_admin());
create policy "settings public read" on settings for select using (true);
create policy "settings admin" on settings for all using (is_admin()) with check (is_admin());
create policy "marquee public read" on marquee_items for select using (active);
create policy "marquee admin" on marquee_items for all using (is_admin()) with check (is_admin());
create policy "courses public read" on courses for select using (published and not archived);
create policy "courses admin" on courses for all using (is_admin()) with check (is_admin());
create policy "apps admin" on student_applications for all using (is_admin()) with check (is_admin());
create policy "student own row" on students for select using (user_id = auth.uid() or is_admin());
create policy "students admin" on students for all using (is_admin()) with check (is_admin());
create policy "methods read" on payment_methods for select to authenticated using (active or is_admin());
create policy "methods admin" on payment_methods for all using (is_admin()) with check (is_admin());
create policy "fees own" on fees for select using (is_admin() or student_id in (select id from students where user_id = auth.uid()));
create policy "fees admin" on fees for all using (is_admin()) with check (is_admin());
create policy "pay own read" on payments for select using (is_admin() or student_id in (select id from students where user_id = auth.uid()));
create policy "pay own insert" on payments for insert with check (
  status = 'pending' and source = 'student_submitted' and receipt_no is null and verified_by is null
  and student_id in (select id from students where user_id = auth.uid() and status = 'active')
  and fee_id in (select id from fees where student_id = payments.student_id));
create policy "pay admin" on payments for all using (is_admin()) with check (is_admin());
create policy "audit admin read" on audit_logs for select using (is_admin());
-- applications and audit rows are written only by the server (service role).

-- Private storage for payment proofs --------------------------------
insert into storage.buckets(id,name,public) values ('payment-proofs','payment-proofs',false) on conflict do nothing;
create policy "proof upload own folder" on storage.objects for insert to authenticated
  with check (bucket_id='payment-proofs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "proof read own or admin" on storage.objects for select to authenticated
  using (bucket_id='payment-proofs' and ((storage.foldername(name))[1] = auth.uid()::text or is_admin()));

create or replace function next_student_code() returns text language sql security definer set search_path=public as
$$ select 'KQ-' || to_char(now(),'YY') || '-' || nextval('student_code_seq')::text $$;
revoke all on function next_student_code() from public, anon, authenticated;
