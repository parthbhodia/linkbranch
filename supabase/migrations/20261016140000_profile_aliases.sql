-- Handle aliases: extra names that resolve to a profile.
--
-- A brand's spelling and its handle rarely match ("MKTV" vs "mk-tv"), and a
-- rename leaves every shared link and printed QR code pointing at a name the
-- profile no longer holds. An alias 308s that name to the profile that owns it,
-- so one page answers at several names without a second copy living at any of
-- them.
--
-- Aliases and handles share one namespace: whichever was created second would
-- be unreachable behind the first. is_username_available() therefore counts
-- aliases as taken (except an alias you own, which a rename has to be able to
-- reclaim), the rename guard refuses a handle an alias already holds, and
-- signup falls back rather than landing on one.

create table public.profile_aliases (
  alias text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint profile_aliases_alias_format
    check (alias ~ '^[a-z0-9][a-z0-9_-]{2,29}$')
);

create index profile_aliases_user_id_idx on public.profile_aliases (user_id);

alter table public.profile_aliases enable row level security;

-- Readable by its owner so the dashboard can list them. Writes go through the
-- guard trigger, which is the only thing that knows the namespace rules.
revoke all on public.profile_aliases from anon, authenticated;
grant select on public.profile_aliases to authenticated;

create policy profile_aliases_owner_read on public.profile_aliases
for select to authenticated
using (user_id = (select auth.uid()));

-- Signed-out visitors arrive by alias, so resolution is public. Security
-- definer so the table itself stays unreadable to them.
create or replace function public.resolve_profile_alias(candidate text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.username
  from public.profile_aliases a
  join public.profiles p on p.id = a.user_id
  where a.alias = lower(trim(coalesce(candidate, '')))
  limit 1;
$$;

revoke all on function public.resolve_profile_alias(text)
  from public, anon, authenticated;
grant execute on function public.resolve_profile_alias(text)
  to anon, authenticated;

-- Same function as before, with aliases counted as taken. `is distinct from`
-- is what keeps your own alias claimable by you while it stays taken for
-- everyone else -- including signed-out callers, whose auth.uid() is null.
create or replace function public.is_username_available(candidate text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    lower(trim(candidate)) ~ '^[a-z0-9][a-z0-9_-]{2,29}$'
    and not exists (
      select 1 from public.profiles
      where username = lower(trim(candidate))
    )
    and not exists (
      select 1 from public.reserved_usernames
      where name = lower(trim(candidate))
    )
    and not exists (
      select 1 from public.profile_aliases
      where alias = lower(trim(candidate))
        and user_id is distinct from auth.uid()
    );
$$;

revoke all on function public.is_username_available(text)
  from public, anon, authenticated;
grant execute on function public.is_username_available(text)
  to anon, authenticated;

-- A rename moves the handle; the name left behind becomes an alias, so the
-- links people already have keep working instead of 404ing.
--
-- In public rather than private, and not revoked, because authenticated users
-- fire it on every profile save: a trigger function needs EXECUTE for the role
-- running the update. It is the same shape as public.set_updated_at().
create or replace function public.profiles_alias_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.username is distinct from old.username then
    if exists (
      select 1 from public.profile_aliases
      where alias = new.username
        and user_id is distinct from new.id
    ) then
      raise exception 'username % is already in use', new.username
        using errcode = 'unique_violation';
    end if;

    insert into public.profile_aliases (alias, user_id)
    values (old.username, new.id)
    on conflict (alias) do nothing;

    -- The new name may have been an alias of this same profile. A name cannot
    -- be a handle and an alias at once, so the alias row goes.
    delete from public.profile_aliases
    where alias = new.username
      and user_id = new.id;
  end if;

  return new;
end;
$$;

create trigger profiles_alias_guard
before update of username on public.profiles
for each row execute function public.profiles_alias_guard();

-- Signup assigns a username from metadata or the email local part, so it can
-- land on an alias without a conflict being raised: profile aliases live in a
-- different table, so the unique index on profiles.username never sees them.
-- Otherwise unchanged from 20260727180000_reserved_usernames.sql.
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_username text;
  fallback_username text;
  profile_display_name text;
begin
  requested_username := regexp_replace(
    lower(coalesce(
      nullif(new.raw_user_meta_data->>'username', ''),
      split_part(coalesce(new.email, ''), '@', 1),
      'creator'
    )),
    '[^a-z0-9_-]', '', 'g'
  );

  if char_length(requested_username) < 3 then
    requested_username := 'creator';
  end if;

  requested_username := left(requested_username, 30);
  fallback_username :=
    left(requested_username, 22)
    || '-'
    || left(replace(new.id::text, '-', ''), 6);
  profile_display_name := coalesce(
    nullif(new.raw_user_meta_data->>'full_name', ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'Creator'
  );

  if exists (
    select 1 from public.reserved_usernames where name = requested_username
  ) or exists (
    select 1 from public.profile_aliases where alias = requested_username
  ) then
    requested_username := fallback_username;
  end if;

  insert into public.profiles (id, username, display_name)
  values (new.id, requested_username, profile_display_name)
  on conflict (username) do nothing;

  if not found then
    insert into public.profiles (id, username, display_name)
    values (new.id, fallback_username, profile_display_name);
  end if;

  return new;
end;
$$;

revoke all on function private.handle_new_user()
  from public, anon, authenticated;

-- One-off: the case that prompted this. "MKTV" is the brand, `mk-tv` is the
-- handle, and cueful.bio/mktv and cueful.bio/MKTV are what people actually
-- type -- both 404'd. Guarded in case the name has been taken as a handle in
-- the meantime.
insert into public.profile_aliases (alias, user_id)
select 'mktv', p.id
from public.profiles p
where p.username = 'mk-tv'
  and not exists (select 1 from public.profiles where username = 'mktv')
on conflict (alias) do nothing;
