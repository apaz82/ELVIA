// Cliente de Supabase para el backend
const { createClient } = require('@supabase/supabase-js');

// Cliente base (anon) — solo para verificar JWTs en el middleware de auth
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Cliente autenticado con el JWT del usuario
// Permite que RLS identifique al usuario y aplique sus políticas correctamente
const crearClienteAutenticado = (token) => {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
    }
  );
};

// Cliente con service role key — permisos totales (para operaciones sensibles)
// NUNCA exponer al frontend
// Creación condicional: si la key no está, el servidor arranca igual y solo fallan las rutas admin
const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null;

module.exports = { supabase, crearClienteAutenticado, supabaseAdmin };
