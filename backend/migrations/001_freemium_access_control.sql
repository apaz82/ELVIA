-- ============================================================
-- Migración: Sistema freemium con control de acceso granular
-- Ejecutar en Supabase → SQL Editor
-- ============================================================

-- Nuevos campos en profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS cv_optimizer_count    INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cv_match_count        INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS plan_expires_at       TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS free_trial_expires_at TIMESTAMPTZ NULL;

-- Poblar free_trial_expires_at para usuarios existentes (14 días desde creación)
UPDATE profiles
SET free_trial_expires_at = created_at + INTERVAL '14 days'
WHERE free_trial_expires_at IS NULL;

-- Poblar contadores desde usage_count existente (aproximación conservadora)
UPDATE profiles
SET
  cv_optimizer_count = LEAST(COALESCE(usage_count, 0), 1),
  cv_match_count     = LEAST(COALESCE(usage_count, 0), 3)
WHERE cv_optimizer_count = 0 AND cv_match_count = 0
  AND usage_count > 0;

-- Índices para queries del admin y middleware
CREATE INDEX IF NOT EXISTS idx_profiles_plan
  ON profiles(plan);

CREATE INDEX IF NOT EXISTS idx_profiles_trial
  ON profiles(free_trial_expires_at)
  WHERE free_trial_expires_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_plan_expires
  ON profiles(plan_expires_at)
  WHERE plan_expires_at IS NOT NULL;
