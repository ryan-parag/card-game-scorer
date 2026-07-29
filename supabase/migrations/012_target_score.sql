-- Optional target score: the number of points a player needs to reach to win.
-- NULL means the game has no target (rounds-based play only).
ALTER TABLE games
  ADD COLUMN target_score INTEGER;

-- anon already has SELECT on games; no new grants needed.
-- authenticated already has full CRUD on games; no new grants needed.
