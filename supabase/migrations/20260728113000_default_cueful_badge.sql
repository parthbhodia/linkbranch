alter table public.profiles
  alter column show_cueful_badge set default true,
  alter column is_discoverable set default true,
  alter column is_published set default true;

-- New and unfinished profiles have not made an explicit badge choice yet.
update public.profiles
set show_cueful_badge = true,
    is_discoverable = true,
    is_published = true
where onboarding_completed = false;
