-- Track which user recorded scores for a game.
-- NULL means the scorer was anonymous or not logged in.
ALTER TABLE games
  ADD COLUMN score_recorded_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Index for looking up games by scorer (e.g. profile stats page)
CREATE INDEX idx_games_score_recorded_by ON games(score_recorded_by);

-- anon already has SELECT on games; no new grants needed.
-- authenticated already has full CRUD on games; no new grants needed.
