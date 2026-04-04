// Middleware factory para verificar roles de admin
// Uso: router.get('/ruta', auth, requireRole('super_admin'), handler)
//      router.get('/ruta', auth, requireRole('company_admin'), handler)

const requireRole = (minRole = 'company_admin') => async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  const db = req.supabase;

  try {
    const { data: profile, error } = await db
      .from('profiles')
      .select('role, company_id')
      .eq('id', req.user.id)
      .single();

    if (error || !profile) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    // Super admin siempre puede
    if (profile.role === 'super_admin') {
      req.adminRole = 'super_admin';
      req.companyId = null;
      req.adminProfile = profile;
      return next();
    }

    // Company admin solo para rutas que no exigen super_admin
    if (profile.role === 'company_admin' && minRole === 'company_admin') {
      req.adminRole = 'company_admin';
      req.companyId = profile.company_id;
      req.adminProfile = profile;
      return next();
    }

    res.status(403).json({ error: 'Acceso denegado. Permisos insuficientes.' });
  } catch (err) {
    console.error('[requireRole] Error:', err);
    res.status(500).json({ error: 'Error verificando permisos' });
  }
};

module.exports = requireRole;
