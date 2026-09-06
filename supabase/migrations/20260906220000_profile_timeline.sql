-- Education and experience: the one thing a student's page needs that links
-- cannot express.
--
-- Deliberately a display surface rather than a resume builder. Resunova
-- already does analysis, tailoring, templates and ATS checking; a second,
-- worse version of that here would help nobody. These rows render as a
-- background section on the public page, next to a link to the real resume.
--
-- Dates are stored as yyyy-mm-01 and only ever shown as month and year: a CV
-- does not print the day, so asking for one is a field nobody can answer well.

create table public.profile_timeline (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null,
  title text not null,
  organisation text not null,
  location text not null default '',
  started_on date,
  ended_on date,
  is_current boolean not null default false,
  description text not null default '',
  position integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profile_timeline_kind_check
    check (kind in ('education', 'experience')),
  constraint profile_timeline_title_length
    check (char_length(title) between 1 and 120),
  constraint profile_timeline_organisation_length
    check (char_length(organisation) between 1 and 120),
  constraint profile_timeline_location_length
    check (char_length(location) <= 120),
  constraint profile_timeline_description_length
    check (char_length(description) <= 300),
  -- A finished entry cannot end before it began. A current one may carry a
  -- stale end date, which the app ignores, so it is not checked here.
  constraint profile_timeline_range_ordered
    check (
      is_current
      or started_on is null
      or ended_on is null
      or ended_on >= started_on
    ),
  constraint profile_timeline_position_nonnegative check (position >= 0)
);

comment on table public.profile_timeline is
  'Education and experience shown on the public page. Not a resume builder: Resunova owns that.';
comment on column public.profile_timeline.started_on is
  'Stored as the first of the month; only month and year are ever displayed.';

create index profile_timeline_user_idx
  on public.profile_timeline (user_id, kind, position);

alter table public.profile_timeline enable row level security;

grant select, insert, update, delete on public.profile_timeline to authenticated;
grant usage, select on sequence public.profile_timeline_id_seq to authenticated;

create policy profile_timeline_public_read on public.profile_timeline
for select to anon
using (
  is_active and exists (
    select 1 from public.profiles p
    where p.id = profile_timeline.user_id and p.is_published
  )
);

create policy profile_timeline_authenticated_read on public.profile_timeline
for select to authenticated
using (
  user_id = (select auth.uid())
  or (
    is_active and exists (
      select 1 from public.profiles p
      where p.id = profile_timeline.user_id and p.is_published
    )
  )
);

create policy profile_timeline_owner_insert on public.profile_timeline
for insert to authenticated
with check (user_id = (select auth.uid()));

create policy profile_timeline_owner_update on public.profile_timeline
for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy profile_timeline_owner_delete on public.profile_timeline
for delete to authenticated
using (user_id = (select auth.uid()));


-- The wizard's purpose list gains "Student", which needs no schema of its own
-- beyond this table.
