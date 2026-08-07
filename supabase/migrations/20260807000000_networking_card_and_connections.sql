-- Networking card: the contact identity a vCard needs, plus the inbox of
-- people you met. Paper cards were never valuable because they carried a phone
-- number -- they were valuable because you could write on the back and sort the
-- stack afterwards. `connections` is that stack.

alter table public.profiles
  add column if not exists job_title text,
  add column if not exists company text,
  add column if not exists contact_email text,
  add column if not exists contact_phone text,
  add column if not exists show_save_contact boolean not null default true,
  add column if not exists show_exchange boolean not null default true,
  -- Set while the owner is at an event; stamped onto every capture so the
  -- morning-after pile is already grouped by the night it came from.
  add column if not exists current_event_tag text;

alter table public.profiles
  drop constraint if exists profiles_job_title_length,
  drop constraint if exists profiles_company_length,
  drop constraint if exists profiles_contact_email_format,
  drop constraint if exists profiles_contact_phone_length,
  drop constraint if exists profiles_current_event_tag_length;

alter table public.profiles
  add constraint profiles_job_title_length
    check (job_title is null or char_length(job_title) <= 80),
  add constraint profiles_company_length
    check (company is null or char_length(company) <= 80),
  add constraint profiles_contact_email_format
    check (
      contact_email is null
      or contact_email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    ),
  add constraint profiles_contact_phone_length
    check (contact_phone is null or char_length(contact_phone) between 4 and 32),
  add constraint profiles_current_event_tag_length
    check (current_event_tag is null or char_length(current_event_tag) <= 80);

create table if not exists public.connections (
  id bigint generated always as identity primary key,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  email text not null default '',
  phone text not null default '',
  company text not null default '',
  job_title text not null default '',
  -- The back of the card.
  note text not null default '',
  event_tag text not null default '',
  -- new -> untriaged. meet/warm/archived are the piles.
  status text not null default 'new',
  source text not null default 'exchange',
  met_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint connections_name_length check (char_length(name) between 1 and 100),
  constraint connections_email_length check (char_length(email) <= 254),
  constraint connections_email_format
    check (
      email = ''
      or email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    ),
  constraint connections_phone_length check (char_length(phone) <= 32),
  constraint connections_company_length check (char_length(company) <= 100),
  constraint connections_job_title_length check (char_length(job_title) <= 100),
  constraint connections_note_length check (char_length(note) <= 2000),
  constraint connections_event_tag_length check (char_length(event_tag) <= 80),
  constraint connections_status_check
    check (status in ('new', 'meet', 'warm', 'archived')),
  constraint connections_source_check
    check (source in ('exchange', 'manual', 'form'))
);

create index if not exists connections_profile_met_idx
  on public.connections (profile_id, met_at desc);

create index if not exists connections_profile_status_idx
  on public.connections (profile_id, status);

create trigger connections_set_updated_at
  before update on public.connections
  for each row execute function public.set_updated_at();

-- Visitors do not get to choose which event their card lands under, pre-triage
-- themselves into a pile, or backdate when you met. The owner, editing their
-- own inbox, does. BEFORE-row triggers run ahead of the RLS check, so the
-- stamped row is what gets validated.
create or replace function public.stamp_visitor_connection()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.profile_id is distinct from (select auth.uid()) then
    new.event_tag := coalesce(
      (select p.current_event_tag from public.profiles p where p.id = new.profile_id),
      ''
    );
    new.status := 'new';
    new.source := 'exchange';
    new.met_at := now();
  end if;
  return new;
end;
$$;

create trigger connections_stamp_visitor
  before insert on public.connections
  for each row execute function public.stamp_visitor_connection();

alter table public.connections enable row level security;

revoke all on public.connections from public, anon, authenticated;

-- anon inserts because the whole point is that someone you just met can send
-- their details back without making an account first.
grant insert on public.connections to anon, authenticated;
grant select, update, delete on public.connections to authenticated;
grant usage, select on sequence public.connections_id_seq to anon, authenticated;

create policy connections_public_insert on public.connections
for insert to anon, authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = connections.profile_id
      and p.is_published
      and p.show_exchange
  )
);

create policy connections_owner_read on public.connections
for select to authenticated
using (profile_id = (select auth.uid()));

create policy connections_owner_insert on public.connections
for insert to authenticated
with check (profile_id = (select auth.uid()));

create policy connections_owner_update on public.connections
for update to authenticated
using (profile_id = (select auth.uid()))
with check (profile_id = (select auth.uid()));

create policy connections_owner_delete on public.connections
for delete to authenticated
using (profile_id = (select auth.uid()));

-- /digital-business-card is a real route now, and its slug fits the username
-- pattern, so reserve the name before someone claims it.
insert into public.reserved_usernames (name, reason) values
  ('digital-business-card', 'route')
on conflict (name) do update set reason = excluded.reason;
