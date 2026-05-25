-- ============================================================================
-- MIGRATION 014: Índices compuestos multi-tenant para performance
-- Los índices parciales (WHERE company_id IS NOT NULL) solo indexan filas B2B,
-- manteniendo el índice pequeño sin penalizar a usuarios B2C.
-- EJECUTAR después de 013, antes de 015.
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────
-- saved_jobs
-- ─────────────────────────────────────────────────────────────────────────

-- Dashboard HR: listar todos los candidatos de un tenant
CREATE INDEX IF NOT EXISTS idx_saved_jobs_company_user
  ON public.saved_jobs(company_id, user_id)
  WHERE company_id IS NOT NULL;

-- Dashboard HR: conteo por etapa del pipeline
CREATE INDEX IF NOT EXISTS idx_saved_jobs_company_estado
  ON public.saved_jobs(company_id, estado)
  WHERE company_id IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────
-- cv_results
-- ─────────────────────────────────────────────────────────────────────────

-- Dashboard HR: CVs por empresa
CREATE INDEX IF NOT EXISTS idx_cv_results_company_user
  ON public.cv_results(company_id, user_id)
  WHERE company_id IS NOT NULL;

-- Filtros por tipo dentro de un tenant
CREATE INDEX IF NOT EXISTS idx_cv_results_company_tipo
  ON public.cv_results(company_id, tipo)
  WHERE company_id IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────
-- job_checks
-- ─────────────────────────────────────────────────────────────────────────

-- Lookups de compatibilidad por empresa
CREATE INDEX IF NOT EXISTS idx_job_checks_company_user
  ON public.job_checks(company_id, user_id)
  WHERE company_id IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────
-- linkedin_analyses
-- ─────────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_linkedin_analyses_company_user
  ON public.linkedin_analyses(company_id, user_id)
  WHERE company_id IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────
-- profiles — lookup frecuente en las políticas RLS de M015
-- ─────────────────────────────────────────────────────────────────────────

-- is_super_admin() y company_admin lookup (usado en policies de M004 y M015)
CREATE INDEX IF NOT EXISTS idx_profiles_company_role
  ON public.profiles(company_id, role)
  WHERE company_id IS NOT NULL;

-- auth.uid() = id es el lookup más común — asegurar que existe
CREATE INDEX IF NOT EXISTS idx_profiles_id
  ON public.profiles(id);

DO $$
BEGIN
  RAISE NOTICE 'M014: Índices compuestos multi-tenant creados en 4 tablas + profiles.';
END $$;

-- FIN MIGRATION 014
