-- Managing your own aliases.
--
-- The dashboard needs to add and remove the extra names that resolve to a
-- profile. Writes stay behind security definer functions rather than an insert
-- policy on the table, because the namespace rules (a name cannot be both a
-- handle and an alias, reserved names are out, and an alias can only be yours)
-- are decisions the database should make once, in one place.

create or replace function public.add_profile_alias(candidate text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner_id uuid := auth.uid();
  clean text := lower(trim(coalesce(candidate, '')));
  alias_count integer;
begin
  if owner_id is null then
    raise exception 'Sign in to add a name' using errcode = '42501';
  end if;

  if clean !~ '^[a-z0-9][a-z0-9_-]{2,29}$' then
    raise exception
      'Use 3-30 letters, numbers, dashes or underscores, starting with a letter or number'
      using errcode = '22023';
  end if;

  -- Idempotent: adding a name you already own is not an error worth surfacing.
  if exists (
    select 1 from public.profile_aliases
    where alias = clean and user_id = owner_id
  ) then
    return clean;
  end if;

  if exists (select 1 from public.profiles where username = clean) then
    raise exception '% is already taken', clean using errcode = 'unique_violation';
  end if;

  if exists (select 1 from public.reserved_usernames where name = clean) then
    raise exception '% is reserved', clean using errcode = 'unique_violation';
  end if;

  if exists (
    select 1 from public.profile_aliases
    where alias = clean and user_id is distinct from owner_id
  ) then
    raise exception '% is already taken', clean using errcode = 'unique_violation';
  end if;

  select count(*) into alias_count
  from public.profile_aliases
  where user_id = owner_id;

  if alias_count >= 5 then
    raise exception 'Up to 5 extra names per page' using errcode = 'check_violation';
  end if;

  insert into public.profile_aliases (alias, user_id)
  values (clean, owner_id);

  return clean;
end;
$$;

revoke all on function public.add_profile_alias(text)
  from public, anon, authenticated;
grant execute on function public.add_profile_alias(text) to authenticated;

-- Removing only ever touches your own row, so there is nothing to validate
-- beyond the ownership in the where clause.
create or replace function public.remove_profile_alias(candidate text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner_id uuid := auth.uid();
  clean text := lower(trim(coalesce(candidate, '')));
begin
  if owner_id is null then
    raise exception 'Sign in to remove a name' using errcode = '42501';
  end if;

  delete from public.profile_aliases
  where alias = clean and user_id = owner_id;
end;
$$;

revoke all on function public.remove_profile_alias(text)
  from public, anon, authenticated;
grant execute on function public.remove_profile_alias(text) to authenticated;
