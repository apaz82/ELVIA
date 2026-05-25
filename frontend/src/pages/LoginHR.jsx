// LoginHR — Landing + Login dedicado para HR Director / Gestor de programa B2B
// Ruta: /empresas/:slug/hr   y   /universidades/:slug/hr
// Diseño: split layout, login form a la izquierda + bullets institucionales a la derecha
// Tras login: si role=company_admin o super_admin -> /empresa-admin
//             si role=user -> redirige al landing del candidato con error

import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import * as PI from '@phosphor-icons/react'
import { useAuth } from '../context/AuthContext'
import { useTenant, DEFAULT_TENANT } from '../context/TenantContext'
import { useSectorLabels } from '../hooks/useSectorLabels'
import { supabase } from '../services/authService'

export default function LoginHR() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { login, logout, user, perfil, perfilCargado } = useAuth()
  const { tenant, loading: tenantLoading, isUniversity, showTenantLogo, showElviaLogo, elviaProminent } = useTenant()
  const L = useSectorLabels()

  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  // MFA state (solo activo cuando tenant.require_mfa = true)
  const [mfaScreen, setMfaScreen]     = useState(null)  // null | 'enroll' | 'verify'
  const [mfaFactorId, setMfaFactorId] = useState(null)
  const [mfaChallengeId, setMfaChallengeId] = useState(null)
  const [mfaTotpUri, setMfaTotpUri]   = useState(null)  // data URI para QR
  const [mfaCode, setMfaCode]         = useState('')
  const [mfaLoading, setMfaLoading]   = useState(false)
  const [mfaError, setMfaError]       = useState('')

  const primary   = tenant.primary_color   || DEFAULT_TENANT.primary_color
  const secondary = tenant.secondary_color || DEFAULT_TENANT.secondary_color
  const sectorPath = isUniversity ? 'universidades' : 'empresas'

  // Si ya esta logueado y es HR, validar tenant y redirigir
  useEffect(() => {
    if (!user || !perfilCargado || !perfil || !tenant?.id) return

    // super_admin tiene acceso global a cualquier tenant
    if (perfil.role === 'super_admin') {
      navigate('/empresa-admin', { replace: true })
      return
    }

    if (perfil.role === 'company_admin') {
      // Bloqueo de tenant cruzado: la cuenta HR debe pertenecer al tenant del slug
      if (perfil.company_id && perfil.company_id !== tenant.id) {
        setError(`Esta cuenta HR no pertenece al programa de ${tenant.name}. Cierra sesión y usa la cuenta correcta.`)
        logout()
        return
      }
      navigate('/empresa-admin', { replace: true })
    }
  }, [user, perfil, perfilCargado, tenant, navigate, logout])

  useEffect(() => {
    if (tenant?.name) document.title = `${L.adminPanelTitle} · ${tenant.name} × ELVIA®`
    return () => { document.title = 'ELVIA®' }
  }, [tenant?.name, L.adminPanelTitle])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { error: authErr } = await login(email, password)
      if (authErr) {
        const msg = (authErr.message || '').toLowerCase()
        if (msg.includes('invalid')) setError('Credenciales invalidas. Verifica email y contrasena.')
        else if (msg.includes('not confirmed')) setError('Tu cuenta no esta confirmada. Contacta a soporte.')
        else if (msg.includes('rate')) setError('Demasiados intentos. Espera unos minutos.')
        else setError(authErr.message || 'No fue posible iniciar sesion.')
        setLoading(false)
        return
      }

      // Si el tenant requiere MFA, verificar el nivel de aseguramiento
      if (tenant?.require_mfa) {
        const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
        if (aalData?.currentLevel === 'aal2') {
          // Ya verificado — el useEffect manejará el redirect
        } else if (aalData?.nextLevel === 'aal2') {
          // Tiene factores enrollados pero no verificados en esta sesión
          const { data: factors } = await supabase.auth.mfa.listFactors()
          const verified = factors?.totp?.find(f => f.status === 'verified')
          if (verified) {
            const { data: ch } = await supabase.auth.mfa.challenge({ factorId: verified.id })
            setMfaFactorId(verified.id)
            setMfaChallengeId(ch?.id)
            setMfaScreen('verify')
            setLoading(false)
            return
          }
        } else {
          // Sin MFA enrollado — iniciar enrollment
          const { data: enroll } = await supabase.auth.mfa.enroll({ factorType: 'totp' })
          if (enroll) {
            setMfaFactorId(enroll.id)
            setMfaTotpUri(enroll.totp?.qr_code)
            setMfaScreen('enroll')
            setLoading(false)
            return
          }
        }
      }
      // Sin MFA o ya aal2 — el useEffect maneja el redirect
    } catch {
      setError('Error inesperado. Intenta de nuevo.')
      setLoading(false)
    }
  }

  const handleMfaVerify = async () => {
    if (!mfaCode || mfaCode.length !== 6) return
    setMfaError('')
    setMfaLoading(true)
    try {
      if (mfaScreen === 'enroll') {
        // Primer enroll: challengeAndVerify en un solo paso
        const { error } = await supabase.auth.mfa.challengeAndVerify({
          factorId: mfaFactorId,
          code: mfaCode,
        })
        if (error) { setMfaError('Código incorrecto. Verifica tu app autenticadora.'); setMfaLoading(false); return }
      } else {
        // Verify con challenge ya existente
        const { error } = await supabase.auth.mfa.verify({
          factorId: mfaFactorId,
          challengeId: mfaChallengeId,
          code: mfaCode,
        })
        if (error) { setMfaError('Código incorrecto o expirado.'); setMfaLoading(false); return }
      }
      // MFA verificado — sesión upgrades a aal2; el useEffect manejará el redirect
      setMfaScreen(null)
    } catch {
      setMfaError('Error al verificar. Intenta de nuevo.')
    } finally {
      setMfaLoading(false)
    }
  }

  // Si ya esta logueado pero NO es HR, mostrar bloqueo
  const isLoggedAsUser = user && perfilCargado && perfil && perfil.role === 'user'

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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Panel HR no disponible</h1>
          <p className="text-sm text-gray-500 mb-6">
            No encontramos un programa activo con el identificador <code className="px-2 py-0.5 bg-gray-100 rounded">{slug}</code>.
          </p>
          <button onClick={() => navigate('/')} className="px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800">
            Ir al inicio
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">

      {/* Header co-brandeado */}
      <header className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-4 flex items-center justify-between">
          <Link to={`/${sectorPath}/${slug}`} className="flex items-center gap-4">
            {elviaProminent ? (
              <img src="/LOGOS/ELVIA_logo_fondo_transparente.png" alt="ELVIA"
                className="h-[36px] md:h-[44px] object-contain transition-all hover:scale-105" />
            ) : (
              <>
                {showTenantLogo && (
                  <img src={tenant.logo_url} alt={tenant.name}
                    className="h-[48px] md:h-[60px] max-w-[240px] object-contain transition-all hover:scale-105" />
                )}
                {showElviaLogo && (
                  <>
                    <div className="h-6 w-px bg-gray-200" />
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                      <span>operado por</span>
                      <img src="/LOGOS/ELVIA_logo_fondo_transparente.png" alt="ELVIA"
                        className="h-4 md:h-5 object-contain opacity-80" />
                    </div>
                  </>
                )}
              </>
            )}
          </Link>
          <Link to={`/${sectorPath}/${slug}`} className="text-sm font-semibold text-gray-700 hover:text-gray-900">
            Soy colaborador →
          </Link>
        </div>
      </header>

      <div className="grid lg:grid-cols-5 min-h-[calc(100vh-73px)]">

        {/* ── FORM SIDE ── */}
        <div className="lg:col-span-2 flex items-center justify-center px-6 lg:px-12 py-12 md:py-16 order-2 lg:order-1">
          <div className="w-full max-w-sm">
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-5"
              style={{ background: `${primary}10`, color: primary }}
            >
              <PI.ShieldCheck size={12} weight="bold" />
              {L.adminAccessBadge}
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 leading-tight">
              {L.adminPanelTitle}<br />{tenant.name}
            </h1>
            <p className="text-sm text-gray-500 mb-8">
              Gestiona el programa, la cohorte y revisa métricas agregadas anónimas de {L.programSubject}.
            </p>

            {isLoggedAsUser && (
              <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800 flex items-start gap-2">
                <PI.WarningCircle size={16} className="shrink-0 mt-0.5" />
                <span>Tu cuenta es de {L.member}, no del equipo del programa. Ve a <Link to={`/${sectorPath}/${slug}`} className="underline font-semibold">tu panel</Link>.</span>
              </div>
            )}

            {/* ── MFA: Enrollment screen ── */}
            {mfaScreen === 'enroll' && (
              <div className="space-y-5">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800 flex items-start gap-2">
                  <PI.ShieldCheck size={16} className="shrink-0 mt-0.5" style={{ color: primary }} />
                  <span>Este programa requiere autenticación de dos factores. Escanea el código QR con Google Authenticator o Authy.</span>
                </div>

                {mfaTotpUri && (
                  <div className="flex justify-center">
                    <img src={mfaTotpUri} alt="QR MFA" className="w-44 h-44 rounded-xl border border-gray-200" />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Código de 6 dígitos</label>
                  <input
                    type="text" inputMode="numeric" maxLength={6}
                    value={mfaCode} onChange={e => setMfaCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-center font-mono tracking-[0.4em] focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': `${primary}40` }}
                    autoComplete="one-time-code"
                  />
                </div>

                {mfaError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
                    <PI.WarningCircle size={14} />
                    <span>{mfaError}</span>
                  </div>
                )}

                <button
                  type="button" onClick={handleMfaVerify}
                  disabled={mfaCode.length !== 6 || mfaLoading}
                  className="w-full py-3.5 rounded-xl text-white font-semibold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: primary }}
                >
                  {mfaLoading ? <><PI.CircleNotch size={16} className="animate-spin" /> Verificando...</> : 'Activar autenticador →'}
                </button>
              </div>
            )}

            {/* ── MFA: Verify screen ── */}
            {mfaScreen === 'verify' && (
              <div className="space-y-5">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800 flex items-start gap-2">
                  <PI.Lock size={16} className="shrink-0 mt-0.5" style={{ color: primary }} />
                  <span>Ingresa el código de tu app autenticadora para acceder al panel HR.</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Código de verificación</label>
                  <input
                    type="text" inputMode="numeric" maxLength={6}
                    value={mfaCode} onChange={e => setMfaCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-center font-mono tracking-[0.4em] focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': `${primary}40` }}
                    autoComplete="one-time-code"
                    autoFocus
                  />
                </div>

                {mfaError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
                    <PI.WarningCircle size={14} />
                    <span>{mfaError}</span>
                  </div>
                )}

                <button
                  type="button" onClick={handleMfaVerify}
                  disabled={mfaCode.length !== 6 || mfaLoading}
                  className="w-full py-3.5 rounded-xl text-white font-semibold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: primary }}
                >
                  {mfaLoading ? <><PI.CircleNotch size={16} className="animate-spin" /> Verificando...</> : 'Verificar código →'}
                </button>
              </div>
            )}

            {/* ── Login form (oculto durante MFA) ── */}
            {!mfaScreen && <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Correo institucional</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder={L.contactEmailHint}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': `${primary}40` }}
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Contraseña</label>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={password} onChange={e => setPassword(e.target.value)} required
                    placeholder="••••••••"
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 pr-12 text-sm focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': `${primary}40` }}
                    autoComplete="current-password"
                  />
                  <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
                    {showPwd ? <PI.EyeSlash size={16} /> : <PI.Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-start gap-2">
                  <PI.WarningCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit" disabled={loading || !email || !password}
                className="w-full py-3.5 rounded-xl text-white font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                style={{ background: primary, boxShadow: `0 6px 20px -6px ${primary}80` }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <PI.CircleNotch size={16} className="animate-spin" />
                    Validando acceso...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Acceder al {L.adminPanelTitle}
                    <PI.ArrowRight size={14} weight="bold" />
                  </span>
                )}
              </button>
            </form>}

            {!mfaScreen && (
              <p className="mt-6 text-center text-xs text-gray-400">
                ¿Olvidaste tu contraseña? <Link to="/auth?forgot=1" className="font-semibold hover:underline" style={{ color: primary }}>Recuperar</Link>
              </p>
            )}

            <div className="mt-10 pt-6 border-t border-gray-100">
              <p className="text-[10px] text-gray-400 leading-relaxed text-center">
                Si necesitas acceso para este programa, contacta a{' '}
                <a href={`mailto:${tenant.support_email || 'soporte@elvia.lat'}`} className="font-semibold" style={{ color: primary }}>
                  {tenant.support_email || 'soporte@elvia.lat'}
                </a>.
              </p>
            </div>
          </div>
        </div>

        {/* ── INSTITUTIONAL SIDE ── */}
        <div className="lg:col-span-3 relative overflow-hidden order-1 lg:order-2" style={{ background: secondary }}>
          <div
            className="absolute inset-0 opacity-40"
            style={{ background: `radial-gradient(circle at 70% 20%, ${primary} 0%, transparent 55%)` }}
          />
          <div className="relative z-10 flex flex-col justify-between h-full p-10 lg:p-16 text-white min-h-[400px]">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-[10px] font-bold uppercase tracking-widest mb-6">
                <PI.Briefcase size={12} weight="duotone" />
                Operación del programa
              </div>
              <h2 className="text-3xl md:text-4xl font-bold leading-tight mb-4">
                Todo lo que necesitas para {L.programMission}.
              </h2>
              <p className="text-base opacity-80 leading-relaxed mb-10 max-w-lg">
                Una plataforma diseñada para {L.adminPersona}: visibilidad agregada, control de acceso y reportes institucionales. Sin ver datos individuales sensibles.
              </p>

              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { icon: PI.UsersThree,   title: L.bullet1Title, desc: L.bullet1Desc },
                  { icon: PI.ChartLine,    title: L.bullet2Title, desc: L.bullet2Desc },
                  { icon: PI.ShieldCheck,  title: L.bullet3Title, desc: L.bullet3Desc },
                  { icon: PI.Export,       title: L.bullet4Title, desc: L.bullet4Desc },
                ].map((f, i) => (
                  <div key={i} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                    <f.icon size={20} weight="duotone" className="mb-2" style={{ color: primary }} />
                    <h3 className="text-sm font-bold mb-1">{f.title}</h3>
                    <p className="text-xs opacity-70 leading-relaxed">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-8 border-t border-white/10 text-xs opacity-60 leading-relaxed mt-8">
              <p className="font-bold mb-1">Compliance enterprise</p>
              <p>SOC2 Type II en proceso · GDPR · LGPD · Aislación por tenant (Postgres RLS) · Audit log completo · Cifrado en tránsito y en reposo.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
