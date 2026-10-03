-- PLOTSS migration 0004: multi-client (agency) support.
-- Run once in Supabase SQL Editor (after 0001, 0002, 0003). Safe to re-run.
--
-- Model: a "client" is a business account onboarded onto the shared PLOTSS marketplace (like a listing
-- agency on JustDial/MagicBricks) — this reuses `broker_profiles` rather than adding a new table, since
-- it already models a business with its own listings and public profile page. `properties.broker_id`
-- already ties a listing to its business. What was missing:
--   1. a business could only ever have one login (broker_profiles.user_id) — now any number of staff
--      logins (profiles.broker_id) can manage the same business's listings.
--   2. no way to suspend a business without deleting its data.
-- The existing global `admin` role (dm@techbliss.in, see 0002) is unchanged and remains the one
-- super-admin who can see and manage every client on the platform.

alter table broker_profiles add column if not exists status text not null default 'active' check (status in ('active','suspended'));

-- Multiple staff logins per business.
alter table profiles add column if not exists broker_id uuid references broker_profiles(id) on delete set null;
create index if not exists profiles_broker_idx on profiles(broker_id);

create or replace function is_broker_staff_for(target_broker uuid) returns boolean
language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'broker' and broker_id = target_broker
  );
$$;

-- A business's staff can manage listings tied to their own business, alongside the existing
-- owner_id-based FSBO policy (properties_owner_all) and the admin override (properties_admin_all).
drop policy if exists properties_broker_staff on properties;
create policy properties_broker_staff on properties for all
  using (broker_id is not null and is_broker_staff_for(broker_id))
  with check (broker_id is not null and is_broker_staff_for(broker_id));

drop policy if exists images_broker_staff on property_images;
create policy images_broker_staff on property_images for all using (
  exists (select 1 from properties p where p.id = property_id and p.broker_id is not null and is_broker_staff_for(p.broker_id)))
  with check (exists (select 1 from properties p where p.id = property_id and p.broker_id is not null and is_broker_staff_for(p.broker_id)));

drop policy if exists vdocs_broker_staff on verification_documents;
create policy vdocs_broker_staff on verification_documents for all using (
  exists (select 1 from properties p where p.id = property_id and p.broker_id is not null and is_broker_staff_for(p.broker_id)))
  with check (exists (select 1 from properties p where p.id = property_id and p.broker_id is not null and is_broker_staff_for(p.broker_id)));

drop policy if exists enquiries_broker_staff on enquiries;
create policy enquiries_broker_staff on enquiries for select using (
  exists (select 1 from properties p where p.id = property_id and p.broker_id is not null and is_broker_staff_for(p.broker_id)));

-- Staff can read their own business's row (branding, verified status) alongside the existing
-- broker_public_read (verified businesses are public anyway) and broker_admin (super-admin) policies.
drop policy if exists broker_staff_read on broker_profiles;
create policy broker_staff_read on broker_profiles for select using (is_broker_staff_for(id));

-- A suspended business's listings disappear from the public marketplace without deleting anything.
drop policy if exists properties_public_read on properties;
create policy properties_public_read on properties for select using (
  status = 'live'
  and (broker_id is null or exists (select 1 from broker_profiles b where b.id = broker_id and b.status = 'active'))
);
