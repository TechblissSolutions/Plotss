-- PLOTSS migration 0007: welcome notification on signup.
-- Run once in Supabase SQL Editor (after 0001-0006). Safe to re-run.
--
-- Every signup path (email+password, Google, admin.createUser, admin.inviteUserByEmail for a new teammate)
-- creates exactly one auth.users row, which this trigger already turns into a profiles row — so extending
-- it is the single place that reliably covers every path, instead of calling notify() from each one
-- separately (and risking missing one, e.g. Google's redirect-based flow has no server action to hook into).

create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name, phone)
  values (new.id, new.raw_user_meta_data->>'full_name', new.phone);
  insert into notifications (user_id, title, body, link)
  values (new.id, 'Welcome to PLOTSS', 'Browse verified land listings, save your favourites, and we will match you with new plots as they come in.', '/search');
  return new;
end $$;
