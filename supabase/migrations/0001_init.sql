-- PLOTSS initial schema: profiles, geography, properties, verification, enquiries, site settings.

create table profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  phone text,
  role text not null default 'buyer' check (role in ('buyer','seller','broker','admin')),
  created_at timestamptz default now()
);

create table cities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  state text not null,
  slug text unique not null
);

create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null
);

create table properties (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  description text,
  ai_description text,
  listing_type text not null check (listing_type in ('sale','lease','rent')),
  category_id uuid references categories(id),
  city_id uuid references cities(id),
  address text,
  price numeric,
  area_value numeric,
  area_unit text not null check (area_unit in ('sqft','acre','sqm')),
  road_width_ft numeric,
  zone_type text,
  status text not null default 'draft' check (status in ('draft','pending','live','sold','rejected')),
  is_verified boolean not null default false,
  match_metadata jsonb,
  owner_id uuid references profiles(id),
  created_at timestamptz default now()
);
create index properties_status_idx on properties(status);
create index properties_city_idx on properties(city_id);
create index properties_category_idx on properties(category_id);

create table property_images (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references properties(id) on delete cascade,
  url text not null,
  sort_order int default 0,
  ai_tag text
);

create table verification_documents (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references properties(id) on delete cascade,
  doc_type text,
  file_url text,
  status text not null default 'pending' check (status in ('pending','verified','rejected'))
);

create table enquiries (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references properties(id),
  buyer_id uuid references profiles(id),
  message text,
  status text default 'open',
  created_at timestamptz default now()
);

create table saved_listings (
  user_id uuid references profiles(id) on delete cascade,
  property_id uuid references properties(id) on delete cascade,
  primary key (user_id, property_id)
);

-- Key/value site configuration. key = 'theme' holds the super-admin design settings.
create table site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);

-- Helpers ---------------------------------------------------------------
create function is_admin() returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

-- Create a profile row on signup (role is always 'buyer'; users cannot self-assign admin).
create function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name, phone)
  values (new.id, new.raw_user_meta_data->>'full_name', new.phone);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- RLS ---------------------------------------------------------------------
alter table profiles enable row level security;
alter table cities enable row level security;
alter table categories enable row level security;
alter table properties enable row level security;
alter table property_images enable row level security;
alter table verification_documents enable row level security;
alter table enquiries enable row level security;
alter table saved_listings enable row level security;
alter table site_settings enable row level security;

-- profiles: read/update own row; role can only be changed by an admin (see trigger below)
create policy profiles_self_read on profiles for select using (id = auth.uid() or is_admin());
create policy profiles_self_update on profiles for update using (id = auth.uid() or is_admin());

create function prevent_role_escalation() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and not is_admin() then
    -- allow the one-time buyer -> seller/broker choice right after signup, never admin
    if not (old.role = 'buyer' and new.role in ('seller','broker')) then
      raise exception 'role change not permitted';
    end if;
  end if;
  return new;
end $$;
create trigger profiles_role_guard before update on profiles
  for each row execute function prevent_role_escalation();

-- geography: public read, admin write
create policy cities_read on cities for select using (true);
create policy cities_admin on cities for all using (is_admin()) with check (is_admin());
create policy categories_read on categories for select using (true);
create policy categories_admin on categories for all using (is_admin()) with check (is_admin());

-- properties: public sees live; owner manages own; admin all
create policy properties_public_read on properties for select using (status = 'live');
create policy properties_owner_all on properties for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy properties_admin_all on properties for all using (is_admin()) with check (is_admin());

create policy images_read on property_images for select using (
  exists (select 1 from properties p where p.id = property_id and (p.status = 'live' or p.owner_id = auth.uid()))
  or is_admin());
create policy images_owner_write on property_images for all using (
  exists (select 1 from properties p where p.id = property_id and p.owner_id = auth.uid()))
  with check (exists (select 1 from properties p where p.id = property_id and p.owner_id = auth.uid()));
create policy images_admin on property_images for all using (is_admin()) with check (is_admin());

-- verification documents: owner + admin only
create policy vdocs_owner on verification_documents for all using (
  exists (select 1 from properties p where p.id = property_id and p.owner_id = auth.uid()))
  with check (exists (select 1 from properties p where p.id = property_id and p.owner_id = auth.uid()));
create policy vdocs_admin on verification_documents for all using (is_admin()) with check (is_admin());

-- enquiries: buyer creates/reads own; property owner reads on their listings; admin all
create policy enquiries_buyer_insert on enquiries for insert with check (buyer_id = auth.uid());
create policy enquiries_read on enquiries for select using (
  buyer_id = auth.uid()
  or exists (select 1 from properties p where p.id = property_id and p.owner_id = auth.uid())
  or is_admin());
create policy enquiries_admin on enquiries for all using (is_admin()) with check (is_admin());

create policy saved_own on saved_listings for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- site settings: anyone can read (theme is public), only admins write
create policy settings_read on site_settings for select using (true);
create policy settings_admin_write on site_settings for all using (is_admin()) with check (is_admin());

-- Seed reference data
insert into categories (name, slug) values
  ('Industrial','industrial'), ('Commercial','commercial'), ('Residential','residential');
