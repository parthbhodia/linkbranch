-- Throttle the public exchange insert.
--
-- The endpoint has to stay open -- the whole point is that someone you just met
-- can send their details without an account. But every published profile URL is
-- listed in sitemap.xml and /discover, so the targets are trivially
-- enumerable, and a public form that anyone can find will eventually be found
-- by a scanner.
--
-- The damage from spam here is worse than on an ordinary contact form: the
-- inbox's whole value is being a pile you can sort. Four hundred junk rows
-- recreate exactly the problem the feature exists to solve.
--
-- The cap is deliberately generous. A busy booth genuinely collects a few dozen
-- people in an hour and must never be blocked; a bot doing thousands is.

create index if not exists connections_profile_recent_exchange_idx
  on public.connections (profile_id, created_at desc)
  where source = 'exchange';

create or replace function public.stamp_visitor_connection()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  recent_count integer;
begin
  if new.profile_id is distinct from (select auth.uid()) then
    new.event_tag := coalesce(
      (select p.current_event_tag from public.profiles p where p.id = new.profile_id),
      ''
    );
    new.status := 'new';
    new.source := 'exchange';
    new.met_at := now();

    -- created_at, not met_at: the owner can set met_at on their own rows, and
    -- only the insert time is beyond a visitor's reach.
    select count(*) into recent_count
    from public.connections c
    where c.profile_id = new.profile_id
      and c.source = 'exchange'
      and c.created_at > now() - interval '1 hour';

    if recent_count >= 100 then
      -- Default P0001. This trigger is the only thing that raises on this
      -- table, so the client can tell a throttle from a constraint violation
      -- (class 23) by the code alone rather than by matching message text.
      raise exception 'Too many contact submissions for this profile in the last hour';
    end if;
  end if;
  return new;
end;
$$;
