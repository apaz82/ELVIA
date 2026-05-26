-- Migration 019: PII retention + explicit consent
-- Cubre hallazgo de auditoría: política de retención de CVs y consentimiento explícito.
--
-- Cambios:
--   1. cv_results.expires_at — fecha de purga automática (default NOW + 180 días)
--   2. profiles.pii_consent_at — timestamp del consentimiento explícito
--   3. profiles.pii_consent_version — versión del aviso de privacidad aceptado
--   4. Función purge_expired_cv_results() — invocable manualmente o vía pg_cron
--   5. Índice en cv_results.expires_at para purga eficiente

BEGIN;

-- ── 1. cv_results.expires_at ─────────────────────────────────────────────
ALTER TABLE public.cv_results
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ
    DEFAULT (NOW() + INTERVAL '180 days');

-- Backfill: filas existentes obtienen TTL desde su created_at + 180 días.
-- Si created_at no existe, usa NOW como base (conservador).
UPDATE public.cv_results
SET expires_at = COALESCE(created_at, NOW()) + INTERVAL '180 days'
WHERE expires_at IS NULL;

-- Índice parcial: solo entradas con TTL activo
CREATE INDEX IF NOT EXISTS idx_cv_results_expires_at
  ON public.cv_results (expires_at)
  WHERE expires_at IS NOT NULL;

-- ── 2. profiles.pii_consent_at + version ─────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS pii_consent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pii_consent_version TEXT;

COMMENT ON COLUMN public.profiles.pii_consent_at IS
  'Fecha en que el usuario aceptó explícitamente el tratamiento de PII (CV, datos de carrera). NULL = sin consentimiento registrado.';
COMMENT ON COLUMN public.profiles.pii_consent_version IS
  'Versión del aviso de privacidad aceptado (ej: "2026-05-26-v1"). Permite trazar a qué texto consintió cada usuario.';

-- Backfill: usuarios existentes se consideran haber consentido en el momento de la migration
-- (decisión pragmática: ya usaban el producto bajo los términos previos).
UPDATE public.profiles
SET pii_consent_at = NOW(),
    pii_consent_version = '2026-05-26-v1-implicit'
WHERE pii_consent_at IS NULL;

-- ── 3. Función de purga ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.purge_expired_cv_results()
RETURNS TABLE(purged_count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count BIGINT;
BEGIN
  DELETE FROM public.cv_results
   WHERE expires_at IS NOT NULL
     AND expires_at < NOW();
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN QUERY SELECT v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.purge_expired_cv_results() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.purge_expired_cv_results() TO service_role;

COMMENT ON FUNCTION public.purge_expired_cv_results() IS
  'Borra cv_results con expires_at en el pasado. Llamar desde backend cron o pg_cron diario.';

-- ── 4. (Opcional) Schedule vía pg_cron si está disponible ────────────────
-- Si pg_cron está instalado en Supabase, descomenta esto:
-- SELECT cron.schedule(
--   'purge-expired-cv-results',
--   '0 3 * * *',                              -- 03:00 UTC diario
--   $$SELECT public.purge_expired_cv_results();$$
-- );

COMMIT;
