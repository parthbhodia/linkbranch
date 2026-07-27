-- Behavioural smoke test for record_claim_view / claim_draft_status.
--
-- HOW TO READ THIS: it ends by raising an exception whose message IS the
-- report. Supabase shows it as a red error — that is success. Read the
-- PASS/FAIL lines. Raising is also what rolls back the test rows, so nothing
-- persists in claim_drafts.
--
-- Run the whole file as one script.

do $$
declare
  live_tok text := 'view_smoke_live_0123456789ab';
  dead_tok text := 'view_smoke_dead_0123456789ab';
  report text := '';
  v_count int;
  v_first timestamptz;
  v_last timestamptz;
  status_row record;
begin
  ---------------------------------------------------------------- 1
  -- Must not raise on a token that does not exist.
  begin
    perform public.record_claim_view('no-such-token-at-all-here');
    report := report || 'PASS  unknown token is a no-op, not an error' || E'\n';
  exception when others then
    report := report || format('FAIL  unknown token raised: %s', sqlerrm) || E'\n';
  end;

  ---------------------------------------------------------------- 2
  insert into public.claim_drafts
    (token, source_url, suggested_username, display_name, payload)
  values (live_tok, 'https://linktr.ee/viewsmoke', 'viewsmoke', 'View Smoke',
          '{"links":[],"socials":[]}'::jsonb);

  select view_count, first_viewed_at into v_count, v_first
  from public.claim_drafts where token = live_tok;

  report := report || case when v_count = 0 and v_first is null
    then 'PASS  new draft starts at view_count 0, first_viewed_at null'
    else format('FAIL  new draft had count=%s first=%s', v_count, v_first)
    end || E'\n';

  ---------------------------------------------------------------- 3
  perform public.record_claim_view(live_tok);
  select view_count, first_viewed_at, last_viewed_at
    into v_count, v_first, v_last
  from public.claim_drafts where token = live_tok;

  report := report || case when v_count = 1 and v_first is not null and v_last is not null
    then 'PASS  first view: count=1, first_viewed_at and last_viewed_at set'
    else format('FAIL  first view gave count=%s first=%s last=%s', v_count, v_first, v_last)
    end || E'\n';

  ---------------------------------------------------------------- 4
  perform public.record_claim_view(live_tok);
  select view_count, first_viewed_at into v_count, v_last
  from public.claim_drafts where token = live_tok;

  report := report || case when v_count = 2
    then 'PASS  second view increments count to 2'
    else format('FAIL  second view gave count=%s', v_count) end || E'\n';

  -- coalesce() must not move first_viewed_at on subsequent views.
  report := report || case when v_last = v_first
    then 'PASS  first_viewed_at unchanged by the second view'
    else format('FAIL  first_viewed_at moved from %s to %s', v_first, v_last)
    end || E'\n';

  ---------------------------------------------------------------- 5
  -- An expired draft must not record views. created_at is backdated too, or
  -- claim_drafts_expiry_after_creation would reject the row.
  insert into public.claim_drafts
    (token, source_url, display_name, payload, created_at, expires_at)
  values (dead_tok, 'https://linktr.ee/expired', 'Expired',
          '{"links":[],"socials":[]}'::jsonb,
          now() - interval '60 days', now() - interval '1 day');

  perform public.record_claim_view(dead_tok);
  select view_count into v_count from public.claim_drafts where token = dead_tok;

  report := report || case when v_count = 0
    then 'PASS  expired draft does not record views'
    else format('FAIL  expired draft recorded %s views', v_count) end || E'\n';

  -- get_claim_draft should already hide it; confirm the two agree.
  report := report || case when public.get_claim_draft(dead_tok) is null
    then 'PASS  expired draft hidden from get_claim_draft'
    else 'FAIL  expired draft still returned by get_claim_draft' end || E'\n';

  ---------------------------------------------------------------- 6
  select * into status_row from public.claim_draft_status where token = live_tok;
  report := report || case
    when status_row.view_count = 2 and status_row.is_claimed = false
    then 'PASS  claim_draft_status reports count=2, is_claimed=false'
    else format('FAIL  status row: count=%s claimed=%s',
                status_row.view_count, status_row.is_claimed) end || E'\n';

  raise exception E'\n=== VIEW TRACKING REPORT (this error is expected; it rolls everything back) ===\n%', report;
end $$;
