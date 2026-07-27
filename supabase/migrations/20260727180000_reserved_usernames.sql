-- Reserve usernames that would collide with application routes.
--
-- Public profiles live at /u/<username> today, but the intent is to serve them
-- from the root (cueful.bio/<username>, like Linktree). Next.js resolves static
-- routes ahead of dynamic ones, so a user holding "dashboard" would keep the
-- name while their page became permanently unreachable.
--
-- This has to land before the route change, not with it: usernames are being
-- claimed now, and a name cannot be taken back later without breaking a live
-- page someone has already shared.

create table public.reserved_usernames (
  name text primary key,
  reason text not null default 'route'
);

insert into public.reserved_usernames (name, reason) values
  -- current routes
  ('auth', 'route'), ('claim', 'route'), ('dashboard', 'route'),
  ('demo', 'route'), ('onboarding', 'route'), ('templates', 'route'),
  ('u', 'route'),
  -- generated files and framework internals
  ('api', 'route'), ('_next', 'route'), ('robots', 'route'),
  ('sitemap', 'route'), ('manifest', 'route'), ('favicon', 'route'),
  ('opengraph-image', 'route'), ('static', 'route'), ('assets', 'route'),
  -- plausible future routes, cheap to reserve now and impossible later
  ('about', 'future'), ('admin', 'future'), ('blog', 'future'),
  ('explore', 'future'), ('help', 'future'), ('home', 'future'),
  ('login', 'future'), ('logout', 'future'), ('me', 'future'),
  ('new', 'future'), ('pricing', 'future'), ('privacy', 'future'),
  ('search', 'future'), ('settings', 'future'), ('signup', 'future'),
  ('support', 'future'), ('terms', 'future'), ('billing', 'future'),
  -- impersonation risks
  ('cueful', 'brand'), ('official', 'brand'), ('support-team', 'brand');

alter table public.reserved_usernames enable row level security;
revoke all on public.reserved_usernames from anon, authenticated;

-- The availability check is security definer, so it can read the table while
-- callers cannot enumerate it.
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
    );
$$;

revoke all on function public.is_username_available(text)
  from public, anon, authenticated;
grant execute on function public.is_username_available(text)
  to anon, authenticated;

-- Signup assigns a username from metadata or the email local part, so it can
-- land on a reserved name without any conflict being raised. Fall through to
-- the uuid-suffixed form in that case.
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
