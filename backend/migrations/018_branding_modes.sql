-- ============================================================================
-- MIGRATION 018: Sprint 3c — Branding modes + Program badge
--
-- Permite que el super_admin configure CÓMO se muestra la marca del cliente
-- frente a los candidatos. Cubre el caso de outplacement confidencial donde
-- el cliente NO quiere que aparezca su logo en el flujo del candidato.
--
-- branding_mode:
--   'cobranded'   → Logo ELVIA + logo cliente (default, caso Telefónica)
--   'tenant_only' → Solo logo cliente, ELVIA discreto en footer
--   'elvia_only'  → Solo ELVIA, sin pista del cliente (outplacement con confidencialidad)
--
-- show_program_badge: badge in-app "Programa {company.name}" en dashboard/header
-- program_badge_text: override opcional del texto (ej. "Programa de Transición 2026"
--   en vez de "Programa Telefónica") para más confidencialidad
--
-- Defaults preservan comportamiento actual: cobranded + badge ON.
-- Idempotente.
-- ============================================================================

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS branding_mode TEXT NOT NULL DEFAULT 'cobranded'
    CHECK (branding_mode IN ('cobranded', 'tenant_only', 'elvia_only'));

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS show_program_badge BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS program_badge_text TEXT;

COMMENT ON COLUMN public.companies.branding_mode IS
  'cobranded (default) | tenant_only | elvia_only — controla qué logos ve el candidato';
COMMENT ON COLUMN public.companies.show_program_badge IS
  'Si true, muestra badge "Programa X" en dashboard/header del candidato';
COMMENT ON COLUMN public.companies.program_badge_text IS
  'Override opcional del texto del badge. Si NULL usa "Programa {name}"';

DO $$
BEGIN
  RAISE NOTICE '── M018 completado ──────────────────────────────────';
  RAISE NOTICE 'companies.branding_mode: cobranded/tenant_only/elvia_only (default cobranded)';
  RAISE NOTICE 'companies.show_program_badge: BOOLEAN (default true)';
  RAISE NOTICE 'companies.program_badge_text: TEXT nullable (override del badge)';
  RAISE NOTICE 'Telefónica demo NO se ve afectada — defaults preservan comportamiento actual';
  RAISE NOTICE '─────────────────────────────────────────────────────';
END $$;

-- FIN MIGRATION 018
