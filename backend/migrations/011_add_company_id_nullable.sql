-- ============================================================================
-- MIGRATION 011: Agregar company_id (nullable) a tablas de contenido de usuario
-- company_id NULL  → usuario B2C (sin tenant corporativo) — backward compatible
-- company_id NOT NULL → usuario B2B (asignado a un tenant)
-- FK ON DELETE SET NULL: si se elimina la empresa, los datos del usuario quedan
-- huérfanos como B2C en lugar de borrarse en cascada.
-- EJECUTAR después de 010, antes de 012.
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────
-- saved_jobs
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE public.saved_jobs
  ADD COLUMN IF NOT EXISTS company_id UUID
    REFERENCES public.companies(id) ON DELETE SET NULL;

-- ─────────────────────────────────────────────────────────────────────────
-- cv_results
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE public.cv_results
  ADD COLUMN IF NOT EXISTS company_id UUID
    REFERENCES public.companies(id) ON DELETE SET NULL;

-- ─────────────────────────────────────────────────────────────────────────
-- job_checks
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE public.job_checks
  ADD COLUMN IF NOT EXISTS company_id UUID
    REFERENCES public.companies(id) ON DELETE SET NULL;

-- ─────────────────────────────────────────────────────────────────────────
-- linkedin_analyses: habilitar RLS (no tenía) y agregar company_id
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE public.linkedin_analyses ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.linkedin_analyses
  ADD COLUMN IF NOT EXISTS company_id UUID
    REFERENCES public.companies(id) ON DELETE SET NULL;

-- Política temporal mientras M015 no esté aplicada
DROP POLICY IF EXISTS "linkedin_temp_user_own" ON public.linkedin_analyses;
CREATE POLICY "linkedin_temp_user_own" ON public.linkedin_analyses
  FOR ALL
  USING (
    auth.uid() = user_id
    OR (auth.jwt()->>'role') = 'service_role'
  )
  WITH CHECK (
    auth.uid() = user_id
    OR (auth.jwt()->>'role') = 'service_role'
  );

DO $$
BEGIN
  RAISE NOTICE 'M011: company_id (nullable) agregado a saved_jobs, cv_results, job_checks, linkedin_analyses.';
  RAISE NOTICE 'M011: RLS habilitado en linkedin_analyses con política temporal.';
END $$;

-- FIN MIGRATION 011
