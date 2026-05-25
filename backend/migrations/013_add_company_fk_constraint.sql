-- ============================================================================
-- MIGRATION 013: Integridad referencial + detección de huérfanos
-- NO se fuerza NOT NULL en company_id para mantener compatibilidad B2C.
-- Verifica que no existan registros con company_id apuntando a empresas
-- inexistentes (debería ser 0 si M011/M012 corrieron correctamente).
-- EJECUTAR después de 012, antes de 014.
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────
-- Verificación de integridad pre-M014
-- ─────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  sj_orphans  INT;
  cr_orphans  INT;
  jc_orphans  INT;
  la_orphans  INT;
  has_issues  BOOLEAN := false;
BEGIN
  SELECT COUNT(*) INTO sj_orphans
  FROM public.saved_jobs sj
  WHERE sj.company_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM public.companies c WHERE c.id = sj.company_id);

  SELECT COUNT(*) INTO cr_orphans
  FROM public.cv_results cr
  WHERE cr.company_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM public.companies c WHERE c.id = cr.company_id);

  SELECT COUNT(*) INTO jc_orphans
  FROM public.job_checks jc
  WHERE jc.company_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM public.companies c WHERE c.id = jc.company_id);

  SELECT COUNT(*) INTO la_orphans
  FROM public.linkedin_analyses la
  WHERE la.company_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM public.companies c WHERE c.id = la.company_id);

  IF sj_orphans > 0 OR cr_orphans > 0 OR jc_orphans > 0 OR la_orphans > 0 THEN
    has_issues := true;
    RAISE WARNING 'M013: Huérfanos detectados — saved_jobs:% cv_results:% job_checks:% linkedin:%. Corregir antes de M015.',
      sj_orphans, cr_orphans, jc_orphans, la_orphans;
  ELSE
    RAISE NOTICE 'M013: Sin huérfanos. Integridad referencial OK.';
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────
-- Función set_updated_at (idempotente — puede ya existir de M010)
-- ─────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────────────────────────────────
-- Función helper: is_super_admin() — SECURITY DEFINER para evitar
-- recursión infinita cuando RLS de profiles evalúa otras tablas.
-- ─────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND (is_admin = true OR role = 'super_admin')
  )
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE;

DO $$
BEGIN
  RAISE NOTICE 'M013: Función is_super_admin() creada. Lista para usar en M015.';
END $$;

-- FIN MIGRATION 013
