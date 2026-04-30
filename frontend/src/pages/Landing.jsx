import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle } from '@phosphor-icons/react'

// ─── Países ──────────────────────────────────────────────────────────────────
const PAISES = [
  { value: 'Colombia',       code: '+57'  },
  { value: 'México',         code: '+52'  },
  { value: 'Argentina',      code: '+54'  },
  { value: 'Chile',          code: '+56'  },
  { value: 'Perú',           code: '+51'  },
  { value: 'Ecuador',        code: '+593' },
  { value: 'Venezuela',      code: '+58'  },
  { value: 'Bolivia',        code: '+591' },
  { value: 'Paraguay',       code: '+595' },
  { value: 'Uruguay',        code: '+598' },
  { value: 'Costa Rica',     code: '+506' },
  { value: 'Guatemala',      code: '+502' },
  { value: 'Honduras',       code: '+504' },
  { value: 'Panamá',         code: '+507' },
  { value: 'España',         code: '+34'  },
  { value: 'Estados Unidos', code: '+1'   },
  { value: 'Otro',           code: ''     },
]

const TEASERS = [
  {
    label: 'Gerente de Búsqueda',
    desc: 'Seis pilares estratégicos que convierten tu búsqueda en un proyecto con resultados medibles.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
  {
    label: 'CV Harvard Standard',
    desc: 'Optimización ATS con IA, análisis de compatibilidad por vacante y entrega en PDF o Word.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
  },
  {
    label: 'LinkedIn® Pro',
    desc: 'Convierte tu perfil en un imán de oportunidades. Extracto magnético, keywords estratégicos, SSI aumentado.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
      </svg>
    ),
  },
]

export default function Landing() {
  const [form, setForm]     = useState({ nombre: '', apellido: '', indicativo: '', telefono: '', pais: '', email: '', situacion: '', aceptaPrivacidad: false })
  const [status, setStatus] = useState({ loading: false, success: false, error: null })

  // Auto-detect país por idioma del navegador
  useEffect(() => {
    if (window.location.hostname !== 'localhost') {
      fetch((import.meta.env.VITE_API_URL || '') + '/api/waitlist/track', { method: 'POST' }).catch(() => {})
    }
    const lang = navigator.language || ''
    let defaultCountry = 'México'
    if (lang.includes('es-CO')) defaultCountry = 'Colombia'
    else if (lang.includes('es-AR')) defaultCountry = 'Argentina'
    else if (lang.includes('es-CL')) defaultCountry = 'Chile'
    else if (lang.includes('en'))    defaultCountry = 'Estados Unidos'
    const pais = PAISES.find(p => p.value === defaultCountry) || PAISES[0]
    setForm(f => ({ ...f, pais: pais.value, indicativo: pais.code }))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.nombre || form.nombre.length < 2)   { setStatus({ loading: false, success: false, error: 'Nombre inválido' }); return }
    if (!form.apellido || form.apellido.length < 2) { setStatus({ loading: false, success: false, error: 'Apellido inválido' }); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setStatus({ loading: false, success: false, error: 'Email inválido' }); return }
    if (!form.situacion) { setStatus({ loading: false, success: false, error: 'Selecciona tu situación actual' }); return }
    if (!form.aceptaPrivacidad) { setStatus({ loading: false, success: false, error: 'Acepta la política de privacidad' }); return }

    setStatus({ loading: true, success: false, error: null })
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      const res  = await fetch(`${API_URL}/api/waitlist`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al unirte')
      setStatus({ loading: false, success: true, error: null })
      setForm({ nombre: '', apellido: '', indicativo: '', telefono: '', pais: '', email: '', situacion: '', aceptaPrivacidad: false })
    } catch (err) {
      setStatus({ loading: false, success: false, error: err.message })
    }
  }

  const scrollToForm = () => document.getElementById('waitlist')?.scrollIntoView({ behavior: 'smooth', block: 'center' })

  return (
    <div className="min-h-screen bg-[#09090E] text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* ── Ambient glow ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #E8541A 0%, transparent 70%)' }} />
        <div className="absolute top-1/3 -right-40 w-[400px] h-[400px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #F59E0B 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 -left-20 w-[300px] h-[300px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #E8541A 0%, transparent 70%)' }} />
      </div>

      {/* ── Navbar ── */}
      <nav className="relative z-20 flex items-center justify-between px-6 md:px-12 py-5">
        <span className="text-xl font-black tracking-tight">
          ELVIA<span className="text-[#E8541A]">®</span>
        </span>
        <Link to="/auth"
          className="text-sm font-semibold text-white/70 hover:text-white transition-colors cursor-pointer">
          Iniciar sesión
        </Link>
      </nav>

      {/* ── Hero ── */}
      <section className="relative z-10 flex flex-col items-center text-center px-6 pt-16 pb-20 md:pt-28 md:pb-32">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-[#E8541A]/10 border border-[#E8541A]/30 text-[#E8541A] text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-[#E8541A] animate-pulse" />
          Muy pronto
        </div>

        {/* Headline */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black leading-tight max-w-4xl mb-6"
          style={{ letterSpacing: '-0.03em' }}>
          Tú serás el{' '}
          <span style={{ background: 'linear-gradient(135deg, #E8541A 0%, #F59E0B 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            protagonista
          </span>
          {' '}de tu transición laboral.
        </h1>

        {/* Sub-copy */}
        <p className="text-lg md:text-xl text-white/50 max-w-2xl leading-relaxed mb-10">
          La primera plataforma de acompañamiento estratégico para profesionales en LATAM.
          Mentorías de clase mundial, accesibles para todos.
        </p>

        {/* CTA */}
        <button onClick={scrollToForm}
          className="inline-flex items-center gap-2 bg-[#E8541A] hover:bg-[#D04010] text-white font-bold text-base px-8 py-4 rounded-2xl transition-all duration-200 shadow-xl cursor-pointer"
          style={{ boxShadow: '0 0 32px rgba(232,84,26,0.35)' }}>
          Acceso prioritario
          <ArrowRight size={18} weight="bold" />
        </button>

        <p className="mt-4 text-xs text-white/30">Sin tarjeta de crédito · Gratis</p>
      </section>

      {/* ── Teasers ── */}
      <section className="relative z-10 px-6 md:px-12 pb-24 max-w-5xl mx-auto">
        <p className="text-center text-xs font-bold uppercase tracking-widest text-white/30 mb-8">Lo que viene</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TEASERS.map((t) => (
            <div key={t.label}
              className="relative group p-6 rounded-2xl border border-white/8 bg-white/4 backdrop-blur-sm overflow-hidden cursor-default"
              style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{ background: 'radial-gradient(circle at 50% 0%, rgba(232,84,26,0.08) 0%, transparent 60%)' }} />
              <div className="text-[#E8541A] mb-4">{t.icon}</div>
              <h3 className="font-bold text-white text-sm mb-2">{t.label}</h3>
              <p className="text-white/40 text-xs leading-relaxed">{t.desc}</p>
              <div className="mt-4 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#E8541A]/60 border border-[#E8541A]/20 px-2.5 py-1 rounded-full">
                <span className="w-1 h-1 rounded-full bg-[#E8541A]/60 animate-pulse" />
                Próximamente
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Waitlist form ── */}
      <section id="waitlist" className="relative z-10 px-6 md:px-12 pb-32">
        <div className="max-w-2xl mx-auto">

          {/* Header form */}
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-black mb-3" style={{ letterSpacing: '-0.02em' }}>
              Sé de los primeros.
            </h2>
            <p className="text-white/50 text-base">
              Únete a la lista de espera y recibe acceso prioritario con beneficios exclusivos de fundadores.
            </p>
          </div>

          {/* Card */}
          <div className="rounded-3xl border border-white/10 p-8 md:p-10"
            style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(12px)' }}>

            {status.success ? (
              <div className="flex flex-col items-center gap-4 py-8 text-center">
                <CheckCircle size={48} weight="duotone" className="text-emerald-400" />
                <h3 className="text-xl font-bold">¡Ya estás en la lista!</h3>
                <p className="text-white/50 text-sm max-w-xs">
                  Te escribiremos al email registrado con tus acceso prioritario cuando lancemos.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input required type="text" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                    placeholder="Nombre"
                    className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8541A]/50 placeholder-white/25 transition-all" />
                  <input required type="text" value={form.apellido} onChange={e => setForm(f => ({ ...f, apellido: e.target.value }))}
                    placeholder="Apellido"
                    className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8541A]/50 placeholder-white/25 transition-all" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <select required value={form.pais} onChange={e => {
                    const pais = PAISES.find(p => p.value === e.target.value)
                    setForm(f => ({ ...f, pais: e.target.value, indicativo: pais?.code || '' }))
                  }} className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8541A]/50 appearance-none cursor-pointer">
                    <option value="" disabled className="bg-gray-900">País</option>
                    {PAISES.map(p => <option key={p.value} value={p.value} className="bg-gray-900">{p.value}</option>)}
                  </select>
                  <input type="tel" value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))}
                    placeholder={`Teléfono ${form.indicativo ? `(${form.indicativo})` : ''} (opcional)`}
                    className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8541A]/50 placeholder-white/25" />
                </div>

                <input required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="Email profesional"
                  className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8541A]/50 placeholder-white/25 transition-all" />

                <select required value={form.situacion} onChange={e => setForm(f => ({ ...f, situacion: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8541A]/50 appearance-none cursor-pointer">
                  <option value="" disabled className="bg-gray-900">¿Cuál es tu situación actual?</option>
                  <option value="Sin empleo y en búsqueda activa" className="bg-gray-900">Sin empleo y en búsqueda activa</option>
                  <option value="Con empleo y en búsqueda activa" className="bg-gray-900">Con empleo y en búsqueda activa</option>
                  <option value="Quiero gestionar mi siguiente paso" className="bg-gray-900">Quiero gestionar mi siguiente paso</option>
                </select>

                {/* Privacidad */}
                <label className="flex items-start gap-3 cursor-pointer group pt-1">
                  <input type="checkbox" required checked={form.aceptaPrivacidad} onChange={e => setForm(f => ({ ...f, aceptaPrivacidad: e.target.checked }))}
                    className="mt-0.5 w-4 h-4 rounded accent-[#E8541A] cursor-pointer flex-shrink-0" />
                  <span className="text-xs text-white/40 leading-relaxed group-hover:text-white/60 transition-colors">
                    Acepto la{' '}
                    <Link to="/privacidad" className="underline text-white/60 hover:text-white transition-colors">política de privacidad</Link>
                    {' '}y el consentimiento para recibir comunicaciones estratégicas de ELVIA®.
                  </span>
                </label>

                {status.error && (
                  <p className="text-red-400 text-xs font-medium">{status.error}</p>
                )}

                <button disabled={status.loading} type="submit"
                  className="w-full flex items-center justify-center gap-2 text-white font-black text-base px-6 py-4 rounded-2xl transition-all duration-200 disabled:opacity-50 cursor-pointer"
                  style={{ background: 'linear-gradient(135deg, #E8541A 0%, #F59E0B 100%)', boxShadow: '0 0 24px rgba(232,84,26,0.30)' }}>
                  {status.loading ? 'Procesando...' : 'Quiero acceso prioritario'}
                  {!status.loading && <ArrowRight size={18} weight="bold" />}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-white/8 px-6 py-8 text-center">
        <p className="text-xs text-white/25">
          © {new Date().getFullYear()} ELVIA® · Ecosistema Integral de Acompañamiento en Transición Laboral ·{' '}
          <Link to="/privacidad" className="hover:text-white/50 transition-colors underline">Privacidad</Link>
        </p>
      </footer>
    </div>
  )
}
