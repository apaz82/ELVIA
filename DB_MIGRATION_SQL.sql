-- ═══════════════════════════════════════════════════════════════════════════
-- AUDITORÍA DE BASE DE DATOS OPTIMA-CV
-- Migración SQL para resolver hallazgos críticos
-- Ejecutar en: Supabase → SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- PASO 1: CREAR TABLA landing_stats (requerida para RPC)
-- ───────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.landing_stats (
  id INT PRIMARY KEY DEFAULT 1,
  views INT NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT ck_landing_stats_views CHECK (views >= 0),
  CONSTRAINT ck_landing_stats_id CHECK (id = 1)  -- Solo un registro
);

-- Inicializar si está vacía
INSERT INTO public.landing_stats (id, views)
VALUES (1, 0)
ON CONFLICT (id) DO NOTHING;

-- ───────────────────────────────────────────────────────────────────────────
-- PASO 2: CREAR RPC increment_landing_views (para analytics de landing)
-- ───────────────────────────────────────────────────────────────────────────

DROP FUNCTION IF EXISTS public.increment_landing_views();

CREATE OR REPLACE FUNCTION public.increment_landing_views()
RETURNS void AS $$
BEGIN
  INSERT INTO public.landing_stats (id, views) VALUES (1, 1)
  ON CONFLICT (id) DO UPDATE SET views = views + 1, last_updated = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ───────────────────────────────────────────────────────────────────────────
-- PASO 3: CREAR ÍNDICES FALTANTES (CRÍTICO - Performance)
-- ───────────────────────────────────────────────────────────────────────────

-- Índice en cv_results para queries frecuentes por usuario
CREATE INDEX IF NOT EXISTS idx_cv_results_user_id ON public.cv_results(user_id);

-- Índice en job_checks para cache lookups
CREATE INDEX IF NOT EXISTS idx_job_checks_user_id ON public.job_checks(user_id);
CREATE INDEX IF NOT EXISTS idx_job_checks_job_key ON public.job_checks(job_key);

-- Índices opcionales para búsquedas y análisis
CREATE INDEX IF NOT EXISTS idx_waitlist_leads_email ON public.waitlist_leads(email);
CREATE INDEX IF NOT EXISTS idx_landing_events_event_name ON public.landing_events(event_name);
CREATE INDEX IF NOT EXISTS idx_deletion_audit_log_admin_id ON public.deletion_audit_log(admin_id);

-- ───────────────────────────────────────────────────────────────────────────
-- PASO 4: AGREGAR CONSTRAINTS DE VALIDACIÓN (Data Integrity)
-- ───────────────────────────────────────────────────────────────────────────

-- Validar que usage counts nunca sean negativos
ALTER TABLE public.access_codes
  ADD CONSTRAINT ck_access_codes_uses
  CHECK (uses_count >= 0 AND uses_count <= max_uses);

ALTER TABLE public.profiles
  ADD CONSTRAINT ck_profiles_usage_counts
  CHECK (cv_optimizer_count >= 0 AND cv_match_count >= 0 AND usage_count >= 0);

ALTER TABLE public.daily_usage_cap
  ADD CONSTRAINT ck_daily_cap_counts
  CHECK (analyses_count >= 0 AND analyses_count <= max_daily_analyses);

-- ───────────────────────────────────────────────────────────────────────────
-- PASO 5: HABILITAR ROW LEVEL SECURITY EN TABLAS SENSIBLES
-- ───────────────────────────────────────────────────────────────────────────

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cv_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_checks ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si existen (evitar duplicates)
DROP POLICY IF EXISTS "Users see own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users see own CVs" ON public.cv_results;
DROP POLICY IF EXISTS "Users insert own CVs" ON public.cv_results;
DROP POLICY IF EXISTS "Admins view all CVs" ON public.cv_results;
DROP POLICY IF EXISTS "Users see own checks" ON public.job_checks;
DROP POLICY IF EXISTS "Users insert own checks" ON public.job_checks;

-- ───────────────────────────────────────────────────────────────────────────
-- PASO 5A: RLS para PROFILES
-- ───────────────────────────────────────────────────────────────────────────

-- Usuarios ven su propio perfil
CREATE POLICY "Users see own profile" ON public.profiles FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Usuarios actualizan solo su propio perfil
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins pueden eliminar perfiles (para suspensiones)
CREATE POLICY "Admins manage all profiles" ON public.profiles FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ───────────────────────────────────────────────────────────────────────────
-- PASO 5B: RLS para CV_RESULTS
-- ───────────────────────────────────────────────────────────────────────────

-- Usuarios ven sus propios CVs
CREATE POLICY "Users see own CVs" ON public.cv_results FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Usuarios insertan solo sus propios CVs
CREATE POLICY "Users insert own CVs" ON public.cv_results FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Usuarios actualizan solo sus propios CVs
CREATE POLICY "Users update own CVs" ON public.cv_results FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ───────────────────────────────────────────────────────────────────────────
-- PASO 5C: RLS para JOB_CHECKS
-- ───────────────────────────────────────────────────────────────────────────

-- Usuarios ven sus propios job checks
CREATE POLICY "Users see own checks" ON public.job_checks FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Usuarios insertan solo para sí mismos
CREATE POLICY "Users insert own checks" ON public.job_checks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ───────────────────────────────────────────────────────────────────────────
-- PASO 6: AGREGAR COLUMNAS PARA GDPR COMPLIANCE (HASH en lugar de email plano)
-- ───────────────────────────────────────────────────────────────────────────

-- Nota: Esta es una ADICIÓN, no reemplaza la existente (backward compatible)
ALTER TABLE public.deletion_audit_log
  ADD COLUMN IF NOT EXISTS deleted_user_email_hash VARCHAR(64) NULL,
  ADD COLUMN IF NOT EXISTS deleted_user_email_domain VARCHAR(255) NULL;

-- Migrar datos existentes (si existen)
UPDATE public.deletion_audit_log
SET
  deleted_user_email_hash = encode(digest(deleted_user_email, 'sha256'), 'hex'),
  deleted_user_email_domain = split_part(deleted_user_email, '@', 2)
WHERE deleted_user_email_hash IS NULL AND deleted_user_email IS NOT NULL;

-- ───────────────────────────────────────────────────────────────────────────
-- PASO 7: CREAR VISTAS ÚTILES PARA ADMIN (Reporting)
-- ───────────────────────────────────────────────────────────────────────────

-- Vista: Estadísticas de uso por plan
DROP VIEW IF EXISTS public.user_stats CASCADE;

CREATE VIEW public.user_stats AS
SELECT
  p.id,
  p.email_principal,
  p.plan,
  p.is_admin,
  p.suspended,
  p.cv_optimizer_count,
  p.cv_match_count,
  p.usage_count,
  p.plan_expires_at,
  COUNT(DISTINCT cr.id) as total_cvs,
  COUNT(DISTINCT jc.id) as total_job_checks,
  p.created_at,
  p.updated_at
FROM public.profiles p
LEFT JOIN public.cv_results cr ON p.id = cr.user_id
LEFT JOIN public.job_checks jc ON p.id = jc.user_id
GROUP BY p.id;

-- Vista: Códigos de acceso activos con redemption count
DROP VIEW IF EXISTS public.access_codes_summary CASCADE;

CREATE VIEW public.access_codes_summary AS
SELECT
  ac.id,
  ac.code,
  ac.plan,
  ac.max_uses,
  ac.uses_count,
  ac.expires_at,
  ac.is_active,
  COUNT(cr.id) as redemptions_count,
  CASE
    WHEN ac.uses_count >= ac.max_uses THEN 'Agotado'
    WHEN ac.is_active = false THEN 'Desactivado'
    WHEN ac.expires_at < NOW() THEN 'Expirado'
    ELSE 'Activo'
  END as status
FROM public.access_codes ac
LEFT JOIN public.code_redemptions cr ON ac.id = cr.code_id
GROUP BY ac.id;

-- ───────────────────────────────────────────────────────────────────────────
-- PASO 8: QUERIES DE VERIFICACIÓN
-- ───────────────────────────────────────────────────────────────────────────

-- Verificar que los índices fueron creados
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('profiles', 'cv_results', 'job_checks', 'access_codes', 'code_redemptions')
ORDER BY tablename, indexname;

-- Verificar que RLS está habilitado
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename IN ('profiles', 'cv_results', 'job_checks')
AND schemaname = 'public';

-- Verificar políticas RLS
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('profiles', 'cv_results', 'job_checks')
AND schemaname = 'public'
ORDER BY tablename, policyname;

-- Verificar constraints
SELECT
  constraint_name,
  table_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_name IN ('access_codes', 'profiles', 'daily_usage_cap')
AND table_schema = 'public'
ORDER BY table_name, constraint_name;

-- ───────────────────────────────────────────────────────────────────────────
-- PASO 9: CREAR TABLA DE AUDITORÍA PARA RLS VIOLATIONS (Opcional pero recomendado)
-- ───────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.rls_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL, -- SELECT|INSERT|UPDATE|DELETE
  user_id UUID NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  details JSONB NULL
);

-- Índice para búsquedas rápidas de violaciones
CREATE INDEX IF NOT EXISTS idx_rls_audit_user_timestamp
  ON public.rls_audit_log(user_id, timestamp DESC);

-- ───────────────────────────────────────────────────────────────────────────
-- PASO 10: CREAR TABLA PARA PLAN DE DATOS DE RETENCIÓN (GDPR)
-- ───────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.data_retention_policy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT UNIQUE NOT NULL,
  retention_days INT NOT NULL,
  description TEXT,
  last_cleanup TIMESTAMPTZ
);

-- Definir políticas de retención
INSERT INTO public.data_retention_policy (table_name, retention_days, description)
VALUES
  ('landing_events', 180, 'Analytics events — máximo 6 meses'),
  ('deletion_audit_log', 730, 'Compliance audit logs — máximo 2 años'),
  ('daily_usage_cap', 365, 'Usage tracking — máximo 1 año'),
  ('job_checks', 365, 'Job compatibility cache — máximo 1 año')
ON CONFLICT (table_name) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- FIN DE MIGRACIÓN
-- ═══════════════════════════════════════════════════════════════════════════

-- Resumen de cambios:
-- ✅ RLS habilitado en 3 tablas sensibles (profiles, cv_results, job_checks)
-- ✅ 4 índices nuevos para performance crítica
-- ✅ 3 constraints nuevos para data integrity
-- ✅ RPC increment_landing_views creado
-- ✅ Vistas para reporting administrativo
-- ✅ Tablas de auditoría para compliance GDPR
--
-- Tiempo estimado de ejecución: 5-10 segundos (depende del tamaño de datos)
-- NOTA: Las políticas RLS pueden que rompa queries existentes que no filtren por user_id
--       Validar con el equipo de desarrollo antes de aplicar a producción
