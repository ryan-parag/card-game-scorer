-- Add display_name to profiles so public pages show a name rather than email
alter table public.profiles
  add column if not exists display_name text;

-- Backfill display_name from email prefix for existing users
update public.profiles
set display_name = split_part(email, '@', 1)
where display_name is null;

-- Update the new-user trigger to also populate display_name
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, avatar_url, display_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'avatar_url',
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Drop the existing authenticated-only read policy and replace with public read
drop policy if exists "Profiles are viewable by authenticated users" on public.profiles;

create policy "Profiles are publicly viewable"
  on public.profiles
  for select
  to anon, authenticated
  using (true);
