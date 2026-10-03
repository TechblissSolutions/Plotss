-- PLOTSS migration 0002: rich listings, private contacts, brokers, CMS, SEO, blog, redirects, unlock log.
-- Run once in Supabase SQL Editor (after 0001). Safe to re-run.

-- 1. Role guard fix -------------------------------------------------------------------------
-- 0001 blocked *every* role change made without a signed-in admin, including trusted server/SQL contexts
-- (auth.uid() is null there), so the first admin could never be created. Trusted contexts are now allowed.
create or replace function prevent_role_escalation() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and auth.uid() is not null and not is_admin() then
    -- a signed-in user may make the one-time buyer -> seller/broker choice, never admin
    if not (old.role = 'buyer' and new.role in ('seller','broker')) then
      raise exception 'role change not permitted';
    end if;
  end if;
  return new;
end $$;

-- 2. Reference data --------------------------------------------------------------------------
insert into categories (name, slug) values ('Warehousing', 'warehousing') on conflict (slug) do nothing;
insert into cities (name, state, slug) values ('Delhi-NCR', 'Delhi / UP / Haryana', 'delhi-ncr') on conflict (slug) do nothing;

-- 3. Brokers ----------------------------------------------------------------------------------
create table if not exists broker_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete set null,
  name text not null,
  firm_name text,
  rera_number text,
  years_active int default 0,
  photo_url text,
  bio text,
  cities text[] default '{}',
  specializations text[] default '{}',
  verified boolean not null default false,          -- set by an admin after checking RERA / agency proof
  created_at timestamptz default now()
);
-- Private broker contact details: never readable through the public API.
create table if not exists broker_contacts (
  broker_id uuid primary key references broker_profiles(id) on delete cascade,
  phone text, email text
);

-- 4. Listings v2 -------------------------------------------------------------------------------
alter table properties
  add column if not exists tagline text,
  add column if not exists micro_market text,
  add column if not exists lat numeric,
  add column if not exists lng numeric,
  add column if not exists hero_image text,
  add column if not exists gallery text[] default '{}',
  add column if not exists broker_id uuid references broker_profiles(id) on delete set null,
  add column if not exists views int not null default 0,
  add column if not exists details jsonb not null default '{}';   -- connectivity, price history, match reasons, etc.

alter table properties drop constraint if exists properties_price_check;
alter table properties add constraint properties_price_check check (price is null or price >= 0);
alter table properties drop constraint if exists properties_area_check;
alter table properties add constraint properties_area_check check (area_value is null or area_value > 0);

-- Private owner contact per listing. Only the server (service role) reads it, after login + rate limit.
create table if not exists listing_contacts (
  property_id uuid primary key references properties(id) on delete cascade,
  name text not null,
  phone text not null,
  owner_type text default 'Direct Owner'
);

alter table verification_documents
  add column if not exists category text,
  add column if not exists doc_ref text,
  add column if not exists verified_on date,
  add column if not exists description text;
alter table verification_documents drop constraint if exists verification_documents_status_check;
alter table verification_documents add constraint verification_documents_status_check
  check (status in ('pending','verified','rejected','action_required'));

alter table enquiries
  add column if not exists kind text not null default 'enquiry' check (kind in ('enquiry','unlock')),
  add column if not exists visit_date date;
create index if not exists enquiries_unlock_rate_idx on enquiries (buyer_id, kind, created_at);

-- Atomic view counter (called from the server, not writable by clients directly).
create or replace function increment_views(p_id uuid) returns void
language sql security definer set search_path = public as $$
  update properties set views = views + 1 where id = p_id and status = 'live';
$$;
revoke all on function increment_views(uuid) from public, anon, authenticated;

-- 5. CMS / SEO / blog / redirects --------------------------------------------------------------
-- site_settings (from 0001) also stores: 'content' (editable UI copy) and 'seo_global'.
create table if not exists seo_pages (
  path text primary key,               -- '/', '/search', '/city/pune', '/category/industrial', '/property/<slug>', or 'tpl:property'...
  title text,
  description text,
  h1 text,
  intro text,                          -- visible SEO copy on city/category pages
  og_image text,
  canonical text,
  noindex boolean not null default false,
  faq jsonb not null default '[]',     -- [{q, a}] -> FAQPage schema
  updated_at timestamptz default now()
);

create table if not exists blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  excerpt text,
  body text not null default '',
  cover_image text,
  tags text[] default '{}',
  author text default 'PLOTSS Editorial',
  status text not null default 'draft' check (status in ('draft','published')),
  published_at timestamptz,
  seo_title text,
  seo_description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists redirects (
  from_path text primary key check (from_path like '/%'),
  to_path text not null,
  status_code int not null default 301 check (status_code in (301, 302)),
  created_at timestamptz default now()
);

-- 6. Row level security --------------------------------------------------------------------------
alter table broker_profiles enable row level security;
alter table broker_contacts enable row level security;
alter table listing_contacts enable row level security;
alter table seo_pages enable row level security;
alter table blog_posts enable row level security;
alter table redirects enable row level security;

drop policy if exists broker_public_read on broker_profiles;
create policy broker_public_read on broker_profiles for select using (verified or user_id = auth.uid() or is_admin());
drop policy if exists broker_owner_write on broker_profiles;
create policy broker_owner_write on broker_profiles for update using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists broker_admin on broker_profiles;
create policy broker_admin on broker_profiles for all using (is_admin()) with check (is_admin());

-- contact tables: admin only via API; the server uses the service role (bypasses RLS)
drop policy if exists broker_contacts_admin on broker_contacts;
create policy broker_contacts_admin on broker_contacts for all using (is_admin()) with check (is_admin());
drop policy if exists listing_contacts_admin on listing_contacts;
create policy listing_contacts_admin on listing_contacts for all using (is_admin()) with check (is_admin());

drop policy if exists seo_read on seo_pages;
create policy seo_read on seo_pages for select using (true);
drop policy if exists seo_admin on seo_pages;
create policy seo_admin on seo_pages for all using (is_admin()) with check (is_admin());

drop policy if exists blog_read on blog_posts;
create policy blog_read on blog_posts for select using (status = 'published' or is_admin());
drop policy if exists blog_admin on blog_posts;
create policy blog_admin on blog_posts for all using (is_admin()) with check (is_admin());

drop policy if exists redirects_read on redirects;
create policy redirects_read on redirects for select using (true);
drop policy if exists redirects_admin on redirects;
create policy redirects_admin on redirects for all using (is_admin()) with check (is_admin());

-- 6b. Close the self-approval hole ---------------------------------------------------------------------
-- 0001 let an owner update ANY column of their own listing, so a seller could publish and mark it verified
-- straight from the API. Moderation fields can now only be changed by an admin (or the trusted server).
create or replace function guard_property_moderation() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or is_admin() then return new; end if;
  if tg_op = 'INSERT' then
    new.is_verified := false;
    new.views := 0;
    if new.status not in ('draft', 'pending') then new.status := 'pending'; end if;
  else
    new.is_verified := old.is_verified;
    new.views := old.views;
    new.broker_id := old.broker_id;
    if new.status is distinct from old.status and new.status not in ('draft', 'pending', 'sold') then
      raise exception 'only an admin can set status %', new.status;
    end if;
  end if;
  return new;
end $$;
drop trigger if exists properties_moderation_guard on properties;
create trigger properties_moderation_guard before insert or update on properties
  for each row execute function guard_property_moderation();

create or replace function guard_document_status() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or is_admin() then return new; end if;
  if tg_op = 'INSERT' then
    new.status := 'pending'; new.verified_on := null; new.doc_ref := null;
  else
    new.status := old.status; new.verified_on := old.verified_on; new.doc_ref := old.doc_ref;
  end if;
  return new;
end $$;
drop trigger if exists verification_documents_guard on verification_documents;
create trigger verification_documents_guard before insert or update on verification_documents
  for each row execute function guard_document_status();

create or replace function guard_broker_verified() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or is_admin() then return new; end if;
  if tg_op = 'INSERT' then new.verified := false; else new.verified := old.verified; new.user_id := old.user_id; end if;
  return new;
end $$;
drop trigger if exists broker_verified_guard on broker_profiles;
create trigger broker_verified_guard before insert or update on broker_profiles
  for each row execute function guard_broker_verified();

-- 6c. File storage --------------------------------------------------------------------------------------
-- listing-photos: public read (shown on the site). listing-docs: private (owner + admins only).
-- Users can only write inside a folder named after their own user id.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('listing-photos', 'listing-photos', true, 5242880, array['image/jpeg','image/png','image/webp']),
  ('listing-docs', 'listing-docs', false, 10485760, array['application/pdf','image/jpeg','image/png'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "photos public read" on storage.objects;
create policy "photos public read" on storage.objects for select using (bucket_id = 'listing-photos');
drop policy if exists "photos owner insert" on storage.objects;
create policy "photos owner insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'listing-photos' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "docs owner insert" on storage.objects;
create policy "docs owner insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'listing-docs' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "docs owner or admin read" on storage.objects;
create policy "docs owner or admin read" on storage.objects for select to authenticated
  using (bucket_id = 'listing-docs' and ((storage.foldername(name))[1] = auth.uid()::text or is_admin()));

-- 7. Make the first admin ---------------------------------------------------------------------------
update profiles set role = 'admin'
where id = (select id from auth.users where email = 'dm@techbliss.in');
