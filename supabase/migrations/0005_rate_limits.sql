-- PLOTSS migration 0005: durable rate limiting.
-- Run once in Supabase SQL Editor (after 0001-0004). Safe to re-run.
--
-- src/lib/rate-limit.ts's original limiter was a per-process in-memory map — fine for a single server,
-- but silently ineffective once the app runs as multiple serverless instances (each gets its own counter),
-- which defeats the point of limiting contact-unlocks, listing edits, listing submissions and AI-description
-- calls. This table makes those specific limits durable and shared across every instance. High-frequency,
-- low-stakes limits (the analytics ingestion throttle in src/app/api/track/route.ts) deliberately stay on
-- the in-memory limiter — a DB round trip per analytics ping isn't worth it, and under-throttling there
-- isn't a real exploit.

create table if not exists rate_limit_hits (
  id bigint generated always as identity primary key,
  key text not null,
  created_at timestamptz not null default now()
);
create index if not exists rate_limit_hits_key_idx on rate_limit_hits(key, created_at);

alter table rate_limit_hits enable row level security;
-- Only the server (service role, which bypasses RLS) ever touches this table — no public policies needed.
