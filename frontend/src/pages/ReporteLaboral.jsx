import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../services/authService'
import html2pdf from 'html2pdf.js'
import { 
  CheckCircle, Target, Briefcase, MapPin, 
  CurrencyCircleDollar, DownloadSimple, ArrowLeft,
  Quotes, Sparkle, Brain, GraduationCap, Globe,
  ChartBar, SealCheck, Buildings, SuitcaseSimple
} from '@phosphor-icons/react'

export default function ReporteLaboral() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [descargando, setDescargando] = useState(false)
  const reporteRef = useRef(null)

  useEffect(() => {
    cargarTodo()
  }, [id])

  const cargarTodo = async () => {
    try {
      // 1. Cargar el resultado del CV (que contiene la estructura optimizada)
      const { data: row, error: cvError } = await supabase
        .from('cv_results')
        .select('user_id, contenido, metadata')
        .eq('id', id)
        .single()

      if (cvError || !row) throw new Error('No se encontró el reporte profesional')
      
      const cvContenido = JSON.parse(row.contenido)
      setData(cvContenido)

      // 2. Cargar el perfil de búsqueda laboral y autoconocimiento del usuario
      const { data: prof, error: pError } = await supabase
        .from('profiles')
        .select('job_search_profile, autoconocimiento')
        .eq('id', row.user_id)
        .single()
      
      if (!pError && prof) {
        setProfile(prof)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDescargar = () => {
    if (!reporteRef.current) return
    setDescargando(true)

    const element = reporteRef.current
    const opt = {
      margin:       0,
      filename:     `Infografia_Ejecutiva_${data?.nombreCandidato?.replace(/\s+/g, '_') || 'ELVIA'}.pdf`,
      image:        { type: 'jpeg', quality: 1 },
      html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    }

    html2pdf().from(element).set(opt).save().then(() => setDescargando(false))
  }

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-4" />
      <p className="text-gray-500 font-medium">Renderizando tu Infografía de Clase Mundial...</p>
    </div>
  )
  if (error) return <div className="min-h-screen pt-24 text-center text-red-500 font-bold">{error}</div>

  // Extraer datos estratégicos
  const jsp = profile?.job_search_profile || {}
  const auto = profile?.autoconocimiento || {}
  const ofertaValor = jsp.oferta?.oferta_valor || data?.resumen || 'Profesional de alto impacto enfocado en resultados estratégicos.'
  const targetIndustrias = jsp.autoconocimiento?.industrias || data?.sectoresInteres || []
  const targetEmpresas = jsp.autoconocimiento?.top5empresas || data?.empresasMock || []
  
  return (
    <div className="bg-slate-200 min-h-screen py-8 px-4 md:px-8">
      {/* Barra de Acciones Superior */}
      <div className="max-w-[850px] mx-auto mb-8 flex items-center justify-between no-print animate-in fade-in slide-in-from-top-4 duration-700">
        <button onClick={() => navigate('/mis-cvs')} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-all bg-white/80 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-slate-200 shadow-sm font-semibold text-sm">
          <ArrowLeft size={20} weight="bold" /> Volver a mi Dashboard
        </button>
        <button 
          onClick={handleDescargar}
          disabled={descargando}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold px-6 py-3 rounded-2xl transition-all shadow-lg shadow-purple-200 disabled:opacity-50 active:scale-95"
        >
          <DownloadSimple size={22} weight="bold" /> {descargando ? 'Generando PDF...' : 'Descargar Infografía (A4/Carta)'}
        </button>
      </div>

      {/* ÁREA DE INFOGRAFÍA (Capturada por html2pdf) */}
      <div className="w-full flex justify-center no-select">
        <div 
          ref={reporteRef} 
          className="bg-white shadow-[0_0_50px_rgba(0,0,0,0.1)] relative overflow-hidden flex flex-col" 
          style={{ width: '8.5in', minHeight: '11in', boxSizing: 'border-box' }}
        >
          {/* HEADER PREMIUM */}
          <header className="relative bg-slate-900 h-56 flex items-center px-12 overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/20 blur-[100px] rounded-full -mr-20 -mt-20" />
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-indigo-600/10 blur-[80px] rounded-full -ml-32 -mb-32" />
            
            <div className="relative z-10 w-full flex justify-between items-end">
              <div>
                <p className="text-purple-400 font-black uppercase tracking-[0.3em] text-xs mb-3">Infografía Ejecutiva</p>
                <h1 className="text-5xl font-black text-white leading-none tracking-tighter uppercase mb-2">
                  {data?.nombreCandidato || 'EJECUTIVO'}
                </h1>
                <p className="text-slate-400 text-xl font-medium tracking-wide">
                  {jsp.perfil?.nombre_cargo || data?.cargo || 'Líder Estratégico'}
                </p>
              </div>
              <div className="text-right pb-1">
                <SealCheck size={48} weight="fill" className="text-purple-500 opacity-80" />
              </div>
            </div>
          </header>

          {/* CUERPO DE LA INFOGRAFÍA */}
          <main className="flex-1 grid grid-cols-[280px_1fr] border-b-[12px] border-slate-900">
            
            {/* SIDEBAR ESTRATÉGICO */}
            <aside className="bg-slate-50 border-r border-slate-100 p-8 space-y-10">
              
              {/* Target & Compensation */}
              <section className="space-y-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                  <Target size={18} className="text-purple-600" /> Parímetros Meta
                </h3>
                
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Expectativa Salarial</p>
                    <p className="text-lg font-bold text-slate-800">
                      {jsp.perfil?.moneda || data?.moneda || '$'} {Number(jsp.perfil?.salario_monto || data?.salarioMinimo || 0).toLocaleString()} <span className="text-[10px] text-slate-400 italic">/ mes</span>
                    </p>
                  </div>
                  
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Geografía & Modelo</p>
                    <p className="text-sm font-bold text-slate-700 leading-snug">
                      {jsp.perfil?.ciudad || data?.ciudad}, {jsp.perfil?.pais || data?.pais}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {(jsp.asp?.tipos_trabajo || data?.esquemasTrabajo || []).map((t, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full font-bold uppercase">{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* Skills Visual Mastery */}
              <section className="space-y-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                  <ChartBar size={18} className="text-purple-600" /> Mastery Index
                </h3>
                
                {/* Habilidades Duras */}
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Hard Skills</p>
                  {(auto.hard_skills || ['Estrategia', 'Liderazgo', 'Operaciones']).slice(0, 5).map((s, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-slate-600">
                        <span>{s}</span>
                        <span className="text-purple-500">90%</span>
                      </div>
                      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 w-[90%]" />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Soft Skills */}
                <div className="space-y-2 pt-2">
                  <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Soft Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(auto.soft_skills || ['Comunicación', 'Negociación', 'Resiliencia']).map((s, i) => (
                      <span key={i} className="text-[10px] font-bold bg-white border border-slate-200 text-slate-600 px-2 py-1 rounded-lg italic"># {s}</span>
                    ))}
                  </div>
                </div>
              </section>

              {/* Target Ecosystem */}
              <section className="space-y-5">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                  <Buildings size={18} className="text-purple-600" /> Mercado Target
                </h3>
                
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-1.5">
                    {targetIndustrias.slice(0, 3).map((ind, i) => (
                      <span key={i} className="text-[10px] font-bold bg-slate-900 text-white px-2.5 py-1 rounded-md">{ind}</span>
                    ))}
                  </div>
                  <div className="space-y-2 mt-2">
                    {targetEmpresas.slice(0, 5).map((emp, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs font-bold text-slate-600">
                        <SuitcaseSimple size={14} className="text-purple-400" /> {emp}
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </aside>

            {/* CONTENIDO PRINCIPAL */}
            <div className="p-10 space-y-12 bg-white">
              
              {/* LA OFERTA DE VALOR (EL HERO) */}
              <section className="relative group animate-in zoom-in-95 duration-1000 delay-200">
                <div className="absolute -left-6 top-0 text-purple-100">
                  <Quotes size={80} weight="fill" />
                </div>
                <div className="relative pl-10 border-l-4 border-purple-600">
                  <h2 className="text-xs font-black uppercase tracking-widest text-purple-600 mb-4 flex items-center gap-2">
                    <Sparkle size={20} weight="fill" /> Mi Oferta de Valor Única
                  </h2>
                  <p className="text-2xl font-bold text-slate-800 leading-[1.4] tracking-tight italic">
                    "{ofertaValor}"
                  </p>
                </div>
              </section>

              {/* EXPERIENCIA PROFESIONAL (TIMELINE) */}
              <section>
                <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-8 border-b-2 border-slate-100 pb-3 flex items-center gap-2">
                  <SuitcaseSimple size={20} className="text-indigo-600" /> Trayectoria de Alto Impacto
                </h2>
                
                <div className="space-y-10 relative">
                  {/* Timeline vertical line */}
                  <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-slate-100" />

                  {(data?.experiencia || []).slice(0, 3).map((exp, i) => (
                    <div key={i} className="relative pl-8">
                      {/* Node point */}
                      <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full border-4 border-indigo-600 bg-white" />
                      
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="text-xl font-bold text-slate-800 leading-none mb-1 uppercase tracking-tight">{exp.cargo}</h4>
                          <p className="text-indigo-600 font-bold text-sm">{exp.empresa}</p>
                        </div>
                        <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-3 py-1 rounded-full uppercase italic">
                          {exp.periodo}
                        </span>
                      </div>
                      
                      <ul className="space-y-2 mt-4">
                        {(exp.bullets || []).slice(0, 3).map((b, j) => (
                          <li key={j} className="text-sm text-slate-600 flex items-start gap-2 leading-relaxed">
                            <CheckCircle size={16} className="text-purple-400 shrink-0 mt-0.5" weight="bold" />
                            {b}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>

              {/* GRID INTERIOR: EDUCACIÓN & IDIOMAS */}
              <div className="grid grid-cols-2 gap-10">
                {/* Educación */}
                <section>
                  <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 border-b-2 border-slate-100 pb-3 flex items-center gap-2">
                    <GraduationCap size={20} className="text-indigo-600" /> Formación
                  </h2>
                  <div className="space-y-6">
                    {(data?.educacion || []).slice(0, 2).map((edu, i) => (
                      <div key={i}>
                        <h4 className="text-sm font-bold text-slate-800 mb-0.5 uppercase tracking-tighter">{edu.titulo}</h4>
                        <p className="text-xs text-slate-500 font-medium">{edu.institucion}</p>
                        <p className="text-[10px] text-slate-400 font-bold mt-1">{edu.anio}</p>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Idiomas & Global */}
                <section>
                  <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 border-b-2 border-slate-100 pb-3 flex items-center gap-2">
                    <Globe size={20} className="text-indigo-600" /> Global Mindset
                  </h2>
                  <div className="space-y-4">
                    {(jsp.perfil?.idiomas || data?.idiomas || []).map((lang, i) => (
                      <div key={i} className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-2">
                          <SealCheck size={16} className="text-emerald-500" weight="fill" />
                          <span className="text-sm font-bold text-slate-700">{lang.idioma}</span>
                        </div>
                        <span className="text-[10px] font-black bg-white text-indigo-600 px-2 py-0.5 rounded-lg border border-indigo-100 uppercase tracking-tighter">
                          Level: {lang.nivel}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

            </div>
          </main>

          {/* FOOTER PDF */}
          <footer className="px-12 py-6 bg-slate-900 border-t border-slate-800 flex justify-between items-center text-[10px] uppercase tracking-widest">
            <div className="flex items-center gap-2 text-slate-500">
              <SealCheck size={14} weight="fill" className="text-purple-500" />
              CONFIDENTIAL REPORT • ELVIA AI ECOSYSTEM
            </div>
            <div className="text-slate-400 font-bold">
              PLAN ESTRATÉGICO DE CARRERA © {new Date().getFullYear()}
            </div>
          </footer>

          {/* Watermark sutil (visible solo en digital, no distrae) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-[30deg] pointer-events-none opacity-[0.03] text-slate-900 font-black text-[200px] whitespace-nowrap select-none">
            ELVIA PREVIEW
          </div>
        </div>
      </div>
    </div>
  )
}
