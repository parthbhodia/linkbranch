-- Reserve the one route name that shipped without a matching reservation.
--
-- /cueful-vs-linktree is linked from the marketing and SEO footers but was left
-- out of both the middleware exclusion list and this table, so the name was
-- claimable. "privacy" and "terms" were already reserved as 'future' when the
-- table was created; the /privacy and /terms pages that now exist make them
-- current routes, so the reason is corrected here.

insert into public.reserved_usernames (name, reason) values
  ('cueful-vs-linktree', 'route'),
  ('privacy', 'route'),
  ('terms', 'route')
on conflict (name) do update set reason = excluded.reason;
