// Página de restablecimiento de contraseña
// Se accede desde el link del email de recuperación enviado por Supabase
import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../services/authService'
import { useAuth } from '../context/AuthContext'
import { CheckCircle, LockKey, Eye, EyeSlash, Warning } from '@phosphor-icons/react'

export default function ResetPassword() {
  const { setIsRecovering } = useAuth()
  const navigate  = useNavigate()
  const [password, setPassword]   = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [verPass, setVerPass]     = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [exito, setExito]         = useState(false)
  const [tokenValido, setTokenValido] = useState(false)
  const [tokenExpirado, setTokenExpirado] = useState(false)

  // Detectar error en el hash del URL antes de que Supabase procese la sesión
  useEffect(() => {
    const hash = window.location.hash
    if (hash.includes('error_code=otp_expired') || hash.includes('error=access_denied')) {
      setTokenExpirado(true)
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setTokenValido(true)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        setTokenValido(true)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    if (password !== confirmar) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)
    const { error: err } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (err) {
      setError(err.message || 'Error al actualizar la contraseña. El enlace puede haber expirado.')
    } else {
      if (setIsRecovering) setIsRecovering(false) // <--- LIMPIAR ESTADO
      sessionStorage.removeItem('optima_recovery_mode')
      sessionStorage.removeItem('optima_recovery_hash')
      setExito(true)
      setTimeout(() => navigate('/auth'), 3000)
    }
  }

  // ── Enlace expirado (otp_expired en el hash) ──────────────────────────────
  if (tokenExpirado) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl border border-amber-200 p-8 shadow-sm text-center space-y-4">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto">
              <Warning size={28} weight="duotone" className="text-amber-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">El enlace expiró</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              Los enlaces de recuperación son válidos por <strong>60 minutos</strong>.
              Este ya no está activo — solicita uno nuevo y úsalo de inmediato.
            </p>
            <Link
              to="/auth?forgot=1"
              className="inline-flex items-center gap-2 mt-2 bg-gray-900 text-white font-semibold text-sm px-6 py-3 rounded-xl hover:bg-gray-800 transition-colors"
            >
              Solicitar nuevo enlace
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ── Enlace inválido (sin sesión y sin error conocido) ──────────────────────
  if (!tokenValido) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm text-center space-y-4">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
              <Warning size={28} weight="duotone" className="text-amber-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Enlace no válido</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              Este enlace de recuperación es inválido o ya expiró. Los enlaces son válidos por 60 minutos.
            </p>
            <Link
              to="/auth"
              className="inline-block mt-2 bg-gray-900 text-white font-semibold text-sm px-6 py-2.5 rounded-xl hover:bg-gray-800 transition-colors"
            >
              Solicitar nuevo enlace
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ── Contraseña actualizada ─────────────────────────────────────────────────
  if (exito) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle size={32} weight="duotone" className="text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">¡Contraseña actualizada!</h2>
            <p className="text-sm text-gray-500">
              Tu contraseña fue cambiada exitosamente. Serás redirigido en unos segundos...
            </p>
            <Link to="/auth" className="inline-block text-teal-600 font-semibold text-sm hover:underline">
              Ir a iniciar sesión →
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ── Formulario de nueva contraseña ─────────────────────────────────────────
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">

          {/* Header */}
          <div className="text-center mb-7">
            <img src="/optima_logo_v3_clean_1.png" alt="ELVIA" className="h-12 w-auto mx-auto mb-4 object-contain" />
            <div className="w-14 h-14 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <LockKey size={26} weight="duotone" className="text-teal-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Nueva contraseña</h1>
            <p className="text-sm text-gray-500 mt-1">Elige una contraseña segura para tu cuenta</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nueva contraseña */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Nueva contraseña</label>
              <div className="relative">
                <input
                  type={verPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setVerPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {verPass ? <EyeSlash size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* Confirmar contraseña */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Confirmar contraseña</label>
              <input
                type={verPass ? 'text' : 'password'}
                value={confirmar}
                onChange={e => setConfirmar(e.target.value)}
                placeholder="Repite tu nueva contraseña"
                required
                className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition-colors
                  ${confirmar && confirmar !== password
                    ? 'border-red-300 ring-1 ring-red-200 focus:ring-red-300'
                    : 'border-gray-200 focus:ring-teal-500/30 focus:border-teal-500'
                  }`}
              />
              {confirmar && confirmar !== password && (
                <p className="text-xs text-red-500 mt-1">Las contraseñas no coinciden</p>
              )}
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                <Warning size={15} className="mt-0.5 shrink-0" weight="fill" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password || password !== confirmar}
              className="w-full py-3 bg-teal-600 text-white font-bold text-sm rounded-xl hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading
                ? <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Actualizando...
                  </span>
                : 'Guardar nueva contraseña'
              }
            </button>
          </form>

        </div>
      </div>
    </div>
  )
}
