// tenantQuery — helper para queries siempre filtradas por company_id.
// Evita el patrón propenso a errores de olvidar .eq('company_id', companyId).
//
// API:
//   const tq = tenantQuery(db, req.companyId)
//
//   // SELECT / UPDATE / DELETE (filtro auto-aplicado)
//   await tq('profiles').select('id, email_principal')
//   await tq('cv_results').delete().eq('user_id', userId)
//
//   // INSERT / UPSERT (company_id auto-inyectado en rows)
//   await tq.insert('cv_results', { user_id, contenido, tipo })
//   await tq.upsert('company_allowlist', { email, nombre, status }, { onConflict: 'company_id,email' })
//
// Para tablas SIN company_id (companies, auth.users), usar db directamente.

const tenantQuery = (db, companyId) => {
  if (!companyId) {
    throw new Error('tenantQuery: companyId es requerido')
  }

  const builder = (table) => db.from(table).eq('company_id', companyId)

  // INSERT/UPSERT: inyectar company_id en cada row.
  builder.insert = (table, rows) => {
    const arr = Array.isArray(rows) ? rows : [rows]
    const stamped = arr.map(r => ({ ...r, company_id: companyId }))
    return db.from(table).insert(stamped)
  }

  builder.upsert = (table, rows, opts) => {
    const arr = Array.isArray(rows) ? rows : [rows]
    const stamped = arr.map(r => ({ ...r, company_id: companyId }))
    return db.from(table).upsert(stamped, opts)
  }

  return builder
}

module.exports = tenantQuery
