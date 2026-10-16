-- badge_open: a visitor tapped "Make your own with cueful." in the footer of a
-- creator's page.
--
-- That badge is the growth loop. It is on every published page by default, and
-- public pages are the busiest surface the product has by a wide margin -- yet
-- nothing recorded whether anyone ever pressed it. The landing side carries
-- utm_source=creator_badge, but reading UTM dimensions out of Vercel Analytics
-- needs a paid add-on, so the one number that says whether the loop works was
-- the one number nobody could see. This makes it a first-party event, counted
-- next to every other click.
--
-- Targetless, exactly like directions_open: there is no row it points at, so
-- both checks gain a case for it rather than a new nullable column.

alter table public.click_events
  drop constraint click_events_target_check,
  drop constraint click_events_type_check;

alter table public.click_events
  add constraint click_events_target_check
  check (
    case
      when event_type in ('directions_open', 'badge_open')
        then num_nonnulls(link_id, referral_id, product_id, media_embed_id) = 0
      else num_nonnulls(link_id, referral_id, product_id, media_embed_id) = 1
    end
  ),
  add constraint click_events_type_check
  check (
    (event_type = 'link_open' and link_id is not null)
    or (
      event_type in ('referral_open', 'referral_copy')
      and referral_id is not null
    )
    or (event_type = 'product_open' and product_id is not null)
    or (event_type = 'media_open' and media_embed_id is not null)
    or event_type in ('directions_open', 'badge_open')
  );

-- One more clause on the insert policy, on the same principle as the rest: an
-- event is only accepted when the thing it describes is actually live. A badge
-- event is only accepted for a profile that is actually showing the badge, so
-- turning the badge off also stops events being written against the page.
drop policy click_events_public_insert on public.click_events;
create policy click_events_public_insert on public.click_events
for insert to anon, authenticated
with check (
  exists (
    select 1 from public.profiles p
    where p.id = click_events.profile_id and p.is_published
  )
  and (
    event_type <> 'directions_open' or exists (
      select 1 from public.profiles p
      where p.id = click_events.profile_id
        and p.show_map
        and p.map_lat is not null
    )
  )
  and (
    event_type <> 'badge_open' or exists (
      select 1 from public.profiles p
      where p.id = click_events.profile_id
        and p.show_cueful_badge
    )
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
