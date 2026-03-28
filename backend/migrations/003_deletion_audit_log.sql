-- ============================================================
-- Migración: Tabla de auditoría para cumplimiento legal (GDPR/LGPD)
-- Registra cada borrado de usuario con razón y admin responsable
-- ============================================================

CREATE TABLE IF NOT EXISTS public.deletion_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deleted_user_id UUID NOT NULL,
  deleted_user_email VARCHAR(255) NOT NULL,
  admin_id UUID NOT NULL,
  admin_email VARCHAR(255) NOT NULL,
  reason VARCHAR(500),
  status VARCHAR(50) NOT NULL DEFAULT 'completed', -- 'pending', 'completed', 'failed'
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,

  CONSTRAINT fk_admin FOREIGN KEY (admin_id)
    REFERENCES auth.users(id) ON DELETE CASCADE
);

-- RLS: Solo admins pueden ver logs de borrado
ALTER TABLE public.deletion_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins view deletion logs" ON public.deletion_audit_log;
CREATE POLICY "Admins view deletion logs"
  ON public.deletion_audit_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Índices para queries rápidas
CREATE INDEX IF NOT EXISTS idx_deletion_audit_user_id
  ON public.deletion_audit_log(deleted_user_id);
CREATE INDEX IF NOT EXISTS idx_deletion_audit_admin_id
  ON public.deletion_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_deletion_audit_created_at
  ON public.deletion_audit_log(created_at DESC);
