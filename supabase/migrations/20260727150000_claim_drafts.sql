-- Prefilled pages for creators who have not signed up yet.
--
-- A draft deliberately does NOT touch public.profiles: profiles.id references
-- auth.users, so creating one early would mean creating an auth account nobody
-- asked for, and would consume the creator's username via the unique index --
-- meaning when they did sign up, they could not have their own handle.
-- Drafts live here until claimed, then apply onto the claimer's own profile.

create table public.claim_drafts (
  token text primary key,
  source_url text not null,
  suggested_username text,
  display_name text not null default 'Creator',
  payload jsonb not null,
  claimed_by uuid references auth.users(id) on delete set null,
  claimed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '30 days',
  constraint claim_drafts_token_length check (char_length(token) between 24 and 64),
  constraint claim_drafts_source_url_format check (source_url ~* '^https?://'),
  constraint claim_drafts_username_format check (
    suggested_username is null
    or suggested_username ~ '^[a-z0-9][a-z0-9_-]{2,29}$'
  ),
  constraint claim_drafts_display_name_length check (
    char_length(display_name) between 1 and 80
  ),
  constraint claim_drafts_payload_object check (jsonb_typeof(payload) = 'object'),
  constraint claim_drafts_expiry_after_creation check (expires_at > created_at)
  -- No claimed_by/claimed_at consistency check: the FK is ON DELETE SET NULL,
  -- so deleting an auth user would null claimed_by while claimed_at stayed set
  -- and the check would block the delete.
);

create index claim_drafts_claimed_by_idx on public.claim_drafts (claimed_by);

create trigger claim_drafts_set_updated_at before update on public.claim_drafts
for each row execute function public.set_updated_at();

alter table public.claim_drafts enable row level security;

-- No direct table access for anyone. Reads go through the function below so a
-- caller must know the exact token; granting select would let anon dump every
-- draft and see the whole outreach list.
revoke all on public.claim_drafts from public, anon, authenticated;

-- Public read of a single draft, by exact token.
create function public.get_claim_draft(draft_token text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'token', d.token,
    'source_url', d.source_url,
    'suggested_username', d.suggested_username,
    'display_name', d.display_name,
    'payload', d.payload,
    'is_claimed', d.claimed_by is not null,
    'username_available',
      d.suggested_username is not null
      and public.is_username_available(d.suggested_username)
  )
  from public.claim_drafts d
  where d.token = draft_token
    and d.expires_at > now();
$$;

revoke all on function public.get_claim_draft(text) from public, anon, authenticated;
grant execute on function public.get_claim_draft(text) to anon, authenticated;

-- Apply a draft onto the calling user's own profile, then mark it claimed.
-- Values are clamped to the profile/link constraints so a malformed payload
-- cannot fail the claim halfway through.
create function public.claim_draft(draft_token text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  draft public.claim_drafts;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  select * into draft
  from public.claim_drafts
  where token = draft_token and expires_at > now()
  for update;

  if not found then
    raise exception 'Draft not found or expired';
  end if;

  if draft.claimed_by is not null and draft.claimed_by <> current_user_id then
    raise exception 'Draft already claimed';
  end if;

  update public.profiles
  set display_name = coalesce(
        left(nullif(btrim(draft.payload->>'display_name'), ''), 80),
        left(nullif(btrim(draft.display_name), ''), 80),
        display_name
      ),
      bio = left(coalesce(draft.payload->>'bio', bio), 160),
      template = case
        when draft.payload->>'template'
          in ('field-notes', 'after-dark', 'soft-studio')
        then draft.payload->>'template'
        else template
      end,
      onboarding_completed = true
  where id = current_user_id;

  if not found then
    raise exception 'Profile not found';
  end if;

  delete from public.links where user_id = current_user_id;
  insert into public.links (user_id, title, subtitle, url, position, is_active)
  select current_user_id,
    left(item->>'title', 100),
    left(coalesce(item->>'subtitle', ''), 100),
    item->>'url',
    (ordinality::integer - 1),
    true
  from jsonb_array_elements(coalesce(draft.payload->'links', '[]'::jsonb))
    with ordinality as rows(item, ordinality)
  -- Titles are truncated by left() above, so only reject genuinely empty ones;
  -- checking the raw length here would silently drop every long title instead.
  where coalesce(item->>'url', '') ~* '^https?://'
    and char_length(coalesce(item->>'title', '')) >= 1;

  delete from public.social_links where user_id = current_user_id;
  -- Store the label exactly as the payload supplies it. lib/social-platforms.tsx
  -- matches with `option.label === platform`, so the value must be character-for
  -- -character one of "Instagram", "TikTok", "X / Twitter", ... — lower-casing it
  -- here would miss every lookup and fall back to a generic globe icon. The
  -- importer is responsible for emitting canonical labels; dedupe is
  -- case-insensitive only to protect the (user_id, platform) unique index.
  insert into public.social_links (user_id, platform, url, position)
  select current_user_id,
    label,
    url,
    (row_number() over (order by ordinality))::integer - 1
  from (
    select distinct on (lower(label)) label, url, ordinality
    from (
      select
        left(btrim(item->>'platform'), 40) as label,
        item->>'url' as url,
        ordinality
      from jsonb_array_elements(
        case
          when jsonb_typeof(draft.payload->'socials') = 'array'
          then draft.payload->'socials'
          else '[]'::jsonb
        end
      ) with ordinality as rows(item, ordinality)
      where coalesce(item->>'url', '') ~* '^https?://'
    ) normalized
    where label <> ''
    order by lower(label), ordinality
  ) deduped;

  update public.claim_drafts
  set claimed_by = current_user_id, claimed_at = now()
  where token = draft_token;
end;
$$;

revoke all on function public.claim_draft(text) from public, anon;
grant execute on function public.claim_draft(text) to authenticated;
