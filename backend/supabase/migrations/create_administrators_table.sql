-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRACIÓN: CREACIÓN DE TABLA DE ADMINISTRADORES INDEPENDIENTE
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.administrators (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('super_admin', 'billing', 'support', 'auditor')),
  permissions JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.administrators ENABLE ROW LEVEL SECURITY;

-- Políticas de Seguridad (RLS)
-- Los administradores pueden ver sus propios datos, y los super_admin pueden ver todos.
CREATE POLICY "Admins see own data and super admins see all" ON public.administrators
  FOR SELECT TO authenticated
  USING (
    auth.uid() = id OR 
    EXISTS (SELECT 1 FROM public.administrators WHERE id = auth.uid() AND role = 'super_admin' AND is_active = true)
  );

-- Solo los super_admin pueden insertar/modificar administradores
CREATE POLICY "Super admins can manage administrators" ON public.administrators
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.administrators WHERE id = auth.uid() AND role = 'super_admin' AND is_active = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.administrators WHERE id = auth.uid() AND role = 'super_admin' AND is_active = true)
  );

-- Opcionalmente: Migrar automáticamente a los super_admin existentes desde la tabla profiles
-- Puedes ejecutar esto si deseas que tus actuales admins pasen directo a esta tabla:
/*
INSERT INTO public.administrators (id, email, nombre, role)
SELECT id, email_principal, nombre1, 'super_admin'
FROM public.profiles 
WHERE role = 'super_admin'
ON CONFLICT (id) DO NOTHING;
*/
