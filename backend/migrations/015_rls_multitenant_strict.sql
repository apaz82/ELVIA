-- ============================================================================
-- MIGRATION 015: RLS multi-tenant estricto — defensa en profundidad
--
-- DISEÑO DE SEGURIDAD:
--   • Usuarios ven y modifican SOLO sus propios registros (auth.uid() = user_id)
--   • company_admin NO tiene acceso directo a registros individuales de candidatos.
--     Obtiene datos agregados únicamente vía backend con service_role.
--   • super_admin (is_admin=true OR role='super_admin') tiene acceso total.
--   • service_role (backend) bypass completo — responsabilidad del backend filtrar.
--
-- REQUIERE: M013 (función is_super_admin() con SECURITY DEFINER)
-- EJECUTAR después de 014. Reemplaza políticas temporales de M010 y M011.
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────
-- TABLA: saved_jobs
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;

-- Limpiar políticas anteriores (temporales de M010 + cualquier legacy)
DROP POLICY IF EXISTS "saved_jobs_temp_user_own"        ON public.saved_jobs;
DROP POLICY IF EXISTS "saved_jobs_select"               ON public.saved_jobs;
DROP POLICY IF EXISTS "saved_jobs_insert"               ON public.saved_jobs;
DROP POLICY IF EXISTS "saved_jobs_update"               ON public.saved_jobs;
DROP POLICY IF EXISTS "saved_jobs_delete"               ON public.saved_jobs;

-- SELECT: usuario ve solo sus propios jobs
CREATE POLICY "saved_jobs_select" ON public.saved_jobs
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR public.is_super_admin()
    OR (auth.jwt()->>'role') = 'service_role'
  );

-- INSERT: solo para sí mismo; company_id se setea en backend (service_role)
CREATE POLICY "saved_jobs_insert" ON public.saved_jobs
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    OR (auth.jwt()->>'role') = 'service_role'
  );

-- UPDATE: solo sus propios registros
CREATE POLICY "saved_jobs_update" ON public.saved_jobs
  FOR UPDATE
  USING (
    auth.uid() = user_id
    OR (auth.jwt()->>'role') = 'service_role'
  )
  WITH CHECK (
    auth.uid() = user_id
    OR (auth.jwt()->>'role') = 'service_role'
  );

-- DELETE: solo sus propios registros (o super_admin para limpieza)
CREATE POLICY "saved_jobs_delete" ON public.saved_jobs
  FOR DELETE
  USING (
    auth.uid() = user_id
    OR public.is_super_admin()
    OR (auth.jwt()->>'role') = 'service_role'
  );

-- ─────────────────────────────────────────────────────────────────────────
-- TABLA: cv_results
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE public.cv_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own CVs"               ON public.cv_results;
DROP POLICY IF EXISTS "Users insert own CVs"            ON public.cv_results;
DROP POLICY IF EXISTS "Users update own CVs"            ON public.cv_results;
DROP POLICY IF EXISTS "Admins view all CVs"             ON public.cv_results;
DROP POLICY IF EXISTS "cv_results_select"               ON public.cv_results;
DROP POLICY IF EXISTS "cv_results_insert"               ON public.cv_results;
DROP POLICY IF EXISTS "cv_results_update"               ON public.cv_results;
DROP POLICY IF EXISTS "cv_results_delete"               ON public.cv_results;

CREATE POLICY "cv_results_select" ON public.cv_results
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR public.is_super_admin()
    OR (auth.jwt()->>'role') = 'service_role'
  );

CREATE POLICY "cv_results_insert" ON public.cv_results
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    OR (auth.jwt()->>'role') = 'service_role'
  );

CREATE POLICY "cv_results_update" ON public.cv_results
  FOR UPDATE
  USING (
    auth.uid() = user_id
    OR (auth.jwt()->>'role') = 'service_role'
  )
  WITH CHECK (
    auth.uid() = user_id
    OR (auth.jwt()->>'role') = 'service_role'
  );

CREATE POLICY "cv_results_delete" ON public.cv_results
  FOR DELETE
  USING (
    auth.uid() = user_id
    OR public.is_super_admin()
    OR (auth.jwt()->>'role') = 'service_role'
  );

-- ─────────────────────────────────────────────────────────────────────────
-- TABLA: job_checks
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE public.job_checks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own checks"            ON public.job_checks;
DROP POLICY IF EXISTS "Users insert own checks"         ON public.job_checks;
DROP POLICY IF EXISTS "job_checks_select"               ON public.job_checks;
DROP POLICY IF EXISTS "job_checks_insert"               ON public.job_checks;
DROP POLICY IF EXISTS "job_checks_update"               ON public.job_checks;
DROP POLICY IF EXISTS "job_checks_delete"               ON public.job_checks;

CREATE POLICY "job_checks_select" ON public.job_checks
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR public.is_super_admin()
    OR (auth.jwt()->>'role') = 'service_role'
  );

CREATE POLICY "job_checks_insert" ON public.job_checks
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    OR (auth.jwt()->>'role') = 'service_role'
  );

CREATE POLICY "job_checks_update" ON public.job_checks
  FOR UPDATE
  USING (
    auth.uid() = user_id
    OR (auth.jwt()->>'role') = 'service_role'
  )
  WITH CHECK (
    auth.uid() = user_id
    OR (auth.jwt()->>'role') = 'service_role'
  );

CREATE POLICY "job_checks_delete" ON public.job_checks
  FOR DELETE
  USING (
    auth.uid() = user_id
    OR public.is_super_admin()
    OR (auth.jwt()->>'role') = 'service_role'
  );

-- ─────────────────────────────────────────────────────────────────────────
-- TABLA: linkedin_analyses
-- (RLS habilitado en M011 con política temporal — reemplazamos aquí)
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE public.linkedin_analyses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "linkedin_temp_user_own"          ON public.linkedin_analyses;
DROP POLICY IF EXISTS "linkedin_analyses_select"        ON public.linkedin_analyses;
DROP POLICY IF EXISTS "linkedin_analyses_insert"        ON public.linkedin_analyses;
DROP POLICY IF EXISTS "linkedin_analyses_update"        ON public.linkedin_analyses;
DROP POLICY IF EXISTS "linkedin_analyses_delete"        ON public.linkedin_analyses;

CREATE POLICY "linkedin_analyses_select" ON public.linkedin_analyses
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR public.is_super_admin()
    OR (auth.jwt()->>'role') = 'service_role'
  );

CREATE POLICY "linkedin_analyses_insert" ON public.linkedin_analyses
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    OR (auth.jwt()->>'role') = 'service_role'
  );

CREATE POLICY "linkedin_analyses_update" ON public.linkedin_analyses
  FOR UPDATE
  USING (
    auth.uid() = user_id
    OR (auth.jwt()->>'role') = 'service_role'
  )
  WITH CHECK (
    auth.uid() = user_id
    OR (auth.jwt()->>'role') = 'service_role'
  );

CREATE POLICY "linkedin_analyses_delete" ON public.linkedin_analyses
  FOR DELETE
  USING (
    auth.uid() = user_id
    OR public.is_super_admin()
    OR (auth.jwt()->>'role') = 'service_role'
  );

-- ─────────────────────────────────────────────────────────────────────────
-- Verificación final
-- ─────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  pol_count INT;
BEGIN
  SELECT COUNT(*) INTO pol_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN ('saved_jobs', 'cv_results', 'job_checks', 'linkedin_analyses');

  RAISE NOTICE '── M015 RLS Multi-tenant aplicado ───────────────────';
  RAISE NOTICE 'Total políticas activas en 4 tablas: %', pol_count;
  RAISE NOTICE 'company_admin: SIN acceso directo a registros individuales.';
  RAISE NOTICE 'super_admin: acceso total vía is_super_admin().';
  RAISE NOTICE 'service_role: bypass completo (responsabilidad del backend).';
  RAISE NOTICE '─────────────────────────────────────────────────────';
END $$;

-- ============================================================================
-- RESUMEN SPRINT 1 DAY 1
-- ✅ M010: saved_jobs formalizada con esquema completo
-- ✅ M011: company_id nullable en 4 tablas + RLS linkedin_analyses habilitado
-- ✅ M012: Backfill company_id desde profiles (B2B=set, B2C=NULL)
-- ✅ M013: Integridad referencial verificada + is_super_admin() creada
-- ✅ M014: Índices compuestos multi-tenant (parciales WHERE IS NOT NULL)
-- ✅ M015: RLS estricto — usuarios aislados, company_admin sin acceso directo
--
-- PRÓXIMO PASO (Day 2): Backend hardening
--   - requireTenantContext middleware
--   - tenantQuery() helper que siempre filtra por company_id
--   - Refactor company.js: eliminar service_role para queries de candidatos
--   - Fix re-link silencioso en POST /registration/:slug
-- ============================================================================

-- FIN MIGRATION 015
