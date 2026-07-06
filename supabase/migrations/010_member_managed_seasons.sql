-- Allow any league member (not just admins) to create, update, and delete seasons

drop policy if exists "League admins can create seasons" on public.league_seasons;
drop policy if exists "League admins can update seasons" on public.league_seasons;
drop policy if exists "League admins can delete seasons" on public.league_seasons;

create policy "League members can create seasons"
  on public.league_seasons for insert to authenticated
  with check (is_league_member(league_id));

create policy "League members can update seasons"
  on public.league_seasons for update to authenticated
  using (is_league_member(league_id));

create policy "League members can delete seasons"
  on public.league_seasons for delete to authenticated
  using (is_league_member(league_id));
