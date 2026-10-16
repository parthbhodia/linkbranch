-- Retire the seeded greeting.
--
-- The header used to be a sentence assembled from five copy fields. Only some
-- of them were real decisions: "Greeting" was overwritten from the template
-- blueprint on every purpose change (PERSONAL = "Hey, I'm", BUSINESS = "This
-- is") and was written to sit in front of the display name. The two halves of
-- the headline were one sentence cut across two boxes.
--
-- The header is now two plain lines of one headline plus an About paragraph, so
-- the greeting has nowhere to go: it cannot move into the headline without
-- producing "Hey, I'm I make useful things." Because it was never typed by a
-- creator, clearing it loses no authored copy.
--
-- The column stays, and keeps its default, so anything still selecting it keeps
-- working; a later migration can drop it once nothing reads it.
update public.profiles
set greeting = ''
where greeting <> '';
