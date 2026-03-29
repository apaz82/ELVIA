-- ═══════════════════════════════════════════════════════════════
-- Migración 002 — Sistema de Códigos de Acceso
-- Ejecutar en: Supabase > SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- ── Tabla principal de códigos ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.access_codes (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  code        TEXT        UNIQUE NOT NULL,
  plan        TEXT        NOT NULL CHECK (plan IN ('semanal', 'mensual', 'trimestral')),
  max_uses    INTEGER     NOT NULL DEFAULT 1,
  uses_count  INTEGER     NOT NULL DEFAULT 0,
  expires_at  TIMESTAMPTZ NULL,                   -- cuándo vence el CÓDIGO (no el plan)
  notes       TEXT        NULL,
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Tabla de redenciones ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.code_redemptions (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id      UUID        NOT NULL REFERENCES public.access_codes(id) ON DELETE CASCADE,
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_granted TEXT        NOT NULL,
  redeemed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, code_id)   -- un usuario no puede redimir el mismo código dos veces
);

-- ── Trigger: incrementar uses_count automáticamente ──────────
CREATE OR REPLACE FUNCTION public.fn_increment_code_uses()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.access_codes
  SET uses_count = uses_count + 1
  WHERE id = NEW.code_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_increment_code_uses ON public.code_redemptions;
CREATE TRIGGER trg_increment_code_uses
  AFTER INSERT ON public.code_redemptions
  FOR EACH ROW EXECUTE FUNCTION public.fn_increment_code_uses();

-- ── Row Level Security ────────────────────────────────────────

ALTER TABLE public.access_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.code_redemptions ENABLE ROW LEVEL SECURITY;

-- Códigos: cualquier usuario autenticado puede leer (necesario para validar)
DROP POLICY IF EXISTS "Codigos legibles por usuarios auth" ON public.access_codes;
CREATE POLICY "Codigos legibles por usuarios auth"
  ON public.access_codes FOR SELECT
  TO authenticated
  USING (true);

-- Códigos: solo admins pueden insertar/actualizar/eliminar
DROP POLICY IF EXISTS "Admins gestionan codigos" ON public.access_codes;
CREATE POLICY "Admins gestionan codigos"
  ON public.access_codes FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Redenciones: usuario puede ver las propias; admins ven todas
DROP POLICY IF EXISTS "Ver propias redenciones" ON public.code_redemptions;
CREATE POLICY "Ver propias redenciones"
  ON public.code_redemptions FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Redenciones: usuario puede insertar la suya propia
DROP POLICY IF EXISTS "Insertar propia redencion" ON public.code_redemptions;
CREATE POLICY "Insertar propia redencion"
  ON public.code_redemptions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ── Índices ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_access_codes_code      ON public.access_codes(code);
CREATE INDEX IF NOT EXISTS idx_access_codes_is_active ON public.access_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_redemptions_user_id    ON public.code_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_code_id    ON public.code_redemptions(code_id);
