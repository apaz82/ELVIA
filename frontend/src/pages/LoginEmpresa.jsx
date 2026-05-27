// Página de inicio de sesión B2B exclusiva para candidatos de un programa corporativo/universitario
// Ruta: /empresas/:slug/login  y  /universidades/:slug/login
// Sin opción de registro — las cuentas son creadas por el Admin HR
import { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { supabase } from '../services/authService'
import { useTenant, DEFAULT_TENANT } from '../context/TenantContext'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeSlash, Warning, ArrowRight, Info, CheckCircle } from '@phosphor-icons/react'

export default function LoginEmpresa() {
  const { slug }     = useParams()
  const navigate     = useNavigate()
  const [searchParams] = useSearchParams()
  const justActivated = searchParams.get('activated') === '1'
  const { tenant, loading: tenantLoading, isUniversity } = useTenant()
  const { user, loading: authLoading, onboardingPendiente, bienvenidaPendiente, featuresDesbloqueadas, isCompanyAdmin, perfilCargado } = useAuth()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [verPass, setVerPass]   = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const sectorPath = isUniversity ? 'universidades' : 'empresas'
  const primary    = tenant?.primary_color || DEFAULT_TENANT.primary_color
  const logo       = tenant?.logo_url || null

  // Si ya tiene sesión activa, redirigir al destino correcto.
  // CRÍTICO: esperar perfilCargado antes de evaluar isCompanyAdmin para evitar
  // flicker cuando el perfil está cargando y role es null transitoriamente.
  useEffect(() => {
    if (authLoading || tenantLoading) return
    if (!user) return
    if (!perfilCargado) return

    if (isCompanyAdmin) {
      navigate('/empresa-admin', { replace: true })
    } else if (onboardingPendiente || bienvenidaPendiente) {
      navigate('/bienvenida', { replace: true })
    } else if (!featuresDesbloqueadas) {
      navigate('/proyecto-laboral', { replace: true })
    } else {
      navigate('/dashboard', { replace: true })
    }
  }, [user, authLoading, tenantLoading, perfilCargado, isCompanyAdmin, onboardingPendiente, bienvenidaPendiente, featuresDesbloqueadas, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: err } = await supabase.auth.signInWithPassword({
      email:    email.trim().toLowerCase(),
      password,
    })

    setLoading(false)

    if (err) {
      if (err.message?.includes('Invalid login credentials')) {
        setError('Email o contraseña incorrectos. Si es tu primera vez, revisa el email de invitación.')
      } else {
        setError(err.message || 'Error al iniciar sesión. Intenta de nuevo.')
      }
    }
    // El useEffect de arriba maneja la redirección tras login exitoso
  }

  if (tenantLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/${sectorPath}/${slug}`)}>
          {logo && (
            <img src={logo} alt={tenant?.name || ''} className="h-10 object-contain max-w-[160px]" />
          )}
          {logo && <div className="h-5 w-px bg-gray-200" />}
          <img src="/LOGOS/ELVIA_logo_fondo_transparente.png" alt="ELVIA" className="h-7 object-contain opacity-75" />
        </div>
        <button
          onClick={() => navigate(`/${sectorPath}/${slug}/hr`)}
          className="text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors"
        >
          Acceso HR
        </button>
      </header>

      {/* Contenido */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Branding */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-black text-gray-900 mb-1">Bienvenido de vuelta</h1>
            <p className="text-sm text-gray-500">
              {tenant?.name
                ? `Programa ${tenant.name}`
                : 'Ingresa con tu cuenta ELVIA®'}
            </p>
          </div>

          {justActivated && (
            <div
              className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl border"
              style={{
                backgroundColor: `color-mix(in srgb, ${primary} 8%, white)`,
                borderColor:     `color-mix(in srgb, ${primary} 25%, transparent)`,
              }}
            >
              <CheckCircle size={20} weight="fill" style={{ color: primary }} className="shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-gray-700">
                Tu cuenta quedó activada. Ingresa con tu correo y la contraseña que acabas de crear.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="tu@correo.com"
                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                style={{ '--tw-ring-color': primary }}
              />
            </div>

            {/* Contraseña */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={verPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="Tu contraseña"
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
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm">
                <Warning size={16} className="shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 text-sm font-bold text-white rounded-xl shadow-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ backgroundColor: primary }}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Ingresando…
                </>
              ) : (
                <>Ingresar <ArrowRight size={16} weight="bold" /></>
              )}
            </button>
          </form>

          {/* Nota sin registro */}
          <div className="mt-6 p-4 rounded-xl bg-blue-50 border border-blue-100 flex items-start gap-2.5">
            <Info size={16} className="text-blue-400 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 leading-relaxed">
              Las cuentas son creadas por el área de Recursos Humanos de{' '}
              <strong>{tenant?.name || 'tu empresa'}</strong>. Si no tienes acceso,
              contacta a tu coordinador del programa.
            </p>
          </div>

          {/* Activar cuenta */}
          <div className="mt-4 text-center">
            <button
              onClick={() => navigate(`/${sectorPath}/${slug}/activar`)}
              className="text-xs font-semibold hover:underline transition-colors"
              style={{ color: primary }}
            >
              ¿Recibiste un correo de invitación? Activa tu cuenta aquí
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
