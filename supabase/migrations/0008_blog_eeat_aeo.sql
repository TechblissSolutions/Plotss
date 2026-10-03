-- PLOTSS migration 0008: blog EEAT/AEO fields.
-- Run once in Supabase SQL Editor (after 0001-0007). Safe to re-run.
--
-- Adds what a blog post needs to do well in both classic SEO and answer/generative-engine optimization
-- (AEO/GEO), and in Google's E-E-A-T sense (a named author with real credentials, not just "PLOTSS
-- Editorial"): a short "key takeaways" list answer engines can lift directly, an FAQ block (same
-- q/a jsonb shape seo_pages already uses, so it can reuse the same FAQPage schema helper), and an
-- author role + bio for a visible trust signal on the article page.

alter table blog_posts
  add column if not exists key_takeaways text[] not null default '{}',
  add column if not exists faq jsonb not null default '[]',
  add column if not exists author_role text,
  add column if not exists author_bio text;
