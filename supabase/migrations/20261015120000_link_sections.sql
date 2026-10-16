-- Let a creator group links under their own headings.
--
-- Every heading on a public page used to be system-owned ("My links", "Shop",
-- "Watch", ...), so a page with a dozen destinations was one undifferentiated
-- column. group_name is a free-form heading carried on each link; links that
-- share one, in position order, render as a titled section. An empty string is
-- "no section" and keeps the existing flat list, so this is additive.
alter table public.links
  add column if not exists group_name text not null default '';

alter table public.links
  drop constraint if exists links_group_name_length;

alter table public.links
  add constraint links_group_name_length
  check (char_length(group_name) <= 60);

-- save_profile_bundle wipes and re-inserts every link, so it has to know about
-- group_name or saving the setup wizard would silently flatten the sections.
-- Same body as 20260905060000, plus the new column.
create or replace function public.save_profile_bundle(
  profile_data jsonb,
  links_data jsonb default '[]'::jsonb,
  referrals_data jsonb default '[]'::jsonb,
  socials_data jsonb default '[]'::jsonb
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  update public.profiles
  set username = lower(profile_data->>'username'),
      display_name = profile_data->>'display_name',
      greeting = profile_data->>'greeting',
      headline = profile_data->>'headline',
      headline_accent = profile_data->>'headline_accent',
      bio = coalesce(profile_data->>'bio', ''),
      location = coalesce(profile_data->>'location', ''),
      show_location = coalesce(
        (profile_data->>'show_location')::boolean, true
      ),
      map_lat = case
        when profile_data ? 'map_lat'
          then (profile_data->>'map_lat')::double precision
        else map_lat
      end,
      map_lng = case
        when profile_data ? 'map_lng'
          then (profile_data->>'map_lng')::double precision
        else map_lng
      end,
      map_address = case
        when profile_data ? 'map_address'
          then left(coalesce(profile_data->>'map_address', ''), 200)
        else map_address
      end,
      show_map = coalesce((profile_data->>'show_map')::boolean, show_map),
      template = profile_data->>'template',
      is_published = coalesce(
        (profile_data->>'is_published')::boolean, true
      ),
      onboarding_completed = true
  where id = current_user_id;

  if not found then
    raise exception 'Profile not found';
  end if;

  delete from public.links where user_id = current_user_id;
  insert into public.links (
    user_id,
    title,
    subtitle,
    url,
    thumbnail_path,
    position,
    is_active,
    is_featured,
    group_name
  )
  select
    current_user_id,
    item->>'title',
    coalesce(item->>'subtitle', ''),
    item->>'url',
    nullif(item->>'thumbnail_path', ''),
    ordinality::integer - 1,
    coalesce((item->>'is_active')::boolean, true),
    coalesce((item->>'is_featured')::boolean, false),
    left(coalesce(item->>'group_name', ''), 60)
  from jsonb_array_elements(links_data)
    with ordinality as rows(item, ordinality);

  delete from public.referrals where user_id = current_user_id;
  insert into public.referrals (
    user_id, provider, offer, url, code, color, position, is_active
  )
  select
    current_user_id,
    item->>'provider',
    item->>'offer',
    item->>'url',
    nullif(item->>'code', ''),
    coalesce(item->>'color', '#3659d9'),
    ordinality::integer - 1,
    coalesce((item->>'is_active')::boolean, true)
  from jsonb_array_elements(referrals_data)
    with ordinality as rows(item, ordinality);

  delete from public.social_links where user_id = current_user_id;
  insert into public.social_links (user_id, platform, url, position)
  select
    current_user_id,
    item->>'platform',
    item->>'url',
    ordinality::integer - 1
  from jsonb_array_elements(socials_data)
    with ordinality as rows(item, ordinality);
end;
$$;

revoke all on function public.save_profile_bundle(jsonb, jsonb, jsonb, jsonb)
  from public, anon;
grant execute on function public.save_profile_bundle(jsonb, jsonb, jsonb, jsonb)
  to authenticated;
