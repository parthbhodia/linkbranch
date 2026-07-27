alter table public.links
  add column if not exists is_featured boolean not null default false;

create unique index if not exists links_one_featured_per_user_idx
  on public.links (user_id)
  where is_featured;

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
    user_id, title, subtitle, url, position, is_active, is_featured
  )
  select current_user_id,
    item->>'title',
    coalesce(item->>'subtitle', ''),
    item->>'url',
    ordinality::integer - 1,
    coalesce((item->>'is_active')::boolean, true),
    coalesce((item->>'is_featured')::boolean, false)
  from jsonb_array_elements(links_data)
    with ordinality as rows(item, ordinality);

  delete from public.referrals where user_id = current_user_id;
  insert into public.referrals (
    user_id, provider, offer, url, code, color, position, is_active
  )
  select current_user_id,
    item->>'provider',
    item->>'offer',
    item->>'url',
    nullif(item->>'code', ''),
    coalesce(nullif(item->>'color', ''), '#3659d9'),
    ordinality::integer - 1,
    coalesce((item->>'is_active')::boolean, true)
  from jsonb_array_elements(referrals_data)
    with ordinality as rows(item, ordinality);

  delete from public.social_links where user_id = current_user_id;
  insert into public.social_links (user_id, platform, url, position)
  select current_user_id,
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
