-- ── Member-managed membership ────────────────────────────────────────────────
-- Replaces admin-only add/remove policies with member-level permissions.
-- Run this if you applied 006_league_discovery.sql before these changes were
-- added to it.
-- ─────────────────────────────────────────────────────────────────────────────

-- Drop old policies (safe to run even if already dropped)
drop policy if exists "League admins can add members"                  on public.league_members;
drop policy if exists "Admins can remove members or members can leave" on public.league_members;
drop policy if exists "League admins can update member roles"          on public.league_members;
drop policy if exists "Users can join leagues"                         on public.league_members;
drop policy if exists "League members can add members"                 on public.league_members;
drop policy if exists "League members can remove members or leave"     on public.league_members;

-- Any league member can add others; anyone can add themselves (self-join)
create policy "League members can add members"
  on public.league_members for insert to authenticated
  with check (is_league_member(league_id) or user_id = auth.uid());

-- Any league member can remove others; anyone can remove themselves (leave)
create policy "League members can remove members or leave"
  on public.league_members for delete to authenticated
  using (is_league_member(league_id) or user_id = auth.uid());

-- Only admins can promote/demote roles
create policy "League admins can update member roles"
  on public.league_members for update to authenticated
  using (is_league_admin(league_id));
