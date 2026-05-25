-- ============================================================================
-- MIGRATION 012: Backfill company_id desde profiles.company_id
-- Para cada registro existente, copia el company_id del perfil del usuario.
-- Usuarios sin company_id en profiles → quedan con NULL (B2C — correcto).
-- EJECUTAR después de 011. Puede tardar varios segundos en producción.
-- Idempotente: la condición WHERE company_id IS NULL evita re-procesar.
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────
-- Parchear set_updated_at() para que sea safe en tablas sin updated_at.
-- El trigger puede estar vinculado a tablas que no tienen esa columna,
-- y los UPDATEs del backfill lo dispararían causando error 42703.
-- ─────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  BEGIN
    NEW.updated_at = now();
  EXCEPTION WHEN undefined_column THEN
    NULL;  -- tabla sin updated_at — skip silenciosamente
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────────────────────────────────
-- saved_jobs
-- ─────────────────────────────────────────────────────────────────────────

UPDATE public.saved_jobs sj
SET    company_id = p.company_id
FROM   public.profiles p
WHERE  sj.user_id = p.id
  AND  sj.company_id IS NULL
  AND  p.company_id IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────
-- cv_results
-- ─────────────────────────────────────────────────────────────────────────

UPDATE public.cv_results cr
SET    company_id = p.company_id
FROM   public.profiles p
WHERE  cr.user_id = p.id
  AND  cr.company_id IS NULL
  AND  p.company_id IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────
-- job_checks
-- ─────────────────────────────────────────────────────────────────────────

UPDATE public.job_checks jc
SET    company_id = p.company_id
FROM   public.profiles p
WHERE  jc.user_id = p.id
  AND  jc.company_id IS NULL
  AND  p.company_id IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────
-- linkedin_analyses
-- ─────────────────────────────────────────────────────────────────────────

UPDATE public.linkedin_analyses la
SET    company_id = p.company_id
FROM   public.profiles p
WHERE  la.user_id = p.id
  AND  la.company_id IS NULL
  AND  p.company_id IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────
-- Reporte de conteos post-backfill
-- ─────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  sj_b2b  INT; sj_b2c  INT;
  cr_b2b  INT; cr_b2c  INT;
  jc_b2b  INT; jc_b2c  INT;
  la_b2b  INT; la_b2c  INT;
BEGIN
  SELECT COUNT(*) FILTER (WHERE company_id IS NOT NULL),
         COUNT(*) FILTER (WHERE company_id IS NULL)
  INTO sj_b2b, sj_b2c FROM public.saved_jobs;

  SELECT COUNT(*) FILTER (WHERE company_id IS NOT NULL),
         COUNT(*) FILTER (WHERE company_id IS NULL)
  INTO cr_b2b, cr_b2c FROM public.cv_results;

  SELECT COUNT(*) FILTER (WHERE company_id IS NOT NULL),
         COUNT(*) FILTER (WHERE company_id IS NULL)
  INTO jc_b2b, jc_b2c FROM public.job_checks;

  SELECT COUNT(*) FILTER (WHERE company_id IS NOT NULL),
         COUNT(*) FILTER (WHERE company_id IS NULL)
  INTO la_b2b, la_b2c FROM public.linkedin_analyses;

  RAISE NOTICE '── M012 Backfill completado ──────────────────────────';
  RAISE NOTICE 'saved_jobs:         B2B=% | B2C=%', sj_b2b, sj_b2c;
  RAISE NOTICE 'cv_results:         B2B=% | B2C=%', cr_b2b, cr_b2c;
  RAISE NOTICE 'job_checks:         B2B=% | B2C=%', jc_b2b, jc_b2c;
  RAISE NOTICE 'linkedin_analyses:  B2B=% | B2C=%', la_b2b, la_b2c;
  RAISE NOTICE '─────────────────────────────────────────────────────';
END $$;

-- FIN MIGRATION 012
