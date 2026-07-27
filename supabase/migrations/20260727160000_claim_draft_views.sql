-- View tracking for claim drafts.
--
-- public.click_events cannot serve this: profile_id is NOT NULL against
-- public.profiles (a draft has no profile), and click_events_target_check
-- requires exactly one of link_id/referral_id, so a bare page view is not
-- representable there even for a published profile.

-- Written to be re-runnable: applying a migration twice should be a no-op,
-- not an error that aborts partway through.
alter table public.claim_drafts
  add column if not exists first_viewed_at timestamptz,
  add column if not exists last_viewed_at timestamptz,
  add column if not exists view_count integer not null default 0;

-- add constraint has no IF NOT EXISTS, so drop first.
alter table public.claim_drafts
  drop constraint if exists claim_drafts_view_count_nonnegative;
alter table public.claim_drafts
  add constraint claim_drafts_view_count_nonnegative check (view_count >= 0);

-- Called from the browser, never from the server component that renders the
-- page. Link-preview crawlers -- including the one Instagram runs when a URL is
-- pasted into a DM -- fetch the HTML but do not execute JavaScript, so a
-- client-side ping is the difference between "a human opened this" and "a bot
-- generated a thumbnail". Recording it server-side would mark every draft as
-- viewed the moment you sent it.
create or replace function public.record_claim_view(draft_token text)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.claim_drafts
  set view_count = view_count + 1,
      first_viewed_at = coalesce(first_viewed_at, now()),
      last_viewed_at = now()
  where token = draft_token
    and expires_at > now();
$$;

revoke all on function public.record_claim_view(text) from public, anon, authenticated;
grant execute on function public.record_claim_view(text) to anon, authenticated;

-- Outreach status in one place: who opened, how often, who converted.
create or replace view public.claim_draft_status
with (security_invoker = true) as
  select token, source_url, suggested_username, display_name,
         created_at, expires_at,
         view_count, first_viewed_at, last_viewed_at,
         claimed_at, (claimed_by is not null) as is_claimed
  from public.claim_drafts;

revoke all on public.claim_draft_status from anon, authenticated;
