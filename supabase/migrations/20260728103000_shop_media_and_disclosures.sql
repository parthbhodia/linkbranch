alter table public.profiles
  add column disclosure_text text;

alter table public.profiles
  add constraint profiles_disclosure_text_length
  check (disclosure_text is null or char_length(disclosure_text) <= 320);

create table public.products (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text not null default '',
  price_amount numeric(12,2),
  currency text not null default 'USD',
  category text not null default 'digital',
  badge text,
  image_path text,
  destination_url text not null,
  cta_label text not null default 'View product',
  position integer not null default 0,
  is_active boolean not null default true,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_title_length check (char_length(title) between 1 and 100),
  constraint products_description_length check (char_length(description) <= 240),
  constraint products_price_nonnegative check (price_amount is null or price_amount >= 0),
  constraint products_currency_format check (currency ~ '^[A-Z]{3}$'),
  constraint products_category_check
    check (category in ('digital', 'merch', 'service', 'course', 'affiliate')),
  constraint products_badge_length check (badge is null or char_length(badge) <= 24),
  constraint products_image_path_length
    check (image_path is null or char_length(image_path) <= 512),
  constraint products_destination_url_format
    check (destination_url ~* '^https?://'),
  constraint products_cta_label_length
    check (char_length(cta_label) between 1 and 40),
  constraint products_position_nonnegative check (position >= 0)
);

create table public.media_embeds (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  provider text not null,
  url text not null,
  layout text not null default 'compact',
  position integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint media_embeds_title_length check (char_length(title) between 1 and 100),
  constraint media_embeds_provider_check
    check (
      provider in (
        'spotify', 'apple_music', 'soundcloud', 'youtube',
        'bandcamp', 'twitch', 'vimeo'
      )
    ),
  constraint media_embeds_url_format check (url ~* '^https?://'),
  constraint media_embeds_layout_check check (layout in ('compact', 'player')),
  constraint media_embeds_position_nonnegative check (position >= 0)
);

create index products_user_position_idx
  on public.products (user_id, position);
create index products_public_active_idx
  on public.products (user_id, position)
  where is_active;
create index media_embeds_user_position_idx
  on public.media_embeds (user_id, position);
create index media_embeds_public_active_idx
  on public.media_embeds (user_id, position)
  where is_active;

create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

create trigger media_embeds_set_updated_at
before update on public.media_embeds
for each row execute function public.set_updated_at();

alter table public.products enable row level security;
alter table public.media_embeds enable row level security;

revoke all on public.products, public.media_embeds from anon, authenticated;
grant select on public.products, public.media_embeds to anon;
grant select, insert, update, delete on public.products, public.media_embeds
  to authenticated;
grant usage, select on sequence public.products_id_seq,
  public.media_embeds_id_seq to authenticated;

create policy products_public_read on public.products
for select to anon
using (
  is_active and exists (
    select 1 from public.profiles p
    where p.id = products.user_id and p.is_published
  )
);
create policy products_authenticated_read on public.products
for select to authenticated
using (
  user_id = (select auth.uid())
  or (
    is_active and exists (
      select 1 from public.profiles p
      where p.id = products.user_id and p.is_published
    )
  )
);
create policy products_owner_insert on public.products
for insert to authenticated
with check (user_id = (select auth.uid()));
create policy products_owner_update on public.products
for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));
create policy products_owner_delete on public.products
for delete to authenticated
using (user_id = (select auth.uid()));

create policy media_embeds_public_read on public.media_embeds
for select to anon
using (
  is_active and exists (
    select 1 from public.profiles p
    where p.id = media_embeds.user_id and p.is_published
  )
);
create policy media_embeds_authenticated_read on public.media_embeds
for select to authenticated
using (
  user_id = (select auth.uid())
  or (
    is_active and exists (
      select 1 from public.profiles p
      where p.id = media_embeds.user_id and p.is_published
    )
  )
);
create policy media_embeds_owner_insert on public.media_embeds
for insert to authenticated
with check (user_id = (select auth.uid()));
create policy media_embeds_owner_update on public.media_embeds
for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));
create policy media_embeds_owner_delete on public.media_embeds
for delete to authenticated
using (user_id = (select auth.uid()));

alter table public.click_events
  add column product_id bigint references public.products(id) on delete cascade,
  add column media_embed_id bigint references public.media_embeds(id) on delete cascade;

alter table public.click_events
  drop constraint click_events_target_check,
  drop constraint click_events_type_check;

alter table public.click_events
  add constraint click_events_target_check
  check (num_nonnulls(link_id, referral_id, product_id, media_embed_id) = 1),
  add constraint click_events_type_check
  check (
    (event_type = 'link_open' and link_id is not null)
    or (
      event_type in ('referral_open', 'referral_copy')
      and referral_id is not null
    )
    or (event_type = 'product_open' and product_id is not null)
    or (event_type = 'media_open' and media_embed_id is not null)
  );

create index click_events_product_id_idx
  on public.click_events (product_id)
  where product_id is not null;
create index click_events_media_embed_id_idx
  on public.click_events (media_embed_id)
  where media_embed_id is not null;

drop policy click_events_public_insert on public.click_events;
create policy click_events_public_insert on public.click_events
for insert to anon, authenticated
with check (
  exists (
    select 1 from public.profiles p
    where p.id = click_events.profile_id and p.is_published
  )
  and (
    link_id is null or exists (
      select 1 from public.links l
      where l.id = click_events.link_id
        and l.user_id = click_events.profile_id
        and l.is_active
        and (l.starts_at is null or l.starts_at <= now())
        and (l.expires_at is null or l.expires_at > now())
    )
  )
  and (
    referral_id is null or exists (
      select 1 from public.referrals r
      where r.id = click_events.referral_id
        and r.user_id = click_events.profile_id
        and r.is_active
    )
  )
  and (
    product_id is null or exists (
      select 1 from public.products pr
      where pr.id = click_events.product_id
        and pr.user_id = click_events.profile_id
        and pr.is_active
    )
  )
  and (
    media_embed_id is null or exists (
      select 1 from public.media_embeds me
      where me.id = click_events.media_embed_id
        and me.user_id = click_events.profile_id
        and me.is_active
    )
  )
);
