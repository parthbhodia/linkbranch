-- Where a view came from, when there is no referrer to read.
--
-- A QR scan opens the browser straight from the camera app, so referrer is
-- empty and the visit is indistinguishable from someone typing the address.
-- Every code and printed asset we generate now carries ?s=<source>; this is
-- where that lands. Null means an ordinary visit, which is what every row
-- recorded before today is.

alter table public.profile_views
  add column source text,
  add constraint profile_views_source_check
    check (
      source is null
      or source in (
        'qr', 'card', 'wallet', 'poster', 'square', 'tent', 'sticker', 'signature'
      )
    );

comment on column public.profile_views.source is
  'Sharing surface the visit came from, from the ?s= tag. Null for an ordinary visit.';

-- The dashboard counts scans per profile over a date range.
create index profile_views_profile_source_idx
  on public.profile_views (profile_id, source, occurred_at desc)
  where source is not null;
