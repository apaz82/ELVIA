// Página de autenticación — email/password + Google + LinkedIn
import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'


export default function Auth() {
  const { user, login, register, onboardingPendiente } = useAuth()
  const navigate = useNavigate()

  const [searchParams] = useSearchParams()
  const [modo, setModo]       = useState(searchParams.get('register') ? 'register' : 'login')
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [verificando, setVerificando] = useState(false) // pantalla "revisa tu email"
  const [aceptaPolitica, setAceptaPolitica] = useState(false)

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
        if (!aceptaPolitica) {
          setError('Debes aceptar la política de tratamiento de datos para registrarte.')
          setLoading(false)
          return
        }
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
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-10">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-on-surface mb-2">Revisa tu email</h2>
            <p className="text-on-surface-variant text-sm mb-2">
              Enviamos un enlace de verificación a:
            </p>
            <p className="font-semibold text-on-surface mb-5">{email}</p>
            <p className="text-on-surface-variant/70 text-xs mb-6">
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
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-8 shadow-sm">

          {/* Logo + título */}
          <div className="text-center mb-7">
            <img src="/optima_logo_v3_clean_1.png" alt="OPTIMA-CV" className="h-14 w-auto mx-auto mb-4 object-contain" />
            <h1 className="text-2xl font-bold text-on-surface">
              {modo === 'login' ? 'Iniciar sesión' : 'Crear cuenta gratis'}
            </h1>
            <p className="text-sm text-on-surface-variant mt-1">
              {modo === 'login' ? 'Bienvenido de nuevo' : '2 análisis gratuitos al registrarte'}
            </p>
          </div>


          {/* Formulario email/password */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-on-surface-variant mb-1">Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="tu@email.com"
                className="w-full border border-outline-variant/50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors bg-transparent text-on-surface"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-on-surface-variant mb-1">Contraseña</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)} required
                placeholder="••••••••" minLength={6}
                className="w-full border border-outline-variant/50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors bg-transparent text-on-surface"
              />
              {modo === 'register' && (
                <p className="text-xs text-on-surface-variant/70 mt-1">Mínimo 6 caracteres</p>
              )}
            </div>

            {/* Checkbox política — solo en registro */}
            {modo === 'register' && (
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={aceptaPolitica}
                  onChange={e => { setAceptaPolitica(e.target.checked); setError('') }}
                  className="mt-0.5 w-4 h-4 accent-teal-600 shrink-0 cursor-pointer"
                />
                <span className="text-xs text-gray-500 leading-relaxed">
                  He leído y acepto la{' '}
                  <a
                    href="/privacidad"
                    target="_blank"
                    rel="noreferrer"
                    className="text-teal-600 font-semibold hover:underline"
                  >
                    Política de Privacidad y Tratamiento de Datos
                  </a>
                  {' '}de OPTIMA | CV.
                </span>
              </label>
            )}

            {error && (
              <div className="p-3 bg-error-container/30 border border-error-container rounded-xl text-sm text-error">
                {error}
              </div>
            )}

            <button
              type="submit" disabled={loading || (modo === 'register' && !aceptaPolitica)}
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
