-- Restrict editing/deleting completed (and in-progress) games:
--   * League games: only members of that league can update/delete.
--   * Non-league games: any authenticated user can update/delete.
--
-- Replaces the previously fully-permissive "Allow public update/delete access"
-- policies on public.games (which allowed any authenticated user to modify
-- any game, including games belonging to leagues they weren't a member of).

alter table public.games enable row level security;

drop policy if exists "Allow public update access" on public.games;
drop policy if exists "Allow public delete access" on public.games;

create policy "League members can update league games; anyone can update non-league games"
  on public.games for update to authenticated
  using (league_id is null or is_league_member(league_id))
  with check (league_id is null or is_league_member(league_id));

create policy "League members can delete league games; anyone can delete non-league games"
  on public.games for delete to authenticated
  using (league_id is null or is_league_member(league_id));
