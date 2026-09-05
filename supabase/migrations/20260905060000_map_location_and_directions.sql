-- A map pin for the public page's "Find us" block, and a click event for the
-- directions button beside it.
--
-- profiles.location stays what it was: the short eyebrow text under the name
-- ("Pune, India"). The pin is separate and optional. A shop, a venue or a
-- tradesperson sets one; a creator with an audience and no premises does not,
-- and nothing here makes anyone's whereabouts public that was not entered on
-- purpose.

alter table public.profiles
  add column map_lat double precision,
  add column map_lng double precision,
  add column map_address text not null default '',
  add column show_map boolean not null default true,
  add constraint profiles_map_pin_complete
    check ((map_lat is null) = (map_lng is null)),
  add constraint profiles_map_lat_range
    check (map_lat is null or map_lat between -90 and 90),
  add constraint profiles_map_lng_range
    check (map_lng is null or map_lng between -180 and 180),
  add constraint profiles_map_address_length
    check (char_length(map_address) <= 200);

comment on column public.profiles.map_lat is
  'Latitude of the Find-us pin. Null with map_lng null means no pin.';
comment on column public.profiles.map_address is
  'Street address shown beside the map. Distinct from location, the short eyebrow text.';
comment on column public.profiles.show_map is
  'Hide the pin without deleting it, like show_location for the eyebrow.';


-- The setup wizard saves the profile through save_profile_bundle, so it has
-- to learn the new columns. Keys that are absent from profile_data leave the
-- stored value alone -- other callers of this function do not know about the
-- map and must not wipe it. A key present with a null value clears the pin.
--
-- Same body as 20260728050108, plus the four map columns. Declared security
-- invoker to keep 20260728050747's hardening: the caller's own RLS applies.
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
    is_featured
  )
  select
    current_user_id,
    item->>'title',
    coalesce(item->>'subtitle', ''),
    item->>'url',
    nullif(item->>'thumbnail_path', ''),
    ordinality::integer - 1,
    coalesce((item->>'is_active')::boolean, true),
    coalesce((item->>'is_featured')::boolean, false)
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


-- directions_open: a visitor tapped "Get directions". For a shop this is the
-- click that matters most, and the one intent signal a Google Maps listing
-- never reports back to the owner. It is the first event with no target row,
-- so the target checks gain a case for it.
alter table public.click_events
  drop constraint click_events_target_check,
  drop constraint click_events_type_check;

alter table public.click_events
  add constraint click_events_target_check
  check (
    case
      when event_type = 'directions_open'
        then num_nonnulls(link_id, referral_id, product_id, media_embed_id) = 0
      else num_nonnulls(link_id, referral_id, product_id, media_embed_id) = 1
    end
  ),
  add constraint click_events_type_check
  check (
    (event_type = 'link_open' and link_id is not null)
    or (
      event_type in ('referral_open', 'referral_copy')
      and referral_id is not null
    )
    or (event_type = 'product_open' and product_id is not null)
    or (event_type = 'media_open' and media_embed_id is not null)
    or event_type = 'directions_open'
  );

-- Same policy as before, with one more clause: a directions event is only
-- accepted for a profile that is actually showing a map, matching how every
-- other event must point at an active target.
drop policy click_events_public_insert on public.click_events;
create policy click_events_public_insert on public.click_events
for insert to anon, authenticated
with check (
  exists (
    select 1 from public.profiles p
    where p.id = click_events.profile_id and p.is_published
  )
  and (
    event_type <> 'directions_open' or exists (
      select 1 from public.profiles p
      where p.id = click_events.profile_id
        and p.show_map
        and p.map_lat is not null
    )
  )
  and (
    link_id is null or exists (
      select 1 from public.links l
      where l.id = click_events.link_id
        and l.user_id = click_events.profile_id
        and l.is_active
        and (l.starts_at is null or l.starts_at <= now())
        and (l.expires_at is null or l.expires_at > now())
    )
  )
  and (
    referral_id is null or exists (
      select 1 from public.referrals r
      where r.id = click_events.referral_id
        and r.user_id = click_events.profile_id
        and r.is_active
    )
  )
  and (
    product_id is null or exists (
      select 1 from public.products pr
      where pr.id = click_events.product_id
        and pr.user_id = click_events.profile_id
        and pr.is_active
    )
  )
  and (
    media_embed_id is null or exists (
      select 1 from public.media_embeds me
      where me.id = click_events.media_embed_id
        and me.user_id = click_events.profile_id
        and me.is_active
    )
  )
);
