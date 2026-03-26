import { useEffect, useRef, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  FileMagnifyingGlass, MagnifyingGlass, Briefcase, Kanban,
  ArrowRight, CheckCircle, ChartBar, Coins, SignOut, Warning
} from '@phosphor-icons/react'
import { supabase } from '../services/authService'
import { motion, useScroll, useTransform, useSpring } from 'framer-motion'

// ── Animaciones ───────────────────────────────────────────────────────────────
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 }
  }
}

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
  const { scrollYProgress } = useScroll()
  const springScroll = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 })

  // Detectar onboarding incompleto
  const onboardingIncompleto = user && !perfil?.nombre1

  const features = [
    {
      Icon: FileMagnifyingGlass,
      title: 'CV Optimizer',
      desc:  'Sube tu CV y recibe una versión en formato Harvard con lenguaje de impacto, superando los filtros ATS.',
      cta:   'Optimizar ahora',
      href:  '/cv-optimizer',
      size:  'md:col-span-2 lg:col-span-2',
      accent: true,
    },
    {
      Icon: MagnifyingGlass,
      title: 'CV vs Vacante',
      desc:  'Mide tu compatibilidad con una oferta específica y obtén un % de match preciso y recomendaciones.',
      cta:   'Analizar match',
      href:  '/cv-vs-job',
      size:  'md:col-span-1 lg:col-span-1',
    },
    {
      Icon: Briefcase,
      title: 'Vacantes Premium',
      desc:  'Encuentra oportunidades curadas y alineadas a profesionales experimentados en LATAM y USA.',
      cta:   'Explorar vacantes',
      href:  '/jobs',
      size:  'md:col-span-1 lg:col-span-1',
    },
    {
      Icon: Kanban,
      title: 'Pipeline Inteligente',
      desc:  'Gestiona tus candidaturas en un tablero visual integral para no perder nunca el seguimiento.',
      cta:   'Ver Pipeline',
      href:  '/pipeline',
      size:  'md:col-span-2 lg:col-span-2',
    },
  ]

  return (
    <div className="min-h-screen bg-slate-50 font-body text-gray-900 selection:bg-[#E8541A]/20 relative overflow-hidden">

      {/* Background Gradients (suaves, para fondo claro) */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-teal-100 to-transparent blur-[150px] opacity-60 animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-gradient-to-tl from-blue-100 to-transparent blur-[150px] opacity-60" />
      </div>

      {/* Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 via-[#E8541A] to-blue-500 z-[60] origin-left"
        style={{ scaleX: springScroll }}
      />

      {/* ── Nav landing ────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 h-24 bg-white/80 backdrop-blur-xl border-b border-gray-200/80 transition-all duration-300">
        <Link to="/" className="flex items-center">
          <img src="/optima_logo_v3_clean_1.png" alt="OPTIMA-CV" className="h-[4.5rem] py-1 w-auto object-contain" />
        </Link>

        {/* Acciones nav */}
        <div className="flex items-center gap-3 sm:gap-6">
          {user ? (
            <>
              <div className={`hidden sm:flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full border
                ${creditosRestantes === 0 ? 'text-red-600 bg-red-50 border-red-200'
                  : creditosRestantes === 1 ? 'text-amber-600 bg-amber-50 border-amber-200'
                  : 'text-gray-600 bg-gray-100 border-gray-200'}`}>
                <Coins size={15} weight="duotone" />
                {creditosRestantes} / {LIMITE_PLAN} Créditos
              </div>
              <span className="hidden md:block text-sm font-medium text-gray-600">
                {perfil?.nombre1 || user.email?.split('@')[0]}
              </span>
              <button onClick={() => navigate('/cv-optimizer')}
                className="hidden sm:flex items-center gap-2 bg-[#E8541A] text-white font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-[#E8541A]/90 transition-all shadow-md">
                Plataforma <ArrowRight size={15} weight="bold" />
              </button>
              <button
                onClick={() => supabase.auth.signOut().then(() => navigate('/'))}
                title="Cerrar sesión"
                className="flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-gray-700 hover:bg-gray-100 px-3 py-2.5 rounded-xl transition-colors">
                <SignOut size={18} weight="bold" />
              </button>
            </>
          ) : (
            <>
              <Link to="/auth" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors hidden sm:block">
                Iniciar sesión
              </Link>
              <Link to="/auth?register=true"
                className="flex items-center gap-2 bg-gray-900 text-white font-bold text-sm px-6 py-2.5 rounded-xl hover:bg-gray-800 transition-all shadow-md">
                Empezar gratis
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* ── Banner onboarding incompleto ──────────────────────────────────── */}
      {onboardingIncompleto && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-center justify-center sm:justify-between gap-4 relative z-40 flex-wrap">
          <div className="flex items-center gap-3">
            <Warning size={20} weight="duotone" className="text-amber-500" />
            <p className="text-sm text-amber-800 font-medium">
              Completa tu perfil para desbloquear todas las herramientas de IA.
            </p>
          </div>
          <button
            onClick={() => navigate('/onboarding')}
            className="text-sm font-bold bg-amber-500 text-white px-5 py-1.5 rounded-lg hover:bg-amber-600 transition-colors flex items-center gap-2 shrink-0">
            Continuar <ArrowRight size={14} weight="bold" />
          </button>
        </div>
      )}

      {/* ── Hero Section ──────────────────────────────────────────────────── */}
      <section className="relative z-10 pt-12 pb-20 md:pt-20 md:pb-32 px-6 lg:min-h-[85vh] flex items-center">
        <div className="container mx-auto max-w-7xl grid lg:grid-cols-2 gap-16 items-center">
          
          <motion.div 
            initial="hidden" 
            animate="visible" 
            variants={staggerContainer}
            className="max-w-2xl"
          >
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 bg-white shadow-sm mb-8">
              <span className="w-2 h-2 rounded-full bg-[#E8541A] animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-widest text-gray-500">OPTIMA-CV Está en vivo</span>
            </motion.div>

            <motion.h1 variants={fadeInUp} className="font-headline font-black text-5xl sm:text-7xl leading-[1.05] tracking-tight mb-8">
              Tu carrera,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 via-emerald-500 to-blue-600">
                Impulsada por IA.
              </span>
            </motion.h1>

            <motion.p variants={fadeInUp} className="text-lg sm:text-xl text-gray-500 leading-relaxed mb-10 max-w-lg">
              Supera los filtros ATS, diseña un CV formato Harvard de alto impacto y domina tu proceso de selección en empresas top de LATAM y USA.
            </motion.p>

            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4">
              {user ? (
                <button onClick={() => navigate(perfil?.nombre1 ? '/cv-optimizer' : '/onboarding')}
                  className="group flex justify-center items-center gap-3 bg-[#E8541A] text-white font-bold text-base px-8 py-4 rounded-xl hover:bg-[#E8541A]/90 transition-all shadow-lg shadow-[#E8541A]/20">
                  Ir al optimizador <ArrowRight size={18} weight="bold" className="group-hover:translate-x-1 transition-transform" />
                </button>
              ) : (
                <>
                  <button onClick={() => navigate('/auth?register=true')}
                    className="group flex items-center justify-center gap-3 bg-[#E8541A] text-white font-bold text-base px-8 py-4 rounded-xl hover:bg-[#E8541A]/90 transition-all shadow-lg shadow-[#E8541A]/20">
                    Empezar gratis <ArrowRight size={18} weight="bold" className="group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button onClick={() => navigate('/auth')}
                    className="flex justify-center flex-1 sm:flex-none items-center gap-2 bg-white border border-gray-200 text-gray-700 font-medium px-8 py-4 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-colors shadow-sm">
                    Iniciar sesión
                  </button>
                </>
              )}
            </motion.div>

            <motion.div variants={fadeInUp} className="mt-10 flex flex-wrap items-center gap-6 text-sm text-gray-400 font-medium">
              {['2 análisis gratis', 'Sin tarjeta de crédito', 'Métricas instantáneas'].map(t => (
                <span key={t} className="flex items-center gap-2">
                  <CheckCircle size={16} weight="fill" className="text-teal-500" />
                  {t}
                </span>
              ))}
            </motion.div>
          </motion.div>

          {/* Floating UI Elements / Dashboard Mockup */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, rotateX: 10 }}
            animate={{ opacity: 1, scale: 1, rotateX: 0 }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
            className="relative hidden lg:block perspective-1000"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-teal-500/20 to-blue-500/20 blur-[100px] rounded-full" />
            
            {/* Main Widget */}
            <motion.div
              animate={{ y: [0, -15, 0] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
              className="relative bg-white border border-gray-200 p-8 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.08)] z-20"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-6 mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center shrink-0 shadow-lg">
                    <ChartBar size={24} weight="duotone" className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">ATS Resume Score</h3>
                    <p className="text-gray-400 text-xs">Escaneando compatibilidad...</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="block text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-500">92%</span>
                  <span className="text-[10px] text-gray-400 uppercase tracking-widest">Match Rating</span>
                </div>
              </div>

              <div className="space-y-5">
                {[
                  { label: 'Densidad Palabras Clave', pct: 88, color: 'bg-teal-400' },
                  { label: 'Estructura Harvard',      pct: 100, color: 'bg-emerald-400' },
                  { label: 'Métricas de Impacto',     pct: 75, color: 'bg-amber-400' },
                ].map(({ label, pct, color }, i) => (
                  <div key={label} className="flex items-center justify-between gap-4">
                    <span className="text-sm text-gray-500 w-44">{label}</span>
                    <div className="flex-1 bg-gray-100 h-2 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 1.5, delay: 0.5 + (i*0.2), ease: "easeOut" }}
                        className={`h-full rounded-full ${color}`}
                      />
                    </div>
                    <span className="text-sm font-bold text-gray-700 w-10 text-right">{pct}%</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Small Floating Widget */}
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
              className="absolute right-0 -bottom-10 bg-white border border-gray-200 p-5 rounded-2xl shadow-xl z-30 flex items-center gap-4"
            >
              <div className="w-10 h-10 rounded-full bg-[#E8541A]/10 border border-[#E8541A]/30 flex items-center justify-center">
                <CheckCircle size={20} weight="fill" className="text-[#E8541A]" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Formato Optimizado</p>
                <p className="text-xs text-gray-400">Hace 2 minutos</p>
              </div>
            </motion.div>

          </motion.div>
        </div>
      </section>

      {/* ── Stats Strip ───────────────────────────────────────────────────── */}
      <section className="relative z-10 border-y border-gray-200 bg-white py-10">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-gray-200 text-center">
            {[
              { target: 75, suffix: '%', label: 'Tasa de rechazo inicial por filtros ATS sin optimizar' },
              { target: 3,  suffix: 'x', label: 'Mayor probabilidad de entrevista con un formato Harvard' },
              { target: 8,  suffix: 's', label: 'Tiempo promedio que un reclutador lee tu CV' },
            ].map(({ target, suffix, label }) => (
              <div key={label} className="px-6 py-4 md:py-0">
                <p className="font-headline font-black text-4xl text-teal-600 md:text-5xl mb-2">
                  <AnimatedCounter target={target} suffix={suffix} />
                </p>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-relaxed max-w-[220px] mx-auto">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Bento Grid ───────────────────────────────────────────── */}
      <section className="relative z-10 py-32 px-6">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-20 space-y-4"
          >
            <span className="text-[#E8541A] font-bold text-sm tracking-widest uppercase">Ecosistema Integral</span>
            <h2 className="font-headline font-black text-4xl md:text-5xl tracking-tight text-gray-900">
              Dominio total de tu proceso de selección
            </h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              Las herramientas de inteligencia artificial más avanzadas para asegurar que tu perfil destaque en el competitivo mercado laboral actual.
            </p>
          </motion.div>

          {/* Fila 1: CV Optimizer (ancho) + CV vs Vacante */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {features.slice(0, 2).map((feature, idx) => (
              <motion.div
                key={feature.href}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => navigate(feature.href)}
                className={`group cursor-pointer relative overflow-hidden rounded-3xl border border-gray-200 bg-white p-10 transition-all duration-500 hover:border-gray-300 hover:shadow-lg hover:scale-[1.02] shadow-sm
                  ${idx === 0 ? 'md:col-span-2' : 'md:col-span-1'}`}
              >
                {feature.accent && <div className="absolute inset-0 bg-gradient-to-br from-[#E8541A]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />}
                <div className="relative z-10 h-full flex flex-col justify-between">
                  <div>
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-8 transition-transform duration-500 group-hover:-translate-y-2 ${feature.accent ? 'bg-[#E8541A]/10 text-[#E8541A]' : 'bg-teal-50 text-teal-600'}`}>
                      <feature.Icon size={28} weight="duotone" />
                    </div>
                    <h3 className="font-headline font-bold text-2xl mb-4 text-gray-900">{feature.title}</h3>
                    <p className="text-gray-500 leading-relaxed group-hover:text-gray-700 transition-colors">{feature.desc}</p>
                  </div>
                  <div className="mt-12 flex items-center gap-2 text-sm font-bold text-gray-400 group-hover:text-[#E8541A] transition-colors">
                    {feature.cta} <ArrowRight size={16} weight="bold" className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Fila 2: Vacantes + Pipeline (ancho) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.slice(2).map((feature, idx) => (
              <motion.div
                key={feature.href}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => navigate(feature.href)}
                className={`group cursor-pointer relative overflow-hidden rounded-3xl border border-gray-200 bg-white p-10 transition-all duration-500 hover:border-gray-300 hover:shadow-lg hover:scale-[1.02] shadow-sm
                  ${idx === 0 ? 'md:col-span-1' : 'md:col-span-2'}`}
              >
                {feature.accent && <div className="absolute inset-0 bg-gradient-to-br from-[#E8541A]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />}
                <div className="relative z-10 h-full flex flex-col justify-between">
                  <div>
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-8 transition-transform duration-500 group-hover:-translate-y-2 ${feature.accent ? 'bg-[#E8541A]/10 text-[#E8541A]' : 'bg-teal-50 text-teal-600'}`}>
                      <feature.Icon size={28} weight="duotone" />
                    </div>
                    <h3 className="font-headline font-bold text-2xl mb-4 text-gray-900">{feature.title}</h3>
                    <p className="text-gray-500 leading-relaxed group-hover:text-gray-700 transition-colors">{feature.desc}</p>
                  </div>
                  <div className="mt-12 flex items-center gap-2 text-sm font-bold text-gray-400 group-hover:text-[#E8541A] transition-colors">
                    {feature.cta} <ArrowRight size={16} weight="bold" className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Seccion AI Bot 3D ───────────────────────────────────────────── */}
      <section className="relative z-10 py-32 px-6 overflow-hidden bg-gray-900 border-t border-gray-800">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-bl from-teal-500/10 via-emerald-500/5 to-transparent rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-gradient-to-tr from-[#E8541A]/10 to-transparent rounded-full blur-[100px] pointer-events-none" />

        <div className="container mx-auto max-w-7xl grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-8 relative z-10"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-teal-500/30 bg-teal-500/10">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-widest text-teal-300">Inteligencia Artificial Integrada</span>
            </div>
            
            <h2 className="font-headline font-black text-4xl md:text-5xl lg:text-6xl text-white tracking-tight leading-[1.1]">
              Conoce a <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">OPTIMA</span>,<br />
              tu mentora 24/7.
            </h2>
            
            <p className="text-gray-400 text-lg md:text-xl leading-relaxed max-w-xl">
              Un asistente conversacional avanzado diseñado para analizar tu perfil técnico, sugerir mejoras en tiempo real y preparar simulaciones de entrevistas de alto estrés.
            </p>
            
            <ul className="space-y-4 text-gray-300 font-medium">
              {[
                'Feedback inmediato sobre tu CV',
                'Simulaciones de entrevistas por rol (Premium)',
                'Consejos de negociación salarial',
              ].map(item => (
                <li key={item} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-400">
                    <CheckCircle size={14} weight="fill" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* 3D Floating Mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative perspective-1000 lg:h-[500px] flex items-center justify-center mt-10 lg:mt-0"
          >
            <motion.div
              animate={{ 
                y: [0, -20, 0],
                rotateY: [-5, 5, -5],
                rotateX: [2, -2, 2]
              }}
              transition={{ repeat: Infinity, duration: 7, ease: "easeInOut" }}
              className="relative z-20 w-full max-w-sm"
              style={{ transformStyle: 'preserve-3d' }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-teal-400/20 to-emerald-600/20 blur-xl rounded-[2.5rem]" />
              
              {/* Chat Interface Glassmorphism */}
              <div className="relative bg-[#0A1A14]/90 backdrop-blur-xl border border-white/10 p-6 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                <div className="flex items-center gap-4 border-b border-white/10 pb-5 mb-5">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-emerald-600 p-[2px] shadow-lg">
                    <img src="/avatar_3d_bot.png" alt="OPTIMA" className="w-full h-full object-cover rounded-full" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-lg leading-none">OPTIMA</h4>
                    <span className="text-teal-400 text-xs font-semibold flex items-center gap-1 mt-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" /> En línea
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-white/10 border border-white/5 p-4 rounded-2xl rounded-tl-sm text-sm text-gray-200">
                    He analizado tu perfil. Tienes un excelente background, pero faltan métricas de impacto en tu ex-rol. ¿Te ayudo a redactarlas?
                  </div>
                  
                  <div className="bg-teal-500/20 border border-teal-500/30 p-4 rounded-2xl rounded-tr-sm text-sm text-white ml-8">
                    Sí, por favor. Logramos reducir el tiempo de carga un 40%.
                  </div>

                  <div className="bg-white/10 border border-white/5 p-4 rounded-2xl rounded-tl-sm text-sm text-gray-200 flex items-end gap-2">
                    <span className="flex gap-1 mb-1">
                      <span className="w-2 h-2 rounded-full bg-teal-400 animate-bounce" />
                      <span className="w-2 h-2 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                  </div>
                </div>
              </div>

              {/* Decorative floating badges */}
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut", delay: 1 }}
                className="absolute -right-6 lg:-right-12 top-20 bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 px-4 py-2 rounded-xl flex items-center gap-2 shadow-xl"
                style={{ transform: "translateZ(30px)" }}
              >
                <Kanban size={18} weight="fill" className="text-emerald-400" />
                <span className="text-emerald-300 text-xs font-bold tracking-wide">NLP Engine</span>
              </motion.div>
              
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 2 }}
                className="absolute -left-6 lg:-left-10 bottom-16 bg-[#E8541A]/20 backdrop-blur-md border border-[#E8541A]/30 px-4 py-2 rounded-xl flex items-center gap-2 shadow-xl"
                style={{ transform: "translateZ(50px)" }}
              >
                <CheckCircle size={18} weight="fill" className="text-[#E8541A]" />
                <span className="text-[#E8541A] text-xs font-bold tracking-wide">Revisión en 2s</span>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── CTA Final ─────────────────────────────────────────────────────── */}
      <section className="relative z-10 py-24 px-6 border-t border-gray-200 bg-white">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="container mx-auto max-w-4xl text-center bg-gray-900 rounded-3xl p-12 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-500/10 blur-[100px] rounded-full pointer-events-none" />

          {user ? (
            <div className="relative z-10 space-y-8">
              <span className="inline-block px-4 py-1.5 bg-teal-500/20 border border-teal-500/30 text-teal-300 font-bold text-xs rounded-full uppercase tracking-widest">
                Bienvenido de vuelta, {perfil?.nombre1 || user.email?.split('@')[0]}
              </span>
              <h2 className="font-headline font-black text-4xl md:text-5xl tracking-tight leading-tight text-white">
                Tu siguiente paso<br className="hidden md:block" /> te está esperando.
              </h2>
              <p className="text-white/60 max-w-xl mx-auto leading-relaxed text-lg">
                Tienes <strong className="text-white">{creditosRestantes} créditos</strong> disponibles. Úsalos para optimizar tu CV o medir tu match con una vacante.
              </p>
              <button
                onClick={() => navigate(perfil?.nombre1 ? '/cv-optimizer' : '/onboarding')}
                className="inline-flex items-center justify-center gap-3 text-base font-bold bg-[#E8541A] hover:bg-[#E8541A]/90 text-white px-10 py-5 rounded-2xl shadow-lg hover:-translate-y-1 transition-all"
              >
                Ir al optimizador <ArrowRight size={18} weight="bold" />
              </button>
            </div>
          ) : (
            <div className="relative z-10 space-y-8">
              <span className="inline-block px-4 py-1.5 bg-[#E8541A]/20 border border-[#E8541A]/40 text-[#E8541A] font-bold text-xs rounded-full uppercase tracking-widest">
                2 Análisis Gratuitos
              </span>
              <h2 className="font-headline font-black text-4xl md:text-5xl tracking-tight leading-tight text-white">
                No dejes tu carrera<br className="hidden md:block" /> al azar de un algoritmo.
              </h2>
              <p className="text-white/60 max-w-xl mx-auto leading-relaxed text-lg">
                Utiliza inteligencia artificial a tu favor. Mide tu compatibilidad de CV antes de postularte y genera un formato impecable.
              </p>
              <button
                onClick={() => navigate('/auth?register=true')}
                className="inline-flex items-center justify-center gap-3 text-base font-bold bg-[#E8541A] hover:bg-[#E8541A]/90 text-white px-10 py-5 rounded-2xl shadow-lg hover:-translate-y-1 transition-all"
              >
                Crear cuenta gratis ahora <ArrowRight size={18} weight="bold" />
              </button>
            </div>
          )}
        </motion.div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-gray-200 bg-gray-900">
        <div className="container mx-auto max-w-6xl px-6 py-16 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-2 space-y-6">
            <Link to="/">
              <img src="/optima_logo_v3_clean_1.png" alt="OPTIMA-CV" className="h-10 w-auto object-contain brightness-0 invert opacity-90" />
            </Link>
            <p className="text-white/50 text-sm leading-relaxed max-w-sm">
              Potenciando carreras de alto nivel a través de Inteligencia Artificial y conocimiento estratégico del mercado laboral corporativo en LATAM y Estados Unidos.
            </p>
          </div>
          <div>
            <h5 className="text-xs font-bold uppercase tracking-widest text-white/30 mb-6 font-headline">Plataforma</h5>
            <ul className="space-y-4">
              {[
                { to: '/cv-optimizer', label: 'CV Optimizer' },
                { to: '/cv-vs-job',    label: 'Match CV-Vacante' },
                { to: '/jobs',         label: 'Bolsa Premium' },
                { to: '/entrevista',   label: 'Simulador Entrevista (Pro)' },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="text-sm font-medium text-white/60 hover:text-white hover:translate-x-1 inline-block transition-all">{label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h5 className="text-xs font-bold uppercase tracking-widest text-white/30 mb-6 font-headline">Cuenta</h5>
            <ul className="space-y-4">
              {[
                { to: '/auth',    label: 'Iniciar sesión' },
                { to: '/auth?register=true',    label: 'Registrarse gratis' },
                { to: '/perfil',  label: 'Mi Perfil' },
              ].map(({ to, label }, i) => (
                <li key={i}>
                  <Link to={to} className="text-sm font-medium text-white/60 hover:text-white hover:translate-x-1 inline-block transition-all">{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t border-white/5 px-6 py-6 bg-black/20">
          <div className="container max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-[11px] text-white/40 uppercase tracking-widest font-bold">
              © {new Date().getFullYear()} OPTIMA-CV. Reservados todos los derechos.
            </p>
            <div className="flex items-center gap-4">
              <Link to="/privacidad" className="text-[11px] text-white/40 hover:text-white/70 transition-colors font-medium tracking-wide">
                Política de Privacidad
              </Link>
              <span className="text-white/20">·</span>
              <p className="text-[11px] text-white/40 font-medium tracking-wide">Desarrollado para LATAM & USA</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
