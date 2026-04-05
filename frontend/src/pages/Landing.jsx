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
      subtitulo: 'Tu primer paso como gerente',
      desc: 'Un onboarding para que conozcas tu momento actual y hacia donde quieres ir. Preparate para ser gerente de proyecto de tu transicion profesional.',
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
      cta: 'Próximamente',
      upcoming: true,
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
      titulo: 'LinkedIn Optimo',
      desc: 'Tu perfil optimizado para aparecer cuando los recruiters que importan están buscando.',
      cta: 'Próximamente',
      upcoming: true,
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

// ─── Catálogo de países — valor ES, código IP en inglés, indicativo ────────────
const PAISES = [
  { value: 'Colombia',    ipName: 'Colombia',     code: '+57'  },
  { value: 'México',      ipName: 'Mexico',        code: '+52'  },
  { value: 'Argentina',   ipName: 'Argentina',     code: '+54'  },
  { value: 'Chile',       ipName: 'Chile',         code: '+56'  },
  { value: 'Perú',        ipName: 'Peru',          code: '+51'  },
  { value: 'Ecuador',     ipName: 'Ecuador',       code: '+593' },
  { value: 'Venezuela',   ipName: 'Venezuela',     code: '+58'  },
  { value: 'Bolivia',     ipName: 'Bolivia',       code: '+591' },
  { value: 'Paraguay',    ipName: 'Paraguay',      code: '+595' },
  { value: 'Uruguay',     ipName: 'Uruguay',       code: '+598' },
  { value: 'Costa Rica',  ipName: 'Costa Rica',    code: '+506' },
  { value: 'Guatemala',   ipName: 'Guatemala',     code: '+502' },
  { value: 'Honduras',    ipName: 'Honduras',      code: '+504' },
  { value: 'Panamá',      ipName: 'Panama',        code: '+507' },
  { value: 'España',      ipName: 'Spain',         code: '+34'  },
  { value: 'Estados Unidos', ipName: 'United States', code: '+1' },
  { value: 'Otro',        ipName: '',              code: ''     },
]

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
export default function Landing() {
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

  // --- Waitlist State ---
  const [waitlistForm, setWaitlistForm] = useState({ nombre: '', apellido: '', indicativo: '', telefono: '', pais: '', email: '', situacion: '', aceptaPrivacidad: false })
  const [waitlistStatus, setWaitlistStatus] = useState({ loading: false, success: false, error: null })

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

    // Detección de país por idioma del navegador (sin llamadas a API externas)
    const lang = (navigator.language || 'es-CO').toLowerCase()
    let defaultCountry = 'Colombia' // fallback
    if (lang.includes('es-mx') || lang.includes('mx')) defaultCountry = 'México'
    else if (lang.includes('es-ar') || lang.includes('ar')) defaultCountry = 'Argentina'
    else if (lang.includes('es-cl') || lang.includes('cl')) defaultCountry = 'Chile'
    else if (lang.includes('en')) defaultCountry = 'USA'

    const pais = PAISES.find(p => p.value === defaultCountry) || PAISES[0]
    setWaitlistForm(f => ({ ...f, pais: pais.value, indicativo: pais.code }))
  }, [])
  
  const handleWaitlistSubmit = async (e) => {
    e.preventDefault()

    // Validación cliente
    if (!waitlistForm.nombre || waitlistForm.nombre.length < 2) {
      setWaitlistStatus({ loading: false, success: false, error: 'El nombre debe tener mínimo 2 caracteres' })
      return
    }
    if (!waitlistForm.apellido || waitlistForm.apellido.length < 2) {
      setWaitlistStatus({ loading: false, success: false, error: 'El apellido debe tener mínimo 2 caracteres' })
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(waitlistForm.email)) {
      setWaitlistStatus({ loading: false, success: false, error: 'Por favor ingresa un email válido' })
      return
    }

    setWaitlistStatus({ loading: true, success: false, error: null })
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      const res = await fetch(`${API_URL}/api/waitlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(waitlistForm)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al registrarte en la lista de espera')
      
      // Analytics: Registro exitoso
      fetch(`${API_URL}/api/events/track`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ event_name: 'waitlist_success', metadata: { situacion: waitlistForm.situacion } })
      }).catch(() => {})

      setWaitlistStatus({ loading: false, success: true, error: null })
      setWaitlistForm({ nombre: '', apellido: '', indicativo: '', telefono: '', pais: '', email: '', situacion: '', aceptaPrivacidad: false })
    } catch (err) {
      setWaitlistStatus({ loading: false, success: false, error: err.message })
    }
  }


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
          <img src="/elvia-logo-transparent.png" alt="ELVIA" className="h-10 py-1 w-auto object-contain" />
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
              <button onClick={() => { setShowDemoOverlay(false); setTimeout(() => document.getElementById('waitlist-form-bottom')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 150) }}
                className="flex items-center gap-2 bg-gray-900 text-white font-bold text-sm px-6 py-2.5 rounded-xl hover:bg-gray-800 transition-all shadow-md">
                Únete a la Lista de Espera apuntándote aquí
              </button>
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
              <span
                style={{
                  background: 'linear-gradient(to right, rgb(13, 148, 136), rgb(16, 185, 129), rgb(59, 130, 246))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  display: 'inline-block'
                }}
              >
                de tu búsqueda laboral
              </span>
            </motion.h1>

            <motion.p variants={fadeInUp} className="text-lg sm:text-xl text-gray-500 leading-relaxed mb-10 max-w-lg">
              Encuentra tu propósito y ten las herramientas necesarias para encontrar tu siguiente proyecto laboral y profesional.
            </motion.p>

            <motion.div variants={fadeInUp} className="mt-8 flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <div
                className="bg-[#E8541A] text-white font-black py-4 px-8 rounded-2xl text-lg transition-all shadow-[0_8px_30px_rgb(232,84,26,0.3)] hover:shadow-[0_8px_30px_rgb(232,84,26,0.5)] flex items-center gap-2 group w-full sm:w-auto justify-center cursor-default"
              >
                Únete y sé pionero ELVIA
                <ArrowDown className="w-5 h-5 group-hover:translate-y-1 transition-transform" weight="bold" />
              </div>
              
              <div className="flex items-center gap-3 text-sm text-gray-500 mt-2 sm:mt-0">
                <div className="flex -space-x-2">
                  <div className="w-10 h-10 rounded-full border-2 border-white bg-teal-100 flex items-center justify-center relative z-30 shadow-sm text-teal-700 font-bold text-xs tracking-tighter">AM</div>
                  <div className="w-10 h-10 rounded-full border-2 border-white bg-blue-100 flex items-center justify-center relative z-20 shadow-sm text-blue-700 font-bold text-xs tracking-tighter">JR</div>
                  <div className="w-10 h-10 rounded-full border-2 border-white bg-amber-100 flex items-center justify-center relative z-10 shadow-sm text-amber-700 font-bold text-xs tracking-tighter">CV</div>
                </div>
                <div className="flex flex-col text-left">
                  <div className="flex items-center gap-0.5 mt-0.5">
                    {[1,2,3,4,5].map(i => <svg key={i} className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>)}
                  </div>
                  <p className="text-xs mt-0.5"><strong className="text-gray-900">+500</strong> en lista</p>
                </div>
              </div>
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
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-200 mb-3">
                  <span className="text-xs font-bold text-teal-700 uppercase tracking-wide">Según PMI®</span>
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-2">Gerente de Proyecto</h3>
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
                  <div key={idx} className="flex flex-col items-center text-center p-4 rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-100 hover:border-teal-300 transition-colors">
                    <benefit.icon size={24} weight="duotone" className="text-teal-600 mb-2" />
                    <p className="text-xs font-bold text-gray-900 mb-1">{benefit.label}</p>
                    <p className="text-[10px] text-gray-500">{benefit.desc}</p>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <div
                className="w-full flex items-center justify-center gap-2 bg-teal-500 text-white font-bold py-3 px-6 rounded-2xl transition-all shadow-lg shadow-teal-500/20 mt-auto cursor-default group"
              >
                Únete y sé pionero ELVIA <ArrowDown size={16} weight="bold" className="group-hover:translate-y-1 transition-transform" />
              </div>
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
                'Feedback sobre tu CV',
                'Temas de actualidad',
                'Motivación',
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
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-emerald-600 p-[1.5px] shadow-lg overflow-hidden">
                      <img src="/Avatar%20Optima.png" alt="ELVIA" className="w-full h-full object-cover rounded-full" />
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
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">Pega una descripción de vacante real y simularemos cómo nuestra inteligencia artificial recomienda ajustes a tu perfil, siempre basado en tu información, nunca inventando nada.</p>
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
                      onClick={() => setShowDemoOverlay(false)} 
                      className="w-full bg-[#1A91F0] text-white font-bold py-4 px-6 rounded-2xl hover:bg-blue-600 hover:shadow-lg transition-all shadow-md focus:ring-4 focus:ring-blue-500/20"
                    >
                      Únete a la lista de espera
                    </button>
                    <p className="text-xs text-gray-400 mt-2 font-medium">
                      Descubre tu análisis completo. 100% Gratis.
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
            <span className="text-[#E8541A] font-bold text-sm tracking-widest uppercase">Tu arsenal completo</span>
            <h2 className="font-headline font-black text-4xl md:text-5xl tracking-tight text-gray-900">
              De CV a oferta.<br className="hidden md:block" /> Todo en un solo lugar.
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              Herramientas de IA, gestión de candidaturas y mentores reales — diseñados para que consigas el trabajo que mereces.
            </p>
          </motion.div>

          {/* ─── Fila 1: Herramientas IA hero (3 cols) ─── */}
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 mb-4"
          >
            {/* ─── Fila 1: Herramientas IA hero (3 cols iguales) ─── */}
            {FEATURE_ROWS.heroes.map(f => (
              <motion.div
                key={f.titulo}
                variants={fadeInUp}
                whileHover={{ y: -6, boxShadow: f.featured ? '0 25px 50px -12px rgba(0,0,0,0.3)' : '0 25px 50px -12px rgba(0,0,0,0.18)' }}
                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                className={`group relative overflow-hidden rounded-2xl border-2 transition-all ${f.featured ? 'border-blue-400 bg-gradient-to-br from-blue-50 to-white shadow-lg shadow-blue-200/30' : 'border-gray-200 bg-white'}`}
              >
                {f.featured && (
                  <div className="absolute top-3 right-3 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 border border-blue-200 z-20">
                    <span className="text-xs font-bold text-blue-700 uppercase tracking-widest">Destacado</span>
                  </div>
                )}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: f.gradientStyle }} />
                <div className="relative z-10 p-8 h-full flex flex-col min-h-[380px]">
                  {/* Icon */}
                  <div className={`w-16 h-16 rounded-xl flex items-center justify-center mb-6 transition-all duration-300 ${f.iconBg} ${f.iconColor} group-hover:bg-white/20 group-hover:text-white`}>
                    <f.Icon size={32} weight="duotone" />
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <h3 className={`font-headline font-bold text-2xl transition-colors duration-300 mb-1 leading-tight ${f.featured ? 'text-blue-900 group-hover:text-white' : 'text-gray-900 group-hover:text-white'}`}>{f.titulo}</h3>
                    {f.subtitulo && (
                      <p className={`text-xs font-semibold uppercase tracking-wide transition-colors duration-300 mb-3 ${f.featured ? 'text-blue-600 group-hover:text-white/70' : 'text-gray-500 group-hover:text-white/60'}`}>{f.subtitulo}</p>
                    )}
                    <p className={`text-sm leading-relaxed transition-colors duration-300 mb-4 ${f.featured ? 'text-blue-700 group-hover:text-white/80' : 'text-gray-600 group-hover:text-white/80'}`}>{f.desc}</p>
                  </div>

                  {/* CTA */}
                  <div className="mt-6 flex items-center gap-2 text-sm font-bold text-gray-400 group-hover:text-white transition-all duration-300 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0">
                    {f.cta} <ArrowRight size={16} weight="bold" />
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* ─── Fila 2: Mi Carrera (4 cols iguales) ─── */}
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }}
            variants={staggerContainer}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4"
          >
            {FEATURE_ROWS.carrera.map(f => (
              <motion.div
                key={f.titulo}
                variants={fadeInUp}
                whileHover={{ y: -6, boxShadow: '0 20px 40px -10px rgba(0,0,0,0.15)' }}
                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white"
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: f.gradientStyle }} />
                <div className="relative z-10 p-5 flex flex-col min-h-[180px]">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 ${f.iconBg} ${f.iconColor} group-hover:bg-white/20 group-hover:text-white`}>
                    <f.Icon size={20} weight="duotone" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start gap-2 mb-1.5">
                      <h3 className="font-bold text-base text-gray-900 group-hover:text-white transition-colors duration-300">{f.titulo}</h3>
                      {f.upcoming && <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">Próximamente</span>}
                    </div>
                    <p className="text-xs text-gray-500 group-hover:text-white/80 transition-colors duration-300 leading-relaxed">{f.desc}</p>
                  </div>
                  <div className={`mt-4 flex items-center gap-1.5 text-xs font-bold ${f.upcoming ? 'text-gray-300 group-hover:text-gray-400' : 'text-gray-400 group-hover:text-white'} transition-all duration-300 ${f.upcoming ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0'}`}>
                    {f.cta} {!f.upcoming && <ArrowRight size={12} weight="bold" />}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* ─── Fila 3: Recursos (4 cols iguales) ─── */}
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }}
            variants={staggerContainer}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4"
          >
            {FEATURE_ROWS.recursos.map(f => (
              <motion.div
                key={f.titulo}
                variants={fadeInUp}
                whileHover={{ y: -6, boxShadow: '0 20px 40px -10px rgba(0,0,0,0.15)' }}
                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white"
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: f.gradientStyle }} />
                <div className="relative z-10 p-5 flex flex-col min-h-[180px]">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 ${f.iconBg} ${f.iconColor} group-hover:bg-white/20 group-hover:text-white`}>
                    <f.Icon size={20} weight="duotone" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start gap-2 mb-1.5">
                      <h3 className="font-bold text-base text-gray-900 group-hover:text-white transition-colors duration-300">{f.titulo}</h3>
                      {f.upcoming && <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">Próximamente</span>}
                    </div>
                    <p className="text-xs text-gray-500 group-hover:text-white/80 transition-colors duration-300 leading-relaxed">{f.desc}</p>
                  </div>
                  <div className={`mt-4 flex items-center gap-1.5 text-xs font-bold ${f.upcoming ? 'text-gray-300 group-hover:text-gray-400' : 'text-gray-400 group-hover:text-white'} transition-all duration-300 ${f.upcoming ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0'}`}>
                    {f.cta} {!f.upcoming && <ArrowRight size={12} weight="bold" />}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

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
                  Mientras editas tu CV, ELVIA analiza cada sección: desde tu titular y resumen profesional, hasta tus experiencias y logros.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center shrink-0 mt-1">
                    <Check size={20} weight="bold" className="text-teal-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Análisis Inteligente</h4>
                    <p className="text-sm text-gray-600">Detecta palabras clave, formato y estructura para maximizar el match con ATS</p>
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
                    <p className="text-sm text-gray-600">Tu índice de optimización se actualiza instantáneamente a medida que haces cambios</p>
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
                  onClick={() => document.getElementById('waitlist-form-bottom')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                  className="w-full mt-8 bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-teal-500/20"
                >
                  Comenzar análisis gratuito
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

      {/* ─── CTA Final ──────────────────────────────────────────────────────────── */}
      <section id="waitlist-form-bottom" className="relative z-10 py-24 px-6 border-t border-gray-200 bg-white">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="container mx-auto max-w-4xl bg-gray-900 rounded-[3rem] p-8 md:p-16 shadow-2xl relative overflow-hidden"
        >
          {/* Background Elements */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-teal-500/5 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-5 gap-12 items-center">
            {/* Branding Column */}
            <div className="lg:col-span-2 text-center lg:text-left space-y-8">
              <div className="flex flex-col items-center lg:items-start gap-6">
                {/* Logo removido temporalmente */}
                
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-teal-400/20 blur-2xl rounded-full" />
                  <img 
                    src="/Avatar%20Optima.png" 
                    alt="ELVIA" 
                    className="relative w-32 h-32 rounded-full border-2 border-white/10 shadow-2xl object-cover" 
                  />
                  <div className="absolute -bottom-2 -right-2 bg-teal-500 text-white p-2 rounded-xl shadow-lg">
                    <Lightning size={20} weight="fill" />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-3xl font-black text-white mb-4 leading-tight">Únete a la lista de espera</h3>
                <p className="text-white/60 leading-relaxed">
                  Nunca fue tan sencillo ser tu propio gerente de proyecto de tu búsqueda laboral. Sé el primero en acceder a <span className="text-[#E8541A] font-bold">ELVIA</span>.
                </p>
                <div className="mt-6 flex flex-col lg:flex-row items-center gap-4 lg:gap-6 justify-center lg:justify-start">
                   <div className="flex items-center gap-2">
                     <div className="flex -space-x-2">
                       <div className="w-9 h-9 rounded-full border-2 border-gray-900 bg-[#CCFBF1] text-[#115E59] flex items-center justify-center text-[10px] font-black shadow-lg ring-2 ring-white/5">AM</div>
                       <div className="w-9 h-9 rounded-full border-2 border-gray-900 bg-[#DBEAFE] text-[#1E40AF] flex items-center justify-center text-[10px] font-black shadow-lg ring-2 ring-white/5">JR</div>
                       <div className="w-9 h-9 rounded-full border-2 border-gray-900 bg-[#FEF3C7] text-[#92400E] flex items-center justify-center text-[10px] font-black shadow-lg ring-2 ring-white/5">CV</div>
                     </div>
                     <div className="flex items-center gap-0.5 ml-2">
                        {[1,2,3,4,5].map(i => <Star key={i} size={14} weight="fill" className="text-amber-400" />)}
                     </div>
                   </div>
                   <span className="text-xs font-black text-white/50 uppercase tracking-[0.15em]">+500 en lista</span>
                </div>
              </div>
            </div>

            {/* Form Column */}
            <div className="lg:col-span-3">
              {waitlistStatus.success ? (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-teal-500/10 border border-teal-500/30 p-8 rounded-3xl text-center"
                >
                  <div className="w-16 h-16 bg-teal-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-teal-500/20">
                    <Check size={32} weight="bold" className="text-white" />
                  </div>
                    <h4 className="font-black text-white text-2xl mb-4">¡Bienvenido! Es tu primer paso en tu proceso de transición laboral</h4>
                    <p className="text-teal-100/70 leading-relaxed">
                      Recibirás un mail y estarás inscrito en nuestra comunidad de beneficios, además de participar por uno de los accesos FULL de 1 mes para utilizar la plataforma antes que nadie. Estaremos en contacto pronto.
                    </p>
                </motion.div>
              ) : (
                <form onSubmit={handleWaitlistSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <input required type="text" value={waitlistForm.nombre} onChange={e => setWaitlistForm(f => ({...f, nombre: e.target.value}))} className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-teal-500 placeholder-white/20 transition-all" placeholder="Nombre" />
                    <input required type="text" value={waitlistForm.apellido} onChange={e => setWaitlistForm(f => ({...f, apellido: e.target.value}))} className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-teal-500 placeholder-white/20 transition-all" placeholder="Apellido" />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <select required value={waitlistForm.pais} onChange={e => {
                      const pais = PAISES.find(p => p.value === e.target.value)
                      setWaitlistForm(f => ({...f, pais: e.target.value, indicativo: pais?.code || ''}))
                    }} className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-teal-500 appearance-none">
                      <option value="" disabled className="bg-gray-900">País</option>
                      {PAISES.map(p => <option key={p.value} value={p.value} className="bg-gray-900">{p.value}</option>)}
                    </select>

                    <div className="flex gap-2">
                       <input type="tel" value={waitlistForm.telefono} onChange={e => setWaitlistForm(f => ({...f, telefono: e.target.value}))} className="flex-1 bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-teal-500 placeholder-white/20" placeholder="Teléfono (opcional)" />
                    </div>
                  </div>

                  <input required type="email" value={waitlistForm.email} onChange={e => setWaitlistForm(f => ({...f, email: e.target.value}))} className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-teal-500 placeholder-white/20" placeholder="Email profesional" />
                  
                  <select required value={waitlistForm.situacion} onChange={e => setWaitlistForm(f => ({...f, situacion: e.target.value}))} className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-teal-500 appearance-none">
                    <option value="" disabled className="bg-gray-900">¿Cuál es tu situación actual?</option>
                    <option value="Sin empleo y en búsqueda activa" className="bg-gray-900">Sin empleo y en búsqueda activa</option>
                    <option value="Con empleo y en búsqueda activa" className="bg-gray-900">Con empleo y en búsqueda activa</option>
                    <option value="Quiero gestionar mi siguiente paso" className="bg-gray-900">Quiero gestionar mi siguiente paso</option>
                  </select>

                  <div className="pt-2">
                    <label className="flex items-start gap-3 cursor-pointer group mb-6">
                      <input type="checkbox" required checked={waitlistForm.aceptaPrivacidad} onChange={e => setWaitlistForm(f => ({...f, aceptaPrivacidad: e.target.checked}))} className="mt-1 w-4 h-4 border-white/20 bg-transparent rounded focus:ring-teal-500" />
                      <span className="text-xs text-white/40 leading-relaxed group-hover:text-white/60 transition-colors">
                        Acepto la <Link to="/privacidad" className="underline">política de privacidad</Link> y el consentimiento para recibir comunicaciones estratégicas.
                      </span>
                    </label>

                    <button disabled={waitlistStatus.loading} type="submit" className="w-full flex items-center justify-center gap-3 bg-teal-500 hover:bg-teal-600 text-white font-black px-6 py-4 rounded-2xl transition-all shadow-xl shadow-teal-500/20 disabled:opacity-50">
                      {waitlistStatus.loading ? 'Procesando...' : 'Acceso Prioritario'} <ArrowRight size={20} weight="bold" />
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </motion.div>
      </section>

      {/* ─── Footer Minimalista ───────────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-gray-100 bg-white">
        <div className="container mx-auto max-w-6xl px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col items-center md:items-start gap-4">
            <Link to="/">
              <img src="/elvia-logo-transparent.png" alt="ELVIA" className="h-10 w-auto opacity-90" />
            </Link>
            <p className="text-gray-400 text-xs font-medium uppercase tracking-widest text-center md:text-left">
              Potenciando carreras de alto nivel con IA
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-8">
            <Link to="/privacidad" className="text-sm font-bold text-gray-500 hover:text-teal-600 transition-colors">Privacidad</Link>
            <span className="text-gray-200 hidden sm:block">|</span>
            <span className="text-sm font-bold text-gray-500">© {new Date().getFullYear()} ELVIA</span>
          </div>
        </div>
      </footer>

      {/* Sticky CTA (Recomendación Marketing) */}
      <AnimatePresence>
        {showStickyCTA && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 40 }}
            onClick={scrollToWaitlist}
            className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-[100] flex items-center gap-3 bg-gray-900 border border-white/10 text-white font-black px-6 py-4 rounded-2xl shadow-2xl transition-all group active:scale-95"
          >
            <div className="flex flex-col items-start">
               <span className="text-[10px] text-teal-400 uppercase tracking-widest leading-none mb-1">Puestos limitados</span>
               <span className="text-sm font-black">Acceso Prioritario</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-teal-500 text-white flex items-center justify-center shadow-lg shadow-teal-500/20 group-hover:rotate-12 transition-transform">
              <RocketLaunch size={22} weight="bold" />
            </div>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
