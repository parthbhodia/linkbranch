insert into public.reserved_usernames (name, reason) values
  ('discover', 'route'),
  ('es', 'route'),
  ('it', 'route'),
  ('best-link-in-bio-tools', 'route'),
  ('cueful-vs-beacons', 'route'),
  ('cueful-vs-carrd', 'route'),
  ('free-link-in-bio', 'route'),
  ('free-linktree-alternative', 'route'),
  ('link-in-bio-for-instagram', 'route'),
  ('link-in-bio-for-tiktok', 'route'),
  ('link-in-bio-tools', 'route'),
  ('what-does-link-in-bio-mean', 'route')
on conflict (name) do update set reason = excluded.reason;

alter table public.profiles
  add column is_discoverable boolean not null default false,
  add column referred_by uuid references public.profiles(id) on delete set null;

alter table public.profiles
  add constraint profiles_referrer_not_self
  check (referred_by is null or referred_by <> id);

create index profiles_discoverable_updated_idx
  on public.profiles (updated_at desc)
  where is_published and is_discoverable;

create index profiles_referred_by_published_idx
  on public.profiles (referred_by)
  where is_published and referred_by is not null;

comment on column public.profiles.is_discoverable is
  'Explicit creator opt-in for the public Cueful discovery page.';

comment on column public.profiles.referred_by is
  'The published Cueful profile whose invite led to this account.';

create function public.claim_profile_referral(referrer_username text)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  referrer_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  select id
    into referrer_id
  from public.profiles
  where username = lower(trim(referrer_username))
    and is_published
    and id <> current_user_id
  limit 1;

  if referrer_id is null then
    return false;
  end if;

  update public.profiles
  set referred_by = referrer_id
  where id = current_user_id
    and referred_by is null;

  return found;
end;
$$;

revoke all on function public.claim_profile_referral(text)
  from public, anon;
grant execute on function public.claim_profile_referral(text)
  to authenticated;
