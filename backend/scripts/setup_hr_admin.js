// Script para configurar el usuario Administrador de RRHH para Telefónica B2B en producción
// Uso: cd backend && node scripts/setup_hr_admin.js

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const { createClient } = require('@supabase/supabase-js')

const SB_URL = process.env.SUPABASE_URL
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SB_URL || !SB_KEY) {
  console.error('ERROR: Falta SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el .env')
  process.exit(1)
}

const db = createClient(SB_URL, SB_KEY)
const ADMIN_EMAIL = 'hr.telefonica@elvia.demo'
const COMPANY_SLUG = 'telefonica'

async function main() {
  console.log(`\nConfigurando permisos de Administrador de RRHH para '${ADMIN_EMAIL}'...`)

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

  // 2. Buscar perfil de Administración
  const { data: profile, error: pFetchErr } = await db
    .from('profiles')
    .select('id, email_principal')
    .ilike('email_principal', ADMIN_EMAIL)
    .maybeSingle()

  if (pFetchErr || !profile) {
    console.error(`ERROR: No se encontró el perfil de admin para '${ADMIN_EMAIL}':`, pFetchErr?.message)
    process.exit(1)
  }
  console.log(`Perfil encontrado con ID: ${profile.id}`)

  // 3. Actualizar perfil vinculándolo como company_admin de Telefónica
  const { error: pUpdErr } = await db
    .from('profiles')
    .update({
      company_id: company.id,
      role: 'company_admin', // Rol crucial para saltar el middleware de autorización
      plan: 'pro'
    })
    .eq('id', profile.id)

  if (pUpdErr) {
    console.error('ERROR al actualizar perfil de administrador:', pUpdErr.message)
    process.exit(1)
  }

  console.log('\n===============================================================')
  console.log('¡CONFIGURACIÓN DE RRHH COMPLETADA CON ÉXITO!')
  console.log(`- Correo de Admin: ${ADMIN_EMAIL}`)
  console.log(`- Empresa asignada: ${company.name}`)
  console.log(`- Rol de Seguridad: company_admin (Autorizado)`)
  console.log('\nEl panel de administración B2B ya está completamente desbloqueado.')
  console.log('===============================================================\n')
}

main().catch(e => {
  console.error('Excepción no controlada:', e)
  process.exit(1)
})
