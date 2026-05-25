// tenantQuery — helper para queries siempre filtradas por company_id.
// Evita el patrón propenso a errores de olvidar .eq('company_id', companyId).
//
// Uso:
//   const q = tenantQuery(db, req.companyId)
//   const { data } = await q('profiles').select('id, email_principal').order('created_at')
//   const { data } = await q('cv_results').select('*').eq('user_id', userId)
//
// Retorna un builder de Supabase con company_id ya aplicado.
// Para tablas SIN company_id (companies, company_invitations), usar db directamente.

const tenantQuery = (db, companyId) => (table) => {
  if (!companyId) {
    throw new Error(`tenantQuery: companyId es requerido para tabla "${table}"`)
  }
  return db.from(table).eq('company_id', companyId)
}

module.exports = tenantQuery
