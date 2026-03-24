// Landing — diseño editorial "The Authoritative Curator"
import { useEffect, useRef, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  FileMagnifyingGlass, MagnifyingGlass, Briefcase, Kanban,
  ArrowRight, CheckCircle, ChartBar, Coins, SignOut, Warning,
  Sparkle
} from '@phosphor-icons/react'
import { supabase } from '../services/authService'

// ── Contador animado ──────────────────────────────────────────────────────────
function useInView(threshold = 0.15) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true) }, { threshold })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [threshold])
  return [ref, inView]
}

function AnimatedCounter({ target, suffix = '', duration = 1600 }) {
  const [count, setCount] = useState(0)
  const [ref, inView] = useInView()
  useEffect(() => {
    if (!inView) return
    let n = 0
    const step = Math.ceil(target / (duration / 16))
    const t = setInterval(() => {
      n += step
      if (n >= target) { setCount(target); clearInterval(t) } else setCount(n)
    }, 16)
    return () => clearInterval(t)
  }, [inView, target, duration])
  return <span ref={ref}>{count}{suffix}</span>
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function Landing() {
  const navigate  = useNavigate()
  const { user, perfil, creditosRestantes, LIMITE_PLAN } = useAuth()

  // Detectar onboarding incompleto: usuario logueado sin nombre1 en perfil
  const onboardingIncompleto = user && !perfil?.nombre1

  const features = [
    {
      Icon: FileMagnifyingGlass,
      title: 'CV Optimizer',
      desc:  'Sube tu CV y recibe una versión en formato Harvard con lenguaje de impacto, sin inventar información.',
      cta:   'Optimizar ahora',
      href:  '/cv-optimizer',
      size:  'lg:col-span-8',
      accent: true,
    },
    {
      Icon: Briefcase,
      title: 'Vacantes',
      desc:  'Encuentra oportunidades alineadas a tu perfil desde múltiples fuentes en LATAM y USA.',
      cta:   'Explorar',
      href:  '/jobs',
      size:  'lg:col-span-4',
      dark:  true,
    },
    {
      Icon: MagnifyingGlass,
      title: 'CV vs Vacante',
      desc:  'Mide tu compatibilidad con una oferta específica y obtén un % de match con recomendaciones.',
      cta:   'Analizar',
      href:  '/cv-vs-job',
      size:  'lg:col-span-4',
    },
    {
      Icon: Kanban,
      title: 'Pipeline de Postulaciones',
      desc:  'Gestiona tus candidaturas en un tablero visual con etapas, contactos y fechas de seguimiento.',
      cta:   'Ver Pipeline',
      href:  '/pipeline',
      size:  'lg:col-span-8',
    },
  ]

  return (
    <div className="min-h-screen bg-surface font-body">

      {/* ── Nav landing — centrada ────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 flex items-center justify-center gap-4 sm:gap-6 px-6 h-24 bg-gradient-to-r from-[#0A3D2A] to-[#0D2B4E] shadow-md border-none">
        {/* Logo */}
        <Link to="/" className="flex items-center">
          <img src="/optima_logo_full.png" alt="OPTIMA-CV" className="h-[4.5rem] py-1 w-auto object-contain brightness-0 invert" />
        </Link>

        {/* Spacer — empuja los botones a la derecha */}
        <div className="flex-1" />

        {/* Acciones */}
        {user ? (
          <>
            <div className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full
              ${creditosRestantes === 0 ? 'text-error bg-error-container'
                : creditosRestantes === 1 ? 'text-amber-700 bg-amber-50'
                : 'text-white/90 bg-white/20'}`}>
              <Coins size={14} weight="duotone" />
              {creditosRestantes} / {LIMITE_PLAN}
            </div>
            <span className="hidden sm:block text-sm font-medium text-white/90">
              {perfil?.nombre1 || user.email?.split('@')[0]}
            </span>
            <button onClick={() => navigate('/cv-optimizer')}
              className="text-sm font-bold flex items-center gap-2 bg-white text-[#E8541A] px-5 py-2.5 rounded-xl hover:bg-orange-50 transition-colors shadow-md">
              Empecemos <ArrowRight size={15} weight="bold" />
            </button>
            <button
              onClick={() => supabase.auth.signOut().then(() => navigate('/'))}
              title="Cerrar sesión"
              className="flex items-center gap-1.5 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 px-3 py-2.5 rounded-xl transition-colors">
              <SignOut size={16} weight="bold" />
              <span className="hidden sm:block">Salir</span>
            </button>
          </>
        ) : (
          <>
            <Link to="/auth"
              className="text-sm font-medium text-white/90 hidden sm:flex items-center px-4 py-2.5 rounded-xl hover:bg-white/10 transition-colors">
              Iniciar sesión
            </Link>
            <Link to="/auth?register=true"
              className="text-sm font-bold flex items-center gap-2 bg-white text-[#E8541A] px-5 py-2.5 rounded-xl hover:bg-orange-50 transition-colors shadow-md">
              Registrarse gratis <ArrowRight size={15} weight="bold" />
            </Link>
          </>
        )}
      </nav>

      {/* ── Banner onboarding incompleto ──────────────────────────────────── */}
      {onboardingIncompleto && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Warning size={20} weight="duotone" className="text-amber-600" />
            <p className="text-sm text-amber-800 font-medium">
              Tu perfil está incompleto — complétalo para desbloquear todas las funcionalidades.
            </p>
          </div>
          <button
            onClick={() => navigate('/onboarding')}
            className="shrink-0 text-sm font-bold bg-amber-500 text-white px-4 py-2 rounded-xl hover:bg-amber-600 transition-colors flex items-center gap-2">
            Continuar perfil <ArrowRight size={14} weight="bold" />
          </button>
        </div>
      )}

      {/* ── Stats bar ─────────────────────────────────────────────────────── */}
      <section className="bg-surface-container-low py-10">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-outline-variant/30">
            {[
              { target: 75, suffix: '%', label: 'de CVs son rechazados por ATS antes de llegar a un humano' },
              { target: 3,  suffix: 'x', label: 'más entrevistas con un CV en formato Harvard optimizado'   },
              { target: 40, suffix: '%', label: 'más probabilidad de pasar el filtro con palabras clave'     },
            ].map(({ target, suffix, label }) => (
              <div key={label} className="py-4 md:py-0 px-6">
                <p className="font-headline font-black text-4xl text-primary mb-1.5 tabular-nums">
                  <AnimatedCounter target={target} suffix={suffix} />
                </p>
                <p className="text-xs font-semibold text-secondary uppercase tracking-wider leading-snug max-w-[180px] mx-auto">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature bento grid ────────────────────────────────────────────── */}
      <section className="py-24 bg-surface px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-end mb-14 gap-6">
            <div className="max-w-xl">
              <span className="text-secondary font-label text-xs font-bold uppercase tracking-widest mb-3 block">
                Nuestra tecnología
              </span>
              <h2 className="font-headline font-black text-4xl md:text-5xl text-primary tracking-tight">
                Ecosistema inteligente para tu carrera
              </h2>
            </div>
            <p className="text-on-surface-variant text-sm leading-relaxed max-w-xs border-l-2 border-secondary pl-5">
              Herramientas diseñadas para superar los filtros de reclutamiento modernos en LATAM y USA.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {features.map(({ Icon, title, desc, cta, href }) => (
              <div
                key={href}
                onClick={() => navigate(href)}
                className="group cursor-pointer p-8 rounded-2xl bg-surface-container-lowest border border-outline-variant/30
                  shadow-card hover:shadow-float hover:border-[#E8541A]/40 hover:bg-orange-50/30
                  transition-all duration-300 flex flex-col justify-between gap-6 min-h-[220px]"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-[#E8541A]/10 flex items-center justify-center mb-5
                    group-hover:bg-[#E8541A]/20 transition-colors duration-300">
                    <Icon size={26} weight="duotone" className="text-[#E8541A]" />
                  </div>
                  <h3 className="font-headline font-bold text-xl mb-3 text-primary group-hover:text-[#E8541A] transition-colors duration-300">
                    {title}
                  </h3>
                  <p className="text-sm leading-relaxed text-on-surface-variant">
                    {desc}
                  </p>
                </div>
                <span className="text-sm font-bold flex items-center gap-2 text-[#E8541A] group-hover:gap-3 transition-all duration-300">
                  {cta} <ArrowRight size={15} weight="bold" />
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA final ─────────────────────────────────────────────────────── */}
      {!user && (
        <section className="bg-surface-container-low py-20 px-6">
          <div className="container mx-auto max-w-3xl text-center space-y-6">
            <span className="inline-block px-3 py-1 bg-tertiary-fixed text-on-tertiary-fixed-variant font-bold text-[10px] rounded-full uppercase tracking-widest">
              Plan gratuito disponible
            </span>
            <h2 className="font-headline font-black text-4xl text-primary tracking-tight">
              Empieza hoy, sin costo
            </h2>
            <p className="text-on-surface-variant max-w-lg mx-auto leading-relaxed">
              Regístrate y obtén 2 análisis gratuitos. Sin tarjeta de crédito, sin contratos.
            </p>
            <button
              onClick={() => navigate('/auth')}
              className="btn-primary inline-flex items-center gap-2 text-sm px-10 py-4"
            >
              Crear cuenta gratis <ArrowRight size={16} weight="bold" />
            </button>
          </div>
        </section>
      )}

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="py-16 px-6 bg-surface flex justify-center">
        <div className="relative w-full max-w-5xl rounded-3xl overflow-hidden min-h-[72vh] flex items-center shadow-float bg-primary">
          <div className="relative z-10 w-full px-8 py-16 grid md:grid-cols-2 gap-12 items-center">
            {/* Copy */}
            <div className="space-y-8">
              <span className="inline-block px-3 py-1 bg-tertiary-fixed text-on-tertiary-fixed-variant font-bold text-[10px] rounded-full uppercase tracking-widest">
                IA sin bias · Formato Harvard · LATAM
              </span>
              <h1 className="font-headline font-black text-5xl md:text-6xl text-on-primary leading-[1.08] tracking-tight">
                Forja tu futuro<br />profesional
              </h1>
              <p className="text-on-primary-container text-lg leading-relaxed max-w-md">
                Optimiza tu CV con inteligencia artificial y conecta con las vacantes que realmente impulsarán tu carrera. Sin inventar información.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                {user ? (
                  !perfil?.nombre1 ? (
                    <button onClick={() => navigate('/onboarding')}
                      className="flex items-center gap-2 bg-[#E8541A] text-white font-bold px-8 py-3.5 rounded-xl hover:brightness-110 transition-colors shadow-float text-sm hover:-translate-y-1">
                      ¡Completar Onboarding para empezar! <ArrowRight size={16} weight="bold" />
                    </button>
                  ) : (
                    <button onClick={() => navigate('/cv-optimizer')}
                      className="flex items-center gap-2 bg-white text-primary font-bold px-8 py-3.5 rounded-xl hover:bg-surface-container-low transition-colors shadow-float text-sm">
                      Ir al optimizador <ArrowRight size={16} weight="bold" />
                    </button>
                  )
                ) : (
                  <>
                    <button onClick={() => navigate('/auth?register=true')}
                      className="flex items-center gap-2 bg-white text-primary font-bold px-8 py-3.5 rounded-xl hover:bg-surface-container-low transition-colors shadow-float text-sm">
                      Empezar gratis <ArrowRight size={16} weight="bold" />
                    </button>
                    <button onClick={() => navigate('/auth')}
                      className="flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 text-on-primary font-medium px-8 py-3.5 rounded-xl hover:bg-white/20 transition-colors text-sm">
                      Ya tengo cuenta
                    </button>
                  </>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-5 text-sm text-on-primary-container">
                {['2 análisis gratis', 'Sin tarjeta de crédito', 'Resultado inmediato'].map(t => (
                  <span key={t} className="flex items-center gap-1.5">
                    <CheckCircle size={15} weight="fill" className="text-tertiary-fixed" />
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Widget IA — desktop */}
            <div className="hidden md:block">
              <div className="bg-white/[0.07] backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-float relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-secondary/20 blur-3xl rounded-full pointer-events-none" />
                <div className="relative z-10 space-y-6">
                  <div className="flex items-center gap-4 border-b border-white/10 pb-5">
                    <div className="w-12 h-12 rounded-xl bg-tertiary-fixed/20 flex items-center justify-center shrink-0">
                      <ChartBar size={24} weight="duotone" className="text-tertiary-fixed" />
                    </div>
                    <div>
                      <p className="text-on-primary font-bold font-headline">IA Resume Score</p>
                      <p className="text-on-primary-container text-sm">Análisis en tiempo real</p>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-2">
                      <span className="text-on-primary-container">Compatibilidad con la vacante</span>
                      <span className="text-tertiary-fixed">92%</span>
                    </div>
                    <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-tertiary-fixed h-full rounded-full" style={{ width: '92%' }} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    {[
                      { label: 'Palabras clave ATS', pct: 88 },
                      { label: 'Formato Harvard',    pct: 100 },
                      { label: 'Logros cuantificados', pct: 75 },
                    ].map(({ label, pct }) => (
                      <div key={label} className="flex items-center gap-3">
                        <span className="text-xs text-on-primary-container w-40 shrink-0">{label}</span>
                        <div className="flex-1 bg-white/10 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-secondary-fixed h-full rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs font-bold text-on-primary w-8 text-right">{pct}%</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-on-primary-container text-xs italic border-t border-white/10 pt-4">
                    "Tu perfil tiene un 92% de coincidencia con puestos de Senior Project Manager."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="bg-gradient-to-r from-[#0A3D2A] to-[#0D2B4E]">
        <div className="container mx-auto max-w-6xl px-6 py-14 grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center">
              <img src="/optima_logo_full.png" alt="OPTIMA-CV" className="h-12 w-auto object-contain" />
            </div>
            <p className="text-white/80 text-sm leading-relaxed max-w-xs">
              Potenciando carreras de alto nivel a través de IA y conocimiento estratégico del mercado laboral en LATAM.
            </p>
          </div>
          <div>
            <h5 className="text-xs font-bold uppercase tracking-widest text-white/60 mb-5">Plataforma</h5>
            <ul className="space-y-3">
              {[
                { to: '/cv-optimizer', label: 'CV Optimizer' },
                { to: '/cv-vs-job',    label: 'CV vs Vacante' },
                { to: '/jobs',         label: 'Vacantes' },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="text-sm text-white/80 hover:text-white transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h5 className="text-xs font-bold uppercase tracking-widest text-white/60 mb-5">Cuenta</h5>
            <ul className="space-y-3">
              {[
                { to: '/auth',    label: 'Iniciar sesión' },
                { to: '/auth',    label: 'Registrarse gratis' },
                { to: '/perfil',  label: 'Mi Perfil' },
              ].map(({ to, label }, i) => (
                <li key={i}>
                  <Link to={to} className="text-sm text-white/80 hover:text-white transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t border-white/20 px-6 py-5 max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <p className="text-[11px] text-white/60 uppercase tracking-wide font-semibold">
            © 2025 OPTIMA-CV. Todos los derechos reservados.
          </p>
          <p className="text-[11px] text-white/60">Hecho para profesionales en LATAM y USA hispanohablante</p>
        </div>
      </footer>

    </div>
  )
}
