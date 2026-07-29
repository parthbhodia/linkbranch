alter table public.profiles
  add column if not exists favicon_path text;

alter table public.profiles
  drop constraint if exists profiles_favicon_path_length;

alter table public.profiles
  add constraint profiles_favicon_path_length
    check (favicon_path is null or char_length(favicon_path) <= 512);
