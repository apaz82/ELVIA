// Middleware de autenticación — verifica el JWT de Supabase
const { supabase, crearClienteAutenticado } = require('../lib/supabase');

const auth = async (req, res, next) => {
  if (!supabase) {
    return res.status(500).json({ error: 'Backend mal configurado: Supabase no inicializado' });
  }
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  const token = authHeader.split(' ')[1];

  // Supabase verifica la firma del JWT y devuelve el usuario
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }

  // Adjuntar usuario y cliente autenticado a la request
  // req.supabase tiene el contexto del usuario → RLS funciona correctamente
  req.user = user;
  req.token = token;
  req.supabase = crearClienteAutenticado(token);
  next();
};

module.exports = auth;
