// Middleware reutilizable para verificar permisos de admin
// Uso: router.get('/admin-only', auth, requireAdmin, async (req, res) => { ... })

const requireAdmin = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  const db = req.supabase;

  try {
    const { data: profile, error } = await db
      .from('profiles')
      .select('is_admin')
      .eq('id', req.user.id)
      .single();

    if (error || !profile?.is_admin) {
      return res.status(403).json({
        error: 'Acceso denegado. Se requieren permisos de administrador.'
      });
    }

    // Adjuntar perfil al request para uso en rutas
    req.adminProfile = profile;
    next();
  } catch (err) {
    console.error('[requireAdmin] Error:', err);
    res.status(500).json({ error: 'Error verificando permisos' });
  }
};

module.exports = requireAdmin;
