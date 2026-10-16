-- League games are visible only to members of that league. Casual
-- (non-league) games stay public, as before.
--
-- Replaces the fully-permissive "Allow public read access" policies on
-- public.games and public.game_history, which let anyone (including signed-out
-- visitors) read every league game and its full score history.
--
-- Realtime respects these policies, so live updates for a league game only
-- reach that league's members. The share-card endpoints (api/share-game.js,
-- api/og-game.jsx) read with the service role key so link previews still
-- render for league games.
--
-- Before applying, check for any other permissive SELECT policy on these
-- tables — policies are OR'd, so one left behind would keep everything public:
--   select tablename, policyname, cmd, roles
--   from pg_policies where tablename in ('games', 'game_history');

-- Policies run as the caller, so signed-out visitors need to be able to call
-- the helper (it returns false for them, since auth.uid() is null).
grant execute on function public.is_league_member(uuid) to anon, authenticated;

-- ── games ─────────────────────────────────────────────────────────────────────

drop policy if exists "Allow public read access" on public.games;

create policy "Anyone can view non-league games; members can view their league's games"
  on public.games for select to anon, authenticated
  using (league_id is null or is_league_member(league_id));

-- ── game_history ──────────────────────────────────────────────────────────────
-- History rows hold full snapshots of a game, so they follow the game's
-- visibility. The subquery on games is itself filtered by the policy above.

alter table public.game_history enable row level security;

drop policy if exists "Allow public read access" on public.game_history;
drop policy if exists "Allow public insert access" on public.game_history;
drop policy if exists "Allow public delete access" on public.game_history;

create policy "History is visible to anyone who can view the game"
  on public.game_history for select to anon, authenticated
  using (exists (select 1 from public.games g where g.id = game_id));

create policy "People who can edit a game can record its history"
  on public.game_history for insert to authenticated
  with check (exists (
    select 1 from public.games g
    where g.id = game_id and (g.league_id is null or is_league_member(g.league_id))
  ));

create policy "People who can edit a game can clear its history"
  on public.game_history for delete to authenticated
  using (exists (
    select 1 from public.games g
    where g.id = game_id and (g.league_id is null or is_league_member(g.league_id))
  ));
