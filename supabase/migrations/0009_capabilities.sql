-- Migration 0009: account_capabilities and buyer_requirements tables
-- Date: 2026-10-07
-- Adds per-user capability flags (can_buy, can_sell, is_broker_staff) separate from profiles.role,
-- adds a buyer_requirements preference store, drops the legacy role-escalation trigger (superseded
-- by the capabilities model), and extends handle_new_user() to seed a capabilities row on signup.

-- ============================================================
-- A. account_capabilities
-- ============================================================

create table if not exists account_capabilities (
  id                          uuid        primary key default gen_random_uuid(),
  user_id                     uuid        not null references profiles(id) on delete cascade unique,
  can_buy                     boolean     not null default true,
  can_sell                    boolean     not null default false,
  is_broker_staff             boolean     not null default false,
  broker_id                   uuid        references broker_profiles(id) on delete set null,
  can_buy_activated_at        timestamptz default now(),
  can_sell_activated_at       timestamptz default null,
  is_broker_staff_activated_at timestamptz default null,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now(),

  constraint broker_staff_needs_broker_id
    check (not is_broker_staff or broker_id is not null),
  constraint broker_staff_must_can_buy
    check (is_broker_staff = false or can_buy = true)
);

create index if not exists account_capabilities_user_id_idx on account_capabilities(user_id);

alter table account_capabilities enable row level security;

drop policy if exists capabilities_self_read on account_capabilities;
create policy capabilities_self_read on account_capabilities
  for select using (user_id = auth.uid() or is_admin());

-- All writes are via service role or triggers only (no INSERT/UPDATE/DELETE for authenticated role).

-- updated_at trigger
create or replace function set_account_capabilities_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists account_capabilities_updated_at on account_capabilities;
create trigger account_capabilities_updated_at
  before update on account_capabilities
  for each row execute function set_account_capabilities_updated_at();

-- ============================================================
-- B. buyer_requirements
-- ============================================================

create table if not exists buyer_requirements (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        not null references profiles(id) on delete cascade unique,
  city            text,
  category        text,
  min_area_sqft   numeric     check (min_area_sqft >= 0),
  max_area_sqft   numeric     check (max_area_sqft >= 0),
  max_budget_cr   numeric     check (max_budget_cr >= 0),
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint area_range_valid
    check (min_area_sqft is null or max_area_sqft is null or min_area_sqft <= max_area_sqft)
);

create index if not exists buyer_requirements_user_id_idx on buyer_requirements(user_id);

alter table buyer_requirements enable row level security;

drop policy if exists buyer_req_self_read   on buyer_requirements;
drop policy if exists buyer_req_self_insert on buyer_requirements;
drop policy if exists buyer_req_self_update on buyer_requirements;
drop policy if exists buyer_req_delete      on buyer_requirements;

create policy buyer_req_self_read   on buyer_requirements for select using (user_id = auth.uid() or is_admin());
create policy buyer_req_self_insert on buyer_requirements for insert with check (user_id = auth.uid());
create policy buyer_req_self_update on buyer_requirements for update using (user_id = auth.uid());
create policy buyer_req_delete      on buyer_requirements for delete using (user_id = auth.uid() or is_admin());

-- updated_at trigger
create or replace function set_buyer_requirements_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists buyer_requirements_updated_at on buyer_requirements;
create trigger buyer_requirements_updated_at
  before update on buyer_requirements
  for each row execute function set_buyer_requirements_updated_at();

-- ============================================================
-- C. Drop role escalation trigger (superseded by capabilities model)
-- ============================================================
-- Trigger name: profiles_role_guard (defined in 0001, function updated in 0002)
-- Function name: prevent_role_escalation

drop trigger if exists profiles_role_guard on profiles;
drop function if exists prevent_role_escalation();

-- ============================================================
-- D. Update handle_new_user trigger to seed account_capabilities
-- ============================================================
-- Current body (from 0007_welcome_notification.sql): inserts profiles row + welcome notification.
-- This version ALSO inserts an account_capabilities row with can_buy=true defaults.
-- ON CONFLICT DO NOTHING makes it idempotent (safe to replay).

create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- existing: create profile row
  insert into profiles (id, full_name, phone)
  values (new.id, new.raw_user_meta_data->>'full_name', new.phone);

  -- existing: welcome notification
  insert into notifications (user_id, title, body, link)
  values (
    new.id,
    'Welcome to PLOTSS',
    'Browse verified land listings, save your favourites, and we will match you with new plots as they come in.',
    '/search'
  );

  -- new: seed capabilities row (buyer by default)
  insert into account_capabilities (user_id, can_buy, can_buy_activated_at, can_sell, is_broker_staff, broker_id)
  values (new.id, true, now(), false, false, null)
  on conflict (user_id) do nothing;

  return new;
end $$;
