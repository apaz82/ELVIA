-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRACIÓN: FIX RLS ADMINISTRATORS
-- ═══════════════════════════════════════════════════════════════════════════

-- Eliminar las políticas conflictivas que causan recursión infinita
DROP POLICY IF EXISTS "Admins see own data and super admins see all" ON public.administrators;
DROP POLICY IF EXISTS "Super admins can manage administrators" ON public.administrators;

-- Crear una política segura y simple: Cada administrador puede ver y editar sus propios datos
CREATE POLICY "Admins see own data" ON public.administrators
  FOR SELECT TO authenticated
  USING ( auth.uid() = id );

CREATE POLICY "Admins can update own data" ON public.administrators
  FOR UPDATE TO authenticated
  USING ( auth.uid() = id );
