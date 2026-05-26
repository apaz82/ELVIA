-- Migration 021: Agregar columnas faltantes a company_allowlist
-- La tabla fue creada antes de que migration 009 incluyera estas columnas.
-- Todos los ALTER usan IF NOT EXISTS para ser idempotentes.

BEGIN;

ALTER TABLE public.company_allowlist
  ADD COLUMN IF NOT EXISTS area              TEXT,
  ADD COLUMN IF NOT EXISTS cargo_actual      TEXT,
  ADD COLUMN IF NOT EXISTS added_by          UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS activated_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS activated_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS revoked_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS revoked_by        UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS notes             TEXT;

-- Asegurar índices de rendimiento también
CREATE INDEX IF NOT EXISTS idx_allowlist_status  ON public.company_allowlist(company_id, status);
CREATE INDEX IF NOT EXISTS idx_allowlist_cohort  ON public.company_allowlist(company_id, cohort);

COMMIT;
