-- ── League Discovery ─────────────────────────────────────────────────────────
--
-- Allows any authenticated user to:
--   1. Read all leagues (for the Discover tab)
--   2. Read all league_members rows (for member counts on undiscovered leagues)
--   3. Insert themselves as a member (self-join)
--
-- The existing member-only SELECT policies are replaced with open ones so
-- the Discover query can see leagues the user hasn't joined yet.
-- All other policies (insert/update/delete) are unchanged.
-- ─────────────────────────────────────────────────────────────────────────────

-- Drop the old member-only SELECT policies
drop policy if exists "League members can view their leagues"       on public.leagues;
drop policy if exists "League members can view membership list"     on public.league_members;
drop policy if exists "League members can view seasons"             on public.league_seasons;

-- Allow any authenticated user to read any league (needed for Discover tab)
create policy "Authenticated users can view all leagues"
  on public.leagues for select to authenticated
  using (true);

-- Allow any authenticated user to read the members table
-- (needed for member-count aggregation in Discover tab)
create policy "Authenticated users can view all league members"
  on public.league_members for select to authenticated
  using (true);

-- Allow any authenticated user to read seasons for any league
create policy "Authenticated users can view all league seasons"
  on public.league_seasons for select to authenticated
  using (true);

-- Drop the old admin-only insert/delete policies so we can replace them
drop policy if exists "League admins can add members"                    on public.league_members;
drop policy if exists "Admins can remove members or members can leave"   on public.league_members;
drop policy if exists "League admins can update member roles"            on public.league_members;

-- Any league member can add others (not just admins)
create policy "League members can add members"
  on public.league_members for insert to authenticated
  with check (is_league_member(league_id) or user_id = auth.uid());

-- Any league member can remove others; members can always remove themselves
create policy "League members can remove members or leave"
  on public.league_members for delete to authenticated
  using (is_league_member(league_id) or user_id = auth.uid());

-- Only admins can change roles (promote/demote)
create policy "League admins can update member roles"
  on public.league_members for update to authenticated
  using (is_league_admin(league_id));
