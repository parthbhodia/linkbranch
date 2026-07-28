drop policy profile_domains_public_verified_read on public.profile_domains;
drop policy profile_domains_owner_read on public.profile_domains;

create policy profile_domains_anon_verified_read on public.profile_domains
for select to anon
using (status = 'verified');

create policy profile_domains_authenticated_read on public.profile_domains
for select to authenticated
using (
  status = 'verified'
  or profile_id = (select auth.uid())
);
