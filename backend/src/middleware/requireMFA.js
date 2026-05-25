// requireMFA — verifica que la sesión JWT tenga aal=aal2 (MFA verificado).
// Solo aplica si la empresa tiene require_mfa = true.
// Uso: debe ejecutarse DESPUÉS de auth y requireRole.
//
// Para activar en una ruta:
//   router.get('/dashboard', auth, requireRole('company_admin'), requireMFA, handler)
//
// Para activar MFA en un tenant:
//   UPDATE companies SET require_mfa = true WHERE slug = 'cliente-slug';

const requireMFA = (req, res, next) => {
  // req.companyRequiresMFA es seteado por requireRole cuando el perfil tiene company_id
  // y la empresa tiene require_mfa = true. Si no está presente, no bloqueamos.
  if (!req.companyRequiresMFA) return next()

  try {
    // Decodificar el payload del JWT (sin re-verificar firma — auth.js ya lo hizo)
    const payload = JSON.parse(
      Buffer.from(req.token.split('.')[1], 'base64url').toString()
    )
    if (payload.aal !== 'aal2') {
      return res.status(403).json({
        error: 'Este programa requiere verificación de doble factor (MFA).',
        code: 'MFA_REQUIRED',
      })
    }
  } catch {
    // Fail-closed: si no se puede decodificar el payload de un tenant que exige MFA,
    // bloqueamos por seguridad. Mejor un falso positivo que un bypass silencioso.
    return res.status(403).json({
      error: 'No se pudo verificar el factor MFA. Intenta iniciar sesión de nuevo.',
      code: 'MFA_VERIFICATION_FAILED',
    })
  }

  next()
}

module.exports = requireMFA
