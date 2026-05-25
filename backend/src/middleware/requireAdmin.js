// Middleware factory para verificar roles de admin
// Uso: router.get('/ruta', auth, requireRole('super_admin'), handler)
//      router.get('/ruta', auth, requireRole('company_admin'), handler)

const requireRole = (minRole = 'company_admin') => async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  const db = req.supabase;

  try {
    let adminRole = null;
    let companyId = null;
    let finalProfile = null;

    // 1. Check administrators table (B2C)
    const { data: adminRecord, error: adminError } = await db
      .from('administrators')
      .select('role')
      .eq('id', req.user.id)
      .single();

    if (!adminError && adminRecord && adminRecord.role === 'super_admin') {
      adminRole = 'super_admin';
      finalProfile = adminRecord;
    } else {
      // 2. Fallback to profiles table (B2B company_admin)
      const { data: userProfile, error } = await db
        .from('profiles')
        .select('role, company_id')
        .eq('id', req.user.id)
        .single();
      
      if (!error && userProfile) {
        adminRole = userProfile.role;
        companyId = userProfile.company_id;
        finalProfile = userProfile;

        // Verificar si el tenant exige MFA para que requireMFA pueda actuar
        if (companyId) {
          const { data: co } = await db.from('companies').select('require_mfa').eq('id', companyId).maybeSingle()
          if (co?.require_mfa) req.companyRequiresMFA = true
        }
      }
    }

    if (!adminRole) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    // Super admin siempre puede
    if (adminRole === 'super_admin') {
      req.adminRole = 'super_admin';
      req.companyId = null;
      req.adminProfile = finalProfile;
      return next();
    }

    // Company admin solo para rutas que no exigen super_admin
    if (adminRole === 'company_admin' && minRole === 'company_admin') {
      req.adminRole = 'company_admin';
      req.companyId = companyId;
      req.adminProfile = finalProfile;
      return next();
    }

    res.status(403).json({ error: 'Acceso denegado. Permisos insuficientes.' });
  } catch (err) {
    console.error('[requireRole] Error:', err);
    res.status(500).json({ error: 'Error verificando permisos' });
  }
};

module.exports = requireRole;
