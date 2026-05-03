-- Migration: linkedin_analyses
-- Sprint 2 Tier 3 — 7.2 LinkedIn history (persistencia)
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS linkedin_analyses (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  puntaje_global   INTEGER     NOT NULL CHECK (puntaje_global BETWEEN 0 AND 100),
  resumen_global   TEXT,
  top_acciones     JSONB       NOT NULL DEFAULT '[]',
  secciones        JSONB       NOT NULL DEFAULT '{}',
  campos_analizados TEXT[]     DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast per-user history queries
CREATE INDEX IF NOT EXISTS linkedin_analyses_user_id_created_at
  ON linkedin_analyses (user_id, created_at DESC);

-- RLS: users can only see and insert their own analyses
ALTER TABLE linkedin_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "linkedin_analyses_select_own"
  ON linkedin_analyses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "linkedin_analyses_insert_own"
  ON linkedin_analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "linkedin_analyses_delete_own"
  ON linkedin_analyses FOR DELETE
  USING (auth.uid() = user_id);
