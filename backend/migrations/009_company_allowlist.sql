-- Migration 009: Company allowlist (gate de acceso por email aprobado por HR).
-- Cada empresa puede cargar via CSV los emails de los colaboradores que tienen
-- permiso a entrar al programa. Sin estar en la lista, la app rechaza el registro.

-- 1. Tabla principal company_allowlist.

CREATE TABLE IF NOT EXISTS company_allowlist (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  email             TEXT NOT NULL,
  nombre            TEXT,
  apellido          TEXT,
  cohort            TEXT,
  area              TEXT,
  cargo_actual      TEXT,
  status            TEXT NOT NULL DEFAULT 'pending',
  added_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  added_by          UUID REFERENCES profiles(id) ON DELETE SET NULL,
  activated_at      TIMESTAMPTZ,
  activated_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  revoked_at        TIMESTAMPTZ,
  revoked_by        UUID REFERENCES profiles(id) ON DELETE SET NULL,
  notes             TEXT,
  UNIQUE(company_id, email)
);

CREATE INDEX IF NOT EXISTS idx_allowlist_company ON company_allowlist(company_id);
CREATE INDEX IF NOT EXISTS idx_allowlist_email_lower ON company_allowlist(lower(email));
CREATE INDEX IF NOT EXISTS idx_allowlist_cohort ON company_allowlist(company_id, cohort);
CREATE INDEX IF NOT EXISTS idx_allowlist_status ON company_allowlist(company_id, status);

-- 2. Flag por empresa para activar el gate (default OFF para no romper tenants existentes).

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS require_allowlist BOOLEAN DEFAULT false;

-- 3. RLS: company_admin solo ve/modifica el allowlist de su empresa.

ALTER TABLE company_allowlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "company_admin_allowlist_select" ON company_allowlist;
CREATE POLICY "company_admin_allowlist_select" ON company_allowlist
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid() AND role = 'company_admin'
    )
    OR (auth.jwt()->>'role') = 'service_role'
  );

DROP POLICY IF EXISTS "company_admin_allowlist_modify" ON company_allowlist;
CREATE POLICY "company_admin_allowlist_modify" ON company_allowlist
  FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid() AND role = 'company_admin'
    )
    OR (auth.jwt()->>'role') = 'service_role'
  );

-- 4. Activar gate en Telefonica de paso (demo lo necesita)
--    Comentado por defecto: descomenta cuando quieras forzar allowlist en Telefonica.
-- UPDATE companies SET require_allowlist = true WHERE slug = 'telefonica';

-- FIN MIGRATION 009
