-- A greeting is a courtesy, not a requirement.
--
-- profiles_greeting_length was check (char_length(greeting) between 1 and 32),
-- which quietly made the field mandatory: clearing "Greeting" in the dashboard
-- or the wizard failed the save, so a page could never read as just the
-- creator's name. Widen the check to allow an empty value and let new rows
-- start blank instead of inheriting the "Hey, I'm" template.
--
-- The public page renders an empty greeting as just the display name
-- (profile-hub.tsx), so an empty string is the "no greeting" state.

alter table public.profiles
  drop constraint if exists profiles_greeting_length;

alter table public.profiles
  add constraint profiles_greeting_length
  check (char_length(greeting) between 0 and 32);

alter table public.profiles
  alter column greeting set default '';
