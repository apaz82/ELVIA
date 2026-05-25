-- ============================================================================
-- MIGRATION 017: Sprint 2 — MFA support para company_admin
-- companies.require_mfa: habilita el gate de MFA para un tenant específico.
--   DEFAULT false — no rompe tenants existentes (Telefónica demo sigue igual).
-- profiles.mfa_enrolled: flag de conveniencia para saber si el usuario ya
--   completó el enroll sin hacer un query a auth.mfa_factors.
-- Idempotente.
-- ============================================================================

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS require_mfa BOOLEAN DEFAULT false;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS mfa_enrolled BOOLEAN DEFAULT false;

DO $$
BEGIN
  RAISE NOTICE '── M017 completado ──────────────────────────────────';
  RAISE NOTICE 'companies.require_mfa: columna agregada (DEFAULT false)';
  RAISE NOTICE 'profiles.mfa_enrolled: columna agregada (DEFAULT false)';
  RAISE NOTICE 'Telefonica demo NO se ve afectada — require_mfa = false';
  RAISE NOTICE '─────────────────────────────────────────────────────';
END $$;

-- FIN MIGRATION 017
