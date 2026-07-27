create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  display_name text not null default 'Creator',
  greeting text not null default 'Hey, I’m',
  headline text not null default 'I make useful',
  headline_accent text not null default 'things.',
  bio text not null default '',
  location text not null default '',
  show_location boolean not null default true,
  template text not null default 'field-notes',
  avatar_path text,
  is_published boolean not null default false,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_format
    check (username ~ '^[a-z0-9][a-z0-9_-]{2,29}$'),
  constraint profiles_display_name_length
    check (char_length(display_name) between 1 and 80),
  constraint profiles_greeting_length
    check (char_length(greeting) between 1 and 32),
  constraint profiles_headline_length
    check (char_length(headline) between 1 and 48),
  constraint profiles_headline_accent_length
    check (char_length(headline_accent) between 1 and 24),
  constraint profiles_bio_length check (char_length(bio) <= 160),
  constraint profiles_template_check
    check (template in ('field-notes', 'after-dark', 'soft-studio'))
);

create table public.links (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  subtitle text not null default '',
  url text not null,
  position integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint links_title_length check (char_length(title) between 1 and 100),
  constraint links_url_format check (url ~* '^https?://'),
  constraint links_position_nonnegative check (position >= 0)
);

create table public.referrals (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null,
  offer text not null,
  url text not null,
  code text,
  color text not null default '#3659d9',
  position integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint referrals_provider_length
    check (char_length(provider) between 1 and 80),
  constraint referrals_offer_length check (char_length(offer) between 1 and 140),
  constraint referrals_url_format check (url ~* '^https?://'),
  constraint referrals_code_length check (code is null or char_length(code) <= 64),
  constraint referrals_color_format check (color ~ '^#[0-9A-Fa-f]{6}$'),
  constraint referrals_position_nonnegative check (position >= 0)
);

create table public.social_links (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  platform text not null,
  url text not null,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint social_links_platform_length
    check (char_length(platform) between 1 and 40),
  constraint social_links_url_format check (url ~* '^https?://'),
  constraint social_links_position_nonnegative check (position >= 0),
  constraint social_links_user_platform_unique unique (user_id, platform)
);

create table public.click_events (
  id bigint generated always as identity primary key,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  link_id bigint references public.links(id) on delete cascade,
  referral_id bigint references public.referrals(id) on delete cascade,
  event_type text not null,
  referrer text,
  occurred_at timestamptz not null default now(),
  constraint click_events_target_check
    check (num_nonnulls(link_id, referral_id) = 1),
  constraint click_events_type_check
    check (event_type in ('link_open', 'referral_open', 'referral_copy'))
);

create index links_user_position_idx on public.links (user_id, position);
create index referrals_user_position_idx on public.referrals (user_id, position);
create index social_links_user_position_idx
  on public.social_links (user_id, position);
create index click_events_profile_occurred_idx
  on public.click_events (profile_id, occurred_at desc);
create index click_events_link_id_idx on public.click_events (link_id);
create index click_events_referral_id_idx on public.click_events (referral_id);

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger links_set_updated_at before update on public.links
for each row execute function public.set_updated_at();
create trigger referrals_set_updated_at before update on public.referrals
for each row execute function public.set_updated_at();
create trigger social_links_set_updated_at before update on public.social_links
for each row execute function public.set_updated_at();

create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  username_base text;
begin
  username_base := regexp_replace(
    lower(coalesce(
      nullif(new.raw_user_meta_data->>'username', ''),
      split_part(coalesce(new.email, ''), '@', 1),
      'creator'
    )),
    '[^a-z0-9_-]', '', 'g'
  );
  if char_length(username_base) < 3 then
    username_base := 'creator';
  end if;
  username_base := left(username_base, 22);

  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    username_base || '-' || left(replace(new.id::text, '-', ''), 6),
    coalesce(
      nullif(new.raw_user_meta_data->>'full_name', ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'Creator'
    )
  );
  return new;
end;
$$;
revoke all on function private.handle_new_user() from public, anon, authenticated;

create trigger linkbranch_handle_new_user
after insert on auth.users
for each row execute function private.handle_new_user();

alter table public.profiles enable row level security;
alter table public.links enable row level security;
alter table public.referrals enable row level security;
alter table public.social_links enable row level security;
alter table public.click_events enable row level security;

revoke all on public.profiles, public.links, public.referrals,
  public.social_links, public.click_events from anon, authenticated;
grant usage on schema public to anon, authenticated;
grant select on public.profiles, public.links, public.referrals,
  public.social_links to anon;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.links, public.referrals,
  public.social_links to authenticated;
grant select, insert on public.click_events to authenticated;
grant insert on public.click_events to anon;
grant usage, select on sequence public.links_id_seq,
  public.referrals_id_seq, public.social_links_id_seq to authenticated;
grant usage, select on sequence public.click_events_id_seq to anon, authenticated;

create policy profiles_public_read on public.profiles
for select to anon using (is_published);
create policy profiles_authenticated_read on public.profiles
for select to authenticated
using (is_published or id = (select auth.uid()));
create policy profiles_owner_update on public.profiles
for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

create policy links_public_read on public.links
for select to anon
using (
  is_active and exists (
    select 1 from public.profiles p
    where p.id = links.user_id and p.is_published
  )
);
create policy links_authenticated_read on public.links
for select to authenticated
using (
  user_id = (select auth.uid())
  or (
    is_active and exists (
      select 1 from public.profiles p
      where p.id = links.user_id and p.is_published
    )
  )
);
create policy links_owner_insert on public.links
for insert to authenticated with check (user_id = (select auth.uid()));
create policy links_owner_update on public.links
for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));
create policy links_owner_delete on public.links
for delete to authenticated using (user_id = (select auth.uid()));

create policy referrals_public_read on public.referrals
for select to anon
using (
  is_active and exists (
    select 1 from public.profiles p
    where p.id = referrals.user_id and p.is_published
  )
);
create policy referrals_authenticated_read on public.referrals
for select to authenticated
using (
  user_id = (select auth.uid())
  or (
    is_active and exists (
      select 1 from public.profiles p
      where p.id = referrals.user_id and p.is_published
    )
  )
);
create policy referrals_owner_insert on public.referrals
for insert to authenticated with check (user_id = (select auth.uid()));
create policy referrals_owner_update on public.referrals
for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));
create policy referrals_owner_delete on public.referrals
for delete to authenticated using (user_id = (select auth.uid()));

create policy social_links_public_read on public.social_links
for select to anon
using (
  exists (
    select 1 from public.profiles p
    where p.id = social_links.user_id and p.is_published
  )
);
create policy social_links_authenticated_read on public.social_links
for select to authenticated
using (
  user_id = (select auth.uid())
  or exists (
    select 1 from public.profiles p
    where p.id = social_links.user_id and p.is_published
  )
);
create policy social_links_owner_insert on public.social_links
for insert to authenticated with check (user_id = (select auth.uid()));
create policy social_links_owner_update on public.social_links
for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));
create policy social_links_owner_delete on public.social_links
for delete to authenticated using (user_id = (select auth.uid()));

create policy click_events_public_insert on public.click_events
for insert to anon, authenticated
with check (
  exists (
    select 1 from public.profiles p
    where p.id = click_events.profile_id and p.is_published
  )
  and (
    link_id is null or exists (
      select 1 from public.links l
      where l.id = click_events.link_id
        and l.user_id = click_events.profile_id
        and l.is_active
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
);
create policy click_events_owner_read on public.click_events
for select to authenticated using (profile_id = (select auth.uid()));

create function public.save_profile_bundle(
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
    user_id, title, subtitle, url, position, is_active
  )
  select current_user_id,
    item->>'title',
    coalesce(item->>'subtitle', ''),
    item->>'url',
    ordinality::integer - 1,
    true
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
    true
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

insert into storage.buckets (
  id, name, public, file_size_limit, allowed_mime_types
)
values (
  'avatars',
  'avatars',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
);

create policy avatars_owner_insert on storage.objects
for insert to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
create policy avatars_owner_update on storage.objects
for update to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
create policy avatars_owner_delete on storage.objects
for delete to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
