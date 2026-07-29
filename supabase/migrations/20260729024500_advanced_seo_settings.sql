alter table public.profiles
  add column if not exists seo_og_title text,
  add column if not exists seo_og_description text,
  add column if not exists seo_keywords text,
  add column if not exists seo_noindex boolean not null default false,
  add column if not exists twitter_card_style text not null default 'summary_large_image',
  add column if not exists canonical_url text;

alter table public.profiles
  drop constraint if exists profiles_seo_og_title_length,
  drop constraint if exists profiles_seo_og_description_length,
  drop constraint if exists profiles_seo_keywords_length,
  drop constraint if exists profiles_twitter_card_style_check,
  drop constraint if exists profiles_canonical_url_format;

alter table public.profiles
  add constraint profiles_seo_og_title_length
    check (seo_og_title is null or char_length(seo_og_title) <= 70),
  add constraint profiles_seo_og_description_length
    check (seo_og_description is null or char_length(seo_og_description) <= 180),
  add constraint profiles_seo_keywords_length
    check (seo_keywords is null or char_length(seo_keywords) <= 240),
  add constraint profiles_twitter_card_style_check
    check (twitter_card_style in ('summary', 'summary_large_image')),
  add constraint profiles_canonical_url_format
    check (
      canonical_url is null
      or canonical_url ~* '^https?://'
    );
