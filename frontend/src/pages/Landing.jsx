import { useEffect, useRef, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  FileMagnifyingGlass, MagnifyingGlass, Briefcase, Kanban,
  ArrowRight, CheckCircle, ChartBar, Coins, SignOut, Warning,
  ShieldCheck, Lightning, Target,
  Folders, BookmarkSimple, Books, Shapes, LinkedinLogo,
  MicrophoneStage, UsersThree
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
      titulo: 'CV Optimizer',
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
      Icon: Shapes,
      titulo: 'Infografías',
      desc: 'Lo más complejo del mundo laboral, explicado en un vistazo.',
      cta: 'Ver infografías',
      gradientStyle: GRAD.blue,
      iconBg: 'bg-blue-100', iconColor: 'text-blue-600',
    },
    {
      Icon: LinkedinLogo,
      titulo: 'LinkedIn Optimo',
      desc: 'Tu perfil optimizado para aparecer cuando los recruiters que importan están buscando.',
      cta: 'Optimizar LinkedIn',
      gradientStyle: GRAD.blue,
      iconBg: 'bg-blue-100', iconColor: 'text-blue-600',
    },
    {
      Icon: MicrophoneStage,
      titulo: 'Entrevista',
      desc: 'Practica hasta que no haya pregunta difícil. Llega seguro cuando más importa.',
      cta: 'Preparar entrevista',
      gradientStyle: GRAD.blue,
      iconBg: 'bg-blue-100', iconColor: 'text-blue-600',
    },
  ],
}
import { supabase } from '../services/authService'
import { motion, useScroll, useTransform, useSpring } from 'framer-motion'

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
               body: JSON.stringify({ event_name: 'simulation_completed' })
            }).catch(() => {})
          }
        }, 28)
      }
    }, { threshold: 0.3 })
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
    fetch(`${API_URL}/api/events/track`, { method: 'GET' }) // Mock or custom route if needed, for now use Supabase directly
    
    // Using Supabase client for simple public read
    const { createClient } = import('@supabase/supabase-js').then(({ createClient }) => {
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

    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(data => {
        if (data.country_name) {
          // Buscar por ipName (inglés) en el catálogo
          const pais = PAISES.find(p => p.ipName === data.country_name)
          const paisValue  = pais ? pais.value : data.country_name
          const indicativo = pais ? pais.code  : (data.country_calling_code || '')
          setWaitlistForm(f => ({ ...f, pais: paisValue, indicativo }))
        }
      })
      .catch(err => console.error("Error fetching IP details", err))
  }, [])
  
  const handleWaitlistSubmit = async (e) => {
    e.preventDefault()
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
         body: JSON.stringify({ event_name: 'waitlist_registered', metadata: { email: waitlistForm.email, situacion: waitlistForm.situacion } })
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
              <button onClick={() => { setShowDemoOverlay(false); setTimeout(() => document.getElementById('waitlist-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 150) }}
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
              <div className="flex items-center gap-4 mt-2">
                <span
                  style={{
                    background: 'linear-gradient(to right, rgb(13, 148, 136), rgb(16, 185, 129), rgb(59, 130, 246))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    display: 'inline-block'
                  }}
                >
                  Acompañada por OPTIMA
                </span>
                <img
                  src="/Avatar Optima.png"
                  alt="OPTIMA Avatar"
                  className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover shadow-lg border-2 border-teal-400/50 transition-transform duration-300 hover:scale-110 cursor-pointer"
                />
              </div>
            </motion.h1>

            <motion.p variants={fadeInUp} className="text-lg sm:text-xl text-gray-500 leading-relaxed mb-10 max-w-lg">
              Supera los filtros ATS, diseña un CV formato Harvard de alto impacto y domina tu proceso de selección en empresas corporativas.
            </motion.p>

            <motion.div variants={fadeInUp} className="mt-8 bg-gray-900 border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden" id="waitlist-form">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 via-[#E8541A] to-blue-500" />
              <h3 className="text-xl font-black text-white mb-2 underline decoration-teal-500/50">Únete a la lista de espera</h3>
              <p className="text-xs text-white/60 mb-5 leading-relaxed">
                Supera los filtros ATS y domina tu proceso. Por ser pionero <span className="text-[#E8541A] font-bold">OPTIMA</span>, podrás ganar una de las <span className="text-teal-400 font-bold">Cuentas PRO Mensual</span> antes del lanzamiento oficial. Sorteo: 8 de Abril.
              </p>
              
              {waitlistStatus.success ? (
                <div className="bg-teal-50 border border-teal-200 p-4 rounded-xl flex items-start gap-3">
                  <CheckCircle size={24} weight="fill" className="text-teal-500 shrink-0" />
                  <div>
                    <h4 className="font-bold text-teal-800 text-sm">¡Estás en la lista!</h4>
                    <p className="text-xs text-teal-600 mt-1">Acabamos de enviarte un correo de bienvenida. Revisa tu bandeja de entrada (y tu carpeta de spam en caso de que no lo veas).</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleWaitlistSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-white/50 mb-1">Nombre</label>
                      <input required type="text" value={waitlistForm.nombre} onChange={e => setWaitlistForm(f => ({...f, nombre: e.target.value}))} className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8541A] placeholder-white/20" placeholder="Tu nombre" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-white/50 mb-1">Apellido</label>
                      <input required type="text" value={waitlistForm.apellido} onChange={e => setWaitlistForm(f => ({...f, apellido: e.target.value}))} className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8541A] placeholder-white/20" placeholder="Tu apellido" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-white/50 mb-1">País</label>
                      <select required value={waitlistForm.pais} onChange={e => {
                        const pais = PAISES.find(p => p.value === e.target.value)
                        setWaitlistForm(f => ({...f, pais: e.target.value, indicativo: pais?.code || ''}))
                      }} className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8541A] appearance-none">
                        <option value="" disabled className="text-gray-900">Selecciona país</option>
                        {PAISES.map(p => (
                          <option key={p.value} value={p.value} className="text-gray-900 bg-white">{p.value}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-white/50 mb-1">Teléfono</label>
                      <div className="flex gap-2">
                        <select value={waitlistForm.indicativo} onChange={e => setWaitlistForm(f => ({...f, indicativo: e.target.value}))} className="w-24 shrink-0 bg-white/5 border border-white/10 text-white rounded-xl px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8541A] appearance-none text-center">
                          <option value="" className="text-gray-900 bg-white">+--</option>
                          {PAISES.filter(p => p.code).map(p => (
                            <option key={p.value} value={p.code} className="text-gray-900 bg-white">{p.code}</option>
                          ))}
                        </select>
                        <input type="tel" value={waitlistForm.telefono} onChange={e => setWaitlistForm(f => ({...f, telefono: e.target.value}))} className="flex-1 bg-white/5 border border-white/10 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8541A] placeholder-white/20" placeholder="300 000 0000" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-white/50 mb-1">Email</label>
                    <input required type="email" value={waitlistForm.email} onChange={e => setWaitlistForm(f => ({...f, email: e.target.value}))} className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8541A] placeholder-white/20" placeholder="tu@email.com" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-white/50 mb-1">Situación Actual</label>
                    <select required value={waitlistForm.situacion} onChange={e => setWaitlistForm(f => ({...f, situacion: e.target.value}))} className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8541A] appearance-none">
                      <option value="" disabled className="text-gray-400">Selecciona una opción</option>
                      <option value="Estoy desempleada/o" className="text-gray-900">Estoy desempleada/o</option>
                      <option value="Empleada/o pero buscando alternativas" className="text-gray-900">Empleada/o pero buscando alternativas</option>
                      <option value="Quiero optimizar mi perfil para futuro" className="text-gray-900">Quiero optimizar mi perfil para futuro</option>
                    </select>
                  </div>
                  
                  {waitlistStatus.error && (
                    <div className="text-xs font-medium text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
                      {waitlistStatus.error}
                    </div>
                  )}

                  <div className="flex flex-col gap-4 pt-2">
                    <label className="flex items-start gap-2 cursor-pointer group">
                      <div className="relative flex items-center justify-center shrink-0 w-5 h-5 rounded border border-gray-300 bg-white shadow-sm mt-0.5 group-hover:border-[#E8541A] transition-colors">
                        <input type="checkbox" required checked={waitlistForm.aceptaPrivacidad} onChange={e => setWaitlistForm(f => ({...f, aceptaPrivacidad: e.target.checked}))} className="opacity-0 absolute inset-0 w-full h-full cursor-pointer" />
                        {waitlistForm.aceptaPrivacidad && <CheckCircle size={14} weight="bold" className="text-[#E8541A]" />}
                      </div>
                      <span className="text-xs text-white/40 leading-relaxed">
                        Acepto la <Link to="/privacidad" className="underline hover:text-[#E8541A]">política de privacidad</Link> y doy mi consentimiento para recibir comunicaciones.
                      </span>
                    </label>

                    <button disabled={waitlistStatus.loading} type="submit" className="w-full flex items-center justify-center gap-2 bg-teal-500 text-white font-bold px-6 py-3.5 rounded-xl hover:bg-teal-600 transition-all shadow-md shadow-teal-500/20 disabled:opacity-50">
                      {waitlistStatus.loading ? 'Registrando...' : 'Quiero unirme a la lista'} <ArrowRight size={16} weight="bold" />
                    </button>
                  </div>
                </form>
              )}
            </motion.div>

            {/* Trust Badges moved inside the right column below mockup */}
          </motion.div>

          {/* Floating UI Elements / Dashboard Mockup */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, rotateX: 10 }}
            animate={{ opacity: 1, scale: 1, rotateX: 0 }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
            className="relative hidden lg:block perspective-1000"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-teal-500/20 to-blue-500/20 blur-[100px] rounded-full" />

            {/* Wrapper de los dos widgets — pb-16 deja espacio para el flotante absoluto */}
            <div className="relative pb-16">

              {/* Main Widget */}
              <motion.div
                animate={{ y: [0, -15, 0] }}
                transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                className="relative bg-white border border-gray-200 p-8 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.08)] z-20"
              >
                <div className="flex items-center justify-between border-b border-gray-100 pb-6 mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center shrink-0 shadow-lg">
                      <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="9" y1="12" x2="15" y2="12" />
                        <line x1="9" y1="16" x2="15" y2="16" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">Nivel de Optimización</h3>
                      <p className="text-gray-400 text-xs">Escaneando compatibilidad...</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="block text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-500">92%</span>
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest">Compatibilidad</span>
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

              {/* Small Floating Widget — absoluto dentro del wrapper, no toca los badges */}
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
                className="absolute right-0 bottom-0 bg-white border border-gray-200 p-5 rounded-2xl shadow-xl z-30 flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-full bg-[#E8541A]/10 border border-[#E8541A]/30 flex items-center justify-center">
                  <CheckCircle size={20} weight="fill" className="text-[#E8541A]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Formato Optimizado</p>
                  <p className="text-xs text-gray-400">Hace 2 minutos</p>
                </div>
              </motion.div>

            </div>{/* /wrapper widgets */}

            {/* Trust Badges — debajo de ambas animaciones, sin superposición */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5 p-4 rounded-2xl bg-white/60 backdrop-blur-sm border border-gray-200/60 shadow-sm hover:bg-white hover:border-gray-300 transition-all">
                 <ShieldCheck size={28} weight="duotone" className="text-teal-500 mb-1" />
                 <span className="text-sm font-black tracking-tight text-gray-900">100% ATS-Perfect</span>
                 <span className="text-xs text-gray-500 leading-tight">Supera filtros automáticos de corporativos.</span>
              </div>
              <div className="flex flex-col gap-1.5 p-4 rounded-2xl bg-white/60 backdrop-blur-sm border border-gray-200/60 shadow-sm hover:bg-white hover:border-gray-300 transition-all">
                 <Lightning size={28} weight="duotone" className="text-amber-500 mb-1" />
                 <span className="text-sm font-black tracking-tight text-gray-900">10x Más Rápido</span>
                 <span className="text-xs text-gray-500 leading-tight">Tu currículum listo en segundos, no horas.</span>
              </div>
              <div className="flex flex-col gap-1.5 p-4 rounded-2xl bg-white/60 backdrop-blur-sm border border-gray-200/60 shadow-sm hover:bg-white hover:border-gray-300 transition-all">
                 <Target size={28} weight="duotone" className="text-blue-500 mb-1" />
                 <span className="text-sm font-black tracking-tight text-gray-900">Recruiter Match</span>
                 <span className="text-xs text-gray-500 leading-tight">Compatible matemáticamente con la vacante.</span>
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
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 bg-white/5">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-widest text-white">Desarrollada por expertos en atracción de talento</span>
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
                    <img src="/Avatar Optima.png" alt="OPTIMA" className="w-full h-full object-cover rounded-full" />
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

      {/* ─── Seccion Demo Interactive (Curiosity Gap Widget) ────────────────────── */}
      <section ref={demoSectionRef} className="relative z-10 py-24 px-6 bg-slate-50 border-t border-gray-200" id="simulador">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <span className="text-[#E8541A] font-bold text-sm tracking-widest uppercase mb-2 block">Simulador en tiempo real</span>
            <h2 className="font-headline font-black text-4xl md:text-5xl text-gray-900 mb-4 tracking-tight">Prueba la magia gratis.<br className="hidden md:block"/> Sin registrarte.</h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">Pega una descripción de vacante real y simularemos cómo nuestra inteligencia artificial evalúa y penaliza tu currículum frente a ella.</p>
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
                       <p className="text-sm font-bold text-blue-950">TU CV Optimizado con OPTIMA | CV</p>
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
                    Optima detectó que tu perfil es sólido, pero <b>te faltan 4 palabras clave obligatorias</b> que los filtros ATS usarán para descartarte de esta vacante.
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
      <section className="relative z-10 py-24 px-6 bg-slate-50">
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
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4"
          >
            {/* CV Optimizer â€” hero (2 cols) */}
            {[FEATURE_ROWS.heroes[0]].map(f => (
              <motion.div
                key={f.titulo}
                variants={fadeInUp}
                whileHover={{ y: -6, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.18)' }}
                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white md:col-span-2"
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: f.gradientStyle }} />
                <div className="relative z-10 p-7 h-full flex flex-col min-h-[200px]">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-all duration-300 ${f.iconBg} ${f.iconColor} group-hover:bg-white/20 group-hover:text-white`}>
                    <f.Icon size={24} weight="duotone" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-headline font-bold text-xl text-gray-900 group-hover:text-white transition-colors duration-300 mb-2">{f.titulo}</h3>
                    <p className="text-sm text-gray-500 group-hover:text-white/80 transition-colors duration-300 leading-relaxed">{f.desc}</p>
                  </div>
                  <div className="mt-5 flex items-center gap-2 text-sm font-bold text-gray-400 group-hover:text-white transition-all duration-300 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0">
                    {f.cta} <ArrowRight size={15} weight="bold" />
                  </div>
                </div>
              </motion.div>
            ))}

            {/* CV vs Vacante (1 col) */}
            {[FEATURE_ROWS.heroes[1]].map(f => (
              <motion.div
                key={f.titulo}
                variants={fadeInUp}
                whileHover={{ y: -6, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.18)' }}
                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white md:col-span-1"
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: f.gradientStyle }} />
                <div className="relative z-10 p-7 h-full flex flex-col min-h-[200px]">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-all duration-300 ${f.iconBg} ${f.iconColor} group-hover:bg-white/20 group-hover:text-white`}>
                    <f.Icon size={24} weight="duotone" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-headline font-bold text-xl text-gray-900 group-hover:text-white transition-colors duration-300 mb-2">{f.titulo}</h3>
                    <p className="text-sm text-gray-500 group-hover:text-white/80 transition-colors duration-300 leading-relaxed">{f.desc}</p>
                  </div>
                  <div className="mt-5 flex items-center gap-2 text-sm font-bold text-gray-400 group-hover:text-white transition-all duration-300 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0">
                    {f.cta} <ArrowRight size={15} weight="bold" />
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
                    <h3 className="font-bold text-base text-gray-900 group-hover:text-white transition-colors duration-300 mb-1.5">{f.titulo}</h3>
                    <p className="text-xs text-gray-500 group-hover:text-white/80 transition-colors duration-300 leading-relaxed">{f.desc}</p>
                  </div>
                  <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-gray-400 group-hover:text-white transition-all duration-300 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0">
                    {f.cta} <ArrowRight size={12} weight="bold" />
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
                    <h3 className="font-bold text-base text-gray-900 group-hover:text-white transition-colors duration-300 mb-1.5">{f.titulo}</h3>
                    <p className="text-xs text-gray-500 group-hover:text-white/80 transition-colors duration-300 leading-relaxed">{f.desc}</p>
                  </div>
                  <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-gray-400 group-hover:text-white transition-all duration-300 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0">
                    {f.cta} <ArrowRight size={12} weight="bold" />
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
              <button 
                onClick={() => { setShowDemoOverlay(false); setTimeout(() => document.getElementById('waitlist-form-bottom')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 150) }}
                className="flex items-center gap-2.5 text-white font-bold text-sm shrink-0 bg-white/10 group-hover:bg-white/20 transition-colors duration-300 px-6 py-3.5 rounded-xl border border-white/10 group-hover:border-white/20 whitespace-nowrap cursor-pointer">
                Disponible próximamente, únete a la lista de espera
                <ArrowRight size={16} weight="bold" className="group-hover:translate-x-1 transition-transform duration-200" />
              </button>
            </div>
          </motion.div>

        </div>
      </section>

      {/* ─── CTA Final ──────────────────────────────────────────────────────────── */}
      <section id="waitlist-form-bottom" className="relative z-10 py-24 px-6 border-t border-gray-200 bg-white">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="container mx-auto max-w-4xl text-center bg-gray-900 rounded-3xl p-12 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-500/10 blur-[100px] rounded-full pointer-events-none" />

          <div className="relative z-10 text-left">
            <h3 className="text-3xl font-black text-white mb-2 text-center">Únete a la lista de espera</h3>
            <p className="text-white/60 mb-8 text-center max-w-xl mx-auto leading-relaxed">
              Supera los filtros ATS y domina tu proceso. Por ser pionero <span className="text-[#E8541A] font-bold">OPTIMA</span>, podrás ganar una de las <span className="text-teal-400 font-bold">Cuentas PRO Mensual</span> antes del lanzamiento oficial. Sorteo: 8 de Abril.
            </p>
            
            {waitlistStatus.success ? (
              <div className="bg-teal-500/10 border border-teal-500/30 p-6 rounded-2xl flex items-start gap-4">
                <CheckCircle size={28} weight="fill" className="text-teal-400 shrink-0" />
                <div>
                  <h4 className="font-bold text-teal-300 text-lg">¡Estás en la lista!</h4>
                  <p className="text-sm text-teal-100/70 mt-1">Acabamos de enviarte un correo de bienvenida. Revisa tu bandeja de entrada (y tu carpeta de spam en caso de que no lo veas).</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleWaitlistSubmit} className="space-y-5 max-w-2xl mx-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-white/80 mb-1.5">Nombre</label>
                    <input required type="text" value={waitlistForm.nombre} onChange={e => setWaitlistForm(f => ({...f, nombre: e.target.value}))} className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder-white/30" placeholder="Tu nombre" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-white/80 mb-1.5">Apellido</label>
                    <input required type="text" value={waitlistForm.apellido} onChange={e => setWaitlistForm(f => ({...f, apellido: e.target.value}))} className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder-white/30" placeholder="Tu apellido" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-white/80 mb-1.5">País</label>
                    <select required value={waitlistForm.pais} onChange={e => {
                      const pais = PAISES.find(p => p.value === e.target.value)
                      setWaitlistForm(f => ({...f, pais: e.target.value, indicativo: pais?.code || ''}))
                    }} className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none">
                      <option value="" disabled className="text-gray-900">Selecciona país</option>
                      {PAISES.map(p => (
                        <option key={p.value} value={p.value} className="text-gray-900 bg-white">{p.value}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-white/80 mb-1.5">Teléfono</label>
                    <div className="flex gap-2">
                      <select value={waitlistForm.indicativo} onChange={e => setWaitlistForm(f => ({...f, indicativo: e.target.value}))} className="w-24 shrink-0 bg-white/5 border border-white/10 text-white rounded-xl px-2 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none text-center">
                        <option value="" className="text-gray-900 bg-white">+--</option>
                        {PAISES.filter(p => p.code).map(p => (
                          <option key={p.value} value={p.code} className="text-gray-900 bg-white">{p.code}</option>
                        ))}
                      </select>
                      <input type="tel" value={waitlistForm.telefono} onChange={e => setWaitlistForm(f => ({...f, telefono: e.target.value}))} className="flex-1 bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder-white/30" placeholder="300 000 0000" />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-white/80 mb-1.5">Email</label>
                  <input required type="email" value={waitlistForm.email} onChange={e => setWaitlistForm(f => ({...f, email: e.target.value}))} className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder-white/30" placeholder="tu@email.com" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-white/80 mb-1.5">Situación Actual</label>
                  <select required value={waitlistForm.situacion} onChange={e => setWaitlistForm(f => ({...f, situacion: e.target.value}))} className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none">
                    <option value="" disabled className="text-gray-900">Selecciona una opción</option>
                    <option value="Estoy desempleada/o" className="text-gray-900">Estoy desempleada/o</option>
                    <option value="Empleada/o pero buscando alternativas" className="text-gray-900">Empleada/o pero buscando alternativas</option>
                    <option value="Quiero optimizar mi perfil para futuro" className="text-gray-900">Quiero optimizar mi perfil para futuro</option>
                  </select>
                </div>
                
                {waitlistStatus.error && (
                  <div className="text-sm font-medium text-red-400 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                    {waitlistStatus.error}
                  </div>
                )}

                <div className="flex flex-col gap-6 pt-2">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center shrink-0 w-5 h-5 rounded border border-white/30 bg-white/5 mt-0.5 group-hover:border-teal-400 transition-colors">
                      <input type="checkbox" required checked={waitlistForm.aceptaPrivacidad} onChange={e => setWaitlistForm(f => ({...f, aceptaPrivacidad: e.target.checked}))} className="opacity-0 absolute inset-0 w-full h-full cursor-pointer" />
                      {waitlistForm.aceptaPrivacidad && <CheckCircle size={14} weight="bold" className="text-teal-400" />}
                    </div>
                    <span className="text-sm text-white/50 leading-relaxed">
                      Acepto la <Link to="/privacidad" className="underline hover:text-teal-400 transition-colors">política de privacidad</Link> y doy mi consentimiento para recibir comunicaciones.
                    </span>
                  </label>

                  <button disabled={waitlistStatus.loading} type="submit" className="w-full flex items-center justify-center gap-2 bg-teal-500 text-white font-bold px-6 py-4 rounded-xl hover:bg-teal-600 transition-all shadow-lg shadow-teal-500/20 disabled:opacity-50 text-lg">
                    {waitlistStatus.loading ? 'Registrando...' : 'Quiero unirme a la lista'} <ArrowRight size={18} weight="bold" />
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </section>

      {/* ─── Footer ──────────────────────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-gray-200 bg-gray-900">
        <div className="container mx-auto max-w-6xl px-6 py-16 grid grid-cols-1 md:grid-cols-5 gap-12">
          <div className="space-y-6">
            <Link to="/">
              <img src="/optima_logo_v3_clean_1.png" alt="OPTIMA-CV" className="h-10 w-auto object-contain brightness-0 invert opacity-90" />
            </Link>
            <p className="text-white/50 text-sm leading-relaxed max-w-sm">
              Potenciando carreras de alto nivel a través de Inteligencia Artificial y conocimiento estratégico del mercado laboral corporativo.
            </p>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-widest text-white/30 mb-4 font-headline">Herramientas</h5>
            <ul className="space-y-2.5">
              {[
                'CV Optimizer',
                'CV vs Vacante',
                'Vacantes',
              ].map((label) => (
                <li key={label}>
                  <span className="text-sm font-medium text-white/60">{label}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-widest text-white/30 mb-4 font-headline">Mi Carrera</h5>
            <ul className="space-y-2.5">
              {[
                'Mis CVs',
                'Mis Vacantes',
                'Pipeline',
              ].map((label) => (
                <li key={label}>
                  <span className="text-sm font-medium text-white/60">{label}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-widest text-white/30 mb-4 font-headline">Recursos</h5>
            <ul className="space-y-2.5">
              {[
                'Biblioteca',
                'Infografías',
                'LinkedIn Optimo',
                'Entrevista',
              ].map((label) => (
                <li key={label}>
                  <span className="text-sm font-medium text-white/60">{label}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-widest text-white/30 mb-4 font-headline">Cuenta</h5>
            <ul className="space-y-2.5">
              {[].map(({ to, label }, i) => (
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
              <p className="text-[11px] text-white/40 font-medium tracking-wide"></p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
