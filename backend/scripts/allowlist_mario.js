// Script para aislar y preparar el usuario Mario Bahamonde para Telefónica B2B
// Uso: cd backend && node scripts/allowlist_mario.js
// Requiere: SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY en el .env de backend

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const { createClient } = require('@supabase/supabase-js')

const SB_URL = process.env.SUPABASE_URL
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SB_URL || !SB_KEY) {
  console.error('ERROR: Falta SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en backend/.env')
  process.exit(1)
}

const db = createClient(SB_URL, SB_KEY)
const TARGET_EMAIL = 'mario.bahamonde@telefonica.com'
const COMPANY_SLUG = 'telefonica'
const COHORT = 'telefonica-2026-05'

async function main() {
  console.log(`\nIniciando preparación del ambiente de pruebas para: ${TARGET_EMAIL}...`)

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
  console.log(`Empresa encontrada: ${company.name} (${company.id})`)

  // 2. Buscar si ya existe el usuario en Auth para asegurar que sea "desde cero"
  console.log('Verificando cuentas existentes en Supabase Auth...')
  const { data: listData, error: listErr } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (listErr) {
    console.error('ERROR al listar usuarios de auth:', listErr.message)
    process.exit(1)
  }

  const found = (listData?.users || []).find(u => (u.email || '').toLowerCase() === TARGET_EMAIL.toLowerCase())

  if (found) {
    console.log(`Usuario existente encontrado en Auth con ID: ${found.id}. Eliminando para iniciar desde cero...`)
    
    // Al borrar el usuario de Auth, Supabase elimina en cascada el Profile y registros asociados
    const { error: delErr } = await db.auth.admin.deleteUser(found.id)
    if (delErr) {
      console.error('ERROR al eliminar el usuario de Auth:', delErr.message)
      process.exit(1)
    }
    console.log('Usuario previo eliminado exitosamente de Auth.')
  } else {
    console.log('No existe ningún usuario previo registrado con este correo.')
  }

  // 3. Eliminar de company_allowlist si ya existía para evitar conflictos
  console.log('Removiendo entradas anteriores en la lista permitida...')
  const { error: delAlErr } = await db
    .from('company_allowlist')
    .delete()
    .eq('company_id', company.id)
    .ilike('email', TARGET_EMAIL)

  if (delAlErr) {
    console.warn('Advertencia al limpiar la lista permitida:', delAlErr.message)
  }

  // 4. Agregar a la tabla company_allowlist con status = 'pending'
  console.log('Registrando nueva entrada pre-aprobada (PENDING)...')
  const newRow = {
    company_id: company.id,
    email: TARGET_EMAIL.toLowerCase(),
    nombre: 'Mario',
    apellido: 'Bahamonde',
    cohort: COHORT,
    area: 'Dirección',
    cargo_actual: 'Director General',
    status: 'pending'
  }

  const { error: insErr } = await db
    .from('company_allowlist')
    .insert([newRow])

  if (insErr) {
    console.error('ERROR al insertar en company_allowlist:', insErr.message)
    process.exit(1)
  }

  console.log('\n===============================================================')
  console.log('¡PROCESO COMPLETADO CON ÉXITO!')
  console.log(`- Correo: ${TARGET_EMAIL}`)
  console.log(`- Empresa vinculada: ${company.name}`)
  console.log(`- Cohorte: ${COHORT}`)
  console.log('- Estado de registro: PENDING (Listo para registrarse "desde cero")')
  console.log('\nMario ya puede acceder a la plataforma y crear su cuenta en:')
  console.log(`👉 https://www.elvia.lat/empresas/${COMPANY_SLUG}`)
  console.log('===============================================================\n')
}

main().catch(e => {
  console.error('Excepción no controlada en el script:', e)
  process.exit(1)
})
