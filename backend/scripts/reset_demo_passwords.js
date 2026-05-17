// Reset de contraseña para los 10 usuarios demo de Telefonica (cohort telefonica-2026-05).
// Uso: cd backend && node scripts/reset_demo_passwords.js
//
// Usa supabase admin.updateUserById que SI sobreescribe la contraseña existente.
// admin.createUser falla si el email existe — por eso necesitamos updateUserById aparte.

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const { createClient } = require('@supabase/supabase-js')

const SB_URL = process.env.SUPABASE_URL
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SB_URL || !SB_KEY) {
  console.error('FALTA: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env')
  process.exit(1)
}

const db = createClient(SB_URL, SB_KEY)
const NEW_PASSWORD = 'DemoElvia2026!'

const DEMO_EMAILS = [
  'carmen.iglesias@elvia.demo',
  'david.ruiz@elvia.demo',
  'laura.fernandez@elvia.demo',
  'javier.gomez@elvia.demo',
  'sofia.lopez@elvia.demo',
  'marcos.hernandez@elvia.demo',
  'isabel.vargas@elvia.demo',
  'pablo.martinez@elvia.demo',
  'andrea.santos@elvia.demo',
  'roberto.castro@elvia.demo',
]

async function main() {
  console.log('Reseteando password de', DEMO_EMAILS.length, 'usuarios demo a:', NEW_PASSWORD, '\n')

  // Listar todos los usuarios para encontrar los IDs por email
  const { data: listData, error: listErr } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (listErr) {
    console.error('Error listando users:', listErr.message)
    process.exit(1)
  }

  const byEmail = new Map()
  for (const u of (listData?.users || [])) {
    byEmail.set((u.email || '').toLowerCase(), u)
  }

  let ok = 0, missing = 0, errors = 0

  for (const email of DEMO_EMAILS) {
    const u = byEmail.get(email)
    if (!u) {
      console.error('  [no-existe]', email)
      missing++
      continue
    }
    const { error: updErr } = await db.auth.admin.updateUserById(u.id, {
      password: NEW_PASSWORD,
      email_confirm: true,
    })
    if (updErr) {
      console.error('  [error]', email, updErr.message)
      errors++
    } else {
      console.log('  [ok]', email)
      ok++
    }
  }

  console.log('\nResumen:')
  console.log('  Resets exitosos:', ok)
  console.log('  No encontrados :', missing)
  console.log('  Errores        :', errors)
  console.log('\nAhora puedes iniciar sesion con cualquiera de estos emails y la password:', NEW_PASSWORD)
}

main().catch(e => { console.error(e); process.exit(1) })
