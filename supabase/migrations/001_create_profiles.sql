-- Create profiles table as a public mirror of auth.users
-- Required because auth.users is not directly accessible from the client

create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  avatar_url  text,
  created_at  timestamptz default now()
);

-- Enable Row Level Security
alter table public.profiles enable row level security;

-- Anyone authenticated can read profiles (needed for friend search)
create policy "Profiles are viewable by authenticated users"
  on public.profiles
  for select
  to authenticated
  using (true);

-- Users can only update their own profile
create policy "Users can update their own profile"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id);

-- Trigger function: auto-create a profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Attach the trigger to auth.users
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Backfill profiles for any users that already exist
insert into public.profiles (id, email, avatar_url)
select
  id,
  email,
  raw_user_meta_data->>'avatar_url'
from auth.users
on conflict (id) do nothing;
