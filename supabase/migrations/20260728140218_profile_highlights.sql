create table public.profile_highlights (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  image_path text not null,
  title text not null default '',
  destination_url text,
  position integer not null default 0,
  expires_at timestamptz not null default (now() + interval '24 hours'),
  created_at timestamptz not null default now(),
  constraint profile_highlights_image_path_length
    check (char_length(image_path) between 1 and 512),
  constraint profile_highlights_title_length
    check (char_length(title) <= 60),
  constraint profile_highlights_destination_url_format
    check (destination_url is null or destination_url ~* '^https?://'),
  constraint profile_highlights_position_nonnegative check (position >= 0)
);

create index profile_highlights_user_position_idx
  on public.profile_highlights (user_id, position);
create index profile_highlights_public_expiry_idx
  on public.profile_highlights (user_id, expires_at, position);

alter table public.profile_highlights enable row level security;

revoke all on public.profile_highlights from anon, authenticated;
grant select on public.profile_highlights to anon;
grant select, insert, update, delete on public.profile_highlights to authenticated;
grant usage, select on sequence public.profile_highlights_id_seq to authenticated;

create policy profile_highlights_public_read on public.profile_highlights
for select to anon
using (
  expires_at > now() and exists (
    select 1 from public.profiles p
    where p.id = profile_highlights.user_id and p.is_published
  )
);

create policy profile_highlights_authenticated_read on public.profile_highlights
for select to authenticated
using (
  user_id = (select auth.uid())
  or (
    expires_at > now() and exists (
      select 1 from public.profiles p
      where p.id = profile_highlights.user_id and p.is_published
    )
  )
);

create policy profile_highlights_owner_insert on public.profile_highlights
for insert to authenticated
with check (user_id = (select auth.uid()));

create policy profile_highlights_owner_update on public.profile_highlights
for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy profile_highlights_owner_delete on public.profile_highlights
for delete to authenticated
using (user_id = (select auth.uid()));
