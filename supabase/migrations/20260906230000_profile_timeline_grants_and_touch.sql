-- Two things 20260906220000_profile_timeline.sql should have done and did not.
--
-- 1. It never revoked Supabase's default privileges.
--
-- Supabase grants ALL on every new table in the public schema to anon and
-- authenticated, so a table that only ever adds grants keeps whatever the
-- defaults handed it. Every other table here opens by taking that back and
-- then granting exactly what the role needs -- profiles, links, referrals,
-- social_links, products, media_embeds, profile_faqs, profile_highlights,
-- profile_views, contact_submissions, connections, claim_drafts,
-- reserved_usernames. profile_timeline is the only one that did not, so anon
-- still holds insert, update and delete on it.
--
-- Nothing is exploitable today: RLS is enabled and there is no write policy
-- for anon, so those privileges are all currently stopped one layer up. That
-- is exactly the point. Everywhere else in this schema RLS is the second
-- line, not the only one, and a table where it is the only one fails open the
-- day someone adds a permissive policy or disables RLS to debug something.
--
-- 2. updated_at was never maintained.
--
-- The column exists with `default now()` and nothing ever changes it, so it
-- has only ever meant created_at by another name. Every table in this schema
-- that carries updated_at carries the trigger too; profile_highlights has
-- neither, which is why it is not a counter-example.

revoke all on public.profile_timeline from anon, authenticated;
grant select on public.profile_timeline to anon;
grant select, insert, update, delete on public.profile_timeline to authenticated;
grant usage, select on sequence public.profile_timeline_id_seq to authenticated;

-- anon can never insert a row, so the identity sequence is dead weight the
-- defaults handed out.
revoke all on sequence public.profile_timeline_id_seq from anon;

create trigger profile_timeline_set_updated_at
before update on public.profile_timeline
for each row execute function public.set_updated_at();
