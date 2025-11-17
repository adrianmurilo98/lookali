-- Remove manual profile creation and use a trigger instead
-- This trigger automatically creates a profile when a new user signs up

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Insert into profiles table
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', null)
  )
  on conflict (id) do nothing;

  -- Insert into user_profiles table if user wants to be a partner
  if (new.raw_user_meta_data ->> 'wants_partner')::boolean = true then
    insert into public.user_profiles (user_id, full_name, pending_partner_registration)
    values (
      new.id,
      coalesce(new.raw_user_meta_data ->> 'full_name', null),
      true
    )
    on conflict (user_id) do nothing;
  else
    -- Create user_profiles for regular users too
    insert into public.user_profiles (user_id, full_name, pending_partner_registration)
    values (
      new.id,
      coalesce(new.raw_user_meta_data ->> 'full_name', null),
      false
    )
    on conflict (user_id) do nothing;
  end if;

  return new;
end;
$$;

-- Drop existing trigger if it exists
drop trigger if exists on_auth_user_created on auth.users;

-- Create trigger that fires when a new user is created
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
