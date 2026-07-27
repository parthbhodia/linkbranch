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
      select 1
      from public.profiles
      where username = lower(trim(candidate))
    );
$$;

revoke all on function public.is_username_available(text)
  from public, anon, authenticated;
grant execute on function public.is_username_available(text)
  to anon, authenticated;

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
