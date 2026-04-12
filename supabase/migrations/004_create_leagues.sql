-- ── Tables ────────────────────────────────────────────────────────────────────

create table public.leagues (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);

create table public.league_members (
  id        uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.leagues(id) on delete cascade,
  user_id   uuid not null references public.profiles(id) on delete cascade,
  role      text not null default 'member' check (role in ('admin', 'member')),
  joined_at timestamptz not null default now(),
  unique (league_id, user_id)
);

create table public.league_seasons (
  id         uuid primary key default gen_random_uuid(),
  league_id  uuid not null references public.leagues(id) on delete cascade,
  name       text not null,
  start_date date not null,
  end_date   date not null,
  status     text not null default 'upcoming' check (status in ('upcoming', 'active', 'completed')),
  created_at timestamptz not null default now(),
  check (end_date > start_date)
);

-- Tag games to a league season (optional — games can still exist outside leagues)
alter table public.games
  add column if not exists league_id uuid references public.leagues(id) on delete set null,
  add column if not exists season_id uuid references public.league_seasons(id) on delete set null;

-- ── Enable RLS ────────────────────────────────────────────────────────────────

alter table public.leagues enable row level security;
alter table public.league_members enable row level security;
alter table public.league_seasons enable row level security;

-- ── Helper functions (security definer avoids RLS recursion) ──────────────────

create or replace function public.is_league_member(p_league_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from league_members
    where league_id = p_league_id and user_id = auth.uid()
  );
$$;

create or replace function public.is_league_admin(p_league_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from league_members
    where league_id = p_league_id and user_id = auth.uid() and role = 'admin'
  );
$$;

-- ── Trigger: auto-add creator as admin on league creation ─────────────────────
-- Runs as security definer so it can insert into league_members before
-- the creator is technically a member (bootstrapping problem).

create or replace function public.handle_new_league()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into league_members (league_id, user_id, role)
  values (new.id, new.created_by, 'admin');
  return new;
end;
$$;

create trigger on_league_created
  after insert on public.leagues
  for each row execute function public.handle_new_league();

-- ── RLS policies: leagues ─────────────────────────────────────────────────────

create policy "League members can view their leagues"
  on public.leagues for select to authenticated
  using (is_league_member(id));

create policy "Authenticated users can create leagues"
  on public.leagues for insert to authenticated
  with check (created_by = auth.uid());

create policy "League admins can update their league"
  on public.leagues for update to authenticated
  using (is_league_admin(id));

create policy "League admins can delete their league"
  on public.leagues for delete to authenticated
  using (is_league_admin(id));

-- ── RLS policies: league_members ─────────────────────────────────────────────

create policy "League members can view membership list"
  on public.league_members for select to authenticated
  using (is_league_member(league_id));

-- Admins add members; the creator's own row is inserted by the trigger above
create policy "League admins can add members"
  on public.league_members for insert to authenticated
  with check (is_league_admin(league_id));

create policy "League admins can update member roles"
  on public.league_members for update to authenticated
  using (is_league_admin(league_id));

-- Admins can remove anyone; members can remove themselves (leave)
create policy "Admins can remove members or members can leave"
  on public.league_members for delete to authenticated
  using (is_league_admin(league_id) or user_id = auth.uid());

-- ── RLS policies: league_seasons ─────────────────────────────────────────────

create policy "League members can view seasons"
  on public.league_seasons for select to authenticated
  using (is_league_member(league_id));

create policy "League admins can create seasons"
  on public.league_seasons for insert to authenticated
  with check (is_league_admin(league_id));

create policy "League admins can update seasons"
  on public.league_seasons for update to authenticated
  using (is_league_admin(league_id));

create policy "League admins can delete seasons"
  on public.league_seasons for delete to authenticated
  using (is_league_admin(league_id));
