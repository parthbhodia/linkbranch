-- Three small additions behind the follow-up work.
--
-- 1. Event-tagged page views. Without this a quiet event and a badly worded
--    ask look identical: you see fourteen contacts and no idea whether forty
--    people scanned or fourteen did.
-- 2. connected_at, so the LinkedIn pass can skip people already done.
-- 3. /sort is a real route now, so the name gets reserved.

alter table public.profile_views
  add column if not exists event_tag text not null default '';

alter table public.profile_views
  drop constraint if exists profile_views_event_tag_length;

alter table public.profile_views
  add constraint profile_views_event_tag_length
    check (char_length(event_tag) <= 80);

-- Stamped rather than sent. The view insert already runs server-side, so this
-- is less about tamper-proofing than about keeping one source of truth for
-- "which event was running" -- the same rule connections uses.
create or replace function public.stamp_view_event_tag()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.event_tag := coalesce(
    (select p.current_event_tag from public.profiles p where p.id = new.profile_id),
    ''
  );
  return new;
end;
$$;

drop trigger if exists profile_views_stamp_event on public.profile_views;

create trigger profile_views_stamp_event
  before insert on public.profile_views
  for each row execute function public.stamp_view_event_tag();

-- Counting scans per event is the only query this column serves, and it is
-- always scoped to one owner.
create index if not exists profile_views_profile_event_idx
  on public.profile_views (profile_id, event_tag)
  where event_tag <> '';

alter table public.connections
  add column if not exists connected_at timestamptz;

insert into public.reserved_usernames (name, reason) values
  ('sort', 'route')
on conflict (name) do update set reason = excluded.reason;
