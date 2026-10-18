-- Part 3: Teams-style chat, calls, profile photos. Run AFTER 002_part2.sql (Supabase SQL editor).
alter table profiles add column if not exists avatar_path text, add column if not exists avatar_locked boolean not null default false, add column if not exists last_seen timestamptz;
alter table student_applications add column if not exists photo_path text;

create table conversations (
  id uuid primary key default gen_random_uuid(), kind text not null check (kind in ('dm','group')), title text, dm_key text unique,
  created_by uuid references auth.users on delete set null, created_at timestamptz not null default now(), last_message_at timestamptz not null default now());
create table conversation_members (
  conversation_id uuid not null references conversations on delete cascade, user_id uuid not null references auth.users on delete cascade,
  added_at timestamptz not null default now(), primary key (conversation_id, user_id));
create index on conversation_members(user_id);
create table messages (
  id uuid primary key default gen_random_uuid(), conversation_id uuid not null references conversations on delete cascade,
  sender_id uuid not null references auth.users on delete cascade, body text not null default '' check (char_length(body) <= 2000),
  attachment_path text, attachment_name text, attachment_type text, deleted_at timestamptz, created_at timestamptz not null default now());
create index on messages(conversation_id, created_at desc);
create table message_reads (
  conversation_id uuid not null references conversations on delete cascade, user_id uuid not null references auth.users on delete cascade,
  last_read_at timestamptz not null default now(), primary key (conversation_id, user_id));
create table message_reports (
  id uuid primary key default gen_random_uuid(), message_id uuid references messages on delete set null, conversation_id uuid, reporter uuid references auth.users on delete set null,
  reason text not null, status text not null default 'open', created_at timestamptz not null default now());
create table calls (
  id uuid primary key default gen_random_uuid(), conversation_id uuid not null references conversations on delete cascade,
  caller_id uuid not null references auth.users on delete cascade, kind text not null check (kind in ('audio','video')),
  status text not null default 'ringing' check (status in ('ringing','active','declined','ended','missed')),
  created_at timestamptz not null default now(), ended_at timestamptz);
create index on calls(conversation_id, created_at desc);

create or replace function is_member(cid uuid) returns boolean language sql stable security definer set search_path=public as
$$ select exists(select 1 from conversation_members where conversation_id = cid and user_id = auth.uid()) $$;

-- A direct chat is allowed only with an admin, or between a student and their actively assigned teacher. Groups are managed by admins only.
create or replace function dm_ok(cid uuid) returns boolean language sql stable security definer set search_path=public as $$
  select coalesce((select case when c.kind = 'group' then true else exists (
    select 1 from conversation_members m1 join conversation_members m2 on m2.conversation_id = m1.conversation_id and m1.user_id < m2.user_id
    join profiles p1 on p1.id = m1.user_id join profiles p2 on p2.id = m2.user_id
    where m1.conversation_id = cid and (p1.role = 'admin' or p2.role = 'admin' or exists (
      select 1 from teacher_assignments a join students s on s.id = a.student_id join teachers t on t.id = a.teacher_id
      where a.active and ((s.user_id = m1.user_id and t.user_id = m2.user_id) or (s.user_id = m2.user_id and t.user_id = m1.user_id))))) end
    from conversations c where c.id = cid), false) $$;

create or replace function my_unread_counts() returns table(conversation_id uuid, n int) language sql stable as $$
  select m.conversation_id, count(*)::int from messages m join conversation_members cm on cm.conversation_id = m.conversation_id and cm.user_id = auth.uid()
  left join message_reads r on r.conversation_id = m.conversation_id and r.user_id = auth.uid()
  where m.sender_id <> auth.uid() and m.deleted_at is null and m.created_at > coalesce(r.last_read_at, 'epoch'::timestamptz) group by m.conversation_id $$;
create or replace function my_unread_total() returns int language sql stable as $$ select coalesce(sum(n), 0)::int from my_unread_counts() $$;
create or replace function my_last_messages() returns setof messages language sql stable as $$
  select distinct on (m.conversation_id) m.* from messages m where is_member(m.conversation_id) order by m.conversation_id, m.created_at desc $$;
create or replace function bump_conversation() returns trigger language plpgsql security definer set search_path=public as $$
begin update conversations set last_message_at = new.created_at where id = new.conversation_id; return new; end $$;
create trigger messages_bump after insert on messages for each row execute function bump_conversation();

alter table conversations enable row level security; alter table conversation_members enable row level security; alter table messages enable row level security;
alter table message_reads enable row level security; alter table message_reports enable row level security; alter table calls enable row level security;
create policy "conv read" on conversations for select using (is_member(id));
create policy "members read" on conversation_members for select using (is_member(conversation_id));
create policy "msg read" on messages for select using (is_member(conversation_id));
create policy "msg send" on messages for insert with check (sender_id = auth.uid() and deleted_at is null and is_member(conversation_id) and dm_ok(conversation_id));
create policy "reads see" on message_reads for select using (is_member(conversation_id));
create policy "reads add" on message_reads for insert with check (user_id = auth.uid() and is_member(conversation_id));
create policy "reads upd" on message_reads for update using (user_id = auth.uid()) with check (user_id = auth.uid() and is_member(conversation_id));
create policy "calls see" on calls for select using (is_member(conversation_id));
create policy "calls start" on calls for insert with check (caller_id = auth.uid() and is_member(conversation_id) and dm_ok(conversation_id));
create policy "calls upd" on calls for update using (is_member(conversation_id)) with check (is_member(conversation_id));
-- message_reports: no policies on purpose (written and read by the server with the service role only).

alter publication supabase_realtime add table messages, message_reads, calls;
insert into storage.buckets(id, name, public) values ('avatars', 'avatars', false) on conflict do nothing;

-- Default group for all administrators
do $$ declare cid uuid; begin
  if not exists (select 1 from conversations where kind = 'group' and title = 'Administrators') then
    insert into conversations(kind, title) values ('group', 'Administrators') returning id into cid;
    insert into conversation_members(conversation_id, user_id) select cid, id from profiles where role = 'admin';
  end if; end $$;

-- Carry over the old teacher–student chats
do $$ declare r record; cid uuid; begin
  for r in select distinct m.student_id, m.teacher_id, s.user_id su, t.user_id tu from chat_messages m join students s on s.id = m.student_id join teachers t on t.id = m.teacher_id where s.user_id is not null and t.user_id is not null loop
    cid := null;
    insert into conversations(kind, dm_key) values ('dm', least(r.su::text, r.tu::text) || ':' || greatest(r.su::text, r.tu::text)) on conflict (dm_key) do nothing returning id into cid;
    if cid is null then continue; end if;
    insert into conversation_members(conversation_id, user_id) values (cid, r.su), (cid, r.tu) on conflict do nothing;
    insert into messages(conversation_id, sender_id, body, attachment_path, attachment_name, attachment_type, deleted_at, created_at)
      select cid, m.sender_id, m.body, m.attachment_path, m.attachment_name, case when m.attachment_path is null then null else 'file' end, m.deleted_at, m.created_at
      from chat_messages m where m.student_id = r.student_id and m.teacher_id = r.teacher_id order by m.created_at;
  end loop; end $$;
