// logAudit — registra acciones B2B en tenant_audit_log.
// Nunca lanza — los errores de audit no deben romper el flujo principal.
//
// Uso:
//   await logAudit(supabaseAdmin, {
//     company_id, user_id, action: 'tenant_created',
//     entity: 'companies', entity_id: company.id,
//     metadata: { slug, hr_email },
//   })

const logAudit = async (db, { company_id, user_id, action, entity, entity_id, metadata = {} }) => {
  try {
    await db.from('tenant_audit_log').insert({ company_id, user_id, action, entity, entity_id, metadata })
  } catch (err) {
    console.error('[AuditLog] Error registrando acción:', action, err.message)
  }
}

module.exports = logAudit
