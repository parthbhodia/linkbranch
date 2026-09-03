-- /admin is the internal funnel view. Its slug fits the username pattern, so
-- reserve it the same way /card and /digital-business-card were -- otherwise
-- someone registers the handle and their page becomes unreachable.

insert into public.reserved_usernames (name, reason) values
  ('admin', 'route')
on conflict (name) do update set reason = excluded.reason;
