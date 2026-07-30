-- Signal Deck template + profile skill tags.

alter table public.profiles
  drop constraint if exists profiles_template_check;

alter table public.profiles
  add constraint profiles_template_check
  check (
    template in ('field-notes', 'after-dark', 'soft-studio', 'signal-deck')
  );

alter table public.profiles
  add column if not exists tags text[] not null default '{}'::text[];

alter table public.profiles
  drop constraint if exists profiles_tags_length;

alter table public.profiles
  add constraint profiles_tags_length
  check (cardinality(tags) <= 16);

create or replace function public.claim_draft(draft_token text)
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
          in ('field-notes', 'after-dark', 'soft-studio', 'signal-deck')
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
  where coalesce(item->>'url', '') ~* '^https?://'
    and char_length(coalesce(item->>'title', '')) >= 1;

  delete from public.social_links where user_id = current_user_id;
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
