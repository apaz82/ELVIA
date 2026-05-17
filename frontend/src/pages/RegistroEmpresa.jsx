// RegistroEmpresa — formulario de auto-registro B2B por slug de empresa
// Ruta: /empresas/:slug/registro   y   /universidades/:slug/registro
// Llama a POST /api/company/registration/:slug
// El backend valida: empresa activa, dominio corporativo (si aplica), invitación (si aplica)

import { useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { Turnstile } from '@marsidev/react-turnstile'
import * as PI from '@phosphor-icons/react'
import { useTenant, DEFAULT_TENANT } from '../context/TenantContext'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const checkPassword = (pwd) => ({
  length:  pwd.length >= 8,
  upper:   /[A-Z]/.test(pwd),
  number:  /[0-9]/.test(pwd),
  special: /[!@#$%^&*()\-_=+\[\]{};:'"\\|,.<>/?]/.test(pwd),
})

export default function RegistroEmpresa() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { tenant, loading: tenantLoading, isUniversity } = useTenant()

  const [nombre, setNombre]       = useState('')
  const [apellido, setApellido]   = useState('')
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [showPwd, setShowPwd]     = useState(false)
  const [aceptaDPA, setAceptaDPA] = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [success, setSuccess]     = useState(false)
  const [linked, setLinked]       = useState(false)  // true si vinculamos cuenta existente en vez de crear

  const pwdChecks = checkPassword(password)
  const pwdStrong = Object.values(pwdChecks).filter(Boolean).length === 4

  const primary   = tenant.primary_color   || DEFAULT_TENANT.primary_color
  const secondary = tenant.secondary_color || DEFAULT_TENANT.secondary_color
  const sectorPath = isUniversity ? 'universidades' : 'empresas'

  // Estado de carga inicial
  if (tenantLoading && !tenant?.id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-10 h-10 border-2 border-gray-200 border-t-gray-700 rounded-full animate-spin" />
      </div>
    )
  }

  if (!tenant?.id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-6">
        <div className="max-w-md text-center">
          <PI.WarningCircle size={56} weight="duotone" className="text-amber-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Programa no disponible</h1>
          <p className="text-sm text-gray-500 mb-6">
            No encontramos un programa activo con el identificador <code className="px-2 py-0.5 bg-gray-100 rounded">{slug}</code>.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800"
          >
            Ir al inicio
          </button>
        </div>
      </div>
    )
  }

  // ── Submit ─────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!nombre.trim() || !apellido.trim()) {
      setError('Nombre y apellido son requeridos.')
      return
    }
    if (!pwdStrong) {
      setError('La contraseña no cumple los requisitos mínimos.')
      return
    }
    if (!aceptaDPA) {
      setError('Debes aceptar las políticas del programa para continuar.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${API}/api/company/registration/${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          nombre: nombre.trim(),
          apellido: apellido.trim(),
        }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        const msg = data.error || 'No fue posible completar tu registro. Intenta de nuevo.'
        const hint = data.hint ? ` ${data.hint}` : ''
        const detail = data.detail && data.detail !== msg ? ` (${data.detail})` : ''
        setError(msg + hint + detail)
        setLoading(false)
        return
      }

      setLinked(Boolean(data.linked))
      setSuccess(true)
    } catch (err) {
      setError('Error de conexión. Verifica tu internet e intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  // ── Success screen ─────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <div
            className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center"
            style={{ background: `${primary}15` }}
          >
            <PI.CheckCircle size={32} weight="duotone" style={{ color: primary }} />
          </div>
          {linked ? (
            <>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">Cuenta vinculada al programa</h1>
              <p className="text-sm text-gray-500 mb-2">Tu cuenta existente fue vinculada exitosamente al programa <strong>{tenant.name} × ELVIA®</strong>.</p>
              <p className="text-base font-semibold text-gray-900 mb-6">{email}</p>
              <p className="text-xs text-gray-400 mb-8 leading-relaxed">
                Inicia sesión con tu <strong>contraseña existente</strong> (la que pusiste aquí no se aplicó porque ya tenías cuenta). Si no la recuerdas, usa "Olvidé mi contraseña".
              </p>
            </>
          ) : (
            <>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">¡Cuenta activada!</h1>
              <p className="text-sm text-gray-500 mb-2">Tu cuenta del programa <strong>{tenant.name} × ELVIA®</strong> ya está lista:</p>
              <p className="text-base font-semibold text-gray-900 mb-6">{email}</p>
              <p className="text-xs text-gray-400 mb-8 leading-relaxed">
                Inicia sesión con la contraseña que acabas de crear y empieza tu programa de transición profesional.
              </p>
            </>
          )}
          <button
            onClick={() => navigate('/auth')}
            className="w-full py-3 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ background: primary }}
          >
            Ir a iniciar sesión
          </button>
        </div>
      </div>
    )
  }

  // ── Main form ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white">

      {/* Header co-brandeado */}
      <header className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-4 flex items-center justify-between">
          <Link to={`/${sectorPath}/${slug}`} className="flex items-center gap-4">
            {tenant.logo_url ? (
              <img src={tenant.logo_url} alt={tenant.name} className="h-8 md:h-10 object-contain" />
            ) : (
              <div
                className="px-3 py-1.5 rounded-lg text-white text-sm font-bold tracking-tight"
                style={{ background: primary }}
              >
                {tenant.name}
              </div>
            )}
            <div className="h-6 w-px bg-gray-200" />
            <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
              <span>operado por</span>
              <img src="/LOGOS/ELVIA_logo_fondo_transparente.png" alt="ELVIA" className="h-4 md:h-5 object-contain opacity-80" />
            </div>
          </Link>
          <Link to="/auth" className="text-sm font-semibold text-gray-700 hover:text-gray-900">
            Ya tengo cuenta
          </Link>
        </div>
      </header>

      <div className="grid lg:grid-cols-5 min-h-[calc(100vh-73px)]">
        {/* ── Form ── */}
        <div className="lg:col-span-3 flex items-center justify-center px-6 lg:px-16 py-12 md:py-16">
          <div className="w-full max-w-md">
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-5"
              style={{ background: `${primary}10`, color: primary }}
            >
              <PI.UserPlus size={12} weight="bold" />
              Activación de cuenta
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 leading-tight">
              Bienvenido al programa<br />{tenant.name} × ELVIA®
            </h1>
            <p className="text-sm text-gray-500 mb-8">
              Crea tu cuenta para acceder al programa exclusivo de transición profesional. Toma menos de 1 minuto.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nombre + Apellido */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Nombre</label>
                  <input
                    type="text" value={nombre} onChange={e => setNombre(e.target.value)} required
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors"
                    style={{ '--tw-ring-color': `${primary}40` }}
                    placeholder="Tu nombre"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Apellido</label>
                  <input
                    type="text" value={apellido} onChange={e => setApellido(e.target.value)} required
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 transition-colors"
                    style={{ '--tw-ring-color': `${primary}40` }}
                    placeholder="Tu apellido"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Correo {tenant.allowed_email_domain ? <span className="text-gray-400 font-normal">(debe ser corporativo @{tenant.allowed_email_domain})</span> : ''}
                </label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 transition-colors"
                  style={{ '--tw-ring-color': `${primary}40` }}
                  placeholder={tenant.allowed_email_domain ? `tu.nombre@${tenant.allowed_email_domain}` : 'tu@email.com'}
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Contraseña</label>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={password} onChange={e => setPassword(e.target.value)} required
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 pr-12 text-sm focus:outline-none focus:ring-2 transition-colors"
                    style={{ '--tw-ring-color': `${primary}40` }}
                    placeholder="Mínimo 8 caracteres"
                  />
                  <button
                    type="button" onClick={() => setShowPwd(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                  >
                    {showPwd ? <PI.EyeSlash size={16} /> : <PI.Eye size={16} />}
                  </button>
                </div>

                {/* Indicador de fortaleza */}
                {password.length > 0 && (
                  <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-0.5">
                    {[
                      { key:'length',  label:'8+ caracteres'  },
                      { key:'upper',   label:'1 mayúscula'    },
                      { key:'number',  label:'1 número'       },
                      { key:'special', label:'1 símbolo'      },
                    ].map(c => (
                      <p key={c.key} className={`text-xs flex items-center gap-1.5 ${pwdChecks[c.key] ? 'text-emerald-600' : 'text-gray-400'}`}>
                        <PI.CheckCircle size={12} weight={pwdChecks[c.key] ? 'fill' : 'regular'} />
                        {c.label}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              {/* DPA checkbox */}
              <label className="flex items-start gap-3 cursor-pointer select-none pt-2">
                <input
                  type="checkbox" checked={aceptaDPA}
                  onChange={e => { setAceptaDPA(e.target.checked); setError('') }}
                  className="mt-0.5 w-4 h-4 shrink-0 cursor-pointer"
                  style={{ accentColor: primary }}
                />
                <span className="text-xs text-gray-500 leading-relaxed">
                  Acepto la <a href="/privacidad" target="_blank" rel="noreferrer" className="font-semibold hover:underline" style={{ color: primary }}>política de privacidad de ELVIA</a> y entiendo que mi información es <strong className="text-gray-700">confidencial</strong>; {tenant.name} solo recibe métricas agregadas anónimas del programa.
                </span>
              </label>

              {/* Error */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-start gap-2">
                  <PI.WarningCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !pwdStrong || !aceptaDPA || !nombre || !apellido || !email}
                className="w-full py-3.5 rounded-xl text-white font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                style={{ background: primary, boxShadow: `0 6px 20px -6px ${primary}80` }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <PI.CircleNotch size={16} className="animate-spin" />
                    Activando cuenta...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Activar mi cuenta
                    <PI.ArrowRight size={14} weight="bold" />
                  </span>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-gray-400">
              ¿Ya activaste tu cuenta? <Link to="/auth" className="font-semibold hover:underline" style={{ color: primary }}>Inicia sesión</Link>
            </p>
          </div>
        </div>

        {/* ── Side panel testimonios + confidencialidad ── */}
        <div className="hidden lg:flex lg:col-span-2 relative overflow-hidden" style={{ background: secondary }}>
          {/* Gradient overlay */}
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background: `radial-gradient(circle at 30% 20%, ${primary} 0%, transparent 60%)`,
            }}
          />

          <div className="relative z-10 flex flex-col justify-between p-12 text-white">
            <div>
              <PI.ShieldCheck size={32} weight="duotone" className="mb-4 opacity-90" />
              <h2 className="text-2xl font-bold mb-3 leading-tight">
                Tu información, tu decisión.
              </h2>
              <p className="text-sm opacity-80 leading-relaxed mb-8">
                {tenant.name} financia tu programa, pero nunca accede a tu CV, conversaciones, ni postulaciones individuales. Solo recibe métricas agregadas anónimas.
              </p>

              <ul className="space-y-3">
                {[
                  'CV y postulaciones 100% confidenciales',
                  'Borra tu cuenta y datos cuando quieras',
                  'Mentores expertos validan tu plan',
                  '24/7 acceso desde cualquier dispositivo',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm opacity-90">
                    <PI.CheckCircle size={16} weight="fill" style={{ color: primary }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Footer del panel */}
            <div className="pt-8 border-t border-white/10 text-xs opacity-60 leading-relaxed">
              <p className="mb-1 font-bold">Cumplimiento enterprise</p>
              <p>SOC2 Type II en proceso · GDPR · LGPD · Cifrado en tránsito y en reposo · Backups diarios.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
