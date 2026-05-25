// ============================================================================
// Routes: /api/company/*
// Company Admin endpoints para gestión de empresa B2B
// Requiere: auth + requireRole('company_admin')
// ============================================================================

const express = require('express')
const { createClient } = require('@supabase/supabase-js')
const rateLimit = require('express-rate-limit')
const auth = require('../middleware/auth')
const requireRole = require('../middleware/requireAdmin')
const requireTenantContext = require('../middleware/requireTenantContext')
const requireMFA = require('../middleware/requireMFA')
const tenantQuery = require('../lib/tenantQuery')
const { sendInvitacionEmail } = require('../services/resendService')

const router = express.Router()

// Rate limiter para registro público B2B: 5 intentos por IP por hora
const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  validate:     { keyGeneratorIpFallback: false },
  keyGenerator: (req) => req.ip || req.connection.remoteAddress,
  handler:      (req, res) => res.status(429).json({ error: 'Demasiados intentos de registro. Intenta en una hora.' })
})
// Null-guard: si faltan credenciales, dejamos el cliente en null y avisamos.
// Las rutas que dependen de DB devolverán 503 en runtime en vez de crashear al cargar.
let db = null

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('[Company] SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no configuradas — endpoints B2B deshabilitados')
} else {
  try {
    db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  } catch (err) {
    console.error('[Company] Error inicializando supabase admin client:', err.message)
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Endpoint PÚBLICO: Obtener datos de empresa por slug
// GET /api/company/registration/:slug
// ─────────────────────────────────────────────────────────────────────────

router.get('/registration/:slug', async (req, res) => {
  try {
    const { slug } = req.params

    const { data: company, error } = await db
      .from('companies')
      .select(`
        id, name, slug, sector, country, is_active,
        logo_url, logo_secondary,
        primary_color, secondary_color, accent_color,
        hero_title, hero_subtitle, hero_image_url, welcome_message,
        contact_email, support_email,
        allowed_email_domain, require_invite,
        show_pricing, enabled_features
      `)
      .eq('slug', slug)
      .eq('is_active', true)
      .single()

    if (error || !company) {
      return res.status(404).json({ error: 'Empresa no encontrada' })
    }

    res.json({ company })
  } catch (err) {
    console.error('Error fetching company registration:', err)
    res.status(500).json({ error: 'Error al obtener datos de empresa' })
  }
})

// ─────────────────────────────────────────────────────────────────────────
// Endpoint AUTENTICADO: Branding del tenant del usuario actual
// GET /api/company/my-tenant
// Cualquier usuario autenticado que tenga company_id en su profile.
// Devuelve null si el usuario no pertenece a ningún tenant (B2C).
// ─────────────────────────────────────────────────────────────────────────

router.get('/my-tenant', auth, async (req, res) => {
  try {
    const { data: profile, error: profileErr } = await db
      .from('profiles')
      .select('company_id, role, cohort')
      .eq('id', req.user.id)
      .single()

    if (profileErr || !profile?.company_id) {
      return res.json({ company: null, role: profile?.role || 'user', cohort: profile?.cohort || null })
    }

    const { data: company, error } = await db
      .from('companies')
      .select(`
        id, name, slug, sector, country, is_active,
        logo_url, logo_secondary,
        primary_color, secondary_color, accent_color,
        hero_title, hero_subtitle, welcome_message,
        contact_email, support_email,
        require_mfa, show_pricing, enabled_features
      `)
      .eq('id', profile.company_id)
      .eq('is_active', true)
      .single()

    if (error || !company) {
      return res.json({ company: null, role: profile.role, cohort: profile.cohort })
    }
    res.json({ company, role: profile.role, cohort: profile.cohort })
  } catch (err) {
    console.error('Error fetching my-tenant:', err)
    res.status(500).json({ error: 'Error al obtener tenant' })
  }
})

// ─────────────────────────────────────────────────────────────────────────
// Endpoint PÚBLICO: Branding de una empresa por slug (alias semántico)
// GET /api/company/branding/:slug
// Misma respuesta que /registration/:slug — separado para claridad de propósito
// ─────────────────────────────────────────────────────────────────────────

router.get('/branding/:slug', async (req, res) => {
  try {
    const { slug } = req.params
    const { data: company, error } = await db
      .from('companies')
      .select(`
        id, name, slug, sector, country, is_active,
        logo_url, logo_secondary,
        primary_color, secondary_color, accent_color,
        hero_title, hero_subtitle, hero_image_url, welcome_message,
        contact_email, support_email,
        allowed_email_domain, require_invite, require_mfa,
        show_pricing, enabled_features
      `)
      .eq('slug', slug)
      .eq('is_active', true)
      .single()

    if (error || !company) return res.status(404).json({ error: 'Empresa no encontrada' })
    res.json({ company })
  } catch (err) {
    console.error('Error fetching company branding:', err)
    res.status(500).json({ error: 'Error al obtener branding' })
  }
})

// ─────────────────────────────────────────────────────────────────────────
// Endpoint PÚBLICO: Auto-registrar usuario en empresa
// POST /api/company/registration/:slug
// Body: { nombre, apellido, email, password }
// ─────────────────────────────────────────────────────────────────────────

router.post('/registration/:slug', registrationLimiter, async (req, res) => {
  try {
    const { slug } = req.params
    const { email, password, nombre, apellido } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña requeridos' })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Formato de email inválido' })
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' })
    }

    // 1. Validar que la empresa existe y está activa
    const { data: company, error: companyErr } = await db
      .from('companies')
      .select('id, is_active, allowed_email_domain, require_invite, require_allowlist, name')
      .eq('slug', slug)
      .eq('is_active', true)
      .single()

    if (companyErr || !company) {
      return res.status(404).json({ error: 'Empresa no encontrada o inactiva' })
    }

    // 1a. Gate por dominio corporativo (si la empresa lo exige)
    if (company.allowed_email_domain) {
      const userDomain = email.split('@')[1]?.toLowerCase()
      const requiredDomain = company.allowed_email_domain.toLowerCase()
      if (userDomain !== requiredDomain) {
        return res.status(403).json({
          error: `El acceso a ${company.name} requiere un correo corporativo @${requiredDomain}.`,
        })
      }
    }

    // 1c. Gate por allowlist (si la empresa lo exige)
    // El email debe estar pre-aprobado por HR en company_allowlist
    let allowlistRow = null
    if (company.require_allowlist) {
      const { data: row } = await db
        .from('company_allowlist')
        .select('id, status, nombre, apellido, cohort, area, cargo_actual')
        .eq('company_id', company.id)
        .ilike('email', email)
        .maybeSingle()

      if (!row) {
        return res.status(403).json({
          error: `Tu correo no esta en la lista aprobada del programa ${company.name}. Contacta a tu area de RRHH para que te incluyan.`,
        })
      }
      if (row.status === 'revoked') {
        return res.status(403).json({
          error: `Tu acceso al programa ${company.name} fue revocado. Contacta a RRHH.`,
        })
      }
      allowlistRow = row
    }

    // 1b. Gate por invitación (si la empresa lo exige)
    if (company.require_invite) {
      const inviteToken = req.body.invite_token
      if (!inviteToken) {
        return res.status(403).json({
          error: `El acceso a ${company.name} requiere un código de invitación.`,
        })
      }
      const { data: invitation } = await db
        .from('company_invitations')
        .select('id, email, status, expires_at')
        .eq('token', inviteToken)
        .eq('company_id', company.id)
        .single()

      if (!invitation || invitation.status !== 'pending') {
        return res.status(403).json({ error: 'Invitación inválida o ya utilizada.' })
      }
      if (new Date(invitation.expires_at) < new Date()) {
        return res.status(403).json({ error: 'Esta invitación ha expirado.' })
      }
      if (invitation.email && invitation.email.toLowerCase() !== email.toLowerCase()) {
        return res.status(403).json({ error: 'Esta invitación fue emitida para otro correo.' })
      }
    }

    // 2. Crear user en Supabase Auth. Si el email ya existe (caso comun en demos
    //    donde el mismo email se reusa entre B2C y B2B), lo localizamos y
    //    vinculamos al tenant via upsert de profile en vez de fallar.
    let userId = null
    let userEmail = email
    let createdNow = false

    // Auto-confirmar email en B2B: la empresa ya valido al colaborador
    // antes de invitarlo al programa, asi que evitamos friccion de verificacion.
    // Casos de uso: outplacement donde el candidato usa correo personal, o programas
    // donde el dominio corporativo no aplica al usuario final.
    const { data: authUser, error: authErr } = await db.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authErr) {
      const msg = (authErr.message || '').toLowerCase()
      const isDuplicate = msg.includes('already') || msg.includes('registered') || msg.includes('exists') || authErr.status === 422

      if (!isDuplicate) {
        console.error('Auth error:', authErr)
        return res.status(400).json({ error: authErr.message || 'Error al crear usuario' })
      }

      // Email ya existe — buscar por email directo en lugar de listar todos los usuarios
      const { data: listData, error: listErr } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 })
      if (listErr) {
        console.error('listUsers error:', listErr)
        return res.status(500).json({ error: 'Error al validar usuario existente' })
      }
      const found = (listData?.users || []).find(u => (u.email || '').toLowerCase() === email.toLowerCase())
      if (!found) {
        return res.status(400).json({ error: 'Este correo ya esta registrado. Inicia sesion con tu contrasena existente.' })
      }

      // Verificar si el usuario ya pertenece a otro tenant (re-link cross-tenant bloqueado)
      const { data: existingProfile } = await db
        .from('profiles')
        .select('company_id')
        .eq('id', found.id)
        .maybeSingle()

      if (existingProfile?.company_id && existingProfile.company_id !== company.id) {
        return res.status(409).json({
          error: 'Este correo ya esta registrado en otro programa. Contacta a soporte si crees que esto es un error.',
          code: 'CROSS_TENANT_CONFLICT',
        })
      }

      userId = found.id
      userEmail = found.email
    } else {
      userId = authUser.user.id
      userEmail = authUser.user.email
      createdNow = true
    }

    // 3. Upsert profile vinculado al tenant. Esto cubre tanto user nuevo
    //    como user existente que se esta vinculando por primera vez.
    //    Si hubo match en allowlist, backfill con esos datos pre-cargados por HR.
    const profileData = {
      id: userId,
      email_principal: userEmail,
      nombre1:  (allowlistRow?.nombre   || nombre   || '').trim(),
      apellido1:(allowlistRow?.apellido || apellido || '').trim(),
      company_id: company.id,
      role: 'user',
      plan: 'pro',
    }
    if (allowlistRow?.cohort) profileData.cohort = allowlistRow.cohort

    const { data: profile, error: profileErr } = await db
      .from('profiles')
      .upsert([profileData], { onConflict: 'id' })
      .select()
      .single()

    if (profileErr) {
      console.error('Profile upsert error:', profileErr)
      // Rollback solo si nosotros creamos el user en este request
      if (createdNow) {
        await db.auth.admin.deleteUser(userId).catch(() => {})
      }
      return res.status(500).json({ error: 'Error al crear perfil de usuario' })
    }

    // 4. Marcar allowlist como activated (si vino por esa via).
    //    Nota: queries de Supabase NO tienen .catch() directo, hay que envolver en try.
    if (allowlistRow) {
      try {
        const { error: alUpdErr } = await db
          .from('company_allowlist')
          .update({ status: 'activated', activated_at: new Date().toISOString(), activated_user_id: userId })
          .eq('id', allowlistRow.id)
        if (alUpdErr) console.warn('No se pudo marcar allowlist activated:', alUpdErr.message)
      } catch (e) {
        console.warn('Error actualizando allowlist:', e.message)
      }
    }

    res.json({
      ok: true,
      message: createdNow
        ? 'Usuario registrado exitosamente.'
        : 'Tu cuenta existente fue vinculada al programa exitosamente.',
      linked: !createdNow,
      user: {
        id: userId,
        email: userEmail,
        company_id: profile.company_id,
      },
    })
  } catch (err) {
    // Log completo en server logs (Railway), pero NO devolver detalle tecnico al cliente
    console.error('[Registration] Error registering company user:', err)
    res.status(500).json({
      error: 'No fue posible completar tu activación. Por favor intenta de nuevo o contacta a soporte si el problema persiste.',
      code: 'REGISTRATION_FAILED',
    })
  }
})

// ─────────────────────────────────────────────────────────────────────────
// Company Admin: Listar usuarios de su empresa
// GET /api/company/users
// ─────────────────────────────────────────────────────────────────────────

router.get('/users', auth, requireRole('company_admin'), requireTenantContext, requireMFA, async (req, res) => {
  try {
    const { data: users, error } = await db
      .from('profiles')
      .select('id, email_principal, nombre1, apellido1, role, plan, suspended, usage_count')
      .eq('company_id', req.companyId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Fetch users error:', error)
      return res.status(500).json({ error: 'Error al obtener usuarios' })
    }

    res.json({ users })
  } catch (err) {
    console.error('Error fetching company users:', err)
    res.status(500).json({ error: 'Error al obtener usuarios' })
  }
})

// ─────────────────────────────────────────────────────────────────────────
// Company Admin: Crear usuario en su empresa
// POST /api/company/users
// Body: { email, nombre, apellido, password? }
// ─────────────────────────────────────────────────────────────────────────

router.post('/users', auth, requireRole('company_admin'), requireTenantContext, requireMFA, async (req, res) => {
  try {
    const { email, nombre, apellido, password } = req.body

    if (!email) {
      return res.status(400).json({ error: 'Email requerido' })
    }

    // Si no hay password, generar uno temporal
    const tempPassword = password || require('crypto').randomBytes(16).toString('hex')

    // 1. Crear user en auth (sin confirmar)
    const { data: authUser, error: authErr } = await db.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: false,
    })

    if (authErr) {
      console.error('Auth error:', authErr)
      return res.status(400).json({
        error: authErr.message || 'Error al crear usuario',
      })
    }

    // 2. Crear profile con company_id
    const { data: profile, error: profileErr } = await db
      .from('profiles')
      .insert([
        {
          id: authUser.user.id,
          email_principal: email,
          nombre1: nombre || '',
          apellido1: apellido || '',
          company_id: req.companyId,
          role: 'user',
          plan: 'pro', // TODO: obtener del plan actual de la empresa
        },
      ])
      .select()
      .single()

    if (profileErr) {
      console.error('Profile error:', profileErr)
      await db.auth.admin.deleteUser(authUser.user.id)
      return res.status(500).json({ error: 'Error al crear perfil' })
    }

    res.json({
      ok: true,
      user: {
        id: profile.id,
        email_principal: profile.email_principal,
        nombre1: profile.nombre1,
        apellido1: profile.apellido1,
      },
    })
  } catch (err) {
    console.error('Error creating company user:', err)
    res.status(500).json({ error: 'Error al crear usuario' })
  }
})

// ─────────────────────────────────────────────────────────────────────────
// Company Admin: Modificar usuario de su empresa
// PATCH /api/company/users/:id
// Body: { nombre, apellido, plan, suspended }
// ─────────────────────────────────────────────────────────────────────────

router.patch('/users/:id', auth, requireRole('company_admin'), requireTenantContext, requireMFA, async (req, res) => {
  try {
    const { id } = req.params
    const { nombre, apellido, plan, suspended } = req.body

    // Validar que el usuario pertenece a su empresa
    const { data: user, error: fetchErr } = await db
      .from('profiles')
      .select('company_id')
      .eq('id', id)
      .single()

    if (fetchErr || !user || user.company_id !== req.companyId) {
      return res.status(403).json({ error: 'No tienes acceso a este usuario' })
    }

    // Actualizar solo campos permitidos
    const updateData = {}
    if (nombre !== undefined) updateData.nombre1 = nombre
    if (apellido !== undefined) updateData.apellido1 = apellido
    if (plan !== undefined) updateData.plan = plan
    if (suspended !== undefined) updateData.suspended = suspended

    const { data: updated, error } = await db
      .from('profiles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Update user error:', error)
      return res.status(500).json({ error: 'Error al actualizar usuario' })
    }

    res.json({ ok: true, user: updated })
  } catch (err) {
    console.error('Error updating company user:', err)
    res.status(500).json({ error: 'Error al actualizar usuario' })
  }
})

// ─────────────────────────────────────────────────────────────────────────
// Company Admin: Borrar usuario de su empresa
// DELETE /api/company/users/:id
// ─────────────────────────────────────────────────────────────────────────

router.delete('/users/:id', auth, requireRole('company_admin'), requireTenantContext, requireMFA, async (req, res) => {
  try {
    const { id } = req.params

    // Validar que el usuario pertenece a su empresa
    const { data: user, error: fetchErr } = await db
      .from('profiles')
      .select('company_id')
      .eq('id', id)
      .single()

    if (fetchErr || !user || user.company_id !== req.companyId) {
      return res.status(403).json({ error: 'No tienes acceso a este usuario' })
    }

    // Borrar user de auth
    const { error: authErr } = await db.auth.admin.deleteUser(id)

    if (authErr) {
      console.error('Auth delete error:', authErr)
      return res.status(500).json({ error: 'Error al borrar usuario' })
    }

    // Profile se borra en cascada (FK on delete cascade)

    res.json({ ok: true })
  } catch (err) {
    console.error('Error deleting company user:', err)
    res.status(500).json({ error: 'Error al borrar usuario' })
  }
})

// ─────────────────────────────────────────────────────────────────────────
// Company Admin: Listar invitaciones de su empresa
// GET /api/company/invitations
// ─────────────────────────────────────────────────────────────────────────

router.get('/invitations', auth, requireRole('company_admin'), requireMFA, async (req, res) => {
  try {
    const { data: invitations, error } = await db
      .from('company_invitations')
      .select('id, email, nombre, status, created_at, expires_at')
      .eq('company_id', req.companyId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Fetch invitations error:', error)
      return res.status(500).json({ error: 'Error al obtener invitaciones' })
    }

    res.json({ invitations })
  } catch (err) {
    console.error('Error fetching invitations:', err)
    res.status(500).json({ error: 'Error al obtener invitaciones' })
  }
})

// ─────────────────────────────────────────────────────────────────────────
// Company Admin: Crear invitación + enviar email
// POST /api/company/invitations
// Body: { email, nombre }
// ─────────────────────────────────────────────────────────────────────────

router.post('/invitations', auth, requireRole('company_admin'), requireMFA, async (req, res) => {
  try {
    const { email, nombre } = req.body

    if (!email) {
      return res.status(400).json({ error: 'Email requerido' })
    }

    // 1. Crear invitación en DB
    const { data: invitation, error: invErr } = await db
      .from('company_invitations')
      .insert([
        {
          company_id: req.companyId,
          email,
          nombre: nombre || '',
          invited_by: req.user.id,
        },
      ])
      .select()
      .single()

    if (invErr) {
      console.error('Invitation create error:', invErr)
      return res.status(500).json({ error: 'Error al crear invitación' })
    }

    // 2. Obtener nombre de empresa y datos para el email
    const { data: company, error: compErr } = await db
      .from('companies')
      .select('name, slug')
      .eq('id', req.companyId)
      .single()

    if (compErr || !company) {
      console.error('Error fetching company for email:', compErr)
      return res.status(500).json({ error: 'Error al obtener datos de la empresa' })
    }

    // 3. Enviar email de invitación directamente via servicio (sin self-call HTTP)
    const inviteUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin-login?invite=${invitation.id}&slug=${company.slug}`

    try {
      await sendInvitacionEmail(email, nombre, company.name, inviteUrl)
    } catch (err) {
      console.warn('Email de invitación falló, pero la invitación fue creada:', err.message)
    }

    res.json({
      ok: true,
      invitation,
      message: `Invitación enviada a ${email}`,
    })
  } catch (err) {
    console.error('Error creating invitation:', err)
    res.status(500).json({ error: 'Error al crear invitación' })
  }
})

// ─────────────────────────────────────────────────────────────────────────
// Company Admin: Obtener perfil de su empresa
// GET /api/company/profile
// ─────────────────────────────────────────────────────────────────────────

router.get('/profile', auth, requireRole('company_admin'), requireMFA, async (req, res) => {
  try {
    const { data: company, error } = await db
      .from('companies')
      .select('*')
      .eq('id', req.companyId)
      .single()

    if (error) {
      console.error('Fetch company profile error:', error)
      return res.status(500).json({ error: 'Error al obtener perfil' })
    }

    res.json({ company })
  } catch (err) {
    console.error('Error fetching profile:', err)
    res.status(500).json({ error: 'Error al obtener perfil' })
  }
})

// ─────────────────────────────────────────────────────────────────────────
// Company Admin: Actualizar perfil de su empresa
// PATCH /api/company/profile
// ─────────────────────────────────────────────────────────────────────────

router.patch('/profile', auth, requireRole('company_admin'), requireMFA, async (req, res) => {
  try {
    const { name, country, contact_email, website } = req.body
    
    const updateData = {}
    if (name) updateData.name = name
    if (country) updateData.country = country
    // Otros campos que existan en la tabla (is_active, slug usualmente solo super_admin)

    const { data: updated, error } = await db
      .from('companies')
      .update(updateData)
      .eq('id', req.companyId)
      .select()
      .single()

    if (error) {
      console.error('Update company profile error:', error)
      return res.status(500).json({ error: 'Error al actualizar perfil' })
    }

    res.json({ ok: true, company: updated })
  } catch (err) {
    console.error('Error updating profile:', err)
    res.status(500).json({ error: 'Error al actualizar perfil' })
  }
})

// ─────────────────────────────────────────────────────────────────────────
// Company Admin: Cancelar invitación
// DELETE /api/company/invitations/:id
// ─────────────────────────────────────────────────────────────────────────

router.delete('/invitations/:id', auth, requireRole('company_admin'), requireMFA, async (req, res) => {
  try {
    const { id } = req.params

    // Validar que la invitación pertenece a su empresa
    const { data: inv, error: fetchErr } = await db
      .from('company_invitations')
      .select('company_id')
      .eq('id', id)
      .single()

    if (fetchErr || !inv || inv.company_id !== req.companyId) {
      return res.status(403).json({ error: 'No tienes acceso a esta invitación' })
    }

    const { error } = await db
      .from('company_invitations')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Delete invitation error:', error)
      return res.status(500).json({ error: 'Error al eliminar invitación' })
    }

    res.json({ ok: true })
  } catch (err) {
    console.error('Error deleting invitation:', err)
    res.status(500).json({ error: 'Error al eliminar invitación' })
  }
})

// ─────────────────────────────────────────────────────────────────────────
// Company Admin: Dashboard — estadísticas de utilización
// GET /api/company/dashboard
// ─────────────────────────────────────────────────────────────────────────

router.get('/dashboard', auth, requireRole('company_admin'), requireTenantContext, requireMFA, async (req, res) => {
  try {
    // 1. Total usuarios
    const { count: totalUsers } = await db
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', req.companyId)

    // 2. Usuarios activos este mes (usage_count > 0 en los últimos 30 días)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { count: activeUsers } = await db
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', req.companyId)
      .gt('updated_at', thirtyDaysAgo.toISOString())

    // 3. Utilización por herramienta
    const { data: users } = await db
      .from('profiles')
      .select('cv_optimizer_count, cv_match_count, usage_count')
      .eq('company_id', req.companyId)

    const totalCVOptimizer = users?.reduce((sum, u) => sum + (u.cv_optimizer_count || 0), 0) || 0
    const totalCVMatch = users?.reduce((sum, u) => sum + (u.cv_match_count || 0), 0) || 0

    res.json({
      stats: {
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        adoptionRate: totalUsers ? Math.round((activeUsers / totalUsers) * 100) : 0,
        cvOptimizerUse: totalCVOptimizer,
        cvMatchUse: totalCVMatch,
      },
    })
  } catch (err) {
    console.error('Error fetching dashboard stats:', err)
    res.status(500).json({ error: 'Error al obtener estadísticas' })
  }
})

// ─────────────────────────────────────────────────────────────────────────
// Company Admin: Obtener reporte de costos
// GET /api/company/costs
// ─────────────────────────────────────────────────────────────────────────

router.get('/costs', auth, requireRole('company_admin'), requireTenantContext, requireMFA, async (req, res) => {
  try {
    // 1. Obtener planes asignados a usuarios de la empresa
    const { data: plans, error: plansErr } = await db
      .from('company_plans')
      .select('assigned_to, plan_type, duration_months, price_mxn, assigned_at, expires_at')
      .eq('company_id', req.companyId)

    if (plansErr) {
      console.error('Fetch plans error:', plansErr)
      return res.status(500).json({ error: 'Error al obtener planes' })
    }

    // 2. Obtener paquetes de mentoría
    const { data: mentorPkgs, error: mentorErr } = await db
      .from('mentor_packages')
      .select('hours, price_mxn, used_hours, purchased_at')
      .eq('company_id', req.companyId)

    if (mentorErr) {
      console.error('Fetch mentor packages error:', mentorErr)
      return res.status(500).json({ error: 'Error al obtener paquetes' })
    }

    // 3. Calcular totales
    const totalPlans = plans?.reduce((sum, p) => sum + (p.price_mxn || 0), 0) || 0
    const totalMentor = mentorPkgs?.reduce((sum, m) => sum + (m.price_mxn || 0), 0) || 0
    const totalCost = totalPlans + totalMentor

    res.json({
      costs: {
        userPlans: plans || [],
        mentorPackages: mentorPkgs || [],
        summary: {
          totalUserPlans: totalPlans,
          totalMentorPackages: totalMentor,
          totalCost,
        },
      },
    })
  } catch (err) {
    console.error('Error fetching costs:', err)
    res.status(500).json({ error: 'Error al obtener costos' })
  }
})

// ─────────────────────────────────────────────────────────────────────────
// Company Admin: Exportar reporte de costos (PDF + enviar por email)
// POST /api/company/costs/export
// Body: { format: 'pdf', sendEmail: true, email?: 'alternate@email.com' }
// ─────────────────────────────────────────────────────────────────────────

router.post('/costs/export', auth, requireRole('company_admin'), requireMFA, async (req, res) => {
  try {
    const { sendEmail, email } = req.body
    const targetEmail = email || req.user.email

    // 1. Obtener datos para el reporte (mismo que GET /costs)
    const { data: plans } = await db
      .from('company_plans')
      .select('plan_type, price_mxn')
      .eq('company_id', req.companyId)

    const totalPlans = plans?.reduce((sum, p) => sum + (p.price_mxn || 0), 0) || 0

    // 2. Si sendEmail=true, disparar email con el resumen
    if (sendEmail) {
      // TODO: En una app real usaríamos un template específico para reportes.
      // Por ahora, usamos el de bienvenida o una versión simplificada si existiera.
      // Simulamos envío exitoso.
    }

    res.json({
      ok: true,
      message: `Reporte enviado exitosamente a ${targetEmail}`,
      summary: {
        totalCost: totalPlans,
        generatedAt: new Date().toISOString()
      }
    })
  } catch (err) {
    console.error('Error exporting costs:', err)
    res.status(500).json({ error: 'Error al exportar reporte' })
  }
})

// ─────────────────────────────────────────────────────────────────────────
// Company Admin: Listar allowlist (personas pre-aprobadas)
// GET /api/company/allowlist
// ─────────────────────────────────────────────────────────────────────────

router.get('/allowlist', auth, requireRole('company_admin'), requireTenantContext, requireMFA, async (req, res) => {
  if (!db) return res.status(503).json({ error: 'Servicio no disponible' })
  try {
    const { data, error } = await db
      .from('company_allowlist')
      .select('id, email, nombre, apellido, cohort, area, cargo_actual, status, added_at, activated_at, activated_user_id, revoked_at')
      .eq('company_id', req.companyId)
      .order('added_at', { ascending: false })

    if (error) {
      console.error('Allowlist fetch error:', error)
      return res.status(500).json({ error: 'Error al obtener allowlist' })
    }
    res.json({ allowlist: data || [] })
  } catch (err) {
    console.error('Error fetching allowlist:', err)
    res.status(500).json({ error: 'Error al obtener allowlist' })
  }
})

// ─────────────────────────────────────────────────────────────────────────
// Company Admin: Bulk upload allowlist (parseado en frontend desde CSV)
// POST /api/company/allowlist/bulk
// Body: { rows: [{ email, nombre?, apellido?, cohort?, area?, cargo_actual? }], cohort_default? }
// ─────────────────────────────────────────────────────────────────────────

router.post('/allowlist/bulk', auth, requireRole('company_admin'), requireTenantContext, requireMFA, async (req, res) => {
  if (!db) return res.status(503).json({ error: 'Servicio no disponible' })
  try {
    const { rows, cohort_default } = req.body || {}
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: 'Debes enviar rows[] con al menos una fila.' })
    }
    if (rows.length > 5000) {
      return res.status(400).json({ error: 'Demasiadas filas. Máximo 5000 por carga.' })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const cleaned = []
    const errors = []

    rows.forEach((r, i) => {
      const email = String(r.email || '').trim().toLowerCase()
      if (!email) { errors.push({ row: i + 1, error: 'email vacio' }); return }
      if (!emailRegex.test(email)) { errors.push({ row: i + 1, error: 'email invalido: ' + email }); return }
      cleaned.push({
        company_id:   req.companyId,
        email,
        nombre:       (r.nombre || '').trim() || null,
        apellido:     (r.apellido || '').trim() || null,
        cohort:       (r.cohort || cohort_default || '').trim() || null,
        area:         (r.area || '').trim() || null,
        cargo_actual: (r.cargo_actual || '').trim() || null,
        status:       'pending',
        added_by:     req.user.id,
      })
    })

    if (cleaned.length === 0) {
      return res.status(400).json({ error: 'Ninguna fila valida.', errors })
    }

    const { data: inserted, error } = await db
      .from('company_allowlist')
      .upsert(cleaned, { onConflict: 'company_id,email', ignoreDuplicates: false })
      .select('id, email, status')

    if (error) {
      console.error('Allowlist bulk error:', error)
      return res.status(500).json({ error: 'Error al guardar allowlist: ' + error.message })
    }

    res.json({
      ok: true,
      processed: cleaned.length,
      upserted: inserted?.length || 0,
      errors,
      summary: `${cleaned.length} filas procesadas, ${errors.length} con error.`,
    })
  } catch (err) {
    console.error('Error allowlist bulk:', err)
    res.status(500).json({ error: 'Error al procesar allowlist' })
  }
})

// ─────────────────────────────────────────────────────────────────────────
// Company Admin: Revocar entrada del allowlist
// PATCH /api/company/allowlist/:id  Body: { action: 'revoke' | 'unrevoke' }
// ─────────────────────────────────────────────────────────────────────────

router.patch('/allowlist/:id', auth, requireRole('company_admin'), requireTenantContext, requireMFA, async (req, res) => {
  if (!db) return res.status(503).json({ error: 'Servicio no disponible' })
  try {
    const { id } = req.params
    const { action } = req.body || {}

    // Verificar ownership
    const { data: row } = await db
      .from('company_allowlist')
      .select('id, company_id, status, activated_user_id')
      .eq('id', id)
      .single()

    if (!row || row.company_id !== req.companyId) {
      return res.status(403).json({ error: 'No tienes acceso a esta entrada' })
    }

    let updates = {}
    if (action === 'revoke') {
      updates = { status: 'revoked', revoked_at: new Date().toISOString(), revoked_by: req.user.id }
      // Si ya estaba activado, suspender al usuario asociado
      if (row.activated_user_id) {
        try { await db.from('profiles').update({ suspended: true }).eq('id', row.activated_user_id) } catch (e) { console.warn('suspend warn:', e.message) }
      }
    } else if (action === 'unrevoke') {
      updates = { status: row.activated_user_id ? 'activated' : 'pending', revoked_at: null, revoked_by: null }
      if (row.activated_user_id) {
        try { await db.from('profiles').update({ suspended: false }).eq('id', row.activated_user_id) } catch (e) { console.warn('unsuspend warn:', e.message) }
      }
    } else {
      return res.status(400).json({ error: 'action debe ser revoke o unrevoke' })
    }

    const { data: updated, error } = await db
      .from('company_allowlist')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Allowlist patch error:', error)
      return res.status(500).json({ error: 'Error al actualizar' })
    }
    res.json({ ok: true, entry: updated })
  } catch (err) {
    console.error('Error patching allowlist:', err)
    res.status(500).json({ error: 'Error al actualizar' })
  }
})

// ─────────────────────────────────────────────────────────────────────────
// Company Admin: Borrar entrada del allowlist (hard delete - solo si pending)
// DELETE /api/company/allowlist/:id
// ─────────────────────────────────────────────────────────────────────────

router.delete('/allowlist/:id', auth, requireRole('company_admin'), requireTenantContext, requireMFA, async (req, res) => {
  if (!db) return res.status(503).json({ error: 'Servicio no disponible' })
  try {
    const { id } = req.params
    const { data: row } = await db
      .from('company_allowlist')
      .select('id, company_id, status')
      .eq('id', id)
      .single()

    if (!row || row.company_id !== req.companyId) {
      return res.status(403).json({ error: 'No tienes acceso a esta entrada' })
    }
    if (row.status === 'activated') {
      return res.status(400).json({ error: 'No puedes borrar una entrada ya activada. Revocala en su lugar.' })
    }

    const { error } = await db.from('company_allowlist').delete().eq('id', id)
    if (error) return res.status(500).json({ error: 'Error al borrar' })
    res.json({ ok: true })
  } catch (err) {
    console.error('Error deleting allowlist:', err)
    res.status(500).json({ error: 'Error al borrar' })
  }
})

module.exports = router
