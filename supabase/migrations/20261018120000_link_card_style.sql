-- Let a creator choose how a link is drawn, not just what it points at.
--
-- Every link has been drawn the same way: a small square thumbnail on the left,
-- a title beside it. That is a good shape for a list of twelve destinations and
-- a poor one for three links you actually want looked at, where the picture is
-- the point and a 44px thumbnail throws it away.
--
-- card_style is a per-link choice rather than a theme setting, because it is a
-- decision about one link ("show this one off") and not about the page. 'row' is
-- the existing list row, so this is additive: nothing that never asks changes.
alter table public.links
  add column if not exists card_style text not null default 'row';

alter table public.links
  drop constraint if exists links_card_style_valid;

alter table public.links
  add constraint links_card_style_valid
  check (card_style in ('row', 'image'));

-- save_profile_bundle wipes and re-inserts every link, so it has to know about
-- card_style or saving from the dashboard would silently reset every card back
-- to a row. Same body as 20261015120000, plus the new column.
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
    group_name,
    card_style
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
    left(coalesce(item->>'group_name', ''), 60),
    case
      when item->>'card_style' = 'image' then 'image'
      else 'row'
    end
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
