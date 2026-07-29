-- Allow Audiomack as a first-class media embed provider (Linktree-style music).
alter table public.media_embeds drop constraint media_embeds_provider_check;
alter table public.media_embeds add constraint media_embeds_provider_check
  check (
    provider in (
      'spotify', 'apple_music', 'soundcloud', 'youtube',
      'bandcamp', 'twitch', 'vimeo', 'audiomack'
    )
  );
