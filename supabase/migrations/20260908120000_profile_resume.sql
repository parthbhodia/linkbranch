-- A résumé on the profile.
--
-- The Student purpose puts education and experience on the page itself, which
-- is what a visitor reads. This is for the other half: the recruiter who asks
-- for the file. Until now there was nowhere to put one -- the avatars bucket
-- accepts images only, so a PDF was refused at the storage layer.
--
-- The `documents` bucket is created in the Supabase dashboard for this project
-- and the statement below only fills it in for a fresh environment: `do
-- nothing` on conflict, so re-running never overwrites the public/private
-- choice or the size limit already set there.
--
-- PDF and DOCX only. Not .doc, .pages or .odt -- legacy or single-vendor, and
-- every type added is one more the bucket will hand to whoever asks.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents',
  'documents',
  false,
  10485760,
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do nothing;

alter table public.profiles
  add column if not exists resume_path text,
  -- Shown on the button instead of the storage filename, which is a uuid.
  add column if not exists resume_label text;

alter table public.profiles
  drop constraint if exists profiles_resume_label_length;

alter table public.profiles
  add constraint profiles_resume_label_length
    check (resume_label is null or char_length(resume_label) <= 80);
