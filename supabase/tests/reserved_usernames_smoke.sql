-- Behavioural smoke test for reserved usernames.
--
-- HOW TO READ THIS: it ends by raising an exception whose message IS the
-- report. Supabase shows it as a red error — that is success. Read the
-- PASS/FAIL lines. Raising also rolls back the throwaway signup in step 6.
--
-- Run the whole file as one script.

do $$
declare
  report text := '';
  test_id uuid := gen_random_uuid();
  created_username text;
  reserved_count int;
begin
  ---------------------------------------------------------------- 1
  report := report || case
    when public.is_username_available('dashboard') = false
    then 'PASS  "dashboard" is unavailable (route would shadow the page)'
    else 'FAIL  "dashboard" is still claimable' end || E'\n';

  ---------------------------------------------------------------- 2
  report := report || case
    when public.is_username_available('claim') = false
     and public.is_username_available('auth') = false
     and public.is_username_available('templates') = false
    then 'PASS  other app routes blocked (claim, auth, templates)'
    else 'FAIL  at least one app route is still claimable' end || E'\n';

  ---------------------------------------------------------------- 3
  -- Normalisation: the function lowercases and trims before comparing, so
  -- padding or capitalising a reserved name must not slip past it.
  report := report || case
    when public.is_username_available('  DaShBoArD  ') = false
    then 'PASS  reserved check survives case and whitespace'
    else 'FAIL  "  DaShBoArD  " bypassed the reserved list' end || E'\n';

  ---------------------------------------------------------------- 4
  report := report || case
    when public.is_username_available('a-genuinely-free-name-8842') = true
    then 'PASS  an ordinary unused name is still available'
    else 'FAIL  ordinary names are being blocked' end || E'\n';

  ---------------------------------------------------------------- 5
  report := report || case
    when public.is_username_available('ab') = false
    then 'PASS  too-short name rejected by the format rule'
    else 'FAIL  "ab" passed the format rule' end || E'\n';

  select count(*) into reserved_count from public.reserved_usernames;
  report := report || format('INFO  %s names reserved', reserved_count) || E'\n';

  ---------------------------------------------------------------- 6
  -- Signup assigns a username from metadata with no conflict raised, so a
  -- reserved name must be caught by handle_new_user, not just by the UI.
  begin
    insert into auth.users (id, email, raw_user_meta_data)
    values (test_id, format('smoke-%s@example.com', left(test_id::text, 8)),
            '{"username":"dashboard"}'::jsonb);

    select username into created_username
    from public.profiles where id = test_id;

    report := report || case
      when created_username is null
        then 'FAIL  signup created no profile row'
      when created_username = 'dashboard'
        then 'FAIL  signup assigned the reserved name "dashboard"'
      else format('PASS  reserved signup fell through to "%s"', created_username)
      end || E'\n';
  exception when others then
    report := report || format('SKIP  could not simulate signup (%s)', sqlerrm) || E'\n';
  end;

  raise exception E'\n=== RESERVED USERNAMES REPORT (this error is expected; it rolls everything back) ===\n%', report;
end $$;
