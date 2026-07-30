-- Behavioural smoke test for the intro copy claim_draft() applies.
--
-- HOW TO READ THIS: it ends by raising an exception whose message IS the
-- report. Supabase shows it as a red error — that is success. Read the
-- PASS/FAIL lines. Raising is also what rolls back the test rows, so no
-- draft, profile or auth user persists.
--
-- Run the whole file as one script.

do $$
declare
  claimer uuid := gen_random_uuid();
  copy_tok text := 'intro_smoke_copy_0123456789ab';
  bare_tok text := 'intro_smoke_bare_0123456789ab';
  long_tok text := 'intro_smoke_long_0123456789ab';
  report text := '';
  p record;
begin
  insert into auth.users (id, email) values (claimer, 'intro-smoke@example.test');

  -- The account-profile trigger may or may not fire depending on how this
  -- database was built, so make the row exist either way.
  insert into public.profiles (id, username, display_name)
  values (claimer, 'introsmoke', 'Intro Smoke')
  on conflict (id) do nothing;

  perform set_config('request.jwt.claim.sub', claimer::text, true);

  ---------------------------------------------------------------- 1
  -- A draft carrying intro copy replaces the creator defaults.
  insert into public.claim_drafts
    (token, source_url, suggested_username, display_name, payload)
  values (copy_tok, 'https://www.instagram.com/introsmoke/', 'introsmoke',
          'Intro Smoke',
          jsonb_build_object(
            'display_name', 'Nails by Lana',
            'greeting', 'Welcome to',
            'headline', 'Brooklyn''s best',
            'headline_accent', 'gel manicure.',
            'tags', jsonb_build_array('Manicure', 'Pedicure', 'Podology'),
            'template', 'soft-studio',
            'links', '[]'::jsonb,
            'socials', '[]'::jsonb
          ));

  perform public.claim_draft(copy_tok);
  select greeting, headline, headline_accent, tags, template, display_name
    into p from public.profiles where id = claimer;

  report := report || case
    when p.greeting = 'Welcome to'
     and p.headline = 'Brooklyn''s best'
     and p.headline_accent = 'gel manicure.'
    then 'PASS  greeting/headline/accent come from the payload'
    else format('FAIL  got greeting=%s headline=%s accent=%s',
                p.greeting, p.headline, p.headline_accent)
    end || E'\n';

  report := report || case
    when p.tags = array['Manicure', 'Pedicure', 'Podology']
    then 'PASS  tags applied in payload order'
    else format('FAIL  tags were %s', p.tags)
    end || E'\n';

  ---------------------------------------------------------------- 2
  -- A draft with no intro copy must leave what is already there alone,
  -- not blank it. Drafts written before this migration have no such keys.
  insert into public.claim_drafts
    (token, source_url, suggested_username, display_name, payload)
  values (bare_tok, 'https://linktr.ee/introsmoke', null, 'Intro Smoke',
          '{"bio":"still here","links":[],"socials":[]}'::jsonb);

  perform public.claim_draft(bare_tok);
  select greeting, headline, headline_accent, tags into p
  from public.profiles where id = claimer;

  report := report || case
    when p.greeting = 'Welcome to'
     and p.headline = 'Brooklyn''s best'
     and p.tags = array['Manicure', 'Pedicure', 'Podology']
    then 'PASS  a payload without intro copy leaves the profile untouched'
    else format('FAIL  bare payload overwrote copy: greeting=%s tags=%s',
                p.greeting, p.tags)
    end || E'\n';

  ---------------------------------------------------------------- 3
  -- Over-long values and too many tags are clamped, not rejected. Without
  -- the clamp, profiles_greeting_length aborts the claim after links were
  -- already deleted, leaving the claimer with an empty page.
  insert into public.claim_drafts
    (token, source_url, suggested_username, display_name, payload)
  values (long_tok, 'https://linktr.ee/introlong', null, 'Intro Smoke',
          jsonb_build_object(
            'greeting', repeat('g', 200),
            'headline', repeat('h', 200),
            'headline_accent', repeat('a', 200),
            'tags', (select jsonb_agg('tag' || n) from generate_series(1, 40) n),
            'links', '[]'::jsonb,
            'socials', '[]'::jsonb
          ));

  begin
    perform public.claim_draft(long_tok);
    select greeting, headline, headline_accent, tags into p
    from public.profiles where id = claimer;

    report := report || case
      when char_length(p.greeting) = 32
       and char_length(p.headline) = 48
       and char_length(p.headline_accent) = 24
       and cardinality(p.tags) = 16
      then 'PASS  over-long copy and 40 tags clamped to the column limits'
      else format('FAIL  clamped to greeting=%s headline=%s accent=%s tags=%s',
                  char_length(p.greeting), char_length(p.headline),
                  char_length(p.headline_accent), cardinality(p.tags))
      end || E'\n';
  exception when others then
    report := report || format('FAIL  over-long payload raised: %s', sqlerrm)
      || E'\n';
  end;

  ---------------------------------------------------------------- 4
  -- Blank strings must fall through to the existing value: the profiles
  -- checks require at least one character.
  update public.claim_drafts
  set payload = jsonb_build_object(
        'greeting', '   ', 'headline', '', 'links', '[]'::jsonb,
        'socials', '[]'::jsonb),
      claimed_by = null, claimed_at = null
  where token = bare_tok;

  begin
    perform public.claim_draft(bare_tok);
    select greeting, headline into p from public.profiles where id = claimer;
    report := report || case
      when char_length(p.greeting) > 0 and char_length(p.headline) > 0
      then 'PASS  blank copy keeps the previous value'
      else format('FAIL  blank copy wrote greeting=%L headline=%L',
                  p.greeting, p.headline)
      end || E'\n';
  exception when others then
    report := report || format('FAIL  blank copy raised: %s', sqlerrm) || E'\n';
  end;

  raise exception E'\n\n%\n(this exception is the test report and the rollback)\n',
    report;
end $$;
