// Estado global de autenticación
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../services/authService'

const AuthContext = createContext(null)

const LIMITE_PLAN = 2 // Plan gratuito — actualizar cuando haya planes de pago

export const AuthProvider = ({ children }) => {
  const [user, setUser]             = useState(null)
  const [session, setSession]       = useState(null)
  const [loading, setLoading]       = useState(true)
  const [perfilCargado, setPerfilCargado] = useState(false)
  const [usageCount, setUsageCount] = useState(0)
  const [perfil, setPerfil]         = useState(null)

  const fetchPerfil = async (userId, email) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
    if (data) {
      setUsageCount(data.usage_count || 0)
      setPerfil(data)
      if (email && !data.email_principal) {
        await supabase.from('profiles').update({ email_principal: email }).eq('id', userId)
      }
    }
    // Marcar perfil como cargado independientemente de si hay datos o no
    setPerfilCargado(true)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchPerfil(session.user.id, session.user.email)
      } else {
        setPerfilCargado(true) // sin sesión no hay perfil que esperar
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        setPerfilCargado(false)
        fetchPerfil(session.user.id, session.user.email)
      } else {
        setUsageCount(0); setPerfil(null); setPerfilCargado(true)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const login    = (email, password) => supabase.auth.signInWithPassword({ email, password })
  const register = (email, password) => supabase.auth.signUp({ email, password })
  const logout   = () => supabase.auth.signOut()

  const creditosRestantes = Math.max(0, LIMITE_PLAN - usageCount)
  // Onboarding pendiente: esperar a que el perfil esté cargado antes de decidir
  const onboardingPendiente = !loading && perfilCargado && !!user && (!perfil || !perfil.nombre1)

  return (
    <AuthContext.Provider value={{
      user, session, loading,
      login, register, logout,
      usageCount, creditosRestantes, LIMITE_PLAN,
      perfil, refreshPerfil: (uid) => fetchPerfil(uid || user?.id),
      refreshUsage: () => user && fetchPerfil(user.id),
      onboardingPendiente,
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
