// Estado global de autenticación
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../services/authService'

const AuthContext = createContext(null)

const LIMITE_PLAN = 2 // Plan gratuito — actualizar cuando haya planes de pago

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [usageCount, setUsageCount] = useState(0)
  const [perfil, setPerfil]         = useState(null)

  const fetchPerfil = async (userId) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
    if (data) {
      setUsageCount(data.usage_count || 0)
      setPerfil(data)
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) fetchPerfil(session.user.id)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) fetchPerfil(session.user.id)
      else { setUsageCount(0); setPerfil(null) }
    })

    return () => subscription.unsubscribe()
  }, [])

  const login    = (email, password) => supabase.auth.signInWithPassword({ email, password })
  const register = (email, password) => supabase.auth.signUp({ email, password })
  const logout   = () => supabase.auth.signOut()

  const creditosRestantes = Math.max(0, LIMITE_PLAN - usageCount)

  return (
    <AuthContext.Provider value={{
      user, session, loading,
      login, register, logout,
      usageCount, creditosRestantes, LIMITE_PLAN,
      perfil, refreshPerfil: (uid) => fetchPerfil(uid || user?.id),
      refreshUsage: () => user && fetchPerfil(user.id),
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
