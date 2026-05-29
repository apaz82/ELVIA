// TenantContext — resuelve el branding del tenant actual desde 3 fuentes:
//  1) URL slug   (/empresas/:slug  o  /universidades/:slug)
//  2) Usuario autenticado con company_id (vía /api/company/my-tenant)
//  3) Fallback al branding default ELVIA (B2C)
//
// Aplica los colores como CSS variables en :root para uso vía Tailwind arbitrary
// values (ej. bg-[var(--tenant-primary)]) o styles inline.

import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// ── Default branding (ELVIA B2C) ─────────────────────────────────────────
export const DEFAULT_TENANT = {
  id: null,
  slug: null,
  name: 'ELVIA',
  sector: 'b2c',
  country: null,
  logo_url: '/LOGOS/ELVIA_logo_fondo_transparente.png',
  logo_secondary: null,
  primary_color:   '#14B8A6',  // teal-500
  secondary_color: '#0F172A',  // slate-900
  accent_color:    '#38BDF8',  // sky-400
  hero_title: null,
  hero_subtitle: null,
  welcome_message: null,
  contact_email: null,
  support_email: 'soporte@elvia.lat',
  branding_mode: 'cobranded',     // cobranded | tenant_only | elvia_only
  show_program_badge: false,       // B2C default: sin badge
  program_badge_text: null,
  show_pricing: true,
  enabled_features: {
    cv_optimizer: true, cv_match: true, jobs: true, pipeline: true,
    interview: true, linkedin: true, library: true, wellbeing: true, metrics: true,
  },
}

const TenantContext = createContext({
  tenant: DEFAULT_TENANT,
  tenantRole: 'user',
  cohort: null,
  loading: false,
  isB2B: false,
})

// Cache keys
const CACHE_PREFIX = 'tenant_v1_'
const CACHE_TTL_MS = 10 * 60 * 1000   // 10 minutos
const URL_SLUG_REGEX = /^\/(empresas|universidades)\/([^/]+)/

function readCache(key) {
  try {
    const raw = sessionStorage.getItem(CACHE_PREFIX + key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    // Soporta formato nuevo {__ttl, __data} y legacy (objeto plano)
    if (parsed && typeof parsed === 'object' && '__ttl' in parsed) {
      if (Date.now() > parsed.__ttl) {
        sessionStorage.removeItem(CACHE_PREFIX + key)
        return null
      }
      return parsed.__data
    }
    return parsed
  } catch {
    return null
  }
}

function writeCache(key, value) {
  try {
    sessionStorage.setItem(CACHE_PREFIX + key, JSON.stringify({
      __ttl: Date.now() + CACHE_TTL_MS,
      __data: value,
    }))
  } catch {
    // Silenciar errores de quota
  }
}

function clearCache(key) {
  try { sessionStorage.removeItem(CACHE_PREFIX + key) } catch {}
}

export function TenantProvider({ children }) {
  const { user, session, perfil, loading: authLoading, perfilCargado } = useAuth()
  const location = useLocation()

  const [tenant, setTenant]         = useState(() => {
    // 1. Si hay slug en la URL (/empresas/:slug o /universidades/:slug), resolver síncronamente desde caché
    const match = window.location.pathname.match(URL_SLUG_REGEX)
    const slug = match?.[2] || null
    if (slug) {
      const cached = readCache('slug_' + slug)
      if (cached) return cached
    }

    // 2. Si no hay slug, intentar usar el último tenant B2B activo en esta pestaña
    const lastActive = readCache('last_active_tenant')
    if (lastActive) return lastActive

    // 3. Fallback al default B2C
    return DEFAULT_TENANT
  })
  const [tenantRole, setTenantRole] = useState('user')
  const [cohort, setCohort]         = useState(null)
  const [loading, setLoading]       = useState(false)
  // tenantResolved: true cuando el tenant ya fue determinado (caché síncrono o fetch completado).
  // Evita el flash B2C→B2B en el Header al cargar por primera vez.
  const [tenantResolved, setTenantResolved] = useState(() => {
    const match = window.location.pathname.match(URL_SLUG_REGEX)
    const slug = match?.[2] || null
    if (slug) return Boolean(readCache('slug_' + slug))
    return Boolean(readCache('last_active_tenant'))
  })

  // ── Detectar slug en URL ────────────────────────────────────────────────
  const urlSlug = useMemo(() => {
    const match = location.pathname.match(URL_SLUG_REGEX)
    return match?.[2] || null
  }, [location.pathname])

  // ── Resolver tenant ─────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false

    async function resolveTenant() {
      // Si la sesión de Supabase o el perfil del usuario están cargando,
      // no tomamos ninguna decisión de fallback a B2C aún, para evitar parpadeos.
      if (authLoading || (user && !perfilCargado)) {
        return
      }

      try {

      // PRIORIDAD 1: slug en URL (landing público pre-login)
      if (urlSlug) {
        const cached = readCache('slug_' + urlSlug)
        if (cached) {
          if (!cancelled) {
            setTenant(cached)
            setTenantRole('user')
            setCohort(null)
            writeCache('last_active_tenant', cached)
          }
          return
        }
        setLoading(true)
        try {
          const res = await fetch(`${API}/api/company/branding/${urlSlug}`)
          if (res.ok) {
            const data = await res.json()
            if (data.company && !cancelled) {
              setTenant(data.company)
              setTenantRole('user')
              writeCache('slug_' + urlSlug, data.company)
              writeCache('last_slug', urlSlug)
              writeCache('last_active_tenant', data.company)
            }
          } else if (!cancelled) {
            setTenant(DEFAULT_TENANT)
            clearCache('last_active_tenant')
          }
        } catch {
          if (!cancelled) {
            setTenant(DEFAULT_TENANT)
            clearCache('last_active_tenant')
          }
        } finally {
          if (!cancelled) setLoading(false)
        }
        return
      }

      // PRIORIDAD 2: usuario autenticado con company_id
      if (user && session?.access_token && perfil?.company_id) {
        const cached = readCache('user_' + user.id)
        // Validar que el caché coincida con el company_id actual del perfil.
        // Previene contaminación cuando un super_admin cambia su company_id
        // o cuando otro usuario reutiliza la misma pestaña.
        const cacheIsValid = cached?.tenant?.id === perfil.company_id
        if (cacheIsValid) {
          if (!cancelled) {
            const t = cached.tenant || DEFAULT_TENANT
            setTenant(t)
            setTenantRole(cached.role || 'user')
            setCohort(cached.cohort || null)
            if (t && t.id) {
              writeCache('last_active_tenant', t)
            } else {
              clearCache('last_active_tenant')
            }
          }
          return
        }
        // Caché stale: limpiar para forzar fetch fresco
        if (cached) clearCache('user_' + user.id)
        setLoading(true)
        try {
          const res = await fetch(`${API}/api/company/my-tenant`, {
            headers: { Authorization: `Bearer ${session.access_token}` },
          })
          if (res.ok) {
            const data = await res.json()
            if (!cancelled) {
              const t = data.company || DEFAULT_TENANT
              setTenant(t)
              setTenantRole(data.role || 'user')
              setCohort(data.cohort || null)
              writeCache('user_' + user.id, { tenant: t, role: data.role, cohort: data.cohort })
              if (t && t.id) {
                writeCache('last_active_tenant', t)
              } else {
                clearCache('last_active_tenant')
              }
            }
          } else if (!cancelled) {
            setTenant(DEFAULT_TENANT)
            clearCache('last_active_tenant')
          }
        } catch {
          if (!cancelled) {
            setTenant(DEFAULT_TENANT)
            clearCache('last_active_tenant')
          }
        } finally {
          if (!cancelled) setLoading(false)
        }
        return
      }

      // PRIORIDAD 3: rescate desde sessionStorage por last_slug (post-signup, antes de tener perfil)
      const lastSlug = readCache('last_slug')
      if (lastSlug) {
        const cached = readCache('slug_' + lastSlug)
        if (cached && !cancelled) {
          setTenant(cached)
          writeCache('last_active_tenant', cached)
          return
        }
      }

      // PRIORIDAD 4: default ELVIA
      if (!cancelled) {
        setTenant(DEFAULT_TENANT)
        setTenantRole('user')
        setCohort(null)
        clearCache('last_active_tenant')
      }

      } finally {
        if (!cancelled) setTenantResolved(true)
      }
    }

    resolveTenant()
    return () => { cancelled = true }
  }, [urlSlug, user, session, perfil, authLoading, perfilCargado])

  // ── Aplicar variables CSS para colores del tenant ───────────────────────
  useLayoutEffect(() => {
    if (!tenant) return
    const root = document.documentElement
    root.style.setProperty('--tenant-primary',   tenant.primary_color   || DEFAULT_TENANT.primary_color)
    root.style.setProperty('--tenant-secondary', tenant.secondary_color || DEFAULT_TENANT.secondary_color)
    root.style.setProperty('--tenant-accent',    tenant.accent_color    || DEFAULT_TENANT.accent_color)
  }, [tenant])

  // Branding mode derivado: controla qué logos ve el candidato
  const brandingMode = tenant?.branding_mode || 'cobranded'
  const showTenantLogo = brandingMode !== 'elvia_only' && Boolean(tenant?.logo_url)
  const showElviaLogo  = brandingMode !== 'tenant_only' || !tenant?.logo_url
  const elviaProminent = brandingMode === 'elvia_only' || !tenant?.logo_url

  // Badge in-app para dashboard del candidato
  const showProgramBadge = Boolean(tenant?.show_program_badge && tenant?.id && tenant.sector !== 'b2c')
  const programBadgeText = tenant?.program_badge_text || (tenant?.name ? `Programa ${tenant.name}` : null)

  const value = useMemo(() => ({
    tenant,
    tenantRole,
    cohort,
    loading,
    tenantResolved,
    isB2B:           Boolean(tenant?.id && tenant.sector !== 'b2c'),
    isCorporate:     tenant?.sector === 'corporate',
    isUniversity:    tenant?.sector === 'university',
    showPricing:     tenant?.show_pricing !== false,
    enabledFeatures: tenant?.enabled_features || DEFAULT_TENANT.enabled_features,
    // Branding visibility (Sprint 3c)
    brandingMode,
    showTenantLogo,
    showElviaLogo,
    elviaProminent,
    showProgramBadge,
    programBadgeText,
  }), [tenant, tenantRole, cohort, loading, brandingMode, showTenantLogo, showElviaLogo, elviaProminent, showProgramBadge, programBadgeText])

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  )
}

export const useTenant = () => {
  const ctx = useContext(TenantContext)
  if (!ctx) throw new Error('useTenant debe usarse dentro de TenantProvider')
  return ctx
}
