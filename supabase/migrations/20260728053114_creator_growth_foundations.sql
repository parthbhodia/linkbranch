alter table public.profiles
  add column show_cueful_badge boolean not null default false,
  add column locale text not null default 'en',
  add column seo_title text,
  add column seo_description text,
  add column seo_image_path text,
  add column theme_config jsonb not null default '{}'::jsonb;

alter table public.profiles
  add constraint profiles_locale_check check (locale in ('en', 'es')),
  add constraint profiles_seo_title_length
    check (seo_title is null or char_length(seo_title) <= 70),
  add constraint profiles_seo_description_length
    check (seo_description is null or char_length(seo_description) <= 180),
  add constraint profiles_seo_image_path_length
    check (seo_image_path is null or char_length(seo_image_path) <= 512),
  add constraint profiles_theme_config_object
    check (jsonb_typeof(theme_config) = 'object');

alter table public.links
  add column starts_at timestamptz,
  add column expires_at timestamptz,
  add column embed_type text;

alter table public.links
  add constraint links_schedule_order
    check (starts_at is null or expires_at is null or expires_at > starts_at),
  add constraint links_embed_type_check
    check (
      embed_type is null
      or embed_type in ('instagram', 'tiktok', 'youtube', 'spotify')
    );

alter table public.click_events
  add column device_type text,
  add column country_code text;

alter table public.click_events
  add constraint click_events_device_type_check
    check (
      device_type is null
      or device_type in ('mobile', 'tablet', 'desktop', 'bot', 'unknown')
    ),
  add constraint click_events_country_code_format
    check (country_code is null or country_code ~ '^[A-Z]{2}$');

create table public.profile_views (
  id bigint generated always as identity primary key,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  referrer text,
  device_type text,
  country_code text,
  occurred_at timestamptz not null default now(),
  constraint profile_views_device_type_check
    check (
      device_type is null
      or device_type in ('mobile', 'tablet', 'desktop', 'bot', 'unknown')
    ),
  constraint profile_views_country_code_format
    check (country_code is null or country_code ~ '^[A-Z]{2}$')
);

create table public.contact_submissions (
  id bigint generated always as identity primary key,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  email text not null,
  message text not null default '',
  created_at timestamptz not null default now(),
  constraint contact_submissions_name_length
    check (char_length(name) between 1 and 100),
  constraint contact_submissions_email_length
    check (char_length(email) between 3 and 254),
  constraint contact_submissions_email_format
    check (email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  constraint contact_submissions_message_length
    check (char_length(message) <= 2000)
);

create table public.profile_domains (
  id bigint generated always as identity primary key,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  hostname text not null unique,
  status text not null default 'pending',
  verification_token text not null,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profile_domains_hostname_format
    check (
      hostname = lower(hostname)
      and char_length(hostname) <= 253
      and hostname ~ '^[a-z0-9][a-z0-9.-]*\.[a-z0-9]{2,63}$'
      and hostname not like '%..%'
    ),
  constraint profile_domains_status_check
    check (status in ('pending', 'verified', 'failed')),
  constraint profile_domains_verification_token_length
    check (char_length(verification_token) between 24 and 128)
);

create index profile_views_profile_occurred_idx
  on public.profile_views (profile_id, occurred_at desc);
create index contact_submissions_profile_created_idx
  on public.contact_submissions (profile_id, created_at desc);
create index profile_domains_profile_idx
  on public.profile_domains (profile_id);
create index links_active_schedule_idx
  on public.links (user_id, is_active, starts_at, expires_at);

drop policy links_public_read on public.links;
drop policy links_authenticated_read on public.links;
drop policy click_events_public_insert on public.click_events;

create policy links_public_read on public.links
for select to anon
using (
  is_active
  and (starts_at is null or starts_at <= now())
  and (expires_at is null or expires_at > now())
  and exists (
    select 1 from public.profiles p
    where p.id = links.user_id and p.is_published
  )
);

create policy links_authenticated_read on public.links
for select to authenticated
using (
  user_id = (select auth.uid())
  or (
    is_active
    and (starts_at is null or starts_at <= now())
    and (expires_at is null or expires_at > now())
    and exists (
      select 1 from public.profiles p
      where p.id = links.user_id and p.is_published
    )
  )
);

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
);

create trigger profile_domains_set_updated_at
before update on public.profile_domains
for each row execute function public.set_updated_at();

alter table public.profile_views enable row level security;
alter table public.contact_submissions enable row level security;
alter table public.profile_domains enable row level security;

revoke all on public.profile_views, public.contact_submissions,
  public.profile_domains from public, anon, authenticated;

grant insert on public.profile_views to anon, authenticated;
grant select on public.profile_views to authenticated;
grant insert on public.contact_submissions to anon, authenticated;
grant select, delete on public.contact_submissions to authenticated;
grant select on public.profile_domains to anon, authenticated;
grant insert, update, delete on public.profile_domains to authenticated;

grant usage, select on sequence public.profile_views_id_seq,
  public.contact_submissions_id_seq to anon, authenticated;
grant usage, select on sequence public.profile_domains_id_seq to authenticated;

create policy profile_views_public_insert on public.profile_views
for insert to anon, authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = profile_views.profile_id
      and p.is_published
  )
);

create policy profile_views_owner_read on public.profile_views
for select to authenticated
using (profile_id = (select auth.uid()));

create policy contact_submissions_public_insert on public.contact_submissions
for insert to anon, authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = contact_submissions.profile_id
      and p.is_published
  )
);

create policy contact_submissions_owner_read on public.contact_submissions
for select to authenticated
using (profile_id = (select auth.uid()));

create policy contact_submissions_owner_delete on public.contact_submissions
for delete to authenticated
using (profile_id = (select auth.uid()));

create policy profile_domains_public_verified_read on public.profile_domains
for select to anon, authenticated
using (status = 'verified');

create policy profile_domains_owner_read on public.profile_domains
for select to authenticated
using (profile_id = (select auth.uid()));

create policy profile_domains_owner_insert on public.profile_domains
for insert to authenticated
with check (profile_id = (select auth.uid()));

create policy profile_domains_owner_update on public.profile_domains
for update to authenticated
using (profile_id = (select auth.uid()))
with check (profile_id = (select auth.uid()));

create policy profile_domains_owner_delete on public.profile_domains
for delete to authenticated
using (profile_id = (select auth.uid()));
