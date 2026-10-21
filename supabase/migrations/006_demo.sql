create table demo_requests (
  id uuid primary key default gen_random_uuid(), full_name text not null, email text not null, whatsapp text not null,
  country text not null, timezone text not null, course_id uuid references courses on delete set null, notes text,
  status text not null default 'new' check (status in ('new','contacted','scheduled','done','cancelled')), admin_note text,
  created_at timestamptz not null default now());
alter table demo_requests enable row level security; -- no policies: only the server (service role) reads and writes
create index on demo_requests(status, created_at desc);
