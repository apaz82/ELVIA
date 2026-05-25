-- ============================================================================
-- MIGRATION 010: Formalizar tabla saved_jobs
-- saved_jobs existía sin migración formal. Se crea idempotentemente con el
-- esquema completo reverse-engineered del frontend actual.
-- EJECUTAR antes de 011. Idempotente: seguro correr múltiples veces.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.saved_jobs (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Campos de identificación de la vacante
  titulo        TEXT,
  empresa       TEXT,
  descripcion   TEXT,
  job_data      JSONB,                          -- Blob estructurado del job (de CVvsJob)
  job_key       TEXT,                           -- Clave de cache / link a job_checks

  -- Estado del pipeline
  estado        TEXT        NOT NULL DEFAULT 'Descubierto',
  etapas_fechas JSONB       NOT NULL DEFAULT '{}'::jsonb,  -- { "Aplicado": ISO, "Entrevista": ISO }

  -- Notas y contacto
  notas         TEXT,
  contacto      JSONB       NOT NULL DEFAULT '{}'::jsonb,

  -- Interacción
  liked         BOOLEAN     NOT NULL DEFAULT false,

  -- Timestamps
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────
-- Índices base (los compuestos van en M014)
-- ─────────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_saved_jobs_user_id
  ON public.saved_jobs(user_id);

CREATE INDEX IF NOT EXISTS idx_saved_jobs_job_key
  ON public.saved_jobs(job_key)
  WHERE job_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_saved_jobs_user_estado
  ON public.saved_jobs(user_id, estado);

CREATE INDEX IF NOT EXISTS idx_saved_jobs_created
  ON public.saved_jobs(created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────
-- Trigger updated_at
-- ─────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_saved_jobs_updated_at ON public.saved_jobs;
CREATE TRIGGER trg_saved_jobs_updated_at
  BEFORE UPDATE ON public.saved_jobs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────
-- RLS — política temporal B2C para no romper la app antes de M015
-- M015 reemplaza esta política por el set multi-tenant completo
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "saved_jobs_temp_user_own" ON public.saved_jobs;
CREATE POLICY "saved_jobs_temp_user_own" ON public.saved_jobs
  FOR ALL
  USING (
    auth.uid() = user_id
    OR (auth.jwt()->>'role') = 'service_role'
  )
  WITH CHECK (
    auth.uid() = user_id
    OR (auth.jwt()->>'role') = 'service_role'
  );

-- FIN MIGRATION 010
