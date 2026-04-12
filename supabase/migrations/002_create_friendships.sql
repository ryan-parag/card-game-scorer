-- Create friendships table
-- Directional: requester sends the request, addressee receives it
-- Status flow: pending → accepted | declined

create table if not exists public.friendships (
  id            uuid primary key default gen_random_uuid(),
  requester_id  uuid not null references public.profiles(id) on delete cascade,
  addressee_id  uuid not null references public.profiles(id) on delete cascade,
  status        text not null default 'pending'
                  check (status in ('pending', 'accepted', 'declined')),
  created_at    timestamptz default now(),

  -- Prevent duplicate requests in the same direction
  unique (requester_id, addressee_id),
  -- Prevent self-friending
  check (requester_id != addressee_id)
);

-- Enable Row Level Security
alter table public.friendships enable row level security;

-- Users can read any friendship they are part of
create policy "Users can view their own friendships"
  on public.friendships
  for select
  to authenticated
  using (
    auth.uid() = requester_id or
    auth.uid() = addressee_id
  );

-- Users can send a friend request (insert) only as the requester
create policy "Users can send friend requests"
  on public.friendships
  for insert
  to authenticated
  with check (auth.uid() = requester_id);

-- Only the addressee can accept or decline a request
create policy "Addressee can update request status"
  on public.friendships
  for update
  to authenticated
  using (auth.uid() = addressee_id)
  with check (status in ('accepted', 'declined'));

-- Either party can delete (cancel sent request or remove a friend)
create policy "Users can delete their own friendships"
  on public.friendships
  for delete
  to authenticated
  using (
    auth.uid() = requester_id or
    auth.uid() = addressee_id
  );

-- Index for fast lookups from either direction
create index if not exists friendships_requester_idx on public.friendships(requester_id);
create index if not exists friendships_addressee_idx on public.friendships(addressee_id);
