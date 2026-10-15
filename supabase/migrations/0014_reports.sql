-- 0014_reports.sql
-- Reports & Complaints workflow.
-- Apply in Supabase SQL Editor after 0013. Do NOT modify earlier migrations.
-- Rollback: see section at the end.

-- ============================================================
-- A. Reference-number sequence
-- ============================================================
create sequence if not exists reports_ref_seq start 1000 increment 1;

-- ============================================================
-- B. Core reports table
-- ============================================================
create table if not exists reports (
  id               uuid        primary key default gen_random_uuid(),
  ref              text        unique,          -- populated by trigger: RPT-001000
  status           text        not null default 'open'
                               check (status in ('open','investigating','awaiting_information','escalated','resolved','dismissed')),
  category         text        not null
                               check (category in ('spam','fraud','misleading','duplicate','inappropriate','other')),
  severity         text        not null default 'medium'
                               check (severity in ('low','medium','high','critical')),

  -- Reporter: null = anonymous (email stored instead); authenticated = profiles FK
  reporter_id      uuid        references profiles(id) on delete set null,
  reporter_email   text,                        -- for anonymous reporters; never shown to public

  -- Targets: at least one must be non-null
  property_id      uuid        references properties(id) on delete set null,
  reported_user_id uuid        references profiles(id) on delete set null,

  -- Content
  description      text        not null check (char_length(description) >= 20 and char_length(description) <= 5000),

  -- Assignment and resolution
  assigned_to      uuid        references profiles(id) on delete set null,
  resolved_by      uuid        references profiles(id) on delete set null,
  resolved_at      timestamptz,
  resolution       text,                        -- user-visible resolution note

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  constraint reports_must_have_target
    check (property_id is not null or reported_user_id is not null),
  constraint reports_anon_xor_authenticated
    check (reporter_id is null or reporter_email is null),
  constraint reports_resolution_when_closed
    check (status not in ('resolved','dismissed') or resolution is not null)
);

create index if not exists reports_status_idx   on reports(status);
create index if not exists reports_property_idx on reports(property_id);
create index if not exists reports_reporter_idx on reports(reporter_id);
create index if not exists reports_created_idx  on reports(created_at desc);
create index if not exists reports_severity_idx on reports(severity);

-- ============================================================
-- C. Auto-generate human-readable ref via trigger
-- ============================================================
create or replace function set_report_ref() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.ref = 'RPT-' || lpad(nextval('reports_ref_seq')::text, 6, '0');
  return new;
end $$;

drop trigger if exists reports_ref_trigger on reports;
create trigger reports_ref_trigger
  before insert on reports
  for each row
  when (new.ref is null)
  execute function set_report_ref();

-- updated_at
create or replace function set_reports_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists reports_updated_at on reports;
create trigger reports_updated_at
  before update on reports
  for each row execute function set_reports_updated_at();

-- ============================================================
-- D. Internal investigation notes + status history
-- ============================================================
create table if not exists report_notes (
  id               uuid        primary key default gen_random_uuid(),
  report_id        uuid        not null references reports(id) on delete cascade,
  admin_id         uuid        references profiles(id) on delete set null,
  note             text        not null check (char_length(note) >= 1 and char_length(note) <= 2000),
  is_status_change boolean     not null default false,
  from_status      text,
  to_status        text,
  created_at       timestamptz not null default now()
);

create index if not exists report_notes_report_idx on report_notes(report_id, created_at);

-- ============================================================
-- E. Evidence metadata (files stored in complaint-evidence bucket)
-- ============================================================
create table if not exists report_evidence (
  id           uuid      primary key default gen_random_uuid(),
  report_id    uuid      not null references reports(id) on delete cascade,
  file_path    text      not null,        -- storage path: {report_id}/{id}
  file_name    text      not null check (char_length(file_name) >= 1 and char_length(file_name) <= 255),
  file_type    text      not null,        -- server-validated MIME type
  file_size    int       not null check (file_size > 0 and file_size <= 5242880),  -- max 5 MB
  uploaded_by  uuid      references profiles(id) on delete set null,
  created_at   timestamptz not null default now()
);

create index if not exists report_evidence_report_idx on report_evidence(report_id);

-- ============================================================
-- F. Storage bucket for evidence (private)
-- NOTE: Run this manually if Supabase does not support bucket creation via SQL in your project:
--       Dashboard → Storage → New bucket → Name: complaint-evidence, Private: on
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'complaint-evidence',
  'complaint-evidence',
  false,
  5242880,
  ARRAY['image/jpeg','image/png','image/webp','application/pdf']
)
on conflict (id) do nothing;

-- ============================================================
-- G. RLS policies
-- ============================================================
alter table reports        enable row level security;
alter table report_notes   enable row level security;
alter table report_evidence enable row level security;

-- reports: reporter can read their own; admin all
create policy reports_reporter_read on reports
  for select using (reporter_id = auth.uid() or is_admin());

-- anonymous reports (no reporter_id) can only be read by admin
-- (the above policy correctly excludes them for non-admins)

-- public insert (rate limiting enforced in application layer)
create policy reports_public_insert on reports
  for insert with check (true);

-- admins can update (status transitions, assignment, resolution)
create policy reports_admin_update on reports
  for update using (is_admin()) with check (is_admin());

-- report_notes: admin-only (internal investigation notes must not be visible to reporters)
create policy report_notes_admin on report_notes
  for all using (is_admin()) with check (is_admin());

-- report_evidence: reporters can see their own submission's evidence; admins all
create policy report_evidence_reporter on report_evidence
  for select using (
    is_admin() or
    exists (select 1 from reports r where r.id = report_id and r.reporter_id = auth.uid())
  );
-- Only admins and the original uploader can insert evidence
create policy report_evidence_insert on report_evidence
  for insert with check (
    is_admin() or uploaded_by = auth.uid()
  );

-- storage: complaint-evidence — admin only reads; uploads via service role
create policy "Admin evidence access"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'complaint-evidence' and is_admin());

-- ============================================================
-- H. Validation query (run after applying to verify)
-- ============================================================
-- select count(*) from reports;         -- should be 0 (fresh table)
-- select ref from reports limit 1;      -- verify ref format after first insert

-- ============================================================
-- ROLLBACK (run in reverse order if needed):
-- ============================================================
-- drop policy if exists "Admin evidence access" on storage.objects;
-- delete from storage.buckets where id = 'complaint-evidence';
-- drop table if exists report_evidence;
-- drop table if exists report_notes;
-- drop table if exists reports;
-- drop function if exists set_reports_updated_at();
-- drop function if exists set_report_ref();
-- drop sequence if exists reports_ref_seq;
