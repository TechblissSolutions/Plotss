-- PLOTSS migration 0003: launch cities (Ghaziabad, Noida, New Delhi) + first-party journey analytics.
-- Run after 0002. Safe to re-run.

-- 1. Cities: an "active" switch so the site only offers cities we actually serve ------------------
alter table cities add column if not exists active boolean not null default true;
alter table cities add column if not exists sort_order int not null default 100;

insert into cities (name, state, slug, active, sort_order) values
  ('Ghaziabad', 'Uttar Pradesh', 'ghaziabad', true, 1),
  ('Noida',     'Uttar Pradesh', 'noida',     true, 2),
  ('New Delhi', 'Delhi',         'new-delhi', true, 3)
on conflict (slug) do update set active = true, sort_order = excluded.sort_order, name = excluded.name, state = excluded.state;

-- every other city stays in the table but is hidden until the admin switches it on
update cities set active = false where slug not in ('ghaziabad', 'noida', 'new-delhi');

-- 2. Journey events ----------------------------------------------------------------------------------
-- One row per thing a visitor did (page view, click, form step, search...). Written only by the server.
create table if not exists events (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  vid text not null,                       -- anonymous visitor id (first-party cookie, random)
  sid text not null,                       -- session id (resets after 30 min of inactivity)
  user_id uuid,                            -- filled by the server when the visitor is signed in
  type text not null,                      -- page_view | click | scroll | page_leave | form_step | form_field | search | ...
  path text,                               -- e.g. /property/some-slug
  label text,                              -- CTA label, form step name, search text (short)
  props jsonb not null default '{}',       -- small extra details (never personal data)
  referrer text,
  utm_source text, utm_medium text, utm_campaign text,
  device text,                             -- mobile | tablet | desktop
  country text, city text
);
create index if not exists events_at_idx on events (at desc);
create index if not exists events_type_at_idx on events (type, at desc);
create index if not exists events_sid_idx on events (sid, at);
create index if not exists events_path_idx on events (path);

alter table events enable row level security;
-- No policies on purpose: nobody can read or write through the public API. Only the server (service role) and admins.
drop policy if exists events_admin_read on events;
create policy events_admin_read on events for select using (is_admin());

-- 3. Retention: drop raw events older than 13 months (call from a monthly schedule, or by hand)
create or replace function purge_old_events() returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  delete from events where at < now() - interval '13 months';
  get diagnostics n = row_count;
  return n;
end $$;
revoke all on function purge_old_events() from public, anon, authenticated;

-- 4. Settings defaults live in site_settings key 'features' (created from Admin > Settings); nothing to seed.
