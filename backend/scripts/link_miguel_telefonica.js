// Script para asociar al usuario Miguel Ramírez al tenant de Telefónica B2B
// Uso: cd backend && node scripts/link_miguel_telefonica.js

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const { createClient } = require('@supabase/supabase-js')

const SB_URL = process.env.SUPABASE_URL
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SB_URL || !SB_KEY) {
  console.error('ERROR: Falta SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el .env')
  process.exit(1)
}

const db = createClient(SB_URL, SB_KEY)
const TARGET_EMAIL = 'miguel.ramirez@elvia.demo'
const COMPANY_SLUG = 'telefonica'
const COHORT = 'telefonica-2026-05'

async function main() {
  console.log(`\nAsociando usuario '${TARGET_EMAIL}' al tenant de Telefónica...`)

  // 1. Obtener ID de la empresa por slug
  const { data: company, error: cErr } = await db
    .from('companies')
    .select('id, name')
    .eq('slug', COMPANY_SLUG)
    .single()

  if (cErr || !company) {
    console.error(`ERROR: No se encontró la empresa con slug '${COMPANY_SLUG}':`, cErr?.message)
    process.exit(1)
  }
  console.log(`Empresa: ${company.name} (${company.id})`)

  // 2. Buscar perfil de Miguel Ramírez
  const { data: profile, error: pFetchErr } = await db
    .from('profiles')
    .select('id, email_principal')
    .ilike('email_principal', TARGET_EMAIL)
    .maybeSingle()

  if (pFetchErr || !profile) {
    console.error(`ERROR: No se encontró el perfil para '${TARGET_EMAIL}':`, pFetchErr?.message)
    process.exit(1)
  }
  console.log(`Perfil encontrado con ID: ${profile.id}`)

  // 3. Actualizar perfil vinculándolo a la empresa y cohorte
  const { error: pUpdErr } = await db
    .from('profiles')
    .update({
      company_id: company.id,
      cohort: COHORT,
      role: 'user', // Asegurar que sea rol usuario final
      plan: 'pro'  // Plan corporativo
    })
    .eq('id', profile.id)

  if (pUpdErr) {
    console.error('ERROR al actualizar perfil:', pUpdErr.message)
    process.exit(1)
  }
  console.log('Perfil de Miguel actualizado con company_id y cohorte corporativo.')

  // 4. Asegurar entrada en la allowlist como 'activated'
  const allowlistRow = {
    company_id: company.id,
    email: TARGET_EMAIL.toLowerCase(),
    nombre: 'Miguel',
    apellido: 'Ramirez',
    cohort: COHORT,
    area: 'Operaciones',
    cargo_actual: 'Gerente de Operaciones',
    status: 'activated',
    activated_at: new Date().toISOString(),
    activated_user_id: profile.id
  }

  const { error: alErr } = await db
    .from('company_allowlist')
    .upsert([allowlistRow], { onConflict: 'company_id,email' })

  if (alErr) {
    console.error('ERROR al insertar/actualizar en allowlist:', alErr.message)
    process.exit(1)
  }

  console.log('\n===============================================================')
  console.log('¡VINCULACIÓN COMPLETADA CON ÉXITO!')
  console.log(`El usuario '${TARGET_EMAIL}' ahora pertenece al tenant '${company.name}'`)
  console.log(`Ahora las solicitudes de login e integración desde este usuario`)
  console.log(`cargarán el branding B2B y las herramientas corporativas correctas.`)
  console.log('===============================================================\n')
}

main().catch(e => {
  console.error('Excepción no controlada:', e)
  process.exit(1)
})
