// Página de autenticación — login, registro y recuperar contraseña
import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../services/authService'
import { Turnstile } from '@marsidev/react-turnstile'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const INDICATIVOS_REG = [
  {code:'+52',label:'MX +52'},{code:'+57',label:'CO +57'},{code:'+54',label:'AR +54'},
  {code:'+56',label:'CL +56'},{code:'+51',label:'PE +51'},{code:'+58',label:'VE +58'},
  {code:'+593',label:'EC +593'},{code:'+591',label:'BO +591'},{code:'+598',label:'UY +598'},
  {code:'+506',label:'CR +506'},{code:'+507',label:'PA +507'},{code:'+503',label:'SV +503'},
  {code:'+502',label:'GT +502'},{code:'+504',label:'HN +504'},{code:'+505',label:'NI +505'},
  {code:'+1',label:'DO +1'},{code:'+53',label:'CU +53'},{code:'+34',label:'ES +34'},
  {code:'+1',label:'US +1'},{code:'+1',label:'CA +1'},{code:'+55',label:'BR +55'},
]

const checkPassword = (pwd) => ({
  length:  pwd.length >= 8,
  upper:   /[A-Z]/.test(pwd),
  number:  /[0-9]/.test(pwd),
  special: /[!@#$%^&*()\-_=+\[\]{};:'"\\|,.<>/?]/.test(pwd),
})

export default function Auth() {
  const { user, login, register, logout, onboardingPendiente, isRecovering, isCompanyAdmin, perfil } = useAuth()
  const navigate = useNavigate()
  const turnstileRef = useRef(null)

  const [searchParams] = useSearchParams()
  // /auth solo muestra login — registro B2C deshabilitado en modo comercial B2B
  const [modo, setModo]         = useState(
    searchParams.get('forgot') ? 'forgot' : 'login'
  )
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [showPwd, setShowPwd]     = useState(false)
  const [nombre, setNombre]       = useState('')
  const [apellido, setApellido]   = useState('')
  const [indicativo, setIndicativo] = useState('+52')
  const [telefono, setTelefono]   = useState('')
  const [pais, setPais]           = useState('')
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState('')
  const [aceptaPolitica, setAceptaPolitica] = useState(false)
  const [codigoAcceso, setCodigoAcceso] = useState('')
  const [turnstileToken, setTurnstileToken] = useState(null)

  const pwdChecks = checkPassword(password)
  const pwdScore  = Object.values(pwdChecks).filter(Boolean).length
  const pwdStrong = pwdScore === 4

  // Estados de pantallas de confirmación
  const [verificando, setVerificando]     = useState(false) // post-registro
  const [resetEnviado, setResetEnviado]   = useState(false) // post-forgot
  // loginSuccess: true solo cuando el usuario hizo login DESDE ESTE FORMULARIO.
  // Si ya había sesión activa al llegar a /auth, se muestra banner sin auto-redirect.
  const [loginSuccess, setLoginSuccess]   = useState(false)

  // Redirigir solo después de un login/registro explícito en este formulario
  useEffect(() => {
    const isRecoveryMode = sessionStorage.getItem('optima_recovery_mode') === 'true' || isRecovering || window.location.hash.includes('type=recovery')
    if (isRecoveryMode) {
      if (!window.location.pathname.startsWith('/reset-password')) {
        const savedHash = sessionStorage.getItem('optima_recovery_hash') || ''
        navigate('/reset-password' + (window.location.hash || savedHash), { replace: true })
      }
      return
    }

    if (!user || !loginSuccess) return

    if (isCompanyAdmin) {
      navigate('/empresa-admin', { replace: true })
      return
    }
    const returnTo = searchParams.get('returnTo')
    if (returnTo && returnTo.startsWith('/')) {
      navigate(returnTo, { replace: true })
    } else if (onboardingPendiente) {
      navigate('/bienvenida', { replace: true })
    } else {
      navigate('/cv-optimizer', { replace: true })
    }
  }, [user, loginSuccess, isCompanyAdmin, onboardingPendiente, navigate, isRecovering, searchParams])

  const cambiarModo = (nuevoModo) => {
    setModo(nuevoModo)
    setError('')
    setPassword('')
    setNombre(''); setApellido(''); setTelefono('')
    setTurnstileToken(null)
    if (turnstileRef.current) turnstileRef.current.reset()
  }

  // ── Traducción de errores de Supabase ─────────────────────────────────────
  const traducirError = (msg) => {
    if (msg.includes('Invalid login credentials')) return '__NO_REGISTRADO__'
    if (msg.includes('Email not confirmed'))        return 'Debes verificar tu email antes de iniciar sesión.'
    if (msg.includes('User already registered'))    return 'Ya existe una cuenta con este email.'
    if (msg.includes('Password should be'))         return 'La contraseña no cumple los requisitos mínimos de seguridad.'
    if (msg.includes('rate limit'))                 return 'Demasiados intentos. Espera unos minutos.'
    if (msg.includes('Auth session missing') || msg.includes('session_not_found')) return 'Error de validación de seguridad. Recarga la página e intenta de nuevo.'
    if (msg.includes('captcha'))                    return 'Error en la verificación de seguridad. Recarga la página e intenta de nuevo.'
    return msg
  }

  // ── Login / Registro ──────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (modo === 'login') {
        const { error } = await login(email, password, turnstileToken)
        if (error) {
          setError(traducirError(error.message))
          if (turnstileRef.current) turnstileRef.current.reset()
          setTurnstileToken(null)
        } else {
          setLoginSuccess(true)
        }
      } else {
        // Validaciones de registro
        if (!nombre.trim())    { setError('El nombre es requerido.'); setLoading(false); return }
        if (!apellido.trim())  { setError('El apellido es requerido.'); setLoading(false); return }
        if (!pwdStrong)        { setError('La contraseña no cumple los requisitos de seguridad.'); setLoading(false); return }
        if (!aceptaPolitica)   { setError('Debes aceptar la política de tratamiento de datos.'); setLoading(false); return }

        const { error } = await register(email, password, {
          nombre1:    nombre.trim(),
          apellido1:  apellido.trim(),
          indicativo1: indicativo,
          telefono1:  telefono.trim() || null,
          pais:       pais || null,
        }, turnstileToken)
        if (error) {
          if (turnstileRef.current) turnstileRef.current.reset()
          setTurnstileToken(null)
          setError(traducirError(error.message))
        } else {
          if (codigoAcceso.trim()) {
            localStorage.setItem('pending_access_code', codigoAcceso.trim().toUpperCase())
          }
          fetch(`${API}/api/email/bienvenida`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
          }).catch(() => {})
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
      // Delegamos la generación del link y el envío del mail al backend
      // Esto evita el mail genérico de Supabase y nos deja usar nuestro template de Resend
      const response = await fetch(`${API}/api/email/recuperacion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, resetUrl }),
      })

      if (!response.ok) {
        const data = await response.json()
        if (data.code === 'USER_NOT_FOUND') {
          setError('__NO_REGISTRADO__')
        } else {
          setError(data.error || 'No se pudo enviar el correo de recuperación.')
        }
      } else {
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

  // ── Sesión activa (usuario llegó a /auth ya logueado, sin hacer login aquí) ──
  if (user && !loginSuccess && !verificando && !resetEnviado) {
    const destino = isCompanyAdmin ? '/empresa-admin' : (onboardingPendiente ? '/bienvenida' : '/cv-optimizer')
    const emailActivo = perfil?.email_principal || user.email || ''
    const handleContinuar = () => navigate(destino, { replace: true })
    const handleCerrar = async () => { await logout(); setLoginSuccess(false) }

    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm text-center">
            <div className="w-14 h-14 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Ya tienes sesión activa</h2>
            <p className="text-sm text-gray-500 mb-1">Conectado como:</p>
            <p className="text-sm font-semibold text-gray-800 mb-6 truncate">{emailActivo}</p>
            <button
              onClick={handleContinuar}
              className="w-full py-2.5 px-6 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl transition-all mb-3"
            >
              Continuar con esta cuenta
            </button>
            <button
              onClick={handleCerrar}
              className="w-full py-2.5 px-6 border border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-900 font-medium rounded-xl transition-all text-sm"
            >
              Cerrar sesión y cambiar de cuenta
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
          <div className="text-center mb-6">
            <Link to="/">
              <img src="/LOGOS/ELVIA_logo_fondo_transparente.png" alt="ELVIA" className="h-10 mx-auto mb-6" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">
              {modo === 'login' ? 'Iniciar sesión' : modo === 'register' ? 'Crear cuenta' : 'Recuperar contraseña'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {modo === 'login' ? 'Accede a tu cuenta ELVIA' : modo === 'register' ? 'Crea tu cuenta' : 'Te enviaremos un enlace por email'}
            </p>
          </div>

          {/* Banner informativo — solo en login */}
          {modo === 'login' && (
            <div className="mb-5 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex gap-3 items-start">
              <svg className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-xs font-semibold text-blue-800 mb-0.5">Acceso exclusivo para participantes</p>
                <p className="text-xs text-blue-700 leading-relaxed">
                  Este portal es para usuarios registrados en un programa corporativo ELVIA.
                  Si tu empresa aún no hace parte, <a href="/#contacto-comercial" className="underline font-semibold hover:text-blue-900">solicita información aquí</a>.
                </p>
              </div>
            </div>
          )}

          {/* ── Formulario olvidé contraseña ── */}
          {modo === 'forgot' ? (
            <form onSubmit={handleForgot} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Email de tu cuenta</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder="tu@email.com"
                  onInvalid={e => e.target.setCustomValidity('Por favor, ingresa un correo electrónico válido.')}
                  onInput={e => e.target.setCustomValidity('')}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-colors"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                  {error === '__NO_REGISTRADO__' ? (
                    <span>
                      No encontramos una cuenta con este email.{' '}
                      <button type="button" onClick={() => cambiarModo('register')}
                        className="underline font-semibold hover:text-red-800 cursor-pointer">
                        ¿Quieres crear una cuenta gratis?
                      </button>
                    </span>
                  ) : error}
                </div>
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

              {/* Nombre + Apellido — solo en registro */}
              {modo === 'register' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Nombre <span className="text-red-400">*</span></label>
                    <input
                      type="text" value={nombre} onChange={e => setNombre(e.target.value)} required
                      placeholder="Ej: María"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Apellido <span className="text-red-400">*</span></label>
                    <input
                      type="text" value={apellido} onChange={e => setApellido(e.target.value)} required
                      placeholder="Ej: García"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-colors"
                    />
                  </div>
                </div>
              )}

              {/* País — solo en registro */}
              {modo === 'register' && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">País <span className="text-red-400">*</span></label>
                  <select
                    value={pais} onChange={e => setPais(e.target.value)} required
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 bg-white transition-colors"
                  >
                    <option value="">Selecciona tu país</option>
                    {['México','Colombia','Argentina','Chile','Perú','España','Estados Unidos','Venezuela','Ecuador','Bolivia','Uruguay','Paraguay','Costa Rica','Guatemala','Panamá','Otro'].map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Teléfono — solo en registro */}
              {modo === 'register' && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Teléfono <span className="text-gray-400 font-normal">(opcional)</span>
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={indicativo} onChange={e => setIndicativo(e.target.value)}
                      className="border border-gray-200 rounded-xl px-2 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 bg-white text-gray-700 shrink-0"
                    >
                      {INDICATIVOS_REG.map((i, idx) => (
                        <option key={idx} value={i.code}>{i.label}</option>
                      ))}
                    </select>
                    <input
                      type="tel" value={telefono} onChange={e => setTelefono(e.target.value.replace(/\D/g, ''))}
                      placeholder="55 1234 5678"
                      className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-colors"
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Email <span className="text-red-400">*</span></label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder="tu@email.com"
                  onInvalid={e => e.target.setCustomValidity('Por favor, ingresa un correo electrónico válido.')}
                  onInput={e => e.target.setCustomValidity('')}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-colors bg-transparent text-gray-900"
                />
              </div>

              {/* Contraseña */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-600">
                    Contraseña <span className="text-red-400">*</span>
                  </label>
                  {modo === 'login' && (
                    <button type="button" onClick={() => cambiarModo('forgot')}
                      className="text-xs text-teal-600 hover:underline font-medium">
                      ¿Olvidaste tu contraseña?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={password} onChange={e => setPassword(e.target.value)} required
                    placeholder="••••••••"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-colors bg-transparent text-gray-900"
                  />
                  <button type="button" onClick={() => setShowPwd(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-medium">
                    {showPwd ? 'Ocultar' : 'Ver'}
                  </button>
                </div>

                {/* Indicador de fortaleza — solo en registro */}
                {modo === 'register' && password.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {/* Barra */}
                    <div className="flex gap-1">
                      {[0,1,2,3].map(i => (
                        <div key={i} className={'h-1 flex-1 rounded-full transition-colors '+(
                          pwdScore > i
                            ? pwdScore === 4 ? 'bg-emerald-500'
                            : pwdScore === 3 ? 'bg-amber-400'
                            : 'bg-red-400'
                            : 'bg-gray-200'
                        )}/>
                      ))}
                    </div>
                    {/* Checklist */}
                    <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                      {[
                        { key:'length',  label:'8+ caracteres'  },
                        { key:'upper',   label:'1 mayúscula'    },
                        { key:'number',  label:'1 número'       },
                        { key:'special', label:'1 símbolo (!@#…)'},
                      ].map(c => (
                        <p key={c.key} className={'text-xs flex items-center gap-1 '+(pwdChecks[c.key]?'text-emerald-600':'text-gray-400')}>
                          <span>{pwdChecks[c.key] ? '✓' : '○'}</span> {c.label}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Código promocional — solo en registro */}
              {modo === 'register' && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Código promocional <span className="text-gray-400 font-normal">(opcional)</span>
                  </label>
                  <input
                    type="text" value={codigoAcceso}
                    onChange={e => setCodigoAcceso(e.target.value.toUpperCase())}
                    placeholder="EJ: OPTIMA2025" maxLength={30}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-colors uppercase tracking-widest"
                  />
                  <p className="text-xs text-gray-400 mt-1">¿Te compartieron un código? Ingrésalo aquí para activar tu plan.</p>
                </div>
              )}

              {/* Checkbox política — solo en registro */}
              {modo === 'register' && (
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input type="checkbox" checked={aceptaPolitica}
                    onChange={e => { setAceptaPolitica(e.target.checked); setError('') }}
                    className="mt-0.5 w-4 h-4 accent-teal-600 shrink-0 cursor-pointer"
                  />
                  <span className="text-xs text-gray-500 leading-relaxed">
                    He leído y acepto la{' '}
                    <a href="/privacidad" target="_blank" rel="noreferrer"
                       className="text-teal-600 font-semibold hover:underline">
                      Política de Privacidad y Tratamiento de Datos
                    </a>{' '}de ELVIA.
                  </span>
                </label>
              )}

              {/* Validación de robot (Cloudflare Turnstile) — login y registro */}
              <div className="flex justify-center py-2">
                <Turnstile
                  ref={turnstileRef}
                  siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'}
                  onSuccess={(token) => setTurnstileToken(token)}
                  onExpire={() => setTurnstileToken(null)}
                  onError={() => {
                    setError('Error en la validación de seguridad. Intenta de nuevo.')
                    if (turnstileRef.current) turnstileRef.current.reset()
                    setTurnstileToken(null)
                  }}
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                  {error === '__NO_REGISTRADO__' ? (
                    <span>
                      No encontramos una cuenta con ese correo y contraseña.{' '}
                      <button type="button" onClick={() => cambiarModo('forgot')}
                        className="underline font-semibold hover:text-red-800 cursor-pointer">
                        ¿Olvidaste tu contraseña?
                      </button>
                      {' '}Si no tienes acceso, contacta al administrador de tu programa.
                    </span>
                  ) : error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || (modo === 'register' && (!aceptaPolitica || !pwdStrong))}
                className="btn-primary w-full disabled:opacity-60"
              >
                {loading
                  ? <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/>
                      {modo === 'login' ? 'Entrando...' : 'Registrando...'}
                    </span>
                  : modo === 'login' ? 'Entrar' : 'Registrarme'
                }
              </button>
            </form>
          )}

          {/* Volver al login desde registro (B2B) */}
          {modo === 'register' && (
            <p className="mt-5 text-center text-sm text-gray-500">
              ¿Ya tienes cuenta?{' '}
              <button onClick={() => cambiarModo('login')} className="text-teal-600 font-semibold hover:underline">
                Inicia sesión
              </button>
            </p>
          )}
          {/* Olvidaste contraseña — volver desde forgot */}
          {modo === 'forgot' && (
            <p className="mt-5 text-center text-sm text-gray-500">
              <button onClick={() => cambiarModo('login')} className="text-teal-600 font-semibold hover:underline">
                ← Volver al inicio de sesión
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
                texto: 'En 3 días de usar ELVIA conseguí 4 entrevistas. Mi CV pasó de ser ignorado a destacar en cada postulación.',
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
                texto: 'Nunca pensé que mi CV estuviera tan mal estructurado. ELVIA lo transformó completamente en minutos.',
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
