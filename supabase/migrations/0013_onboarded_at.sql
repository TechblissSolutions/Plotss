-- Add onboarded_at to profiles to track onboarding completion
alter table profiles add column if not exists onboarded_at timestamptz default null;
