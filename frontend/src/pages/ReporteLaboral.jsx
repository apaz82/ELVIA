import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../services/authService'
import html2pdf from 'html2pdf.js'
import { 
  CheckCircle, Target, Briefcase, MapPin, 
  CurrencyCircleDollar, DownloadSimple, ArrowLeft,
  Quotes, Sparkle, Brain, GraduationCap, Globe,
  ChartBar, SealCheck, Buildings, SuitcaseSimple,
  Calendar, Clock, Heart, Star, TrendUp,
  User, CheckSquare, Lock, ListChecks, Hourglass,
  UsersThree, ShieldCheck, X, Compass, Wrench
} from '@phosphor-icons/react'
import HelpBadge from '../components/common/HelpBadge'

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

  // Extraer datos estratégicos con fallback robusto
  // Priorizar el contenido corregido e integrado en 'data' (saved en cv_results.contenido)
  const jsp = data || profile?.job_search_profile || {}
  const perfilInfo = jsp.perfil || {}
  const auto = jsp.autoconocimiento || {}
  const oferta = jsp.oferta || {}
  const recursos = jsp.recursos || {}
  const semana = jsp.semana || {}

  // Datos personales de cabecera
  const nombreCandidato = data?.nombreCandidato || `${perfilInfo.nombre1 || ''} ${perfilInfo.apellido1 || ''}`.trim() || 'Ejecutivo'
  const cargoDeseado = perfilInfo.nombre_cargo || data?.cargo || 'Líder Estratégico'

  // Salario y Ubicación
  const salarioMonto = perfilInfo.salario_monto || data?.salarioMinimo || '0'
  const monedaCode = perfilInfo.moneda || data?.moneda || '$'
  const ciudad = perfilInfo.ciudad || data?.ciudad || ''
  const pais = perfilInfo.pais || data?.pais || ''

  // Habilidades
  const hardSkills = auto.hard_skills || []
  const softSkills = auto.soft_skills || []
  const powerSkills = auto.power_skills || []

  // Mercado Target
  const targetIndustrias = auto.industrias || []
  const targetEmpresas = auto.top5empresas || []

  // Oferta de Valor
  const ofertaValor = oferta.oferta_valor || 'Profesional de alto impacto enfocado en resultados estratégicos.'
  const culturaLaboral = oferta.cultura || []

  // IKIGAI
  const ikigaiAmas = oferta.ikigai_amas || ''
  const ikigaiBueno = oferta.ikigai_bueno || ''
  const ikigaiNecesita = oferta.ikigai_necesita || ''
  const ikigaiPagar = oferta.ikigai_pagar || ''

  // Plan Semanal
  const semanaDias = semana.dias || []
  const semanaBloques = semana.bloques || {}
  const totalHorasSemanales = Object.values(semanaBloques).filter(Boolean).length * 2

  // Recursos Activos
  const rawRecursos = Array.isArray(recursos) ? recursos : (Array.isArray(recursos.recursos) ? recursos.recursos : [])
  const recursosActivos = rawRecursos.filter(r => r.tengo)

  return (
    <div className="bg-slate-200 min-h-screen py-8 px-4 md:px-8">
      {/* Barra de Acciones Superior */}
      <div className="max-w-[850px] mx-auto mb-8 flex items-center justify-between no-print animate-in fade-in slide-in-from-top-4 duration-700">
        <button onClick={() => navigate('/mis-cvs')} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-all bg-white/80 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-slate-200 shadow-sm font-semibold text-sm">
          <ArrowLeft size={20} weight="bold" /> Volver a mis documentos
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
          <header className="relative bg-slate-900 h-52 flex items-center px-12 overflow-hidden shrink-0">
            <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/20 blur-[100px] rounded-full -mr-20 -mt-20" />
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-indigo-600/10 blur-[80px] rounded-full -ml-32 -mb-32" />
            
            <div className="relative z-10 w-full flex justify-between items-end">
              <div>
                <p className="text-purple-400 font-black uppercase tracking-[0.3em] text-xs mb-2.5 flex items-center gap-2">
                  Infografía de Autoconocimiento
                  <span className="no-print"><HelpBadge id="reporte.main" /></span>
                </p>
                <h1 className="text-4xl font-black text-white leading-none tracking-tighter uppercase mb-2">
                  {nombreCandidato}
                </h1>
                <p className="text-slate-400 text-lg font-medium tracking-wide">
                  {cargoDeseado}
                </p>
              </div>
              <div className="text-right pb-1">
                <SealCheck size={44} weight="fill" className="text-purple-500 opacity-80" />
              </div>
            </div>
          </header>

          {/* CUERPO DE LA INFOGRAFÍA */}
          <main className="flex-1 grid grid-cols-[270px_1fr] border-b-[12px] border-slate-900 overflow-hidden">
            
            {/* SIDEBAR ESTRATÉGICO */}
            <aside className="bg-slate-50 border-r border-slate-100 p-7 space-y-8 overflow-y-auto">
              
              {/* Target & Compensation */}
              <section className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                  <Target size={16} className="text-purple-600" /> Parámetros Meta
                </h3>
                
                <div className="space-y-3">
                  <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm">
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Expectativa Salarial</p>
                    <p className="text-base font-bold text-slate-800">
                      {monedaCode} {Number(salarioMonto || 0).toLocaleString()} <span className="text-[9px] text-slate-400 italic">/ mes</span>
                    </p>
                  </div>
                  
                  <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm">
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Geografía & Modelo</p>
                    <p className="text-xs font-bold text-slate-700 leading-snug">
                      {ciudad || 'No especificada'}{ciudad && pais && ', '}{pais || ''}
                    </p>
                    {jsp.asp?.tipos_trabajo && jsp.asp.tipos_trabajo.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {jsp.asp.tipos_trabajo.map((t, i) => (
                          <span key={i} className="text-[9px] px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full font-bold uppercase">{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* Skills Visual Mastery */}
              <section className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                  <ChartBar size={16} className="text-purple-600" /> Habilidades
                </h3>
                
                {/* Habilidades Duras */}
                {hardSkills.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Hard Skills</p>
                    <div className="flex flex-wrap gap-1">
                      {hardSkills.slice(0, 6).map((s, i) => (
                        <span key={i} className="text-[10px] font-semibold bg-white border border-slate-200 text-slate-700 px-2 py-1 rounded-lg">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Soft Skills */}
                {softSkills.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Soft Skills</p>
                    <div className="flex flex-wrap gap-1">
                      {softSkills.slice(0, 6).map((s, i) => (
                        <span key={i} className="text-[10px] font-semibold bg-white border border-slate-200 text-slate-700 px-2 py-1 rounded-lg">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Power Skills */}
                {powerSkills.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Power Skills</p>
                    <div className="flex flex-wrap gap-1">
                      {powerSkills.slice(0, 6).map((s, i) => (
                        <span key={i} className="text-[10px] font-semibold bg-white border border-slate-200 text-slate-700 px-2 py-1 rounded-lg">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              {/* Target Ecosystem */}
              <section className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                  <Buildings size={16} className="text-purple-600" /> Mercado Target
                </h3>
                
                <div className="space-y-2">
                  {targetIndustrias.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {targetIndustrias.slice(0, 3).map((ind, i) => (
                        <span key={i} className="text-[9px] font-bold bg-slate-900 text-white px-2 py-0.5 rounded">{ind}</span>
                      ))}
                    </div>
                  )}
                  {targetEmpresas.length > 0 && (
                    <div className="space-y-1.5 mt-2 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-wide mb-1">Compañías Objetivo</p>
                      {targetEmpresas.slice(0, 5).map((emp, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 truncate">
                          <SuitcaseSimple size={12} className="text-purple-500" /> {emp}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              {/* Cultura Laboral */}
              {culturaLaboral.length > 0 && (
                <section className="space-y-3">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                    <UsersThree size={16} className="text-purple-600" /> Cultura Laboral
                  </h3>
                  <div className="flex flex-wrap gap-1">
                    {culturaLaboral.map((cult, i) => (
                      <span key={i} className="text-[9px] font-bold bg-rose-50 border border-rose-100 text-rose-700 px-2 py-0.5 rounded-full uppercase tracking-tight">
                        {cult}
                      </span>
                    ))}
                  </div>
                </section>
              )}
            </aside>

            {/* CONTENIDO PRINCIPAL */}
            <div className="p-8 space-y-8 bg-white overflow-y-auto">
              
              {/* LA OFERTA DE VALOR (EL HERO) */}
              <section className="relative group animate-in zoom-in-95 duration-1000 delay-200 bg-gradient-to-br from-purple-50/50 via-white to-indigo-50/30 border border-purple-100/50 p-6 rounded-2xl shadow-sm">
                <div className="absolute top-3 right-4 text-purple-200 opacity-60">
                  <Quotes size={48} weight="fill" />
                </div>
                <div className="relative border-l-4 border-purple-600 pl-6">
                  <h2 className="text-[10px] font-black uppercase tracking-widest text-purple-600 mb-2.5 flex items-center gap-1.5">
                    <Sparkle size={16} weight="fill" /> Mi Oferta de Valor Única
                  </h2>
                  <p className="text-xl font-bold text-slate-800 leading-relaxed tracking-tight italic">
                    "{ofertaValor}"
                  </p>
                </div>
              </section>

              {/* PROPÓSITO PROFESIONAL (IKIGAI) */}
              <section className="space-y-4">
                <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 border-b-2 border-slate-100 pb-2 flex items-center gap-2">
                  <Compass size={20} className="text-indigo-600" weight="duotone" /> Propósito Profesional · Método IKIGAI
                </h2>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* Amas */}
                  <div className="bg-rose-50/40 border border-rose-100/70 p-4 rounded-xl space-y-1.5">
                    <p className="text-[10px] font-black text-rose-600 uppercase tracking-wider flex items-center gap-1">
                      <Heart size={14} weight="fill" /> Lo que AMAS hacer
                    </p>
                    <p className="text-xs text-slate-600 leading-relaxed font-normal">
                      {ikigaiAmas || 'Aún no completado.'}
                    </p>
                  </div>

                  {/* Bueno */}
                  <div className="bg-violet-50/40 border border-violet-100/70 p-4 rounded-xl space-y-1.5">
                    <p className="text-[10px] font-black text-violet-600 uppercase tracking-wider flex items-center gap-1">
                      <Star size={14} weight="fill" /> En lo que eres BUENO/A
                    </p>
                    <p className="text-xs text-slate-600 leading-relaxed font-normal">
                      {ikigaiBueno || 'Aún no completado.'}
                    </p>
                  </div>

                  {/* Necesita */}
                  <div className="bg-teal-50/40 border border-teal-100/70 p-4 rounded-xl space-y-1.5">
                    <p className="text-[10px] font-black text-teal-600 uppercase tracking-wider flex items-center gap-1">
                      <Globe size={14} weight="fill" /> Lo que el mundo NECESITA
                    </p>
                    <p className="text-xs text-slate-600 leading-relaxed font-normal">
                      {ikigaiNecesita || 'Aún no completado.'}
                    </p>
                  </div>

                  {/* Pagar */}
                  <div className="bg-amber-50/40 border border-amber-100/70 p-4 rounded-xl space-y-1.5">
                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-wider flex items-center gap-1">
                      <CurrencyCircleDollar size={14} weight="fill" /> Por lo que podrían PAGARTE
                    </p>
                    <p className="text-xs text-slate-600 leading-relaxed font-normal">
                      {ikigaiPagar || 'Aún no completado.'}
                    </p>
                  </div>
                </div>
              </section>

              {/* HORARIO SEMANAL & RECURSOS */}
              <div className="grid grid-cols-[240px_1fr] gap-6">
                
                {/* Estrategia Semanal */}
                <section className="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-4">
                  <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                    <Calendar size={18} className="text-indigo-600" weight="duotone" /> Horario Semanal
                  </h2>
                  <div className="text-center py-2 bg-white border border-slate-100 rounded-xl shadow-sm">
                    <p className="text-3xl font-black text-slate-800">{totalHorasSemanales}h</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mt-0.5">Dedicación Planeada</p>
                  </div>
                  {semanaDias.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-wide">Días Activos</p>
                      <div className="flex flex-wrap gap-1">
                        {semanaDias.map((d, i) => (
                          <span key={i} className="text-[9px] font-bold bg-indigo-50 border border-indigo-100 text-indigo-600 px-2 py-0.5 rounded">
                            {d}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </section>

                {/* Recursos Activos */}
                <section className="space-y-3">
                  <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                    <Wrench size={18} className="text-indigo-600" weight="duotone" /> Recursos Activos
                  </h2>
                  {recursosActivos.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No se han registrado recursos activos en tu planeación.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {recursosActivos.map((r, i) => (
                        <div key={i} className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                          <ShieldCheck size={16} weight="fill" className="text-emerald-500 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-700 truncate">{r.nombre}</p>
                            {r.descripcion && <p className="text-[9px] text-slate-400 truncate">{r.descripcion}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

              </div>

            </div>
          </main>

          {/* FOOTER PDF */}
          <footer className="px-12 py-5 bg-slate-900 border-t border-slate-800 flex justify-between items-center text-[10px] uppercase tracking-widest shrink-0">
            <div className="flex items-center gap-2 text-slate-500">
              <SealCheck size={14} weight="fill" className="text-purple-500" />
              CONFIDENTIAL REPORT • ELVIA AI ECOSYSTEM
            </div>
            <div className="text-slate-400 font-bold">
              PLAN ESTRATÉGICO DE CARRERA © {new Date().getFullYear()}
            </div>
          </footer>

          {/* Watermark sutil */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-[30deg] pointer-events-none opacity-[0.02] text-slate-900 font-black text-[120px] whitespace-nowrap select-none">
            ELVIA PREVIEW
          </div>
        </div>
      </div>
    </div>
  )
}
