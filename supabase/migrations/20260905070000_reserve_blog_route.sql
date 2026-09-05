-- /blog is the new article section. Its slug fits the username pattern, so
-- reserve it the way /admin, /card and /digital-business-card were --
-- otherwise someone registers the handle and their page becomes unreachable.

insert into public.reserved_usernames (name, reason) values
  ('blog', 'route')
on conflict (name) do update set reason = excluded.reason;
