// Cron diario — disparo de emails de engagement por tenant
// Ruta: POST /api/admin/cron/email-triggers
// Protegido por CRON_SECRET en header Authorization: Bearer <secret>

const { supabaseAdmin } = require('../lib/supabase')
const {
  sendOnboarding1Email,
  sendOnboarding3Email,
  sendRecap7Email,
} = require('../services/resendService')

// Calcula días desde una fecha ISO
const daysSince = (isoDate) => {
  const diff = Date.now() - new Date(isoDate).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

// Inserta en email_log para dedup — retorna false si ya existe (ya fue enviado)
const markSent = async (userId, emailType) => {
  const { error } = await supabaseAdmin
    .from('email_log')
    .insert({ user_id: userId, email_type: emailType })
  // unique constraint violation (code 23505) = ya enviado
  if (error) {
    if (error.code === '23505') return false
    console.error(`[Cron] email_log insert error (${emailType}):`, error.message)
    return false
  }
  return true
}

// Extrae progreso del Gerente desde job_search_profile
const getProgreso = (jobSearchProfile) => {
  if (!jobSearchProfile) return 0
  return Number(jobSearchProfile.progreso_global || jobSearchProfile.progreso || 0)
}

// Cuenta cv_results de un usuario por subtipo
const contarResultados = async (userId, subtipo) => {
  const { data, error } = await supabaseAdmin
    .from('cv_results')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .contains('metadata', { subtipo })
  if (error) return 0
  return data ?? 0
}

/**
 * Procesa un candidato individual y dispara el email correspondiente si aplica.
 * Retorna el tipo de email enviado o null.
 */
const procesarCandidato = async (candidato, company) => {
  const {
    id: userId,
    email_principal: email,
    nombre1: nombre,
    apellido1: apellido,
    job_search_profile: jp,
    activated_at: activatedAt,
    license_expires_at: licenseExpiresAt,
  } = candidato

  if (!email || !activatedAt) return null

  const dias = daysSince(activatedAt)
  const progreso = getProgreso(jp)
  const loginUrl = `${process.env.FRONTEND_URL || 'https://elvia.lat'}/empresas/${company.slug}/login`
  const diasRestantes = licenseExpiresAt
    ? Math.max(0, Math.ceil((new Date(licenseExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 10

  const ctx = {
    nombre,
    companyName: company.name,
    primaryColor: company.primary_color,
    loginUrl,
    diasRestantes,
    progreso,
  }

  // --- Day+1: si >= 1 día y Gerente < 30% ---
  if (dias >= 1 && dias < 3 && progreso < 30) {
    const ok = await markSent(userId, 'onboarding_day1')
    if (ok) {
      await sendOnboarding1Email(email, ctx)
      return 'onboarding_day1'
    }
    return null
  }

  // --- Day+3: si >= 3 días y Gerente < 60% ---
  if (dias >= 3 && dias < 7 && progreso < 60) {
    const ok = await markSent(userId, 'onboarding_day3')
    if (ok) {
      await sendOnboarding3Email(email, { ...ctx })
      return 'onboarding_day3'
    }
    return null
  }

  // --- Day+7: recap siempre (independiente de progreso) ---
  if (dias >= 7 && dias < 9) {
    const ok = await markSent(userId, 'recap_day7')
    if (ok) {
      // Enriquecer con stats reales
      const cvGenerado = jp?.cv_confirmado || false
      const vacantesAnalizadas = await contarCvResults(userId, 'compatibility')
      const entrevistasSimuladas = await contarCvResults(userId, 'entrevista_simulada')
      await sendRecap7Email(email, {
        ...ctx,
        cvGenerado,
        vacantesAnalizadas,
        entrevistasSimuladas,
      })
      return 'recap_day7'
    }
    return null
  }

  return null
}

// Cuenta cv_results filtrando por subtipo en metadata
const contarCvResults = async (userId, subtipo) => {
  const { data, error } = await supabaseAdmin
    .from('cv_results')
    .select('id')
    .eq('user_id', userId)
  if (error || !data) return 0
  return data.filter(r => {
    try {
      const m = typeof r.metadata === 'string' ? JSON.parse(r.metadata) : (r.metadata || {})
      return m.subtipo === subtipo
    } catch { return false }
  }).length
}

/**
 * Handler principal del cron.
 * Itera todos los candidatos activos de todos los tenants y dispara emails según reglas.
 */
const runEmailTriggers = async (req, res) => {
  const results = { processed: 0, sent: [], skipped: 0, errors: [] }

  try {
    // Traer todas las empresas activas con datos de branding
    const { data: companies, error: compErr } = await supabaseAdmin
      .from('companies')
      .select('id, name, slug, primary_color, plan')
      .eq('is_active', true)

    if (compErr) throw new Error('Error leyendo companies: ' + compErr.message)

    for (const company of (companies || [])) {
      // Traer candidatos activos de esta empresa (no admins)
      const { data: candidatos, error: candErr } = await supabaseAdmin
        .from('profiles')
        .select('id, email_principal, nombre1, apellido1, job_search_profile, activated_at, license_expires_at')
        .eq('company_id', company.id)
        .neq('role', 'company_admin')
        .not('activated_at', 'is', null)

      if (candErr) {
        results.errors.push(`company ${company.id}: ${candErr.message}`)
        continue
      }

      for (const candidato of (candidatos || [])) {
        results.processed++
        try {
          const tipo = await procesarCandidato(candidato, company)
          if (tipo) {
            results.sent.push({ userId: candidato.id, tipo, company: company.slug })
          } else {
            results.skipped++
          }
        } catch (err) {
          console.error(`[Cron] Error procesando candidato ${candidato.id}:`, err.message)
          results.errors.push(`user ${candidato.id}: ${err.message}`)
        }
      }
    }

    console.log('[Cron] email-triggers completado:', results)
    res.json({ ok: true, ...results })
  } catch (err) {
    console.error('[Cron] Error fatal:', err.message)
    res.status(500).json({ ok: false, error: err.message })
  }
}

module.exports = { runEmailTriggers }
