-- ── Scoring Systems ───────────────────────────────────────────────────────────

CREATE TABLE scoring_systems (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  created_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE scoring_system_rules (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scoring_system_id  UUID NOT NULL REFERENCES scoring_systems(id) ON DELETE CASCADE,
  rank               INT  NOT NULL CHECK (rank > 0),
  points             INT  NOT NULL,
  UNIQUE (scoring_system_id, rank)
);

-- Add scoring system to seasons (nullable — no system = use raw score)
ALTER TABLE league_seasons
  ADD COLUMN scoring_system_id UUID REFERENCES scoring_systems(id) ON DELETE SET NULL;

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE scoring_systems      ENABLE ROW LEVEL SECURITY;
ALTER TABLE scoring_system_rules ENABLE ROW LEVEL SECURITY;

-- scoring_systems: anyone authenticated can read
CREATE POLICY "ss_select" ON scoring_systems
  FOR SELECT TO authenticated USING (true);

-- scoring_systems: creator can insert
CREATE POLICY "ss_insert" ON scoring_systems
  FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());

-- scoring_systems: creator can update
CREATE POLICY "ss_update" ON scoring_systems
  FOR UPDATE TO authenticated USING (created_by = auth.uid());

-- scoring_systems: creator can delete
CREATE POLICY "ss_delete" ON scoring_systems
  FOR DELETE TO authenticated USING (created_by = auth.uid());

-- scoring_system_rules: anyone authenticated can read
CREATE POLICY "ssr_select" ON scoring_system_rules
  FOR SELECT TO authenticated USING (true);

-- scoring_system_rules: only parent system creator can insert/update/delete
CREATE POLICY "ssr_insert" ON scoring_system_rules
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM scoring_systems
      WHERE id = scoring_system_id AND created_by = auth.uid()
    )
  );

CREATE POLICY "ssr_update" ON scoring_system_rules
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scoring_systems
      WHERE id = scoring_system_id AND created_by = auth.uid()
    )
  );

CREATE POLICY "ssr_delete" ON scoring_system_rules
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scoring_systems
      WHERE id = scoring_system_id AND created_by = auth.uid()
    )
  );
