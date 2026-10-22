-- Outreach radar: posts from Reddit/X/etc worth targeting for Cueful growth.
-- Internal ops tool at /outreach — authenticated users only.

create table public.outreach_targets (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  external_id text not null,
  title text not null,
  url text not null,
  author text,
  community text,
  body text not null default '',
  score integer not null default 0,
  comments integer not null default 0,
  target_score integer not null default 0,
  status text not null default 'new',
  notes text not null default '',
  reply_draft text not null default '',
  query text,
  posted_at timestamptz,
  scanned_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint outreach_targets_platform_check
    check (platform in ('reddit', 'twitter', 'web', 'other')),
  constraint outreach_targets_status_check
    check (status in ('new', 'queued', 'replied', 'skipped', 'won')),
  constraint outreach_targets_title_length
    check (char_length(title) between 1 and 400),
  constraint outreach_targets_url_format
    check (url ~* '^https?://'),
  constraint outreach_targets_body_length
    check (char_length(body) <= 8000),
  constraint outreach_targets_notes_length
    check (char_length(notes) <= 4000),
  constraint outreach_targets_reply_draft_length
    check (char_length(reply_draft) <= 4000),
  constraint outreach_targets_platform_external_unique
    unique (platform, external_id)
);

create index outreach_targets_status_score_idx
  on public.outreach_targets (status, target_score desc);

create index outreach_targets_platform_idx
  on public.outreach_targets (platform);

create trigger outreach_targets_set_updated_at
  before update on public.outreach_targets
  for each row execute function public.set_updated_at();

alter table public.outreach_targets enable row level security;

create policy outreach_targets_select_authenticated
  on public.outreach_targets
  for select
  to authenticated
  using (true);

create policy outreach_targets_insert_authenticated
  on public.outreach_targets
  for insert
  to authenticated
  with check (true);

create policy outreach_targets_update_authenticated
  on public.outreach_targets
  for update
  to authenticated
  using (true)
  with check (true);

create policy outreach_targets_delete_authenticated
  on public.outreach_targets
  for delete
  to authenticated
  using (true);

revoke all on public.outreach_targets from anon;
grant select, insert, update, delete on public.outreach_targets to authenticated;

insert into public.reserved_usernames (name, reason)
values ('outreach', 'route')
on conflict (name) do nothing;
