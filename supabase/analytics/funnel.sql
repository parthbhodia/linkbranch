-- Cueful drop-off funnels.
--
-- Run in the Supabase SQL editor. Read-only: nothing here writes.
--
-- ============================================================================
-- READ THIS FIRST: is_published is not a funnel stage.
--
-- 20260728113000_default_cueful_badge.sql set profiles.is_published to default
-- true and backfilled every unfinished profile to true. A row is created by the
-- linkbranch_handle_new_user trigger the instant someone signs up, so every
-- account is "published" before it has a bio, a link, or a name. Charting it
-- would show 100% at that step and hide the drop it is supposed to measure.
--
-- The stages below are things a person has to actually do.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- 1. Activation funnel: what happens after signup.
-- ---------------------------------------------------------------------------
-- Stages are cumulative: reaching one means having cleared every stage above
-- it. Independent milestones would let a later stage exceed an earlier one
-- (finishing setup without ever adding a link, say), which reads as a funnel
-- but is not one -- you cannot tell where anybody actually stopped. Query 2
-- reports those same milestones separately, where overlap is the point.
with accounts as (
  select
    p.id,
    p.created_at,
    -- handle_new_user seeds display_name from the email local part, so it is
    -- non-default on arrival and is no evidence of editing. These are left at
    -- the table default until the creator changes them.
    p.bio <> ''                       as has_bio,
    p.avatar_path is not null         as has_avatar,
    p.onboarding_completed,
    (select count(*) from public.links l
      where l.user_id = p.id and l.is_active)          as active_links,
    (select count(*) from public.profile_views v
      where v.profile_id = p.id
        and coalesce(v.device_type, '') <> 'bot')      as human_views,
    (select count(*) from public.click_events c
      where c.profile_id = p.id)                       as clicks
  from public.profiles p
),
reached as (
  select
    true                                                          as s1_signed_up,
    (has_bio or has_avatar)                                       as s2_personalised,
    (has_bio or has_avatar)
      and active_links >= 1                                       as s3_added_link,
    (has_bio or has_avatar)
      and active_links >= 1
      and onboarding_completed                                    as s4_finished_setup,
    (has_bio or has_avatar)
      and active_links >= 1
      and onboarding_completed
      -- The bar the sitemap applies (lib/page-quality.ts).
      and has_bio
      and (has_avatar or active_links >= 2)
      and created_at < now() - interval '24 hours'                as s5_indexable,
    (has_bio or has_avatar)
      and active_links >= 1
      and onboarding_completed
      and has_bio
      and (has_avatar or active_links >= 2)
      and created_at < now() - interval '24 hours'
      and human_views > 0                                         as s6_got_visitor,
    (has_bio or has_avatar)
      and active_links >= 1
      and onboarding_completed
      and has_bio
      and (has_avatar or active_links >= 2)
      and created_at < now() - interval '24 hours'
      and human_views > 0
      and clicks > 0                                              as s7_got_click
  from accounts
),
steps as (
  select 1 as step, 'signed up'          as stage, count(*) filter (where s1_signed_up)     as people from reached
  union all select 2, 'personalised page', count(*) filter (where s2_personalised)          from reached
  union all select 3, 'added a link',      count(*) filter (where s3_added_link)            from reached
  union all select 4, 'finished setup',    count(*) filter (where s4_finished_setup)        from reached
  union all select 5, 'indexable page',    count(*) filter (where s5_indexable)             from reached
  union all select 6, 'got a visitor',     count(*) filter (where s6_got_visitor)           from reached
  union all select 7, 'got a click',       count(*) filter (where s7_got_click)             from reached
)
select
  stage,
  people,
  round(100.0 * people / nullif(max(people) over (), 0), 1)        as pct_of_signups,
  coalesce(lag(people) over (order by step) - people, 0)           as lost_here,
  round(
    100.0 * (lag(people) over (order by step) - people)
    / nullif(lag(people) over (order by step), 0), 1
  )                                                                as pct_lost_here
from steps
order by step;


-- ---------------------------------------------------------------------------
-- 2. The same milestones, counted independently.
-- ---------------------------------------------------------------------------
-- Not nested, so these will not decrease in order and must not be read as a
-- funnel. Useful for the opposite question: how many people finished setup but
-- never added a link, which the cumulative view deliberately folds away.
select
  count(*)                                                            as signed_up,
  count(*) filter (where p.bio <> '' or p.avatar_path is not null)    as personalised,
  count(*) filter (
    where exists (select 1 from public.links l
                   where l.user_id = p.id and l.is_active)
  )                                                                   as added_a_link,
  count(*) filter (where p.onboarding_completed)                      as finished_setup,
  count(*) filter (
    where p.onboarding_completed
      and not exists (select 1 from public.links l
                       where l.user_id = p.id and l.is_active)
  )                                                                   as finished_but_no_link
from public.profiles p;


-- ---------------------------------------------------------------------------
-- 3. Acquisition funnel: the outreach drafts.
-- ---------------------------------------------------------------------------
-- claim_drafts are the pre-built pages sent to creators who have no account.
-- record_claim_view is called from the browser, so first_viewed_at means a
-- human opened it -- link-preview crawlers fetch the HTML without running JS.
select
  count(*)                                                  as drafts_created,
  count(*) filter (where first_viewed_at is not null)        as opened,
  count(*) filter (where claimed_at is not null)             as claimed,
  round(100.0 * count(*) filter (where first_viewed_at is not null)
        / nullif(count(*), 0), 1)                            as pct_opened,
  round(100.0 * count(*) filter (where claimed_at is not null)
        / nullif(count(*) filter (where first_viewed_at is not null), 0), 1)
                                                             as pct_claimed_of_opened,
  count(*) filter (where expires_at < now() and claimed_at is null)
                                                             as expired_unclaimed
from public.claim_drafts;


-- ---------------------------------------------------------------------------
-- 4. Weekly cohorts: is the funnel getting better or worse?
-- ---------------------------------------------------------------------------
select
  date_trunc('week', p.created_at)::date                     as cohort_week,
  count(*)                                                   as signed_up,
  count(*) filter (where p.bio <> '' or p.avatar_path is not null)
                                                             as personalised,
  count(*) filter (
    where exists (select 1 from public.links l
                   where l.user_id = p.id and l.is_active)
  )                                                          as added_a_link,
  count(*) filter (where p.onboarding_completed)             as finished_setup
from public.profiles p
group by 1
order by 1 desc;


-- ---------------------------------------------------------------------------
-- 5. Time to each step, for the people who got there.
-- ---------------------------------------------------------------------------
-- A long tail here means people are leaving and coming back rather than
-- finishing in one sitting, which is a different problem from abandoning.
select
  percentile_cont(0.5) within group (
    order by extract(epoch from (p.updated_at - p.created_at)) / 60
  )                                                          as median_minutes_to_last_edit,
  percentile_cont(0.9) within group (
    order by extract(epoch from (p.updated_at - p.created_at)) / 60
  )                                                          as p90_minutes_to_last_edit
from public.profiles p
where p.onboarding_completed;


-- ---------------------------------------------------------------------------
-- 6. Accounts that stalled, so you can look at real examples.
-- ---------------------------------------------------------------------------
select
  p.username,
  p.created_at,
  p.bio <> ''                as has_bio,
  p.avatar_path is not null  as has_avatar,
  p.onboarding_completed,
  (select count(*) from public.links l
    where l.user_id = p.id and l.is_active) as active_links
from public.profiles p
where not p.onboarding_completed
order by p.created_at desc
limit 50;
