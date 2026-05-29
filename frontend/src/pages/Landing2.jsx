import { useEffect, useRef, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  FileMagnifyingGlass, MagnifyingGlass, Briefcase, Kanban,
  ArrowRight, ArrowDown, CheckCircle, ChartBar, Coins, SignOut, Warning,
  ShieldCheck, Lightning, Target, Check, Star,
  Folders, BookmarkSimple, Books, LinkedinLogo,
  MicrophoneStage, UsersThree, TrendUp, RocketLaunch
} from '@phosphor-icons/react'

// ─── Features data (fuera del componente para evitar re-renders) ───────────────
const GRAD = {
  orange: 'linear-gradient(135deg, #E8541A 0%, #F59E0B 100%)',
  teal:   'linear-gradient(135deg, #0D9488 0%, #059669 100%)',
  blue:   'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)',
}

const FEATURE_ROWS = {
  heroes: [
    {
      Icon: FileMagnifyingGlass,
      titulo: 'Optimizador de CV',
      desc: 'Tu CV habla primero. Haz que diga lo correcto — formato Harvard, lenguaje de impacto, filtros ATS superados.',
      cta: 'Optimizar mi CV',
      gradientStyle: GRAD.orange,
      iconBg: 'bg-[#E8541A]/10', iconColor: 'text-[#E8541A]',
    },
    {
      Icon: MagnifyingGlass,
      titulo: 'CV vs Vacante',
      desc: '¿Eres el candidato ideal? Descúbrelo con un % de match real antes de perder tiempo aplicando.',
      cta: 'Medir mi compatibilidad',
      gradientStyle: GRAD.orange,
      iconBg: 'bg-amber-100', iconColor: 'text-amber-600',
    },
    {
      Icon: UsersThree,
      titulo: 'Autoconocimiento',
      subtitulo: 'Tu primer paso',
      desc: 'Un onboarding para que conozcas tu momento actual y hacia donde quieres ir. Prepárate para tu transición profesional.',
      cta: 'Comenzar',
      gradientStyle: GRAD.blue,
      iconBg: 'bg-blue-100', iconColor: 'text-blue-600',
      featured: true,
    },
  ],
  carrera: [
    {
      Icon: Briefcase,
      titulo: 'Vacantes',
      desc: 'Las oportunidades correctas, ya filtradas. Sin horas perdidas en portales.',
      cta: 'Ver vacantes',
      gradientStyle: GRAD.teal,
      iconBg: 'bg-teal-100', iconColor: 'text-teal-600',
    },
    {
      Icon: Folders,
      titulo: 'Mis CVs',
      desc: 'Todas tus versiones, siempre listas. Adapta sin volver a empezar.',
      cta: 'Ver mis CVs',
      gradientStyle: GRAD.teal,
      iconBg: 'bg-teal-100', iconColor: 'text-teal-600',
    },
    {
      Icon: BookmarkSimple,
      titulo: 'Mis Vacantes',
      desc: 'Guarda las que te interesan. Compara y aplica cuando estés listo.',
      cta: 'Ver guardadas',
      gradientStyle: GRAD.teal,
      iconBg: 'bg-teal-100', iconColor: 'text-teal-600',
    },
    {
      Icon: Kanban,
      titulo: 'Pipeline',
      desc: 'Tu búsqueda laboral bajo control. Sabe exactamente en qué punto estás en cada proceso.',
      cta: 'Ver mi pipeline',
      gradientStyle: GRAD.teal,
      iconBg: 'bg-teal-100', iconColor: 'text-teal-600',
    },
  ],
  recursos: [
    {
      Icon: Books,
      titulo: 'Biblioteca',
      desc: 'El conocimiento que nadie te enseñó. Guías para dominar las reglas del juego.',
      cta: 'Explorar',
      gradientStyle: GRAD.blue,
      iconBg: 'bg-blue-100', iconColor: 'text-blue-600',
    },
    {
      Icon: ChartBar,
      titulo: 'Bienestar',
      desc: 'Ejercicios sencillos para cuando el estrés llega. Cuida tu salud mental durante la búsqueda.',
      cta: 'Ver ejercicios',
      gradientStyle: GRAD.blue,
      iconBg: 'bg-blue-100', iconColor: 'text-blue-600',
    },
    {
      Icon: LinkedinLogo,
      titulo: 'LinkedIn Pro',
      desc: 'Tu perfil optimizado para aparecer cuando los recruiters que importan están buscando.',
      cta: 'Optimizar perfil',
      gradientStyle: GRAD.blue,
      iconBg: 'bg-blue-100', iconColor: 'text-blue-600',
    },
    {
      Icon: MicrophoneStage,
      titulo: 'Entrevista',
      desc: 'Practica hasta que no haya pregunta difícil. Llega seguro cuando más importa.',
      cta: 'Próximamente',
      upcoming: true,
      gradientStyle: GRAD.blue,
      iconBg: 'bg-blue-100', iconColor: 'text-blue-600',
    },
  ],
}
import { supabase } from '../services/authService'
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion'



// ─── Animaciones ──────────────────────────────────────────────────────────────
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

// ─── Contador animado ────────────────────────────────────────────────────────
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

// ─── Componente principal ──────────────────────────────────────────────────
// modoComercial=true → oculta CTAs de registro abierto y muestra formulario "Solicitar información".
// Se usa cuando la landing está montada en la raíz `/` como página comercial B2B.
export default function Landing({ modoComercial = false }) {
  const navigate  = useNavigate()
  const { user, perfil, creditosRestantes, LIMITE_PLAN } = useAuth()
  const { scrollYProgress } = useScroll()
  const springScroll = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 })

  // Detectar onboarding incompleto
  const onboardingIncompleto = user && !perfil?.nombre1

  // ─── Simulador Interactivo (auto-type) ──────────────────────────────────
  const DEMO_JOB_TEXT = 'La Compañía busca un perfil de Operaciones con experiencia en la industria de alimentos. El candidato ideal tiene 3+ años liderando procesos de calidad, coordinación de proveedores y mejora continua (Lean/Six Sigma). Excelente comunicación, visión analítica y enfoque en resultados. Deseable experiencia en ERP (SAP o similar).'
  const [demoText, setDemoText] = useState('')
  const [demoTypingDone, setDemoTypingDone] = useState(false)
  const [demoLoading, setDemoLoading] = useState(false)
  const [demoLoadingText, setDemoLoadingText] = useState('Ejecutar simulador')
  const [showDemoOverlay, setShowDemoOverlay] = useState(false)
  const demoSectionRef = useRef(null)
  const demoTypingStarted = useRef(false)

  // ─── Formulario contacto comercial (solo modoComercial) ──────────────────
  const [contactoForm, setContactoForm] = useState({ nombre: '', empresa: '', email: '', telefono: '', mensaje: '' })
  const [contactoEnviando, setContactoEnviando] = useState(false)
  const [contactoEnviado, setContactoEnviado] = useState(false)
  const [contactoError, setContactoError] = useState('')

  const enviarContactoComercial = async (e) => {
    e.preventDefault()
    setContactoError('')
    if (!contactoForm.nombre.trim() || !contactoForm.email.trim() || !contactoForm.empresa.trim()) {
      setContactoError('Por favor completa nombre, empresa y email.')
      return
    }
    setContactoEnviando(true)
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://cv-optimizer-pro-production.up.railway.app'
      const res = await fetch(`${apiUrl}/api/email/contacto-comercial`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactoForm),
      })
      if (!res.ok) throw new Error('Error enviando')
      setContactoEnviado(true)
      setContactoForm({ nombre: '', empresa: '', email: '', telefono: '', mensaje: '' })
    } catch (err) {
      setContactoError('No pudimos enviar tu mensaje. Intenta de nuevo o escribe a comercial@elvia.lat.')
    } finally {
      setContactoEnviando(false)
    }
  }

  // ─── Sticky CTA (Recomendación Marketing) ──────────────────────────────
  const [showStickyCTA, setShowStickyCTA] = useState(false)
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 800) setShowStickyCTA(true)
      else setShowStickyCTA(false)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToWaitlist = () => {
    document.getElementById('waitlist-form-bottom')?.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'center' 
    })
  }

  useEffect(() => {
    const section = demoSectionRef.current
    if (!section) return
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !demoTypingStarted.current) {
        demoTypingStarted.current = true
        let i = 0
        const timer = setInterval(() => {
          i++
          setDemoText(DEMO_JOB_TEXT.slice(0, i))
          if (i >= DEMO_JOB_TEXT.length) { 
            clearInterval(timer)
            setDemoTypingDone(true)
            // Analytics: Simulación terminada
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
            fetch(`${API_URL}/api/events/track`, {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ event_name: 'demo_complete' })
            }).catch(() => {})
          }
        }, 28)
      }
    }, { threshold: 0.1 })
    obs.observe(section)
    return () => obs.disconnect()
  }, [])

  const handleDemoSubmit = () => {
     setDemoLoading(true)
     setDemoLoadingText('Analizando palabras clave ATS...')
     setTimeout(() => setDemoLoadingText('Cruzando requerimientos con CV...'), 1200)
     setTimeout(() => setDemoLoadingText('Calculando penalizaciones de sintaxis...'), 2400)
     setTimeout(() => {
         setDemoLoadingText('Análisis Completo')
         setShowDemoOverlay(true)
     }, 3500)
  }



  useEffect(() => {
    // Analytics: Registrar visita a la Landing
    if (window.location.hostname !== 'localhost') {
       fetch((import.meta.env.VITE_API_URL || 'https://optima-backend-production.up.railway.app') + '/api/waitlist/track', { method: 'POST' }).catch(() => {})
    }

    // Dynamic Config: SEO & Headline
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
    // LOW-2 fix: GET /api/events/track eliminado (generaba 404 en cada visita)
    
    // Using Supabase client for simple public read
    import('@supabase/supabase-js').then(({ createClient }) => {
      const db = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)
      db.from('landing_config').select('*').then(({ data }) => {
        if (data) {
          const title = data.find(c => c.config_key === 'seo_title')?.config_value
          const desc  = data.find(c => c.config_key === 'seo_meta_description')?.config_value
          if (title) document.title = title
          if (desc) {
            let meta = document.querySelector('meta[name="description"]')
            if (meta) meta.setAttribute('content', desc)
          }
        }
      })
    })

  }, [])
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

      {/* ─── Nav landing ────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 h-24 bg-white/80 backdrop-blur-xl border-b border-gray-200/80 transition-all duration-300">
        <Link to="/" className="flex items-center">
          <img src="/LOGOS/ELVIA_logo_fondo_transparente.png" alt="ELVIA" className="h-10 py-1 w-auto object-contain" />
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
              <button onClick={() => navigate('/auth')}
                className={modoComercial
                  ? "flex items-center gap-2 bg-[#E8541A] text-white font-bold text-sm px-6 py-2.5 rounded-xl hover:bg-[#E8541A]/90 transition-all shadow-md shadow-[#E8541A]/20"
                  : "hidden sm:inline-flex items-center justify-center px-4 py-2.5 text-sm font-bold text-gray-700 bg-transparent border-2 border-gray-200 hover:border-gray-300 hover:text-gray-900 rounded-xl transition-all shadow-sm"
                }>
                Iniciar sesión
              </button>
              {!modoComercial && (
                <button onClick={() => navigate('/auth?register=true')}
                  className="flex items-center gap-2 bg-[#E8541A] text-white font-bold text-sm px-6 py-2.5 rounded-xl hover:bg-[#E8541A]/90 transition-all shadow-md shadow-[#E8541A]/20">
                  Empezar gratis
                </button>
              )}
            </>
          )}
        </div>
      </nav>

      {/* ─── Banner onboarding incompleto ────────────────────────────────────────── */}
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

      {/* ─── Hero Section ───────────────────────────────────────────────────────── */}
      <section className="relative z-10 pt-12 pb-20 md:pt-20 md:pb-32 px-6 lg:min-h-[85vh] flex items-center">
        <div className="container mx-auto max-w-7xl grid lg:grid-cols-2 gap-16 items-stretch">
          
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="max-w-2xl h-full flex flex-col"
          >
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 bg-white shadow-sm mb-8">
              <span className="w-2 h-2 rounded-full bg-[#E8541A] animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-widest text-gray-500">ELVIA Está en vivo</span>
            </motion.div>

            <motion.h1 variants={fadeInUp} className="font-headline font-black text-5xl sm:text-7xl leading-[1.05] tracking-tight mb-8">
              Sé tu propio gerente<br />
              <span className="text-[#002650] inline-block">
                de tu búsqueda laboral
              </span>
            </motion.h1>

            <motion.p variants={fadeInUp} className="text-lg sm:text-xl text-gray-500 leading-relaxed mb-4 max-w-lg">
              Encuentra tu propósito y ten las herramientas necesarias para encontrar tu siguiente proyecto laboral y profesional.
            </motion.p>
            <motion.p variants={fadeInUp} className="text-base text-gray-500 leading-relaxed mb-4 max-w-lg">
              ELVIA es el sistema comprobado que te acompaña de inicio a fin, y no se queda solo en documentos.
            </motion.p>
            <motion.p variants={fadeInUp} className="text-base text-gray-500 leading-relaxed mb-10 max-w-lg">
              El AUTOCONOCIMIENTO es la base de ELVIA, entre más información relevante de ti, mejores resultados. A veces no es cuestión de una CV bonita, es de realmente entender que quieres en tu siguiente paso profesional.
            </motion.p>

            <motion.div variants={fadeInUp} className="mt-8 flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {modoComercial ? (
                <>
                  <button
                    onClick={() => document.getElementById('contacto-comercial')?.scrollIntoView({ behavior: 'smooth' })}
                    className="bg-[#E8541A] text-white font-black py-4 px-8 rounded-2xl text-lg transition-all shadow-[0_8px_30px_rgba(232,84,26,0.3)] hover:shadow-[0_8px_30px_rgba(232,84,26,0.5)] flex items-center gap-2 group w-full sm:w-auto justify-center h-14"
                  >
                    Quiero más información
                    <ArrowDown className="w-5 h-5 group-hover:translate-y-1 transition-transform" weight="bold" />
                  </button>
                  <button
                    onClick={() => navigate('/auth')}
                    className="bg-white border-2 border-gray-200 text-gray-800 font-bold py-4 px-8 rounded-2xl text-lg transition-all hover:border-gray-400 hover:bg-gray-50 flex items-center gap-2 w-full sm:w-auto justify-center h-14"
                  >
                    Ya tengo cuenta · Iniciar sesión
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => document.getElementById('features-section')?.scrollIntoView({ behavior: 'smooth' })}
                    className="bg-[#E8541A] text-white font-black py-4 px-8 rounded-2xl text-lg transition-all shadow-[0_8px_30px_rgba(232,84,26,0.3)] hover:shadow-[0_8px_30px_rgba(232,84,26,0.5)] flex items-center gap-2 group w-full sm:w-auto justify-center h-14"
                  >
                    Únete y sé pionero ELVIA
                    <ArrowDown className="w-5 h-5 group-hover:translate-y-1 transition-transform" weight="bold" />
                  </button>

                  <div className="flex items-center gap-3 text-sm text-gray-500 mt-2 sm:mt-0">
                    <div className="flex -space-x-2">
                      <div className="w-10 h-10 rounded-full border-2 border-white bg-teal-100 flex items-center justify-center relative z-30 shadow-sm text-teal-700 font-bold text-xs tracking-tighter">AM</div>
                      <div className="w-10 h-10 rounded-full border-2 border-white bg-blue-100 flex items-center justify-center relative z-20 shadow-sm text-blue-700 font-bold text-xs tracking-tighter">JR</div>
                      <div className="w-10 h-10 rounded-full border-2 border-white bg-amber-100 flex items-center justify-center relative z-10 shadow-sm text-amber-700 font-bold text-xs tracking-tighter">CV</div>
                    </div>
                    <div className="flex flex-col text-left">
                      <div className="flex items-center gap-0.5 mt-0.5">
                        {[1,2,3,4,5].map(i => <Star key={i} size={14} weight="fill" className="text-amber-500" />)}
                      </div>
                      <p className="text-xs mt-0.5"><strong className="text-gray-900">+500</strong> en lista</p>
                    </div>
                  </div>
                </>
              )}
            </motion.div>

            {/* Trust Badges moved inside the right column below mockup */}
          </motion.div>

          {/* Gerente de Proyecto PMI® Widget */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
            className="relative h-full flex flex-col"
          >
            <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-[0_20px_60px_rgba(0,0,0,0.08)] flex-1 flex flex-col">
              {/* Header con badge PMI® */}
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-gray-200 mb-3">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Según PMI®</span>
                </div>
                <h3 className="text-2xl font-black text-[#002650] mb-2">Gerente de Proyecto</h3>
                <p className="text-sm text-gray-500">De tu búsqueda laboral</p>
              </div>

              {/* Definición */}
              <div className="mb-8 pb-8 border-b border-gray-100">
                <p className="text-sm text-gray-600 leading-relaxed">
                  Un Gerente de Proyecto es quien <strong>planifica, ejecuta y controla</strong> un proyecto para alcanzar sus objetivos. Aplicado a tu carrera, <strong>TÚ eres ese gerente</strong>.
                </p>
              </div>

              {/* Grid 3x2 de beneficios */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                {[
                  { icon: MagnifyingGlass, label: 'Autodescubrimiento', desc: 'Conoce quién eres' },
                  { icon: ShieldCheck, label: 'Fortalezas', desc: 'Sabe en qué eres bueno' },
                  { icon: Target, label: 'Oferta de valor', desc: 'Descubre tu propuesta' },
                  { icon: Lightning, label: 'Herramientas', desc: 'Recursos optimizados' },
                  { icon: ChartBar, label: 'Seguimiento', desc: 'Control y visibilidad' },
                  { icon: CheckCircle, label: 'Tranquilidad', desc: 'Te guía en el proceso' }
                ].map((benefit, idx) => (
                  <div key={idx} className="flex flex-col items-center text-center p-4 rounded-2xl bg-white border border-gray-100 hover:border-[#002650]/20 hover:bg-slate-50/50 transition-all">
                    <benefit.icon size={24} weight="duotone" className="text-[#002650] mb-2" />
                    <p className="text-xs font-bold text-gray-900 mb-1">{benefit.label}</p>
                    <p className="text-[10px] text-gray-500">{benefit.desc}</p>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <button
                onClick={() => modoComercial
                  ? document.getElementById('contacto-comercial')?.scrollIntoView({ behavior: 'smooth' })
                  : navigate('/auth?register=true')}
                className="w-full flex items-center justify-center gap-2 bg-[#E8541A] hover:bg-[#d44813] text-white font-bold py-3.5 px-6 rounded-2xl transition-all shadow-md shadow-orange-500/10 mt-auto group"
              >
                {modoComercial ? 'Quiero más información' : 'Empezar gratis ahora'} <ArrowRight size={16} weight="bold" className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Trust Badges — debajo del widget */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5 p-4 rounded-2xl bg-white/60 backdrop-blur-sm border border-gray-200/60 shadow-sm hover:bg-white hover:border-gray-300 transition-all">
                 <MagnifyingGlass size={28} weight="duotone" className="text-teal-500 mb-1" />
                 <span className="text-sm font-black tracking-tight text-gray-900">Autodescubrimiento</span>
                 <span className="text-xs text-gray-500 leading-tight">Conoce quién eres y qué ofreces.</span>
              </div>
              <div className="flex flex-col gap-1.5 p-4 rounded-2xl bg-white/60 backdrop-blur-sm border border-gray-200/60 shadow-sm hover:bg-white hover:border-gray-300 transition-all">
                 <Kanban size={28} weight="duotone" className="text-amber-500 mb-1" />
                 <span className="text-sm font-black tracking-tight text-gray-900">Proceso Estructurado</span>
                 <span className="text-xs text-gray-500 leading-tight">De inicio a fin, como un proyecto real.</span>
              </div>
              <div className="flex flex-col gap-1.5 p-4 rounded-2xl bg-white/60 backdrop-blur-sm border border-gray-200/60 shadow-sm hover:bg-white hover:border-gray-300 transition-all">
                 <Target size={28} weight="duotone" className="text-blue-500 mb-1" />
                 <span className="text-sm font-black tracking-tight text-gray-900">Control Total</span>
                 <span className="text-xs text-gray-500 leading-tight">Tú decides el ritmo, nosotros te guiamos.</span>
              </div>
            </div>

          </motion.div>
        </div>
      </section>

      {/* ─── Stats Strip ────────────────────────────────────────────────────────── */}
      <section className="relative z-10 border-y border-gray-200 bg-white py-10">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-gray-200 text-center">
            {[
              { target: 75, suffix: '%', label: 'Tasa de rechazo inicial por filtros ATS sin optimizar' },
              { target: 3,  suffix: 'x', label: 'Mayor probabilidad de entrevista con un formato optimizado de clase mundial' },
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

      {/* ─── Seccion AI Bot 3D ───────────────────────────────────────────────────── */}
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
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 bg-gray-900/50">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-widest text-white">Desarrollada por expertos en atracción de talento</span>
            </div>
            
            <h2 className="font-headline font-black text-4xl md:text-5xl lg:text-6xl text-white tracking-tight leading-[1.1]">
              Conoce a <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">ELVIA</span>,<br />
              tu mentora 24/7.
            </h2>
            
            <p className="text-gray-400 text-lg md:text-xl leading-relaxed max-w-xl">
              Un asistente diseñado para acompañarte en tu proceso, a tu ritmo, con respuestas claras y sencillas de entender, para guiarte hacia los mejores resultados posibles.
            </p>

            <ul className="space-y-4 text-gray-300 font-medium">
              {[
                'Preguntas sobre el uso del sistema',
                'Principales competencias',
                'Motivación y mucho más',
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
                    <div className="w-12 h-12 rounded-full bg-[#0A3D2A] shadow-lg overflow-hidden flex items-center justify-center border border-teal-400/40">
                      <img src="/LOGOS/ELVIA_logo_fondo_transparente.png" alt="ELVIA" className="w-full h-full object-contain p-1.5" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-lg leading-none">ELVIA</h4>
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

                  <div className="bg-white/10 border border-white/5 p-3 px-4 rounded-2xl rounded-tl-sm flex items-center min-h-[40px]">
                    <span className="flex gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce" />
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '300ms' }} />
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

      {/* ─── Seccion Demo Interactive (Curiosity Gap Widget) ────────────────────── */}
      <section ref={demoSectionRef} className="relative z-10 py-24 px-6 bg-slate-50 border-t border-gray-200" id="simulador">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <span className="text-[#E8541A] font-bold text-sm tracking-widest uppercase mb-2 block">Simulador en tiempo real</span>
            <h2 className="font-headline font-black text-4xl md:text-5xl text-gray-900 mb-4 tracking-tight">Prueba la magia gratis.<br className="hidden md:block"/> Sin registrarte.</h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">Con solo la descripción de una vacante real, ELVIA evalúa ajustes a tu perfil, siempre basado en tu información de autoconocimiento, nunca inventando nada.</p>
          </div>
          
          <div className="bg-white rounded-[2rem] shadow-2xl shadow-blue-900/5 border border-gray-200 p-6 md:p-10 relative overflow-hidden">
            {/* Widget Interactive component */}
            <div className="space-y-8 relative z-10">
               <div>
                  <h3 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-black">1</div> Tu Experiencia (Simulado)</h3>
                  <div className="w-full bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex items-center gap-4 hover:border-blue-200 transition-colors">
                     <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
                       <FileMagnifyingGlass size={24} className="text-white" weight="duotone" />
                     </div>
                     <div>
                       <p className="text-sm font-bold text-blue-950">TU CV Optimizado con ELVIA</p>
                       <p className="text-xs text-blue-700 font-medium">Perfil intermedio precargado para esta demostración</p>
                     </div>
                  </div>
               </div>
               
               <div>
                  <h3 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-black">2</div>
                    Descripción del cargo (Simulado)
                    {!demoTypingDone && demoText.length > 0 && (
                      <span className="ml-auto text-xs text-teal-500 font-semibold flex items-center gap-1.5">
                        <span className="inline-block w-1.5 h-3.5 bg-teal-500 rounded-sm animate-pulse" />
                        Escribiendo...
                      </span>
                    )}
                    {demoTypingDone && (
                      <span className="ml-auto text-xs text-emerald-600 font-semibold">✓ Listo — ¡Haz clic abajo!</span>
                    )}
                  </h3>
                  <div className="relative">
                    <textarea
                       readOnly
                       value={demoText}
                       rows="5"
                       className={`w-full border-2 rounded-2xl px-5 py-4 text-sm focus:outline-none resize-none transition-all duration-500 ${
                         demoTypingDone
                           ? 'border-teal-400 bg-teal-50/40 text-gray-700'
                           : 'border-gray-200 bg-gray-50/70 text-gray-600'
                       }`}
                       placeholder="Cargando descripción de cargo simulada..."
                    />
                    {!demoTypingDone && demoText.length > 0 && (
                      <span className="absolute bottom-4 right-5 inline-block w-0.5 h-4 bg-gray-500 animate-pulse" />
                    )}
                  </div>
                  <p className="mt-2 text-xs text-gray-400 italic flex items-center gap-1.5">
                    <span className="inline-flex text-[10px] bg-gray-100 text-gray-500 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">Demo</span>
                    Información ficticia utilizada únicamente para esta simulación. No representa una vacante real.
                  </p>
               </div>
               
               <button 
                  onClick={handleDemoSubmit}
                  disabled={demoText.trim().length < 15 || demoLoading || showDemoOverlay}
                  className={`w-full text-white font-bold text-lg py-5 rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-xl focus:ring-4 focus:ring-gray-900/20 ${
                    demoTypingDone 
                      ? 'bg-[#E8541A] hover:bg-[#E8541A]/90 shadow-[#E8541A]/40 animate-bounce-subtle' 
                      : 'bg-gray-900 hover:bg-gray-800 shadow-gray-900/10'
                  }`}
               >
                  {demoLoading ? <span className="animate-spin rounded-full border-2 border-white/20 border-t-white w-5 h-5" /> : <MagnifyingGlass size={22} weight="bold" />}
                  {demoLoadingText}
               </button>
            </div>

            {/* Auth Wall Overlay (Hidden by default) */}
            {showDemoOverlay && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/70 backdrop-blur-md p-6 animate-fade-in">
                <div className="bg-white p-8 md:p-10 rounded-3xl shadow-2xl max-w-md w-full border border-gray-100 ring-4 ring-gray-50 text-center relative pointer-events-auto transform transition-all duration-500 ease-out translate-y-0 opacity-100">
                  <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-600 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-green-500/30 ring-8 ring-green-50">
                    <span className="text-4xl font-black">82%</span>
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">¡Tienes un buen perfil!</h3>
                  <p className="text-gray-500 mb-2 text-sm leading-relaxed mx-auto px-2">
                    ELVIA detectó que tu perfil es sólido, aunque puedes incluir <b>4 palabras clave obligatorias</b> para ser más atractivo a esta vacante.
                  </p>
                  <p className="text-gray-400 mb-8 text-xs italic mx-auto px-2">
                    Este es un ejemplo — para tener esta funcionalidad, regístrate.
                  </p>
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => modoComercial
                        ? document.getElementById('contacto-comercial')?.scrollIntoView({ behavior: 'smooth' })
                        : navigate('/auth?register=true')}
                      className="w-full bg-[#1A91F0] text-white font-bold py-4 px-6 rounded-2xl hover:bg-blue-600 hover:shadow-lg transition-all shadow-md focus:ring-4 focus:ring-blue-500/20"
                    >
                      {modoComercial ? 'Quiero más información' : 'Empezar gratis ahora'}
                    </button>
                    <p className="text-xs text-gray-400 mt-2 font-medium">
                      {modoComercial ? 'Cuéntanos sobre tu equipo y te contactamos.' : 'Descubre tu análisis completo. 100% Gratis.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
          </div>
        </div>
      </section>

      {/* ─── Features Bento Grid ────────────────────────────────────────────────── */}
      <section id="features-section" className="relative z-10 py-24 px-6 bg-slate-50">
        <div className="container mx-auto max-w-6xl">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-14 space-y-3"
          >
            <span className="text-[#E8541A] font-bold text-sm tracking-widest uppercase">Tu sistema completo</span>
            <h2 className="font-headline font-black text-4xl md:text-5xl tracking-tight text-gray-900">
              Desde autoconocimiento a Oferta.<br className="hidden md:block" /> Todo en un solo lugar.
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              Herramientas de alto valor, gestión de candidaturas y mentores reales — diseñados para que consigas el trabajo que mereces.
            </p>
          </motion.div>

          {/* Mobile: lista */}
          <div className="md:hidden space-y-3 mb-4">
            <div className="rounded-2xl border-2 border-blue-400 bg-gradient-to-br from-blue-50 to-white p-6 shadow-lg shadow-blue-200/30">
              <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 border border-blue-200 mb-4">
                <span className="text-xs font-bold text-blue-700 uppercase tracking-widest">Centro del sistema</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-3">
                <UsersThree size={24} weight="duotone" className="text-blue-600" />
              </div>
              <h3 className="font-bold text-xl text-blue-900 mb-1">Autoconocimiento</h3>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 mb-3">Tu primer paso</p>
              <p className="text-sm text-blue-700 leading-relaxed">Un onboarding para que conozcas tu momento actual y hacia donde quieres ir. Prepárate para tu transición profesional.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { Icon: FileMagnifyingGlass, titulo: 'Optimizador de CV',    iconBg: 'bg-orange-100', iconColor: 'text-[#E8541A]' },
                { Icon: LinkedinLogo,        titulo: 'LinkedIn® Optimizado', iconBg: 'bg-blue-100',   iconColor: 'text-blue-600'  },
                { Icon: MagnifyingGlass,     titulo: 'CV vs Vacante',        iconBg: 'bg-amber-100',  iconColor: 'text-amber-600' },
                { Icon: BookmarkSimple,      titulo: 'Mis Vacantes',         iconBg: 'bg-teal-100',   iconColor: 'text-teal-600'  },
                { Icon: Kanban,              titulo: 'Pipeline',             iconBg: 'bg-teal-100',   iconColor: 'text-teal-600'  },
                { Icon: MicrophoneStage,     titulo: 'Entrevista',           iconBg: 'bg-purple-100', iconColor: 'text-purple-600'},
                { Icon: Books,              titulo: 'Biblioteca',           iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600'},
                { Icon: ChartBar,            titulo: 'Bienestar',            iconBg: 'bg-green-100',  iconColor: 'text-green-600' },
              ].map(item => (
                <div key={item.titulo} className="rounded-2xl border border-gray-200 bg-white p-4 hover:shadow-md transition-shadow">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${item.iconBg} ${item.iconColor}`}>
                    <item.Icon size={20} weight="duotone" />
                  </div>
                  <h4 className="font-bold text-sm text-gray-900 leading-tight">{item.titulo}</h4>
                </div>
              ))}
            </div>
          </div>

          {/* Desktop: círculo orbital */}
          <div className="hidden md:block relative mx-auto mb-4" style={{ maxWidth: '700px', height: '700px' }}>
            {/* Anillo de órbita */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-gray-200 pointer-events-none"
              style={{ width: '580px', height: '580px' }}
            />

            {/* Centro: Autoconocimiento */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20" style={{ width: '160px' }}>
              <div className="rounded-2xl border-2 border-blue-400 bg-gradient-to-br from-blue-50 to-white p-5 shadow-xl shadow-blue-200/40 text-center">
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 border border-blue-200 mb-3">
                  <span className="text-[9px] font-bold text-blue-700 uppercase tracking-widest">Centro</span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mx-auto mb-3">
                  <UsersThree size={24} weight="duotone" className="text-blue-600" />
                </div>
                <h3 className="font-bold text-sm text-blue-900 leading-tight">Autoconocimiento</h3>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-600 mt-1">Tu primer paso</p>
              </div>
            </div>

            {/* Ítems orbitales — 8 en círculo, sentido horario desde arriba */}
            {[
              { Icon: FileMagnifyingGlass, titulo: 'Optimizador de CV',    iconBg: 'bg-orange-100', iconColor: 'text-[#E8541A]' },
              { Icon: LinkedinLogo,        titulo: 'LinkedIn® Optimizado', iconBg: 'bg-blue-100',   iconColor: 'text-blue-600'  },
              { Icon: MagnifyingGlass,     titulo: 'CV vs Vacante',        iconBg: 'bg-amber-100',  iconColor: 'text-amber-600' },
              { Icon: BookmarkSimple,      titulo: 'Mis Vacantes',         iconBg: 'bg-teal-100',   iconColor: 'text-teal-600'  },
              { Icon: Kanban,              titulo: 'Pipeline',             iconBg: 'bg-teal-100',   iconColor: 'text-teal-600'  },
              { Icon: MicrophoneStage,     titulo: 'Entrevista',           iconBg: 'bg-purple-100', iconColor: 'text-purple-600'},
              { Icon: Books,              titulo: 'Biblioteca',           iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600'},
              { Icon: ChartBar,            titulo: 'Bienestar',            iconBg: 'bg-green-100',  iconColor: 'text-green-600' },
            ].map((item, i) => {
              const angleDeg = -90 + i * 45
              const angleRad = angleDeg * Math.PI / 180
              const r = 41.5
              const x = 50 + r * Math.cos(angleRad)
              const y = 50 + r * Math.sin(angleRad)
              return (
                <div
                  key={item.titulo}
                  className="absolute z-10"
                  style={{ top: `${y}%`, left: `${x}%`, transform: 'translate(-50%, -50%)', width: '116px' }}
                >
                  <motion.div
                    whileHover={{ y: -4, boxShadow: '0 12px 24px -6px rgba(0,0,0,0.12)' }}
                    transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                    className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm text-center cursor-default"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2 ${item.iconBg} ${item.iconColor}`}>
                      <item.Icon size={20} weight="duotone" />
                    </div>
                    <h4 className="font-bold text-xs text-gray-900 leading-tight">{item.titulo}</h4>
                  </motion.div>
                </div>
              )
            })}
          </div>

          {/* ─── Fila 4: Mentor Experto ─── card premium full-width ─── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            whileHover={{ y: -4, boxShadow: '0 30px 60px -15px rgba(0,0,0,0.35)' }}
            transition={{ type: 'spring', stiffness: 280, damping: 24 }}
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-[#002650] border border-slate-700/50"
          >
            {/* Glow sutil en hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            {/* Patrón de fondo decorativo */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/[0.03] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/[0.02] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />

            <div className="relative z-10 p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {/* Icono */}
              <div
                className="rounded-2xl flex items-center justify-center shrink-0 border border-teal-400/30 group-hover:border-teal-300/60 transition-colors duration-300"
                style={{ width: 72, height: 72, background: 'linear-gradient(135deg, rgba(20,184,166,0.3) 0%, rgba(13,148,136,0.15) 100%)' }}
              >
                <UsersThree size={40} weight="fill" className="text-teal-200 group-hover:text-white transition-colors duration-300" />
              </div>

              {/* Texto */}
              <div className="flex-1">
                <span className="text-sm font-black uppercase tracking-[0.2em] text-white mb-2 block">Hablemos</span>
                <h3 className="font-headline font-black text-2xl text-white mb-2">
                  Mentor Experto — cuando la IA no es suficiente
                </h3>
                <p className="text-white/55 text-sm leading-relaxed max-w-xl group-hover:text-white/75 transition-colors duration-300">
                  Orientación personalizada, feedback honesto y el impulso que solo un humano puede darte.
                </p>
              </div>

              {/* CTA */}
              <div
                className="flex items-center gap-2.5 text-white/50 font-bold text-sm shrink-0 bg-white/5 px-6 py-3.5 rounded-xl border border-white/5 whitespace-nowrap cursor-default">
                Próximamente
              </div>
            </div>
          </motion.div>

        </div>
      </section>


      {/* ─── Banner de Estadísticas Premium ─────────────────────────────────────── */}
      <section className="relative z-10 py-24 px-6 bg-[#0a0f16] border-y border-white/[0.05] overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-teal-500/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="container mx-auto max-w-6xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center justify-center gap-3 mb-6 px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.08] backdrop-blur-md">
               <span className="w-1.5 h-1.5 rounded-full bg-teal-400 font-bold" />
               <h2 className="text-white/70 text-xs font-bold uppercase tracking-[0.2em]">Impacto medible</h2>
            </div>
            <h3 className="font-headline font-black text-3xl md:text-5xl text-white tracking-tight">
              Los datos hablan por sí solos
            </h3>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-0 relative">
            <div className="hidden md:block absolute top-[40%] left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            
            {[
              {
                stat: '3x',
                title: 'Velocidad de contratación',
                desc: 'Al tener una estrategia clara antes de aplicar, triplicas tu probabilidad de encontrar el trabajo ideal.',
                Icon: Target,
                glowClass: 'bg-teal-500/20',
                boxClass: 'from-teal-500/10 to-teal-500/5 border-teal-500/20',
                iconClass: 'text-teal-400'
              },
              {
                stat: '65%',
                title: 'Match con vacantes',
                desc: 'Cuando alineas tu propuesta de valor, tu compatibilidad con el mercado laboral aumenta dramáticamente.',
                Icon: TrendUp,
                glowClass: 'bg-blue-500/20',
                boxClass: 'from-blue-500/10 to-blue-500/5 border-blue-500/20',
                iconClass: 'text-blue-400'
              },
              {
                stat: '40%',
                title: 'Entrevistas conseguidas',
                desc: 'Al optimizar tu perfil para sistemas ATS, incrementas sustancialmente tu paso al primer filtro humano.',
                Icon: RocketLaunch,
                glowClass: 'bg-emerald-500/20',
                boxClass: 'from-emerald-500/10 to-emerald-500/5 border-emerald-500/20',
                iconClass: 'text-emerald-400'
              }
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: idx * 0.15 }}
                className="relative flex flex-col items-center text-center p-4 md:p-12 group"
              >
                {/* Separador vertical entre columnas */}
                {idx !== 2 && (
                  <div className="hidden md:block absolute top-[10%] right-0 w-[1px] h-[80%] bg-gradient-to-b from-transparent via-white/10 to-transparent" />
                )}

                {/* Icon Wrapper con Glow Soft */}
                <div className="relative mb-8 flex items-center justify-center w-16 h-16 transition-transform duration-500 group-hover:-translate-y-2">
                   <div className={`absolute inset-0 ${item.glowClass} blur-[20px] rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-500`} />
                   <div className={`relative flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${item.boxClass} border backdrop-blur-md shadow-inner`}>
                     <item.Icon size={28} weight="duotone" className={item.iconClass} />
                   </div>
                </div>

                {/* Número Grande Premium */}
                <div className="text-6xl md:text-7xl font-black mb-4 tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40 drop-shadow-sm group-hover:scale-105 transition-transform duration-500">
                  {item.stat}
                </div>

                <h4 className="text-white font-bold text-lg mb-3 tracking-wide">{item.title}</h4>
                <p className="text-white/50 text-sm leading-relaxed max-w-[260px] mx-auto group-hover:text-white/70 transition-colors">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Showcase: Herramientas en Acción ────────────────────────────────────── */}
      <section className="relative z-10 py-20 px-6 bg-white border-b border-gray-200">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-16 space-y-3"
          >
            <span className="text-[#E8541A] font-bold text-sm tracking-widest uppercase">En tiempo real</span>
            <h2 className="font-headline font-black text-4xl md:text-5xl tracking-tight text-gray-900">
              Herramientas en acción
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              Nuestro sistema analiza cada sección de tu CV en tiempo real, recomendándote mejoras basadas en mejores prácticas del mercado laboral.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: Contextual Text */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ type: 'spring', stiffness: 280, damping: 24 }}
              className="space-y-6"
            >
              <div className="space-y-4">
                <h3 className="font-headline font-bold text-2xl text-gray-900">Optimización en cada paso</h3>
                <p className="text-gray-600 leading-relaxed">
                  Partiendo de tu AUTOCONOCIMIENTO y mientras editas tu CV, ELVIA analiza cada sección: desde tu titular y resumen profesional, hasta tus experiencias y logros.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center shrink-0 mt-1">
                    <Check size={20} weight="bold" className="text-teal-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Análisis Inteligente</h4>
                    <p className="text-sm text-gray-600">Usa tu propia información que registras para crear tu perfil y no solo eso, tiene en cuenta tu OFERTA DE VALOR para el mercado.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center shrink-0 mt-1">
                    <Check size={20} weight="bold" className="text-teal-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Recomendaciones Accionables</h4>
                    <p className="text-sm text-gray-600">Sugerencias concretas para mejorar cada sección de tu perfil</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center shrink-0 mt-1">
                    <Check size={20} weight="bold" className="text-teal-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Seguimiento en Tiempo Real</h4>
                    <p className="text-sm text-gray-600">Puedes guardar tus reportes y volverlos a ver, un sistema dinámico que te permite aprender de ti constantemente.</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right: Optimization Widget (Simplified) */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ type: 'spring', stiffness: 280, damping: 24 }}
              className="relative"
            >
              <div className="bg-white border-2 border-gray-200 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-shadow duration-300">
                {/* Header */}
                <div className="mb-8">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 mb-3">
                    <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                    <span className="text-xs font-bold text-teal-700 uppercase tracking-wide">Análisis en vivo</span>
                  </div>
                  <h3 className="font-headline font-bold text-xl text-gray-900">Nivel de Optimización</h3>
                  <p className="text-sm text-gray-500 mt-1">Tu score de compatibilidad</p>
                </div>

                {/* Main Score */}
                <div className="mb-8 text-center">
                  <div className="inline-flex flex-col items-center gap-4">
                    <div className="relative w-32 h-32">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        {/* Background circle */}
                        <circle cx="50" cy="50" r="45" fill="none" stroke="#f3f4f6" strokeWidth="8" />
                        {/* Progress circle */}
                        <circle
                          cx="50"
                          cy="50"
                          r="45"
                          fill="none"
                          stroke="url(#scoreGradient)"
                          strokeWidth="8"
                          strokeDasharray="141"
                          strokeDashoffset="35"
                          strokeLinecap="round"
                          className="transition-all duration-500"
                        />
                        <defs>
                          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#14b8a6" />
                            <stop offset="100%" stopColor="#06b6d4" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-cyan-600">
                          78%
                        </span>
                        <span className="text-xs text-gray-500 font-semibold mt-1">Muy bien</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Score Breakdown */}
                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-700 font-semibold">Titular</span>
                      <span className="text-teal-600 font-bold">92%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-gradient-to-r from-teal-500 to-cyan-500 h-2 rounded-full" style={{ width: '92%' }} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-700 font-semibold">Experiencia</span>
                      <span className="text-teal-600 font-bold">78%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-gradient-to-r from-teal-500 to-cyan-500 h-2 rounded-full" style={{ width: '78%' }} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-700 font-semibold">Habilidades</span>
                      <span className="text-teal-600 font-bold">65%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-gradient-to-r from-teal-500 to-cyan-500 h-2 rounded-full" style={{ width: '65%' }} />
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <button
                  onClick={() => modoComercial
                    ? document.getElementById('contacto-comercial')?.scrollIntoView({ behavior: 'smooth' })
                    : navigate('/auth?register=true')}
                  className="w-full mt-8 bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-teal-500/20"
                >
                  {modoComercial ? 'Quiero más información' : 'Comenzar análisis gratuito'}
                </button>
              </div>

              {/* Floating accent */}
              <motion.div
                animate={{ y: [0, 12, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="absolute -bottom-4 -right-4 w-24 h-24 bg-teal-100/40 rounded-full blur-3xl pointer-events-none"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── Formulario contacto comercial (solo modoComercial) ───────────────────────── */}
      {modoComercial && (
        <section id="contacto-comercial" className="relative z-10 py-20 px-6 border-t border-gray-200 bg-gradient-to-b from-slate-50 to-white">
          <div className="container mx-auto max-w-3xl">
            <div className="text-center mb-10">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#E8541A] mb-3">¿Tu empresa necesita ELVIA?</p>
              <h2 className="font-headline font-black text-4xl md:text-5xl text-[#002650] mb-4">
                Cuéntanos sobre tu equipo
              </h2>
              <p className="text-gray-600 text-lg max-w-xl mx-auto">
                Acompañamos a empresas en transiciones, outplacement y desarrollo de carrera. Déjanos tus datos y te contactamos en 24h.
              </p>
            </div>

            {contactoEnviado ? (
              <div className="bg-emerald-50 border-2 border-emerald-200 rounded-3xl p-10 text-center">
                <CheckCircle size={56} weight="duotone" className="text-emerald-500 mx-auto mb-4" />
                <h3 className="text-2xl font-black text-emerald-900 mb-2">¡Recibimos tu mensaje!</h3>
                <p className="text-emerald-700">
                  Nuestro equipo comercial te contactará en menos de 24 horas hábiles.
                </p>
              </div>
            ) : (
              <form onSubmit={enviarContactoComercial} className="bg-white border border-gray-200 rounded-3xl p-8 md:p-10 shadow-xl shadow-gray-200/50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Nombre completo *</label>
                    <input type="text" required value={contactoForm.nombre}
                      onChange={e => setContactoForm({...contactoForm, nombre: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E8541A]/30 focus:border-[#E8541A] transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Empresa *</label>
                    <input type="text" required value={contactoForm.empresa}
                      onChange={e => setContactoForm({...contactoForm, empresa: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E8541A]/30 focus:border-[#E8541A] transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Email corporativo *</label>
                    <input type="email" required value={contactoForm.email}
                      onChange={e => setContactoForm({...contactoForm, email: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E8541A]/30 focus:border-[#E8541A] transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Teléfono (opcional)</label>
                    <input type="tel" value={contactoForm.telefono}
                      onChange={e => setContactoForm({...contactoForm, telefono: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E8541A]/30 focus:border-[#E8541A] transition-all" />
                  </div>
                </div>
                <div className="mt-5">
                  <label className="block text-sm font-bold text-gray-700 mb-2">¿Cuéntanos un poco sobre tu necesidad? (opcional)</label>
                  <textarea rows="4" value={contactoForm.mensaje}
                    onChange={e => setContactoForm({...contactoForm, mensaje: e.target.value})}
                    placeholder="Ej: Estamos planeando un proceso de outplacement para 50 colaboradores..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E8541A]/30 focus:border-[#E8541A] transition-all resize-none" />
                </div>

                {contactoError && (
                  <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700">
                    {contactoError}
                  </div>
                )}

                <button type="submit" disabled={contactoEnviando}
                  className="w-full mt-6 bg-[#E8541A] hover:bg-[#E8541A]/90 text-white font-bold text-lg py-4 rounded-2xl transition-all shadow-md shadow-orange-500/20 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {contactoEnviando ? (
                    <><span className="animate-spin rounded-full border-2 border-white/20 border-t-white w-5 h-5" /> Enviando…</>
                  ) : (
                    <>Enviar solicitud <ArrowRight size={18} weight="bold" /></>
                  )}
                </button>

                <p className="text-xs text-gray-400 text-center mt-4">
                  O escríbenos directamente a <a href="mailto:comercial@elvia.lat" className="text-[#E8541A] font-bold hover:underline">comercial@elvia.lat</a>
                </p>
              </form>
            )}
          </div>
        </section>
      )}

      {/* ─── CTA Final Post-Lanzamiento ──────────────────────────────────────────────────────────── */}
      <section className="relative z-10 py-24 px-6 border-t border-gray-200 bg-white">
        <motion.div
           initial={{ opacity: 0, scale: 0.95 }}
           whileInView={{ opacity: 1, scale: 1 }}
           viewport={{ once: true }}
           className="container mx-auto max-w-5xl bg-[#090E17] rounded-[3rem] p-10 md:p-20 shadow-[-10px_-10px_30px_4px_rgba(0,0,0,0.1),_10px_10px_30px_4px_rgba(45,78,255,0.15)] relative overflow-hidden flex flex-col items-center text-center border border-white/10"
        >
          {/* Background Glows */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-64 bg-teal-500/20 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md h-48 bg-blue-600/20 blur-[100px] rounded-full pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[length:24px_24px] pointer-events-none" />

          {/* Icon/Logo */}
          <div className="relative inline-block mb-10">
            <div className="absolute inset-0 bg-teal-400/20 blur-2xl rounded-full" />
            {/* Logo removido temporalmente */}
            <div className="absolute bottom-0 -right-2 bg-gradient-to-br from-[#E8541A] to-orange-600 text-white p-2.5 rounded-2xl shadow-xl shadow-orange-500/20 border border-white/10">
              <Lightning size={24} weight="fill" />
            </div>
          </div>

          <h2 className="font-headline font-black text-4xl md:text-6xl tracking-tight text-white mb-6">
            Tu futuro gerente de<br className="hidden md:block" /> proyecto te espera
          </h2>
          <p className="text-gray-400 text-lg md:text-xl max-w-3xl mb-8 font-medium">
            Únete a cientos de profesionales que ya están haciendo el ejercicio de autoconocerse, optimizando su carrera y obteniendo las herramientas necesarias para su transición de carrera.
          </p>

          <div className="flex flex-col items-center gap-4 mb-12">
             <div className="flex -space-x-2">
               <div className="w-10 h-10 rounded-full border-2 border-[#090E17] bg-[#CCFBF1] text-[#115E59] flex items-center justify-center text-[11px] font-black shadow-lg">AM</div>
               <div className="w-10 h-10 rounded-full border-2 border-[#090E17] bg-[#DBEAFE] text-[#1E40AF] flex items-center justify-center text-[11px] font-black shadow-lg">JR</div>
               <div className="w-10 h-10 rounded-full border-2 border-[#090E17] bg-[#FEF3C7] text-[#92400E] flex items-center justify-center text-[11px] font-black shadow-lg">CV</div>
             </div>
             <div className="flex items-center gap-4">
                <div className="flex items-center gap-0.5">
                   {[1,2,3,4,5].map(i => <Star key={i} size={16} weight="fill" className="text-amber-400" />)}
                </div>
                <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">+500 en lista</span>
             </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto z-10">
            <button
              onClick={() => modoComercial
                ? document.getElementById('contacto-comercial')?.scrollIntoView({ behavior: 'smooth' })
                : navigate('/auth?register=true')}
              className="w-full sm:w-auto bg-[#E8541A] hover:bg-[#E8541A]/90 text-white font-bold text-lg px-10 py-5 rounded-2xl transition-all shadow-[0_0_30px_rgba(232,84,26,0.3)] hover:shadow-[0_0_30px_rgba(232,84,26,0.5)] flex items-center justify-center gap-3 group"
            >
              {modoComercial ? 'Solicitar información ahora' : 'Crear mi cuenta gratis ahora'}
              <ArrowRight size={20} weight="bold" className="group-hover:translate-x-1 transition-transform" />
            </button>
            {modoComercial && (
              <button
                onClick={() => navigate('/auth')}
                className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white font-bold text-lg px-10 py-5 rounded-2xl transition-all border border-white/20 flex items-center justify-center gap-3"
              >
                Ya tengo cuenta · Iniciar sesión
              </button>
            )}
          </div>

          {!modoComercial && (
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm font-semibold tracking-wide text-gray-500 z-10">
              <span className="flex items-center gap-2 text-center sm:text-left"><CheckCircle size={18} weight="fill" className="text-teal-500" /> Sin tarjeta de crédito para la prueba de 7 días</span>
              <span className="flex items-center gap-2 text-center sm:text-left"><CheckCircle size={18} weight="fill" className="text-teal-500" /> Funcionalidades gratis</span>
            </div>
          )}
        </motion.div>
      </section>

      {/* ─── Footer Minimalista ───────────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-gray-100 bg-white">
        <div className="container mx-auto max-w-6xl px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col items-center md:items-start gap-4">
            <Link to="/">
              <img src="/LOGOS/ELVIA_logo_fondo_transparente.png" alt="ELVIA" className="h-10 w-auto opacity-90" />
            </Link>
            <p className="text-gray-400 text-xs font-medium uppercase tracking-widest text-center md:text-left">
              <span style={{ color: '#0D9488' }}>CONECTA</span> TU PRESENTE CON EL FUTURO QUE QUIERES.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-8">
            <Link to="/privacidad" className="text-sm font-bold text-gray-500 hover:text-teal-600 transition-colors">Privacidad</Link>
            <span className="text-gray-200 hidden sm:block">|</span>
            <span className="text-sm font-bold text-gray-500">© {new Date().getFullYear()} ELVIA</span>
          </div>
        </div>
      </footer>

      {/* Sticky CTA (Mobile/Desktop) — oculto en modo comercial */}
      <AnimatePresence>
        {!user && showStickyCTA && !modoComercial && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed bottom-0 left-0 right-0 z-[100] p-4 sm:p-6 sm:left-auto sm:right-6 sm:bottom-6 sm:w-auto pointer-events-none"
          >
            <div className="pointer-events-auto bg-gray-900/95 backdrop-blur-xl border border-white/10 p-4 sm:p-5 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center justify-between sm:justify-start gap-4 sm:gap-6 min-w-full sm:min-w-[400px]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-black text-teal-400 border border-white/10 shrink-0">
                  EL
                </div>
                <div>
                  <p className="text-white font-bold text-sm sm:text-base leading-tight">Optimiza tu carrera con ELVIA</p>
                  <p className="text-gray-400 text-xs sm:text-sm">Únete a los +500 profesionales</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/auth?register=true')}
                className="bg-[#E8541A] hover:bg-[#E8541A]/90 text-white font-bold text-sm sm:text-base px-5 sm:px-8 py-3 sm:py-3.5 rounded-xl shadow-[0_0_20px_rgba(232,84,26,0.3)] transition-all active:scale-95 shrink-0"
              >
                Empezar gratis
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
