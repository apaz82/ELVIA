// Página de autenticación — login, registro y recuperar contraseña
import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../services/authService'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export default function Auth() {
  const { user, login, register, onboardingPendiente } = useAuth()
  const navigate = useNavigate()

  const [searchParams] = useSearchParams()
  const [modo, setModo]         = useState(
    searchParams.get('register') ? 'register' :
    searchParams.get('forgot')   ? 'forgot'   : 'login'
  )
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState('')
  const [aceptaPolitica, setAceptaPolitica] = useState(false)
  const [codigoAcceso, setCodigoAcceso] = useState('')

  // Estados de pantallas de confirmación
  const [verificando, setVerificando]     = useState(false) // post-registro
  const [resetEnviado, setResetEnviado]   = useState(false) // post-forgot

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (!user) return
    if (onboardingPendiente) navigate('/onboarding', { replace: true })
    else navigate('/cv-optimizer', { replace: true })
  }, [user, onboardingPendiente])

  const cambiarModo = (nuevoModo) => {
    setModo(nuevoModo)
    setError('')
    setPassword('')
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

  // ── Login / Registro ──────────────────────────────────────────────────────
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
          // Guardar código de acceso para canjearlo tras el primer login
          if (codigoAcceso.trim()) {
            localStorage.setItem('pending_access_code', codigoAcceso.trim().toUpperCase())
          }
          // Enviar email de bienvenida via Resend (no bloquea el flujo)
          fetch(`${API}/api/email/bienvenida`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
          }).catch(() => {}) // silenciar errores del email, no son críticos
          setVerificando(true)
        }
      }
    } catch {
      setError('Error inesperado. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  // ── Recuperar contraseña ──────────────────────────────────────────────────
  const handleForgot = async (e) => {
    e.preventDefault()
    if (!email.trim()) { setError('Ingresa tu email para continuar.'); return }
    setLoading(true)
    setError('')

    try {
      const resetUrl = `${window.location.origin}/reset-password`
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: resetUrl,
      })
      if (error) {
        setError(traducirError(error.message))
      } else {
        // Email de notificación con el link real (lo maneja Supabase internamente)
        // Enviamos adicionalmente nuestro propio email de notificación
        fetch(`${API}/api/email/recuperacion`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, resetUrl }),
        }).catch(() => {})
        setResetEnviado(true)
      }
    } catch {
      setError('Error inesperado. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  // ── Pantalla: verificar email (post-registro) ─────────────────────────────
  if (verificando) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-white rounded-2xl border border-gray-200 p-10 shadow-sm">
            <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Revisa tu email</h2>
            <p className="text-gray-500 text-sm mb-2">Enviamos un enlace de verificación y tu email de bienvenida a:</p>
            <p className="font-semibold text-gray-900 mb-5">{email}</p>
            <p className="text-gray-400 text-xs mb-6 leading-relaxed">
              Haz clic en el enlace del correo para activar tu cuenta. Luego ya puedes iniciar sesión.
            </p>
            <button
              onClick={() => { setVerificando(false); cambiarModo('login') }}
              className="text-teal-600 font-semibold text-sm hover:underline"
            >
              Ya verifiqué → Iniciar sesión
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Pantalla: reset enviado (post-forgot) ─────────────────────────────────
  if (resetEnviado) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-white rounded-2xl border border-gray-200 p-10 shadow-sm">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Revisa tu correo</h2>
            <p className="text-gray-500 text-sm mb-2">Enviamos las instrucciones de recuperación a:</p>
            <p className="font-semibold text-gray-900 mb-5">{email}</p>
            <p className="text-gray-400 text-xs mb-6 leading-relaxed">
              El enlace es válido por 60 minutos. Si no lo ves, revisa tu carpeta de spam.
            </p>
            <button
              onClick={() => { setResetEnviado(false); cambiarModo('login') }}
              className="text-teal-600 font-semibold text-sm hover:underline"
            >
              ← Volver al inicio de sesión
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
            <img src="/optima_logo_v3_clean_1.png" alt="OPTIMA-CV" className="h-14 w-auto mx-auto mb-4 object-contain" />
            <h1 className="text-2xl font-bold text-gray-900">
              {modo === 'login'    ? 'Iniciar sesión'
               : modo === 'register' ? 'Crear cuenta gratis'
               : 'Recuperar contraseña'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {modo === 'login'    ? 'Bienvenido de nuevo'
               : modo === 'register' ? 'Créditos gratuitos de Análisis al registrarte'
               : 'Te enviaremos un enlace por email'}
            </p>
          </div>

          {/* ── Formulario olvidé contraseña ── */}
          {modo === 'forgot' ? (
            <form onSubmit={handleForgot} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Email de tu cuenta</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder="tu@email.com"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-colors"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
              )}

              <button
                type="submit" disabled={loading}
                className="w-full py-3 bg-gray-900 text-white font-bold text-sm rounded-xl hover:bg-gray-800 disabled:opacity-60 transition-colors"
              >
                {loading
                  ? <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Enviando...
                    </span>
                  : 'Enviar instrucciones'
                }
              </button>

              <button
                type="button"
                onClick={() => cambiarModo('login')}
                className="w-full text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                ← Volver al inicio de sesión
              </button>
            </form>

          ) : (
            /* ── Formulario login / registro ── */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder="tu@email.com"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-colors bg-transparent text-gray-900"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-600">Contraseña</label>
                  {modo === 'login' && (
                    <button
                      type="button"
                      onClick={() => cambiarModo('forgot')}
                      className="text-xs text-teal-600 hover:underline font-medium"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  )}
                </div>
                <input
                  type="password" value={password} onChange={e => setPassword(e.target.value)} required
                  placeholder="••••••••" minLength={6}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-colors bg-transparent text-gray-900"
                />
                {modo === 'register' && (
                  <p className="text-xs text-gray-400 mt-1">Mínimo 6 caracteres</p>
                )}
              </div>

              {/* Código de acceso — solo en registro */}
              {modo === 'register' && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Código de acceso{' '}
                    <span className="text-gray-400 font-normal">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={codigoAcceso}
                    onChange={e => setCodigoAcceso(e.target.value.toUpperCase())}
                    placeholder="Ej: BETA2025"
                    maxLength={30}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-colors bg-transparent text-gray-900 uppercase tracking-widest placeholder-normal"
                  />
                  <p className="text-xs text-gray-400 mt-1">¿Te compartieron un código? Ingrésalo aquí para activar tu plan.</p>
                </div>
              )}

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
                    <a href="/privacidad" target="_blank" rel="noreferrer"
                       className="text-teal-600 font-semibold hover:underline">
                      Política de Privacidad y Tratamiento de Datos
                    </a>
                    {' '}de OPTIMA | CV.
                  </span>
                </label>
              )}

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
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
          )}

          {/* Cambiar entre login y registro */}
          {modo !== 'forgot' && (
            <p className="mt-5 text-center text-sm text-gray-500">
              {modo === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
              <button
                onClick={() => cambiarModo(modo === 'login' ? 'register' : 'login')}
                className="text-teal-600 font-semibold hover:underline"
              >
                {modo === 'login' ? 'Regístrate gratis' : 'Inicia sesión'}
              </button>
            </p>
          )}
        </div>

        {/* ── Testimonios — solo en registro ── */}
        {modo === 'register' && (
          <div className="mt-6 space-y-3">
            <p className="text-center text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
              Lo que dicen nuestros candidatos
            </p>

            {[
              {
                texto: 'En 3 días de usar OPTIMA conseguí 4 entrevistas. Mi CV pasó de ser ignorado a destacar en cada postulación.',
                nombre: 'Carlos M.',
                cargo: 'Gerente de Proyectos · CDMX',
                iniciales: 'CM',
                color: 'bg-teal-500',
              },
              {
                texto: 'El análisis CV vs Vacante me mostró exactamente qué palabras clave me faltaban. Conseguí el trabajo que quería.',
                nombre: 'Andrea R.',
                cargo: 'Analista de Datos · Bogotá',
                iniciales: 'AR',
                color: 'bg-indigo-500',
              },
              {
                texto: 'Nunca pensé que mi CV estuviera tan mal estructurado. OPTIMA lo transformó completamente en minutos.',
                nombre: 'Miguel T.',
                cargo: 'Ingeniero de Software · Buenos Aires',
                iniciales: 'MT',
                color: 'bg-orange-500',
              },
            ].map((t, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <p className="text-xs text-gray-600 leading-relaxed mb-3">"{t.texto}"</p>
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-full ${t.color} flex items-center justify-center shrink-0`}>
                    <span className="text-white text-[10px] font-bold">{t.iniciales}</span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-800">{t.nombre}</p>
                    <p className="text-[10px] text-gray-400">{t.cargo}</p>
                  </div>
                  <div className="ml-auto flex gap-0.5">
                    {[...Array(5)].map((_, s) => (
                      <svg key={s} className="w-3 h-3 text-amber-400 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
