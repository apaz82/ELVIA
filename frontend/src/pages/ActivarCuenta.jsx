// Página de activación de cuenta B2B
// Ruta: /empresas/:slug/activar  y  /universidades/:slug/activar
// Llega aquí desde el email de invitación con hash de tipo 'recovery'
import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../services/authService'
import { useTenant, DEFAULT_TENANT } from '../context/TenantContext'
import { useAuth } from '../context/AuthContext'
import { CheckCircle, LockKey, Eye, EyeSlash, Warning, ShieldCheck } from '@phosphor-icons/react'
import { Turnstile } from '@marsidev/react-turnstile'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

function PasswordStrength({ checks, score }) {
  const labels = { length: '8+ caracteres', upper: 'Mayúscula', number: 'Número', special: 'Caracter especial' }
  return (
    <div className="mt-3 space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map(n => (
          <div key={n} className={`h-1 flex-1 rounded-full transition-colors ${n <= score ? (score < 3 ? 'bg-amber-400' : 'bg-emerald-500') : 'bg-gray-200'}`} />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {Object.entries(checks).map(([k, ok]) => (
          <span key={k} className={`text-[11px] font-medium flex items-center gap-1 ${ok ? 'text-emerald-600' : 'text-gray-400'}`}>
            <span>{ok ? '✓' : '○'}</span>{labels[k]}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function ActivarCuenta() {
  const { slug } = useParams()
  const navigate  = useNavigate()
  const { tenant, loading: tenantLoading, isUniversity } = useTenant()
  const { setIsRecovering, user, loading: authLoading, isCompanyAdmin, onboardingPendiente, featuresDesbloqueadas } = useAuth()

  const [password, setPassword]       = useState('')
  const [confirmar, setConfirmar]     = useState('')
  const [verPass, setVerPass]         = useState(false)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')
  const [exito, setExito]             = useState(false)
  const [tokenValido, setTokenValido] = useState(false)
  const [tokenExpirado, setTokenExpirado] = useState(false)
  const [candidateName, setCandidateName] = useState('')
  const [turnstileToken, setTurnstileToken] = useState(null)
  const turnstileRef = useRef(null)
  // Capturar el hash UNA vez al montar (no leer window.location.hash en render)
  const [initialHash] = useState(() => (typeof window !== 'undefined' ? window.location.hash : ''))

  const sectorPath = isUniversity ? 'universidades' : 'empresas'
  const primary    = tenant?.primary_color || DEFAULT_TENANT.primary_color
  const logo       = tenant?.logo_url || null

  const checkPassword = (pwd) => ({
    length:  pwd.length >= 8,
    upper:   /[A-Z]/.test(pwd),
    number:  /[0-9]/.test(pwd),
    special: /[!@#$%^&*()\-_=+[\]{};:'"\\|,.<>/?]/.test(pwd),
  })
  const pwdChecks = checkPassword(password)
  const pwdScore  = Object.values(pwdChecks).filter(Boolean).length
  const pwdStrong = pwdScore === 4

  useEffect(() => {
    if (initialHash.includes('error_code=otp_expired') || initialHash.includes('error=access_denied')) {
      setTokenExpirado(true)
      return
    }

    // Si el hash contiene un token de activación, cerramos cualquier sesión previa
    // ÚNICAMENTE si el token del hash no coincide con la sesión actual.
    // Esto evita cerrar la sesión recién iniciada por el token de recuperación en la carga de la página.
    const hasActivationToken = initialHash.includes('access_token') || initialHash.includes('type=recovery')

    const init = async () => {
      if (hasActivationToken) {
        const { data: { session: existing } } = await supabase.auth.getSession()
        if (existing) {
          const params = new URLSearchParams(initialHash.replace('#', '?'))
          const hashToken = params.get('access_token')
          // Solo cerrar sesión si la sesión activa NO corresponde al token del enlace
          if (hashToken && existing.access_token !== hashToken) {
            await supabase.auth.signOut()
          }
        }
      } else {
        // Sin hash de token: revisar si ya hay sesión activa (caso cuenta ya activada)
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          setTokenValido(true)
          const meta = session.user?.user_metadata || {}
          const name = [meta.nombre1, meta.apellido1].filter(Boolean).join(' ').trim()
          if (name) setCandidateName(name)
        }
      }
    }
    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        setTokenValido(true)
        const meta = session?.user?.user_metadata || {}
        const name = [meta.nombre1, meta.apellido1].filter(Boolean).join(' ').trim()
        if (name) setCandidateName(name)
      } else if (event === 'SIGNED_OUT' || !session) {
        setTokenValido(false)
        setCandidateName('')
      }
    })
    return () => subscription.unsubscribe()
  }, [initialHash])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!pwdStrong) {
      setError('La contraseña no cumple los requisitos mínimos de seguridad.')
      return
    }
    if (password !== confirmar) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)
    const { error: err } = await supabase.auth.updateUser({ password })

    if (err) {
      setLoading(false)
      setError(err.message || 'Error al configurar la contraseña. El enlace puede haber expirado.')
      if (turnstileRef.current) turnstileRef.current.reset()
      setTurnstileToken(null)
      return
    }

    // Notificar al backend para marcar la cuenta como activada
    // (antes de signOut, mientras todavía tenemos el access_token de recovery)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.access_token) {
        await fetch(`${API}/api/company/confirm-activation`, {
          method:  'POST',
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
      }
    } catch (e) {
      console.warn('[activar] confirm-activation no crítico:', e.message)
    }

    // CRÍTICO: cerrar sesión + limpiar estado de recovery.
    // Esto rompe el cordón umbilical con AuthContext y garantiza que el siguiente
    // paso (login manual) arranque desde cero, sin races ni perfiles stale.
    if (setIsRecovering) setIsRecovering(false)
    sessionStorage.removeItem('optima_recovery_mode')
    sessionStorage.removeItem('optima_recovery_hash')
    try { await supabase.auth.signOut() } catch { /* ignorar */ }

    setLoading(false)
    setExito(true)
    // NO auto-redirect. El usuario hace clic explícito en el botón de éxito.
  }

  if (tenantLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
      </div>
    )
  }

  // Si hay sesión activa pero NO hay token de recovery en el hash → cuenta ya activada
  // o es un admin que aterrizó aquí por error.
  const hasRecoveryHash = initialHash.includes('type=recovery') || initialHash.includes('access_token')
  if (user && !tokenValido && !hasRecoveryHash && !exito) {
    const destino = isCompanyAdmin
      ? '/empresa-admin'
      : onboardingPendiente
        ? '/bienvenida'
        : featuresDesbloqueadas
          ? '/dashboard'
          : '/proyecto-laboral'
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
        <div className="max-w-sm text-center">
          <CheckCircle size={52} className="mx-auto mb-4" style={{ color: primary }} weight="duotone" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Tu cuenta ya está activa</h1>
          <p className="text-sm text-gray-500 mb-6">
            Ya tienes una sesión iniciada. Puedes ir directo a tu panel.
          </p>
          <button
            onClick={() => navigate(destino)}
            className="px-6 py-2.5 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
            style={{ backgroundColor: primary }}
          >
            Ir a mi panel
          </button>
        </div>
      </div>
    )
  }

  // ── Token expirado ────────────────────────────────────────────────────────
  if (tokenExpirado) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
        <div className="max-w-sm text-center">
          <Warning size={52} className="text-amber-500 mx-auto mb-4" weight="duotone" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Enlace expirado</h1>
          <p className="text-sm text-gray-500 mb-6">
            El enlace de activación tiene una vigencia de 1 hora. Pide a tu área de Recursos Humanos que te reenvíe la invitación.
          </p>
          <button
            onClick={() => navigate(`/${sectorPath}/${slug}`)}
            className="px-6 py-2.5 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
            style={{ backgroundColor: primary }}
          >
            Volver al inicio
          </button>
        </div>
      </div>
    )
  }

  // ── Éxito ─────────────────────────────────────────────────────────────────
  if (exito) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
        <div className="max-w-sm text-center">
          <CheckCircle size={64} className="mx-auto mb-5" style={{ color: primary }} weight="duotone" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">¡Cuenta activada!</h1>
          <p className="text-sm text-gray-500 mb-8 leading-relaxed">
            Tu contraseña quedó configurada correctamente. Ahora inicia sesión
            con tu correo y la contraseña que acabas de crear.
          </p>
          <button
            onClick={() => navigate(`/${sectorPath}/${slug}/login?activated=1`, { replace: true })}
            className="w-full py-3.5 text-sm font-bold text-white rounded-xl shadow-sm hover:opacity-90 active:scale-[0.98] transition-all"
            style={{ backgroundColor: primary }}
          >
            Iniciar sesión
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header minimal con logos */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-4">
          {logo && (
            <img src={logo} alt={tenant?.name || ''} className="h-20 object-contain max-w-[220px]" />
          )}
          {logo && (
            <div className="h-6 w-px bg-gray-200" />
          )}
          <img src="/LOGOS/ELVIA_logo_fondo_transparente.png" alt="ELVIA" className="h-8 object-contain opacity-75" />
        </div>
      </header>

      {/* Formulario */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div
              className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
              style={{ backgroundColor: `color-mix(in srgb, ${primary} 12%, transparent)` }}
            >
              <LockKey size={28} style={{ color: primary }} weight="duotone" />
            </div>
            <h1 className="text-2xl font-black text-gray-900 mb-1">
              {candidateName ? `Hola, ${candidateName.split(' ')[0]}` : 'Activa tu cuenta'}
            </h1>
            <p className="text-sm text-gray-500">
              {candidateName
                ? `Bienvenido${tenant?.name ? ` al programa ${tenant.name}` : ''}. Crea tu contraseña para empezar.`
                : `${tenant?.name ? `Programa ${tenant.name} · ` : ''}Crea tu contraseña para empezar`}
            </p>
          </div>

          {!tokenValido ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <div className="w-7 h-7 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin" />
              <p className="text-sm text-gray-400">Verificando enlace de activación…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Contraseña */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                  Nueva contraseña
                </label>
                <div className="relative">
                  <input
                    type={verPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="Mínimo 8 caracteres"
                    className="w-full px-4 py-3 pr-11 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                    style={{ '--tw-ring-color': primary }}
                  />
                  <button
                    type="button"
                    onClick={() => setVerPass(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                  >
                    {verPass ? <EyeSlash size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {password && <PasswordStrength checks={pwdChecks} score={pwdScore} />}
              </div>

              {/* Confirmar */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                  Confirmar contraseña
                </label>
                <input
                  type="password"
                  value={confirmar}
                  onChange={e => setConfirmar(e.target.value)}
                  required
                  placeholder="Repite la contraseña"
                  className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                  style={{ '--tw-ring-color': primary }}
                />
                {confirmar && password !== confirmar && (
                  <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                    <Warning size={12} />Las contraseñas no coinciden
                  </p>
                )}
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm">
                  <Warning size={16} className="shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              <div className="flex justify-center">
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

              <button
                type="submit"
                disabled={loading || !pwdStrong || password !== confirmar || !turnstileToken}
                className="w-full py-3.5 text-sm font-bold text-white rounded-xl shadow-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: primary }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Activando…
                  </span>
                ) : 'Activar cuenta'}
              </button>

              <div className="flex items-center gap-2 text-xs text-gray-400 pt-1">
                <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
                <span>Tu información es confidencial y está protegida.</span>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
