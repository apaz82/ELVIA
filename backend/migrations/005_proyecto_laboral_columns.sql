-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRACIÓN 005 — Columnas para Proyecto Laboral (Mi Perfil + compensación)
-- Ejecutar en: Supabase → SQL Editor
-- Todas las columnas usan IF NOT EXISTS — seguro de ejecutar múltiples veces
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Columna JSONB principal para todos los datos de los 6 pilares ──────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS job_search_profile JSONB DEFAULT '{}'::jsonb;

-- ── Datos personales básicos ──────────────────────────────────────────────
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nombre1          TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nombre2          TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS apellido1        TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS apellido2        TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS indicativo1      TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS telefono1        TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_secundario TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ciudad           TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS edad             INT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS industria_actual TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS salario_esperado TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nombre           TEXT;

-- ── Prestaciones base ──────────────────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS prestaciones TEXT[] DEFAULT ARRAY[]::TEXT[];

-- ── Compensación detallada ────────────────────────────────────────────────
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pais_prestaciones   TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS prestaciones_detalle JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bono_activo         BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bono_tipo           TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bono_esquema        TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bono_frecuencia     TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bono_pct            TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bono_num_salarios   TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bono_monto          TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS variable_monto      TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS prestaciones_otros  TEXT;

-- ── Índice GIN en job_search_profile para queries JSONB rápidos ───────────
CREATE INDEX IF NOT EXISTS idx_profiles_job_search_profile
  ON public.profiles USING GIN (job_search_profile);

-- ── Verificación: muestra las columnas de profiles ────────────────────────
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'profiles'
ORDER BY ordinal_position;
