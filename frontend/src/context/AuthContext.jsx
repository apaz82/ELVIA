// Estado global de autenticación con control de plan freemium
import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react'
import { supabase } from '../services/authService'
import { calcularProgreso } from '../utils/progresoLaboral'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// Intenta canjear el código pendiente en localStorage tras el primer login
async function redimirCodigoPendiente(token, refreshFn) {
  const code = localStorage.getItem('pending_access_code')
  if (!code) return
  try {
    const res = await fetch(`${API}/api/codes/redeem`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body:    JSON.stringify({ code }),
    })
    if (res.ok) {
      localStorage.removeItem('pending_access_code')
      refreshFn()  // recargar perfil para reflejar el nuevo plan
    }
    // Si falla (código inválido/agotado), no bloqueamos — solo limpiamos
    if (!res.ok && res.status !== 500) {
      localStorage.removeItem('pending_access_code')
    }
  } catch {
    // Silenciar errores de red — no son críticos para el flujo de login
  }
}

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser]                   = useState(null)
  const [session, setSession]             = useState(null)
  const [loading, setLoading]             = useState(true)
  const [perfilCargado, setPerfilCargado] = useState(false)
  const [perfil, setPerfil]               = useState(null)
  const [isRecovering, setIsRecovering]   = useState(false)
  const [jpData, setJpData]               = useState(null)
  const [jpLoaded, setJpLoaded]           = useState(false)

  const fetchPerfil = useCallback(async (userId, email) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
    if (data) {
      let perfActualizado = { ...data }

      // Si no tiene nombre1, intentar recuperarlo de los metadatos del registro
      if (!data.nombre1) {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        const meta = authUser?.user_metadata || {}
        if (meta.nombre1 || meta.apellido1) {
          const nombreCompleto = [meta.nombre1, meta.apellido1].filter(Boolean).join(' ')
          const updates = {
            nombre1:     meta.nombre1    || null,
            apellido1:   meta.apellido1  || null,
            indicativo1: meta.indicativo1 || null,
            telefono1:   meta.telefono1  || null,
            nombre:      nombreCompleto  || null,
          }
          await supabase.from('profiles').update(updates).eq('id', userId)
          perfActualizado = { ...perfActualizado, ...updates }
        }
      }

      if (email && !data.email_principal) {
        await supabase.from('profiles').update({ email_principal: email }).eq('id', userId)
        perfActualizado.email_principal = email
      }

      setPerfil(perfActualizado)
    }
    setPerfilCargado(true)
  }, [])

  const fetchJpData = useCallback(async (userId) => {
    const { data } = await supabase
      .from('profiles')
      .select('job_search_profile')
      .eq('id', userId)
      .maybeSingle()
    setJpData(data?.job_search_profile || null)
    setJpLoaded(true)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchPerfil(session.user.id, session.user.email)
        fetchJpData(session.user.id)
      } else {
        setPerfilCargado(true)
        setJpLoaded(true)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (_event === 'PASSWORD_RECOVERY') {
        setIsRecovering(true)
      }

      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        setPerfilCargado(false)
        fetchPerfil(session.user.id, session.user.email)
        fetchJpData(session.user.id)
        // Canjear código pendiente si el evento es un login nuevo
        if (_event === 'SIGNED_IN' && session.access_token) {
          redimirCodigoPendiente(
            session.access_token,
            () => fetchPerfil(session.user.id, session.user.email)
          )
        }
      } else {
        setPerfil(null); setPerfilCargado(true)
        setJpData(null); setJpLoaded(true)
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchPerfil, fetchJpData])

  const login = useCallback((email, password) =>
    supabase.auth.signInWithPassword({ email, password }), [])
  const register = useCallback((email, password, extraData = {}, captchaToken) =>
    supabase.auth.signUp({ email, password, options: { data: extraData, captchaToken } }), [])
  const logout   = useCallback(() => supabase.auth.signOut(), [])

  // ── Lógica de plan y acceso ───────────────────────────────────────────────

  const planInfo = useMemo(() => {
    if (!perfil) return {
      plan: 'free',
      isPaidPlan: false,
      trialExpired: false,
      trialDaysLeft: 14,
      trialExpiresAt: null,
      canOptimizeCV: true,
      canMatchCV: true,
      cvOptimizerCount: 0,
      cvMatchCount: 0,
      usageCount: 0,
      creditosMatchRestantes: 3,
      watermark: true,
    }

    const plan = perfil.plan || 'free'
    const PLANES_PAGO = ['mensual', 'trimestral']

    // Cualquier plan de pago expirado → degradar a free en el cliente
    const planExpirado =
      PLANES_PAGO.includes(plan) &&
      perfil.plan_expires_at &&
      new Date(perfil.plan_expires_at) < new Date()
    const planEfectivo = planExpirado ? 'free' : plan

    const isPaidPlan = PLANES_PAGO.includes(planEfectivo)


    // Trial: 7 días desde el registro
    const trialExpiresAt = perfil.free_trial_expires_at
      ? new Date(perfil.free_trial_expires_at)
      : null
    const trialExpired =
      !isPaidPlan &&
      trialExpiresAt !== null &&
      trialExpiresAt < new Date()

    const trialDaysLeft = trialExpiresAt
      ? Math.max(0, Math.ceil((trialExpiresAt - new Date()) / (1000 * 60 * 60 * 24)))
      : 7

    const cvOptimizerCount = perfil.cv_optimizer_count || 0
    const cvMatchCount     = perfil.cv_match_count     || 0
    const usageCount       = perfil.usage_count        || 0

    const canOptimizeCV = isPaidPlan || (!trialExpired && cvOptimizerCount < 1)
    const canMatchCV    = isPaidPlan || (!trialExpired && cvMatchCount < 3)

    const creditosMatchRestantes = isPaidPlan ? Infinity : Math.max(0, 3 - cvMatchCount)
    const watermark = !isPaidPlan

    return {
      plan: planEfectivo,
      isPaidPlan,
      trialExpired,
      trialDaysLeft,
      trialExpiresAt,
      canOptimizeCV,
      canMatchCV,
      cvOptimizerCount,
      cvMatchCount,
      usageCount,
      creditosMatchRestantes,
      watermark,
    }
  }, [perfil])

  // Retrocompatibilidad: campos que otros componentes ya usan
  const LIMITE_PLAN         = 3
  const usageCount          = planInfo.usageCount
  const creditosRestantes   = planInfo.creditosMatchRestantes

  const onboardingPendiente = useMemo(() => !loading && perfilCargado && !!user && (!perfil || !perfil.nombre1), [loading, perfilCargado, user, perfil])

  // Progreso del Gerente de Búsqueda (0-100) — disponible globalmente
  const progresoLaboral = useMemo(() => {
    if (!jpLoaded || !perfil) return 0
    return calcularProgreso(jpData, perfil)
  }, [jpData, perfil, jpLoaded])

  // Usuarios B2B siguen el MISMO flujo que B2C: onboarding -> gerente -> 100% -> features.
  // (Cambio de criterio: la empresa paga el programa pero el flujo educativo del
  // Gerente de Búsqueda es parte del valor, no debe saltarse.)
  const featuresDesbloqueadas = (progresoLaboral >= 100) || (planInfo.isPaidPlan)

  const refreshJpData = useCallback(async () => {
    if (!user) return
    await fetchJpData(user.id)
  }, [user, fetchJpData])

  const refreshPerfil = useCallback((uid) => fetchPerfil(uid || user?.id), [fetchPerfil, user])
  const refreshUsage  = useCallback(()    => user && fetchPerfil(user.id), [fetchPerfil, user])

  // Roles y multi-tenancy
  const role = perfil?.role || 'user'
  const companyId = perfil?.company_id || null
  const isAdmin = perfil?.role === 'super_admin'
  const isCompanyAdmin = perfil?.role === 'company_admin'

  const value = useMemo(() => ({
    user, session, loading,
    login, register, logout,
    perfil,
    refreshPerfil,
    refreshUsage,
    onboardingPendiente, perfilCargado,
    isRecovering, setIsRecovering,
    // Progreso Gerente de Búsqueda
    progresoLaboral, featuresDesbloqueadas, jpLoaded, jpData, refreshJpData,
    // Roles y multi-tenancy
    role, companyId, isAdmin, isCompanyAdmin,
    // Plan info — usa directamente estos valores en los componentes
    ...planInfo,
    // Retrocompatibilidad
    usageCount, creditosRestantes, LIMITE_PLAN,
  }), [
    user, session, loading, login, register, logout, perfil, refreshPerfil, refreshUsage,
    onboardingPendiente, perfilCargado, isRecovering, setIsRecovering, progresoLaboral,
    featuresDesbloqueadas, jpLoaded, jpData, refreshJpData, role, companyId, isAdmin, isCompanyAdmin,
    planInfo, usageCount, creditosRestantes
  ])

  return (
    <AuthContext.Provider value={value}>
    {children}
    </AuthContext.Provider>
  )

}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
