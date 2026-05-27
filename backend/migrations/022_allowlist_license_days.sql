-- Migration 022: Días de licencia por participante en company_allowlist
-- Permite que HR defina cuántos días de acceso tiene cada invitado.
-- license_expires_at se calcula al activar: activated_at + license_days.

BEGIN;

ALTER TABLE public.company_allowlist
  ADD COLUMN IF NOT EXISTS license_days        INT          DEFAULT 90,
  ADD COLUMN IF NOT EXISTS license_expires_at  TIMESTAMPTZ;

COMMENT ON COLUMN public.company_allowlist.license_days IS
  'Días de vigencia de la licencia desde la activación (default 90).';
COMMENT ON COLUMN public.company_allowlist.license_expires_at IS
  'Fecha calculada: activated_at + license_days. Se fija al confirmar activación.';

COMMIT;
