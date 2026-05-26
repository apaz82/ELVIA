// LandingEmpresa — landing co-brandeada por tenant (B2B)
// Ruta: /empresas/:slug   y   /universidades/:slug
// Lee tenant desde TenantContext (auto-resolve por slug en URL)
// Estilo: Cupertino Glass white theme — consistente con BienvenidaOnboarding

import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import * as PI from '@phosphor-icons/react'
import { useTenant, DEFAULT_TENANT } from '../context/TenantContext'

export default function LandingEmpresa() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { tenant, loading, isUniversity, isCorporate, showTenantLogo, showElviaLogo, elviaProminent, showProgramBadge, programBadgeText } = useTenant()

  // Tenant no encontrado o aún no resuelto
  const tenantResuelto = tenant?.slug === slug
  const noEncontrado   = !loading && tenant?.id === null && slug

  useEffect(() => {
    if (tenantResuelto && tenant?.name) {
      document.title = `${tenant.name} × ELVIA® — Programa de transición profesional`
    }
    return () => { document.title = 'ELVIA®' }
  }, [tenantResuelto, tenant])

  // ── Estados de carga ────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-10 h-10 border-2 border-gray-200 border-t-gray-700 rounded-full animate-spin" />
      </div>
    )
  }

  if (noEncontrado) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-6">
        <div className="max-w-md text-center">
          <PI.WarningCircle size={56} weight="duotone" className="text-amber-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Programa no disponible</h1>
          <p className="text-sm text-gray-500 mb-6">
            No encontramos un programa activo con el identificador <code className="px-2 py-0.5 bg-gray-100 rounded">{slug}</code>.
            Verifica el enlace que te compartieron o contacta a tu área de Recursos Humanos.
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

  // ── Texto y branding ────────────────────────────────────────────────────
  const primary   = tenant.primary_color   || DEFAULT_TENANT.primary_color
  const secondary = tenant.secondary_color || DEFAULT_TENANT.secondary_color
  const accent    = tenant.accent_color    || DEFAULT_TENANT.accent_color
  const heroTitle = tenant.hero_title    || 'Tu próximo capítulo profesional'
  const heroSub   = tenant.hero_subtitle || `Programa de transición y desarrollo de carrera para colaboradores de ${tenant.name}, operado por ELVIA®.`
  const sectorPath = isUniversity ? 'universidades' : 'empresas'

  // ── Features dinámicas según el tenant ──────────────────────────────────
  const allFeatures = [
    { key: 'cv_optimizer', icon: PI.FileText,        title: 'CV de clase mundial',  desc: 'Plantillas Harvard y optimización ATS asistida por IA.' },
    { key: 'cv_match',     icon: PI.Target,          title: 'CV vs Vacante',        desc: 'Match instantáneo con score por dimensión y keywords clave.' },
    { key: 'jobs',         icon: PI.Briefcase,       title: 'Vacantes compatibles', desc: 'Buscador integrado con miles de empleos relevantes.' },
    { key: 'pipeline',     icon: PI.Kanban,          title: 'Pipeline de búsqueda', desc: 'Organiza postulaciones, etapas, contactos y seguimientos.' },
    { key: 'interview',    icon: PI.ChatsCircle,     title: 'Simulador de entrevista', desc: 'Practica con preguntas reales y obtén feedback IA.' },
    { key: 'linkedin',     icon: PI.LinkedinLogo,    title: 'LinkedIn® Pro',        desc: 'Análisis y mejoras concretas para tu perfil profesional.' },
    { key: 'library',      icon: PI.Books,           title: 'Biblioteca',           desc: 'Guías, tips y cartas de presentación listas para usar.' },
    { key: 'wellbeing',    icon: PI.HeartStraight,   title: 'Bienestar',            desc: 'Acompañamiento emocional durante la transición.' },
    { key: 'metrics',      icon: PI.ChartBar,        title: 'Mis Métricas',         desc: 'Visualiza tu progreso, conversión y tendencias semanales.' },
  ]
  const enabled = tenant.enabled_features || {}
  const features = allFeatures.filter(f => enabled[f.key] !== false)

  return (
    <div className="min-h-screen bg-white text-gray-900">

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* HEADER                                                            */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-4 flex items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            {elviaProminent ? (
              // Modo elvia_only o sin logo del tenant: ELVIA prominente
              <img src="/LOGOS/ELVIA_logo_fondo_transparente.png" alt="ELVIA"
                className="h-[60px] md:h-[80px] object-contain transition-all duration-300 hover:scale-105" />
            ) : (
              <>
                {showTenantLogo && (
                  <img src={tenant.logo_url} alt={tenant.name}
                    className="h-[108px] md:h-[144px] max-w-[450px] object-contain transition-all duration-300 hover:scale-105" />
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
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/${sectorPath}/${slug}/hr`)}
              className="hidden md:inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 px-3 py-2"
              title="Acceso para gestores del programa"
            >
              <PI.ShieldCheck size={14} weight="duotone" />
              Acceso HR
            </button>
            <button
              onClick={() => navigate(`/${sectorPath}/${slug}/login`)}
              className="hidden sm:inline-flex text-sm font-semibold text-gray-700 hover:text-gray-900 px-4 py-2"
            >
              Iniciar sesión
            </button>
            <button
              onClick={() => navigate(`/${sectorPath}/${slug}/activar`)}
              className="text-sm font-semibold text-white px-5 py-2.5 rounded-xl shadow-sm hover:opacity-90 transition-opacity"
              style={{ background: primary }}
            >
              Activar mi cuenta
            </button>
          </div>
        </div>
      </header>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* HERO                                                              */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden border-b border-slate-100">
        {/* Subtle blueprint grid background */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{
          backgroundImage: 'linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)',
          backgroundSize: '32px 32px'
        }} />
        
        {/* Gradient backdrop */}
        <div
          className="absolute inset-0 opacity-[0.08] pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at 20% 0%, ${primary} 0%, transparent 60%), radial-gradient(ellipse at 80% 100%, ${accent} 0%, transparent 60%)`,
          }}
        />

        <div className="relative max-w-7xl mx-auto px-6 lg:px-10 pt-16 md:pt-24 pb-16 md:pb-28">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            {/* Texto */}
            <div className="lg:col-span-7">
              <div
                className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-slate-200/80 bg-slate-50/80 backdrop-blur-sm text-[11px] font-bold uppercase tracking-wider mb-6 shadow-sm"
              >
                <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: primary }} />
                <span className="text-slate-600 font-semibold">Programa exclusivo · {tenant.name}</span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight text-slate-900 mb-6">
                {heroTitle}
              </h1>

              <p className="text-base md:text-lg text-slate-500 leading-relaxed mb-8 max-w-2xl font-medium">
                {heroSub}
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => navigate(`/${sectorPath}/${slug}/activar`)}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-white font-bold text-sm shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"
                  style={{ background: primary, boxShadow: `0 8px 30px -6px ${primary}60` }}
                >
                  Activar mi cuenta
                  <PI.ArrowRight size={16} weight="bold" />
                </button>
                <button
                  onClick={() => navigate(`/${sectorPath}/${slug}/login`)}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95"
                >
                  Ya tengo cuenta
                </button>
              </div>

              {/* Confidencialidad badge */}
              <div className="mt-8 inline-flex items-start gap-2.5 text-xs text-slate-500 max-w-xl">
                <PI.ShieldCheck size={18} className="text-emerald-500 shrink-0 mt-0.5" weight="duotone" />
                <span>
                  <strong className="text-slate-700 font-bold">Tu información es confidencial.</strong> {tenant.name} solo recibe métricas agregadas y anónimas del programa.
                </span>
              </div>

              {/* Stacked avatars + list count (social proof, similar to Image 2) */}
              <div className="mt-10 flex flex-wrap items-center gap-4 border-t border-slate-100 pt-6">
                <div className="flex -space-x-2.5">
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600 font-sans shadow-sm">JP</div>
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-600 font-sans shadow-sm">AM</div>
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-emerald-100 flex items-center justify-center text-[10px] font-bold text-emerald-600 font-sans shadow-sm">CV</div>
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-amber-100 flex items-center justify-center text-[10px] font-bold text-amber-600 font-sans shadow-sm">MC</div>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    {[...Array(5)].map((_, i) => (
                      <PI.Star key={i} size={14} weight="fill" className="text-amber-400" />
                    ))}
                    <span className="text-xs font-extrabold text-slate-800 ml-1">+100 registrados</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">Colaboradores de {tenant.name} en transición activa</span>
                </div>
              </div>
            </div>

            {/* Visual Capability Card (similar to Image 2 right card) */}
            <div className="lg:col-span-5">
              <div
                className="rounded-3xl border border-slate-100 shadow-xl bg-white p-8 flex flex-col relative overflow-hidden"
              >
                <div
                  className="absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none"
                  style={{ background: primary }}
                />
                
                {/* Card Header */}
                <div className="relative mb-6">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                    MÉTODO ELVIA®
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 leading-tight">Gestor de Carrera</h2>
                  <p className="text-xs text-slate-400 font-semibold tracking-wide uppercase mt-0.5">De tu transición profesional</p>
                  <p className="text-xs text-slate-500 mt-3 leading-relaxed">
                    Un Gestor de Carrera es quien <strong className="text-slate-800 font-bold">planifica, ejecuta y controla</strong> su transición laboral. Aplicado a tu carrera, <strong className="text-slate-800 font-bold">TÚ lideras el proceso</strong>.
                  </p>
                </div>

                {/* 6-Capabilities Grid */}
                <div className="grid grid-cols-2 gap-3 mb-6 relative">
                  {[
                    { title: 'Autodescubrimiento', desc: 'Conoce quién eres', icon: PI.MagnifyingGlass },
                    { title: 'Fortalezas', desc: 'Sabe en qué eres bueno', icon: PI.ShieldCheck },
                    { title: 'Oferta de valor', desc: 'Descubre tu propuesta', icon: PI.Target },
                    { title: 'Herramientas', desc: 'Recursos optimizados', icon: PI.Lightning },
                    { title: 'Seguimiento', desc: 'Control y visibilidad', icon: PI.ChartBar },
                    { title: 'Tranquilidad', desc: 'Te guía en el proceso', icon: PI.HeartStraight },
                  ].map((c, i) => {
                    const Icon = c.icon
                    return (
                      <div key={i} className="bg-slate-50/50 border border-slate-100 hover:border-slate-200 hover:bg-white hover:shadow-sm rounded-2xl p-3 flex flex-col items-center text-center transition-all duration-300 group">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2.5 transition-transform duration-300 group-hover:scale-110" style={{ background: `${primary}12`, color: primary }}>
                          <Icon size={18} weight="duotone" />
                        </div>
                        <h4 className="text-xs font-bold text-slate-800 leading-tight mb-0.5">{c.title}</h4>
                        <p className="text-[10px] text-slate-400 font-medium leading-tight">{c.desc}</p>
                      </div>
                    )
                  })}
                </div>

                {/* Big CTA Button inside card */}
                <button
                  onClick={() => navigate(`/${sectorPath}/${slug}/activar`)}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-white font-bold text-sm shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 active:scale-95 shrink-0"
                  style={{ background: primary, boxShadow: `0 8px 24px -6px ${primary}60` }}
                >
                  Activar mi cuenta
                  <PI.ArrowRight size={14} weight="bold" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* WELCOME MESSAGE (HR Director / Rector)                            */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {tenant.welcome_message && (
        <section className="bg-gray-50 border-y border-gray-100">
          <div className="max-w-4xl mx-auto px-6 lg:px-10 py-16 text-center">
            <PI.Quotes size={32} weight="duotone" className="mx-auto mb-4" style={{ color: primary }} />
            <p className="text-lg md:text-xl text-gray-700 leading-relaxed font-medium italic max-w-3xl mx-auto">
              {tenant.welcome_message}
            </p>
            <div className="mt-6 text-xs font-bold uppercase tracking-widest text-gray-400">
              {isCorporate ? 'Mensaje del área de Personas' : isUniversity ? 'Mensaje de Empleabilidad' : 'Mensaje del programa'} · {tenant.name}
            </div>
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* FEATURES                                                          */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <section className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="max-w-2xl mb-14">
            <div
              className="inline-block text-[10px] font-bold uppercase tracking-widest mb-3"
              style={{ color: primary }}
            >
              Tu kit completo de transición
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-3">
              {features.length} herramientas, un solo programa.
            </h2>
            <p className="text-base text-gray-500 leading-relaxed">
              Desde tu primer CV hasta firmar tu próxima oferta, todo el camino acompañado por mentores humanos e inteligencia artificial.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <div
                key={i}
                className="group p-6 rounded-2xl bg-white border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all"
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-105"
                  style={{ background: `${primary}12`, color: primary }}
                >
                  <f.icon size={20} weight="duotone" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1.5">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* CONFIDENCIALIDAD                                                  */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <section className="bg-gray-50 border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-6 lg:px-10 py-20">
          <div className="text-center mb-12">
            <PI.ShieldCheck size={40} weight="duotone" className="mx-auto mb-4 text-emerald-500" />
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Tu información, tu decisión</h2>
            <p className="text-base text-gray-500 max-w-2xl mx-auto leading-relaxed">
              Diseñado con compliance enterprise. {tenant.name} financia tu programa, pero nunca accede a tu CV, conversaciones, ni postulaciones individuales.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              { icon: PI.Lock,    title: 'Confidencialidad total',     desc: 'Tu CV, conversaciones y postulaciones jamás se comparten individualmente con la empresa.' },
              { icon: PI.Files,   title: 'Métricas agregadas únicamente', desc: 'Solo reportes anónimos a nivel cohorte: % completitud, NPS, herramientas más usadas.' },
              { icon: PI.UserCircle, title: 'Tus datos te pertenecen',   desc: 'Puedes exportar o eliminar tu información cuando quieras, sin pedir permiso.' },
            ].map((p, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100">
                <p.icon size={22} weight="duotone" className="text-gray-700 mb-3" />
                <h3 className="text-sm font-bold text-gray-900 mb-1.5">{p.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* CTA FINAL                                                         */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <section className="py-20 md:py-28">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-4">
            Tu próximo paso empieza hoy.
          </h2>
          <p className="text-base text-gray-500 mb-8">
            Activa tu cuenta del programa {tenant.name} × ELVIA y empieza a construir tu próxima oportunidad profesional.
          </p>
          <button
            onClick={() => navigate(`/${sectorPath}/${slug}/activar`)}
            className="inline-flex items-center justify-center gap-2 px-9 py-4 rounded-2xl text-white font-semibold text-sm shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
            style={{ background: primary, boxShadow: `0 10px 30px -10px ${primary}80` }}
          >
            Activar mi cuenta
            <PI.ArrowRight size={16} weight="bold" />
          </button>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* FOOTER                                                            */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <footer className="border-t border-gray-100 py-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs text-gray-400">
            {showProgramBadge && programBadgeText && <><span>{programBadgeText}</span><span>·</span></>}
            <span>operado por ELVIA®</span>
          </div>
          <div className="flex items-center gap-5 text-xs text-gray-400">
            <a href="/privacidad" className="hover:text-gray-600">Privacidad</a>
            <a href="/cookies" className="hover:text-gray-600">Cookies</a>
            <a href={`mailto:${tenant.support_email || 'soporte@elvia.lat'}`} className="hover:text-gray-600">
              {tenant.support_email || 'soporte@elvia.lat'}
            </a>
          </div>
        </div>
      </footer>

    </div>
  )
}
