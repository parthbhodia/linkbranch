-- Restrict canonical_url to this site.
--
-- The column only required '^https?://', so a creator could point their
-- canonical at any address. A canonical tag naming another domain tells search
-- engines "the real version of this page lives there": the profile drops out of
-- the index and its ranking signal transfers away. It fails silently -- the page
-- still loads, still looks right, and nothing in the product reports it -- so it
-- is not a mistake a creator can be expected to diagnose.
--
-- Anything already pointing off-site is cleared rather than kept, since leaving
-- it would fail the new constraint and, more to the point, it is actively
-- deindexing that profile right now. A null canonical falls back to the
-- profile's own URL, which is the correct value in every case the field is not
-- deliberately overridden.

update public.profiles
set canonical_url = null
where canonical_url is not null
  and canonical_url !~* '^https://cueful\.bio(/|$)';

alter table public.profiles
  drop constraint if exists profiles_canonical_url_format;

alter table public.profiles
  add constraint profiles_canonical_url_format
    check (
      canonical_url is null
      or canonical_url ~* '^https://cueful\.bio(/|$)'
    );
