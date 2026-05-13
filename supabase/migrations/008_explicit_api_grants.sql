-- Explicit Data API grants required as of Supabase's April 2026 change.
-- Tables no longer inherit implicit grants to anon/authenticated roles.
-- RLS policies still control which rows each role can actually see/modify.

-- ── profiles ──────────────────────────────────────────────────────────────────
-- anon: SELECT for public profile pages (/u/:userId, unauthed visitors)
-- authenticated: SELECT (friend search) + UPDATE (own profile)
-- INSERT is handled by the security-definer handle_new_user() trigger only.
grant select on public.profiles to anon;
grant select, update on public.profiles to authenticated;

-- ── friendships ───────────────────────────────────────────────────────────────
-- anon: SELECT so PublicProfilePage friend-count query returns 0 rows (not an error).
--   RLS "to authenticated" policy still prevents anon from seeing any rows.
-- authenticated: full CRUD (send/accept/decline/delete friend requests)
grant select on public.friendships to anon;
grant select, insert, update, delete on public.friendships to authenticated;

-- ── games ─────────────────────────────────────────────────────────────────────
-- anon: SELECT for public profile stats page
-- authenticated: full CRUD (create, update, delete games)
grant select on public.games to anon;
grant select, insert, update, delete on public.games to authenticated;

-- ── leagues ───────────────────────────────────────────────────────────────────
-- authenticated only (league discovery, creation, management)
grant select, insert, update, delete on public.leagues to authenticated;

-- ── league_members ────────────────────────────────────────────────────────────
-- authenticated only (join, leave, manage members)
grant select, insert, update, delete on public.league_members to authenticated;

-- ── league_seasons ────────────────────────────────────────────────────────────
-- anon: SELECT for public profile stats (season context shown on /u/:userId)
-- authenticated: full CRUD (create, update, delete seasons)
grant select on public.league_seasons to anon;
grant select, insert, update, delete on public.league_seasons to authenticated;

-- ── scoring_systems ───────────────────────────────────────────────────────────
-- authenticated only (create and manage scoring systems)
grant select, insert, update, delete on public.scoring_systems to authenticated;

-- ── scoring_system_rules ──────────────────────────────────────────────────────
-- anon: SELECT so public profile stat calculations can resolve point values
-- authenticated: full CRUD (manage rules for owned scoring systems)
grant select on public.scoring_system_rules to anon;
grant select, insert, update, delete on public.scoring_system_rules to authenticated;
