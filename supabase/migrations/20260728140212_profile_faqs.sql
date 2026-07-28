create table public.profile_faqs (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  question text not null,
  answer text not null,
  position integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profile_faqs_question_length
    check (char_length(question) between 1 and 160),
  constraint profile_faqs_answer_length
    check (char_length(answer) between 1 and 600),
  constraint profile_faqs_position_nonnegative check (position >= 0)
);

create index profile_faqs_user_position_idx
  on public.profile_faqs (user_id, position);
create index profile_faqs_public_active_idx
  on public.profile_faqs (user_id, position)
  where is_active;

create trigger profile_faqs_set_updated_at
before update on public.profile_faqs
for each row execute function public.set_updated_at();

alter table public.profile_faqs enable row level security;

revoke all on public.profile_faqs from anon, authenticated;
grant select on public.profile_faqs to anon;
grant select, insert, update, delete on public.profile_faqs to authenticated;
grant usage, select on sequence public.profile_faqs_id_seq to authenticated;

create policy profile_faqs_public_read on public.profile_faqs
for select to anon
using (
  is_active and exists (
    select 1 from public.profiles p
    where p.id = profile_faqs.user_id and p.is_published
  )
);

create policy profile_faqs_authenticated_read on public.profile_faqs
for select to authenticated
using (
  user_id = (select auth.uid())
  or (
    is_active and exists (
      select 1 from public.profiles p
      where p.id = profile_faqs.user_id and p.is_published
    )
  )
);

create policy profile_faqs_owner_insert on public.profile_faqs
for insert to authenticated
with check (user_id = (select auth.uid()));

create policy profile_faqs_owner_update on public.profile_faqs
for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy profile_faqs_owner_delete on public.profile_faqs
for delete to authenticated
using (user_id = (select auth.uid()));
