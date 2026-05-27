#!/usr/bin/env node
// Limpia usuarios demo + toda su data para empezar desde cero.
// Corre: node backend/scripts/delete-demo-users.js
// Requiere .env con SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
'use strict'

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const { createClient } = require('@supabase/supabase-js')

const EMAILS_TO_DELETE = [
  'alejo.paz0982@gmail.com',
  'alejo.pazdiaz82@gmail.com',
  'apaztalentsearch@gmail.com',
  'alejo.paz82@gmail.com',
  'mario.bahamonde@telefonica.com',
]

const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function run() {
  console.log('═══════════════════════════════════════════════')
  console.log('  DELETE DEMO USERS')
  console.log('═══════════════════════════════════════════════')
  console.log('Emails a borrar:')
  EMAILS_TO_DELETE.forEach(e => console.log(' •', e))
  console.log()

  // 1. Obtener IDs desde profiles
  const { data: profiles, error: profErr } = await db
    .from('profiles')
    .select('id, email_principal')
    .in('email_principal', EMAILS_TO_DELETE)

  if (profErr) {
    console.error('Error fetching profiles:', profErr.message)
    process.exit(1)
  }

  // También buscar desde auth.users (pueden existir sin perfil)
  const { data: authList } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 })
  const authUsers = (authList?.users || []).filter(u =>
    EMAILS_TO_DELETE.includes((u.email || '').toLowerCase())
  )

  // Unificar IDs
  const profileIds = (profiles || []).map(p => p.id)
  const authIds    = authUsers.map(u => u.id)
  const allIds     = [...new Set([...profileIds, ...authIds])]

  console.log(`Perfiles encontrados en DB : ${profileIds.length}`)
  console.log(`Usuarios en Auth           : ${authIds.length}`)
  console.log(`IDs únicos para borrar     : ${allIds.length}`)
  if (allIds.length === 0) {
    console.log('\nNo se encontraron usuarios. Nada que borrar.')
    return
  }
  console.log()

  // 2. Borrar data en orden seguro (FKs)
  const steps = [
    {
      table: 'tenant_audit_log',
      filter: q => q.in('user_id', allIds),
    },
    {
      table: 'cv_results',
      filter: q => q.in('user_id', allIds),
    },
    {
      table: 'saved_jobs',
      filter: q => q.in('user_id', allIds),
    },
    {
      table: 'job_checks',
      filter: q => q.in('user_id', allIds),
    },
    {
      table: 'linkedin_analyses',
      filter: q => q.in('user_id', allIds),
    },
    {
      table: 'company_invitations',
      filter: q => q.in('email', EMAILS_TO_DELETE),
    },
    {
      table: 'company_allowlist',
      filter: q => q.in('email', EMAILS_TO_DELETE),
    },
    {
      table: 'profiles',
      filter: q => q.in('id', allIds),
    },
  ]

  for (const step of steps) {
    const { error, count } = await step.filter(
      db.from(step.table).delete({ count: 'exact' })
    )
    if (error) {
      console.warn(`  ⚠️  ${step.table}: ${error.message}`)
    } else {
      console.log(`  ✅  ${step.table}: ${count ?? '?'} filas borradas`)
    }
  }

  // 3. Borrar de auth.users (ultimo — es la fuente de verdad)
  console.log('\n  Borrando de Auth...')
  for (const id of allIds) {
    const email = authUsers.find(u => u.id === id)?.email || id
    const { error } = await db.auth.admin.deleteUser(id)
    if (error) {
      console.warn(`  ⚠️  Auth delete ${email}: ${error.message}`)
    } else {
      console.log(`  ✅  Auth delete ${email}`)
    }
  }

  console.log('\n═══════════════════════════════════════════════')
  console.log('  Limpieza completa. Listo para demo desde cero.')
  console.log('═══════════════════════════════════════════════')
}

run().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
