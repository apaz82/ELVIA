// Middleware de auditoría para acciones del panel admin
// Se conecta al evento 'finish' de la respuesta para loguear sin bloquear el request
// Solo audita métodos con efecto: POST, PUT, PATCH, DELETE

const { supabaseAdmin } = require('../lib/supabase');

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const auditAdmin = (req, res, next) => {
  if (!MUTATING_METHODS.has(req.method)) return next();

  res.on('finish', () => {
    if (!supabaseAdmin) return;

    const entry = {
      admin_id:    req.user?.id    || null,
      admin_email: req.user?.email || null,
      method:      req.method,
      path:        req.path,
      status_code: res.statusCode,
      ip:          req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket?.remoteAddress || null,
      user_agent:  req.headers['user-agent']?.slice(0, 200) || null,
    };

    supabaseAdmin
      .from('admin_audit_log')
      .insert(entry)
      .then(({ error }) => {
        if (error) console.error('[auditAdmin] Error al insertar log:', error.message);
      });
  });

  next();
};

module.exports = auditAdmin;
