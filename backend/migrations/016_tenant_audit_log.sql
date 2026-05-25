-- ============================================================================
-- MIGRATION 016: Sprint 2 — is_template flag + tenant_audit_log
-- is_template: marca filas de companies como plantilla base (no son clientes reales).
-- tenant_audit_log: registra acciones B2B del panel super_admin (crear tenant,
--   invitar usuario, cambiar config, etc.). Distinto de admin_audit_log (HTTP log)
--   y deletion_audit_log (GDPR borrados).
-- Idempotente.
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────
-- 1. Flag is_template en companies
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT false;

-- ─────────────────────────────────────────────────────────────────────────
-- 2. Tabla tenant_audit_log
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.tenant_audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,    -- 'tenant_created' | 'user_invited' | 'user_removed'
                                -- | 'allowlist_updated' | 'config_changed' | 'hr_admin_created'
  entity      TEXT,             -- 'companies' | 'profiles' | 'company_allowlist'
  entity_id   UUID,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tenant_audit_company
  ON public.tenant_audit_log(company_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tenant_audit_user
  ON public.tenant_audit_log(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tenant_audit_action
  ON public.tenant_audit_log(action, created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────
-- 3. RLS — solo backend (service_role) puede leer/escribir
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE public.tenant_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_audit" ON public.tenant_audit_log;
CREATE POLICY "service_role_all_audit" ON public.tenant_audit_log
  FOR ALL
  USING ((auth.jwt()->>'role') = 'service_role');

-- ─────────────────────────────────────────────────────────────────────────
-- 4. Verificación
-- ─────────────────────────────────────────────────────────────────────────

DO $$
BEGIN
  RAISE NOTICE '── M016 completado ──────────────────────────────────';
  RAISE NOTICE 'companies.is_template: columna agregada';
  RAISE NOTICE 'tenant_audit_log: tabla creada con RLS activa';
  RAISE NOTICE '─────────────────────────────────────────────────────';
END $$;

-- FIN MIGRATION 016
