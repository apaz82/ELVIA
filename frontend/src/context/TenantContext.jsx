// TenantContext — resuelve el branding del tenant actual desde 3 fuentes:
//  1) URL slug   (/empresas/:slug  o  /universidades/:slug)
//  2) Usuario autenticado con company_id (vía /api/company/my-tenant)
//  3) Fallback al branding default ELVIA (B2C)
//
// Aplica los colores como CSS variables en :root para uso vía Tailwind arbitrary
// values (ej. bg-[var(--tenant-primary)]) o styles inline.

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
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
  const { user, session, perfil } = useAuth()
  const location = useLocation()

  const [tenant, setTenant]         = useState(DEFAULT_TENANT)
  const [tenantRole, setTenantRole] = useState('user')
  const [cohort, setCohort]         = useState(null)
  const [loading, setLoading]       = useState(false)

  // ── Detectar slug en URL ────────────────────────────────────────────────
  const urlSlug = useMemo(() => {
    const match = location.pathname.match(URL_SLUG_REGEX)
    return match?.[2] || null
  }, [location.pathname])

  // ── Resolver tenant ─────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false

    async function resolveTenant() {
      // PRIORIDAD 1: slug en URL (landing público pre-login)
      if (urlSlug) {
        const cached = readCache('slug_' + urlSlug)
        if (cached) {
          if (!cancelled) {
            setTenant(cached)
            setTenantRole('user')
            setCohort(null)
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
            }
          } else if (!cancelled) {
            setTenant(DEFAULT_TENANT)
          }
        } catch {
          if (!cancelled) setTenant(DEFAULT_TENANT)
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
            setTenant(cached.tenant || DEFAULT_TENANT)
            setTenantRole(cached.role || 'user')
            setCohort(cached.cohort || null)
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
            }
          } else if (!cancelled) {
            setTenant(DEFAULT_TENANT)
          }
        } catch {
          if (!cancelled) setTenant(DEFAULT_TENANT)
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
          return
        }
      }

      // PRIORIDAD 4: default ELVIA
      if (!cancelled) {
        setTenant(DEFAULT_TENANT)
        setTenantRole('user')
        setCohort(null)
      }
    }

    resolveTenant()
    return () => { cancelled = true }
  }, [urlSlug, user, session, perfil])

  // ── Aplicar variables CSS para colores del tenant ───────────────────────
  useEffect(() => {
    if (!tenant) return
    const root = document.documentElement
    root.style.setProperty('--tenant-primary',   tenant.primary_color   || DEFAULT_TENANT.primary_color)
    root.style.setProperty('--tenant-secondary', tenant.secondary_color || DEFAULT_TENANT.secondary_color)
    root.style.setProperty('--tenant-accent',    tenant.accent_color    || DEFAULT_TENANT.accent_color)
  }, [tenant])

  const value = useMemo(() => ({
    tenant,
    tenantRole,
    cohort,
    loading,
    isB2B:           Boolean(tenant?.id && tenant.sector !== 'b2c'),
    isCorporate:     tenant?.sector === 'corporate',
    isUniversity:    tenant?.sector === 'university',
    showPricing:     tenant?.show_pricing !== false,
    enabledFeatures: tenant?.enabled_features || DEFAULT_TENANT.enabled_features,
  }), [tenant, tenantRole, cohort, loading])

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
