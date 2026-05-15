-- ============================================================
-- Migración 006: Tabla de auditoría general de acciones admin
-- Registra todas las acciones POST/PUT/PATCH/DELETE del admin panel
-- Requerido para SOC2 CC6.3 (logical access logging)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id     UUID,
  admin_email  TEXT,
  method       TEXT NOT NULL,
  path         TEXT NOT NULL,
  status_code  INTEGER,
  ip           TEXT,
  user_agent   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: Solo super_admin puede leer el audit log
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admin puede leer audit log" ON public.admin_audit_log;
CREATE POLICY "Super admin puede leer audit log"
  ON public.admin_audit_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.administrators
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Nadie puede modificar ni borrar audit logs (inmutabilidad)
DROP POLICY IF EXISTS "Audit log es append-only" ON public.admin_audit_log;
CREATE POLICY "Audit log es append-only"
  ON public.admin_audit_log FOR INSERT
  WITH CHECK (true); -- El service_role lo inserta desde el backend

-- Índices para queries rápidas
CREATE INDEX IF NOT EXISTS idx_admin_audit_created_at ON public.admin_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_admin_id   ON public.admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_path        ON public.admin_audit_log(path);
