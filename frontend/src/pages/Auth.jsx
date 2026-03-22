// Página de autenticación — email/password + Google + LinkedIn
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../services/authService'

// Íconos SVG inline para no depender de librerías extra
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)

const LinkedInIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="#0A66C2">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
)

export default function Auth() {
  const { user, login, register, onboardingPendiente } = useAuth()
  const navigate = useNavigate()

  const [modo, setModo]       = useState('login') // login | register
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState('')
  const [error, setError]     = useState('')
  const [verificando, setVerificando] = useState(false) // pantalla "revisa tu email"

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (!user) return
    if (onboardingPendiente) navigate('/onboarding', { replace: true })
    else navigate('/cv-optimizer', { replace: true })
  }, [user, onboardingPendiente])

  // ── Email / Password ──────────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (modo === 'login') {
        const { error } = await login(email, password)
        if (error) setError(traducirError(error.message))
      } else {
        const { error } = await register(email, password)
        if (error) {
          setError(traducirError(error.message))
        } else {
          setVerificando(true) // mostrar pantalla de verificación
        }
      }
    } catch {
      setError('Error inesperado. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  // ── OAuth ─────────────────────────────────────────────────────────────────

  const handleOAuth = async (provider) => {
    setOauthLoading(provider)
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin + '/auth',
      },
    })
    if (error) {
      setError('No se pudo conectar con ' + (provider === 'google' ? 'Google' : 'LinkedIn'))
      setOauthLoading('')
    }
    // Si no hay error, el navegador redirige a OAuth — no hay más código que correr aquí
  }

  // ── Traducción de errores de Supabase ─────────────────────────────────────

  const traducirError = (msg) => {
    if (msg.includes('Invalid login credentials')) return 'Email o contraseña incorrectos.'
    if (msg.includes('Email not confirmed'))        return 'Debes verificar tu email antes de iniciar sesión.'
    if (msg.includes('User already registered'))    return 'Ya existe una cuenta con este email.'
    if (msg.includes('Password should be'))         return 'La contraseña debe tener al menos 6 caracteres.'
    if (msg.includes('rate limit'))                 return 'Demasiados intentos. Espera unos minutos.'
    return msg
  }

  // ── Pantalla: verificar email ─────────────────────────────────────────────

  if (verificando) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-white rounded-2xl border border-gray-200 p-10">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Revisa tu email</h2>
            <p className="text-gray-500 text-sm mb-2">
              Enviamos un enlace de verificación a:
            </p>
            <p className="font-semibold text-gray-800 mb-5">{email}</p>
            <p className="text-gray-400 text-xs mb-6">
              Haz clic en el enlace del correo para activar tu cuenta. Después podrás iniciar sesión.
            </p>
            <button
              onClick={() => { setVerificando(false); setModo('login') }}
              className="text-primary font-medium text-sm hover:underline"
            >
              Ya verifiqué → Iniciar sesión
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Formulario principal ──────────────────────────────────────────────────

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">

          {/* Logo + título */}
          <div className="text-center mb-7">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mx-auto mb-3">
              <span className="text-white font-bold text-lg">CV</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              {modo === 'login' ? 'Iniciar sesión' : 'Crear cuenta gratis'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {modo === 'login' ? 'Bienvenido de nuevo' : '2 análisis gratuitos al registrarte'}
            </p>
          </div>

          {/* Botones OAuth */}
          <div className="space-y-2.5 mb-5">
            <button
              onClick={() => handleOAuth('google')}
              disabled={!!oauthLoading}
              className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 transition-colors"
            >
              {oauthLoading === 'google'
                ? <span className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                : <GoogleIcon />
              }
              Continuar con Google
            </button>

            <button
              onClick={() => handleOAuth('linkedin_oidc')}
              disabled={!!oauthLoading}
              className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 transition-colors"
            >
              {oauthLoading === 'linkedin_oidc'
                ? <span className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                : <LinkedInIcon />
              }
              Continuar con LinkedIn
            </button>
          </div>

          {/* Separador */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400 font-medium">o con email</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* Formulario email/password */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="tu@email.com"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)} required
                placeholder="••••••••" minLength={6}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
              />
              {modo === 'register' && (
                <p className="text-xs text-gray-400 mt-1">Mínimo 6 caracteres</p>
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit" disabled={loading}
              className="btn-primary w-full disabled:opacity-60"
            >
              {loading
                ? <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    {modo === 'login' ? 'Entrando...' : 'Registrando...'}
                  </span>
                : modo === 'login' ? 'Entrar' : 'Registrarme'
              }
            </button>
          </form>

          {/* Cambiar modo */}
          <p className="mt-5 text-center text-sm text-gray-500">
            {modo === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
            <button
              onClick={() => { setModo(modo === 'login' ? 'register' : 'login'); setError('') }}
              className="text-primary font-semibold hover:underline"
            >
              {modo === 'login' ? 'Regístrate gratis' : 'Inicia sesión'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
