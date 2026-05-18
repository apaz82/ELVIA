// 4 perfiles demo B2C — "primera vez": onboarding completo, datos básicos llenos,
// Gerente de Búsqueda en 0% (job_search_profile vacío), sin uso de herramientas.
//
// Uso: cd backend && node scripts/seed_demo_fresh_b2c.js
// Requiere: SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY en .env

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const { createClient } = require('@supabase/supabase-js')

const SB_URL = process.env.SUPABASE_URL
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SB_URL || !SB_KEY) {
  console.error('FALTA: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env')
  process.exit(1)
}

const db = createClient(SB_URL, SB_KEY)

const DEMO_PASSWORD = 'DemoElvia2026!'

// Datos básicos llenos (nombre1 presente → no va a /bienvenida, va directo a /proyecto-laboral)
// job_search_profile: null → Gerente al 0%, plan mensual → features desbloqueadas
const DEMO_USERS = [
  {
    email:      'valentina.torres@elvia.demo',
    nombre1:    'Valentina',
    apellido1:  'Torres',
    pais:       'Colombia',
    ciudad:     'Medellín',
    indicativo1:'+57',
    telefono1:  '3001234567',
    edad:       28,
    nota:       'Analista de Marketing · Medellín · sin uso de herramientas',
  },
  {
    email:      'miguel.ramirez@elvia.demo',
    nombre1:    'Miguel',
    apellido1:  'Ramirez',
    pais:       'México',
    ciudad:     'Monterrey',
    indicativo1:'+52',
    telefono1:  '8112345678',
    edad:       38,
    nota:       'Gerente de Operaciones · Monterrey · sin uso de herramientas',
  },
  {
    email:      'carolina.silva@elvia.demo',
    nombre1:    'Carolina',
    apellido1:  'Silva',
    pais:       'Argentina',
    ciudad:     'Buenos Aires',
    indicativo1:'+54',
    telefono1:  '1156789012',
    edad:       42,
    nota:       'Directora de RRHH · Buenos Aires · sin uso de herramientas',
  },
  {
    email:      'andres.morales@elvia.demo',
    nombre1:    'Andrés',
    apellido1:  'Morales',
    pais:       'Chile',
    ciudad:     'Santiago',
    indicativo1:'+56',
    telefono1:  '912345678',
    edad:       47,
    nota:       'CFO · Santiago · sin uso de herramientas',
  },
]

async function main() {
  let created = 0, updated = 0, errors = 0

  for (const u of DEMO_USERS) {
    const profile = {
      email_principal:    u.email,
      nombre1:            u.nombre1,
      apellido1:          u.apellido1,
      nombre:             u.nombre1 + ' ' + u.apellido1,
      pais:               u.pais,
      ciudad:             u.ciudad,
      indicativo1:        u.indicativo1,
      telefono1:          u.telefono1,
      edad:               u.edad,
      job_search_profile: null,         // Gerente 0%
      role:               'user',
      plan:               'trimestral',
      plan_expires_at:    '2026-08-20T23:59:59Z', // 3 meses desde demo May 20
      cv_optimizer_count: 0,
      cv_match_count:     0,
      usage_count:        0,
    }

    // Buscar si ya existe en auth
    const { data: listData } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 })
    const found = (listData?.users || []).find(au => (au.email || '').toLowerCase() === u.email.toLowerCase())

    let userId
    if (found) {
      userId = found.id
      // Reset password para asegurar que es la correcta
      await db.auth.admin.updateUserById(userId, { password: DEMO_PASSWORD })
      console.log('  [exists]', u.email, '— password reseteada')
      updated++
    } else {
      const { data: newUser, error: aErr } = await db.auth.admin.createUser({
        email:         u.email,
        password:      DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: { demo: true, pais: u.pais },
      })
      if (aErr) {
        console.error('  [auth-error]', u.email, aErr.message)
        errors++
        continue
      }
      userId = newUser.user.id
      console.log('  [created]', u.email)
      created++
    }

    // Upsert profile
    const { error: pErr } = await db
      .from('profiles')
      .upsert([{ id: userId, ...profile }], { onConflict: 'id' })

    if (pErr) {
      console.error('  [profile-error]', u.email, pErr.message)
      errors++
    }
  }

  console.log('\n=== Perfiles demo B2C (primera vez — datos básicos llenos) ===')
  DEMO_USERS.forEach(u => console.log(' ', u.email, ' —', u.nota))
  console.log('\nPassword:', DEMO_PASSWORD)
  console.log('Estado:')
  console.log('  · onboarding completo (nombre1 presente → login va a /proyecto-laboral)')
  console.log('  · datos personales pre-llenos (nombre, país, ciudad, teléfono, edad)')
  console.log('  · Gerente de Búsqueda en 0% (job_search_profile null)')
  console.log('  · plan trimestral · vigente hasta 2026-08-20')
  console.log('  · sin uso de herramientas (cv_count=0, usage=0)')
  console.log('\nCreados:', created, '| Actualizados:', updated, '| Errores:', errors)
}

main().catch(e => { console.error(e); process.exit(1) })
