-- Migration 007: Tenant Branding & White-label Support.
-- Extiende la tabla `companies` con columnas de branding para servir
-- landings y dashboards co-brandeados por tenant (Telefonica, Universidades, etc).

-- 0. Tabla companies — defensa por si no existe (idempotente).

CREATE TABLE IF NOT EXISTS companies (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  email       TEXT,
  is_active   BOOLEAN DEFAULT true,
  created_by  UUID,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1. Branding & identity columns.

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS logo_url         TEXT,
  ADD COLUMN IF NOT EXISTS logo_secondary   TEXT,
  ADD COLUMN IF NOT EXISTS primary_color    TEXT DEFAULT '#0066FF',
  ADD COLUMN IF NOT EXISTS secondary_color  TEXT DEFAULT '#0D1B2A',
  ADD COLUMN IF NOT EXISTS accent_color     TEXT DEFAULT '#00D4FF',
  ADD COLUMN IF NOT EXISTS hero_title       TEXT,
  ADD COLUMN IF NOT EXISTS hero_subtitle    TEXT,
  ADD COLUMN IF NOT EXISTS hero_image_url   TEXT,
  ADD COLUMN IF NOT EXISTS welcome_message  TEXT,
  ADD COLUMN IF NOT EXISTS allowed_email_domain TEXT,
  ADD COLUMN IF NOT EXISTS require_invite    BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS sector            TEXT DEFAULT 'corporate',
  ADD COLUMN IF NOT EXISTS contact_email     TEXT,
  ADD COLUMN IF NOT EXISTS support_email     TEXT,
  ADD COLUMN IF NOT EXISTS show_pricing      BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS enabled_features  JSONB DEFAULT
    '{"cv_optimizer":true,"cv_match":true,"jobs":true,"pipeline":true,"interview":true,"linkedin":true,"library":true,"wellbeing":true,"metrics":true,"linkedin_pro":true}'::jsonb,
  ADD COLUMN IF NOT EXISTS dpa_signed_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS dpa_url           TEXT,
  ADD COLUMN IF NOT EXISTS data_region       TEXT DEFAULT 'us-east-1';

-- 2. Indexes for tenant lookups.

CREATE INDEX IF NOT EXISTS idx_companies_email_domain ON companies(allowed_email_domain)
  WHERE allowed_email_domain IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_companies_sector ON companies(sector);

-- 3. Profiles: agregar columna cohort + tracking de exito de transicion.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS cohort        TEXT,
  ADD COLUMN IF NOT EXISTS hired_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS hired_company TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_cohort ON profiles(cohort)
  WHERE cohort IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_company_cohort ON profiles(company_id, cohort);

-- 4. Habilitar RLS en companies (idempotente) + permitir lectura publica
--    del branding basico (necesario para landings sin auth).
--    El backend usa service_role para escrituras, que bypasea RLS.

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_company_branding" ON companies;
CREATE POLICY "public_read_company_branding" ON companies
  FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "super_admin_manage_companies" ON companies;
CREATE POLICY "super_admin_manage_companies" ON companies
  FOR ALL
  USING ((auth.jwt()->>'role') = 'service_role');

-- FIN MIGRATION 007
