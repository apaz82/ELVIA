// Estado global de autenticación con control de plan freemium
import { createContext, useContext, useEffect, useState, useMemo } from 'react'
import { supabase } from '../services/authService'

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

  const fetchPerfil = async (userId, email) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
    if (data) {
      setPerfil(data)
      if (email && !data.email_principal) {
        await supabase.from('profiles').update({ email_principal: email }).eq('id', userId)
      }
    }
    setPerfilCargado(true)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchPerfil(session.user.id, session.user.email)
      } else {
        setPerfilCargado(true)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        setPerfilCargado(false)
        fetchPerfil(session.user.id, session.user.email)
        // Canjear código pendiente si el evento es un login nuevo
        if (_event === 'SIGNED_IN' && session.access_token) {
          redimirCodigoPendiente(
            session.access_token,
            () => fetchPerfil(session.user.id, session.user.email)
          )
        }
      } else {
        setPerfil(null); setPerfilCargado(true)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const login    = (email, password) => supabase.auth.signInWithPassword({ email, password })
  const register = (email, password) => supabase.auth.signUp({ email, password })
  const logout   = () => supabase.auth.signOut()

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

    // Plan semanal expirado → degradar a free en el cliente
    const planSemanalExpirado =
      plan === 'semanal' &&
      perfil.plan_expires_at &&
      new Date(perfil.plan_expires_at) < new Date()
    const planEfectivo = planSemanalExpirado ? 'free' : plan

    const PLANES_PAGO = ['semanal', 'mensual', 'trimestral']
    const isPaidPlan = PLANES_PAGO.includes(planEfectivo)

    // Trial: 14 días desde el registro
    const trialExpiresAt = perfil.free_trial_expires_at
      ? new Date(perfil.free_trial_expires_at)
      : null
    const trialExpired =
      !isPaidPlan &&
      trialExpiresAt !== null &&
      trialExpiresAt < new Date()

    const trialDaysLeft = trialExpiresAt
      ? Math.max(0, Math.ceil((trialExpiresAt - new Date()) / (1000 * 60 * 60 * 24)))
      : 14

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

  const onboardingPendiente = !loading && perfilCargado && !!user && (!perfil || !perfil.nombre1)

  return (
    <AuthContext.Provider value={{
      user, session, loading,
      login, register, logout,
      perfil,
      refreshPerfil: (uid) => fetchPerfil(uid || user?.id),
      refreshUsage:  ()    => user && fetchPerfil(user.id),
      onboardingPendiente,
      // Plan info — usa directamente estos valores en los componentes
      ...planInfo,
      // Retrocompatibilidad
      usageCount, creditosRestantes, LIMITE_PLAN,
    }}>
    {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
