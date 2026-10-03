-- Email sign-up now collects a mobile number as profile data (not as a login method).
-- It travels in the new user's metadata, so the profile-creation trigger must also read it from there.
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name, phone)
  values (new.id, new.raw_user_meta_data->>'full_name', coalesce(new.phone, new.raw_user_meta_data->>'phone'));
  return new;
end $$;
