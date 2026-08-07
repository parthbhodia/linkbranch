-- /card is the at-an-event screen. Its slug fits the username pattern, so
-- reserve it the same way /digital-business-card was.

insert into public.reserved_usernames (name, reason) values
  ('card', 'route')
on conflict (name) do update set reason = excluded.reason;
