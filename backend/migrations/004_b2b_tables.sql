-- ============================================================================
-- MIGRATION 004: B2B Multi-tenant Infrastructure
-- Tables: company_invitations, company_plans, mentor_packages
-- Columns: companies.slug, companies.plan, companies.country
-- RLS: Policies para company_admin aislamiento de datos
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────
-- 1. Agregar columnas faltantes a tabla companies
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'b2b',
  ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'MX';

CREATE INDEX IF NOT EXISTS idx_companies_slug ON companies(slug);
CREATE INDEX IF NOT EXISTS idx_companies_country ON companies(country);

-- ─────────────────────────────────────────────────────────────────────────
-- 2. CREATE TABLE: company_invitations
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS company_invitations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  nombre      TEXT,
  token       TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  status      TEXT NOT NULL DEFAULT 'pending', -- pending | accepted | expired
  invited_by  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days')
);

CREATE INDEX IF NOT EXISTS idx_invitations_company ON company_invitations(company_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON company_invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON company_invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON company_invitations(status);

-- ─────────────────────────────────────────────────────────────────────────
-- 3. CREATE TABLE: company_plans
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS company_plans (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  plan_type       TEXT NOT NULL, -- 'pro' | 'max'
  duration_months INT NOT NULL,  -- 3 (Pro) | 6 (Max)
  price_mxn       NUMERIC(10,2) NOT NULL,
  assigned_to     UUID REFERENCES profiles(id) ON DELETE SET NULL, -- usuario al que aplica
  assigned_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at      TIMESTAMPTZ,
  created_by      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_plans_company ON company_plans(company_id);
CREATE INDEX IF NOT EXISTS idx_plans_assigned_to ON company_plans(assigned_to);
CREATE INDEX IF NOT EXISTS idx_plans_expires_at ON company_plans(expires_at);

-- ─────────────────────────────────────────────────────────────────────────
-- 4. CREATE TABLE: mentor_packages
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS mentor_packages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  hours       INT NOT NULL, -- 6 | 12 | 24
  price_mxn   NUMERIC(10,2) NOT NULL,
  used_hours  INT NOT NULL DEFAULT 0,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  purchased_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mentor_company ON mentor_packages(company_id);
CREATE INDEX IF NOT EXISTS idx_mentor_purchased_by ON mentor_packages(purchased_by);

-- ─────────────────────────────────────────────────────────────────────────
-- 5. RLS: company_invitations
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE company_invitations ENABLE ROW LEVEL SECURITY;

-- Company admin: ver/crear invitaciones de su empresa SOLAMENTE
CREATE POLICY "company_admin_view_own_invitations" ON company_invitations
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid() AND role = 'company_admin'
    )
    OR (auth.jwt()->>'role') = 'service_role'
  );

CREATE POLICY "company_admin_create_invitations" ON company_invitations
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid() AND role = 'company_admin'
    )
  );

CREATE POLICY "company_admin_delete_own_invitations" ON company_invitations
  FOR DELETE
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid() AND role = 'company_admin'
    )
  );

-- Super admin: acceso total (service role bypass)
CREATE POLICY "super_admin_all_invitations" ON company_invitations
  FOR ALL
  USING ((auth.jwt()->>'role') = 'service_role');

-- ─────────────────────────────────────────────────────────────────────────
-- 6. RLS: company_plans
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE company_plans ENABLE ROW LEVEL SECURITY;

-- Company admin: ver planes de su empresa SOLAMENTE
CREATE POLICY "company_admin_view_own_plans" ON company_plans
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid() AND role = 'company_admin'
    )
    OR (auth.jwt()->>'role') = 'service_role'
  );

-- Super admin: acceso total
CREATE POLICY "super_admin_all_plans" ON company_plans
  FOR ALL
  USING ((auth.jwt()->>'role') = 'service_role');

-- ─────────────────────────────────────────────────────────────────────────
-- 7. RLS: mentor_packages
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE mentor_packages ENABLE ROW LEVEL SECURITY;

-- Company admin: ver paquetes de su empresa SOLAMENTE
CREATE POLICY "company_admin_view_own_packages" ON mentor_packages
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid() AND role = 'company_admin'
    )
    OR (auth.jwt()->>'role') = 'service_role'
  );

-- Super admin: acceso total
CREATE POLICY "super_admin_all_packages" ON mentor_packages
  FOR ALL
  USING ((auth.jwt()->>'role') = 'service_role');

-- ─────────────────────────────────────────────────────────────────────────
-- 8. Actualizar RLS en profiles: company_admin solo ve su empresa
-- ─────────────────────────────────────────────────────────────────────────

-- Eliminar política anterior si existe (cuidado con esto)
DROP POLICY IF EXISTS "company_admin_view_own_company" ON profiles;

-- Company admin: ver solo usuarios de su propia empresa
CREATE POLICY "company_admin_view_own_company" ON profiles
  FOR SELECT
  USING (
    -- Si es company_admin: ver solo usuarios de su empresa
    (auth.uid() IN (SELECT id FROM profiles WHERE role = 'company_admin')
      AND company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()))
    -- Si es super_admin o el usuario mismo: ver todo
    OR (auth.uid() IN (SELECT id FROM profiles WHERE role = 'super_admin'))
    OR auth.uid() = id
    -- Service role: ver todo
    OR (auth.jwt()->>'role') = 'service_role'
  );

-- ─────────────────────────────────────────────────────────────────────────
-- FIN MIGRATION 004
-- ─────────────────────────────────────────────────────────────────────────
