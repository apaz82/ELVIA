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

module.exports = { supabase, crearClienteAutenticado };
