// Middleware: requireTenantContext
// Verifica que req.companyId esté disponible tras requireRole('company_admin').
// Bloquea rutas que exigen un tenant específico cuando el caller es super_admin
// sin company_id explícita (o cuando requireRole no corrió antes).
//
// Uso:
//   router.get('/users', auth, requireRole('company_admin'), requireTenantContext, handler)
//
// Si necesitas permitir super_admin con company_id override por query param, hazlo en el handler.

const requireTenantContext = (req, res, next) => {
  if (!req.companyId) {
    return res.status(400).json({
      error: 'Esta operación requiere un contexto de empresa. Especifica el company_id.',
      code: 'MISSING_TENANT_CONTEXT',
    })
  }
  next()
}

module.exports = requireTenantContext
