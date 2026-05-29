import { useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../services/authService'
import { descargarCV } from '../services/cvService'
import FeatureLocked from '../components/common/FeatureLocked'
import HelpBadge from '../components/common/HelpBadge'
import LinkedinReportePDF from '../components/LinkedinReportePDF'
import ReporteCompensacion from '../components/ReporteCompensacion'
import { FilePdf, LinkedinLogo } from '@phosphor-icons/react'

const extraerNombre = (contenido) => {
  if (!contenido) return 'CV sin nombre'
  return contenido.split('\n').find(l => l.trim().length > 2)?.trim() || 'CV sin nombre'
}

const formatFecha = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const colorScore = (score) => {
  if (score >= 70) return 'text-green-600'
  if (score >= 50) return 'text-amber-500'
  return 'text-red-400'
}

const badgeScore = (score) => {
  if (score >= 70) return 'bg-green-50 border-green-200 text-green-700'
  if (score >= 50) return 'bg-amber-50 border-amber-200 text-amber-700'
  return 'bg-red-50 border-red-200 text-red-600'
}

const parsearJobKey = (key = '') => {
  const [titulo, empresa] = key.split('|')
  return { titulo: titulo?.trim() || key, empresa: empresa?.trim() || '' }
}

function BotonesDescarga({ id, descargando, onDescargar, soloSiOptimizado = false, score = null }) {
  if (soloSiOptimizado && score !== null && score < 70) {
    return (
      <span className="text-xs text-gray-400 italic">No disponible (compatibilidad {'<'} 70%)</span>
    )
  }
  return (
    <div className="flex gap-2 shrink-0">
      <button onClick={() => onDescargar(id, 'pdf')} disabled={!!descargando[id]}
        className="text-xs border border-gray-300 text-gray-600 hover:border-primary hover:text-primary rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50">
        {descargando[id] === 'pdf' ? '...' : '↓ PDF'}
      </button>
      <button onClick={() => onDescargar(id, 'word')} disabled={!!descargando[id]}
        className="text-xs border border-gray-300 text-gray-600 hover:border-primary hover:text-primary rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50">
        {descargando[id] === 'word' ? '...' : '↓ Word'}
      </button>
    </div>
  )
}

function InfoVacante({ title, company, location, link, via, snippet, jobText }) {
  const [verTexto, setVerTexto] = useState(false)
  return (
    <div className="mt-3 bg-gray-50 border border-gray-200 rounded-lg p-3">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Vacante</p>
      <p className="text-sm font-semibold text-gray-800">{title}</p>
      {company && <p className="text-xs text-gray-600 mt-0.5 font-medium">{company}</p>}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
        {location && (
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            {location}
          </span>
        )}
        {via && <span className="text-xs text-gray-400 bg-white border border-gray-200 rounded px-1.5 py-0.5">{via}</span>}
      </div>
      {snippet && <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">{snippet}</p>}
      {link && (
        <a href={link} target="_blank" rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
          Ver vacante original
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
          </svg>
        </a>
      )}
      {jobText && (
        <div className="mt-2 border-t border-gray-200 pt-2">
          <button
            onClick={() => setVerTexto(v => !v)}
            className="text-xs text-gray-500 hover:text-gray-700 font-medium flex items-center gap-1 transition-colors"
          >
            <svg className={`w-3 h-3 transition-transform ${verTexto ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
            </svg>
            {verTexto ? 'Ocultar descripción' : 'Ver descripción de la vacante'}
          </button>
          {verTexto && (
            <pre className="mt-2 text-[11px] text-gray-600 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto bg-white border border-gray-100 rounded-lg p-3">
              {jobText}
            </pre>
          )}
        </div>
      )}
    </div>
  )
}

export default function MisCVs() {
  const { user, loading: authLoading, featuresDesbloqueadas } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [cvsOptimizados, setCvsOptimizados] = useState([])
  const [cvsOriginal,    setCvsOriginal]    = useState([])
  const [cvsMatch,       setCvsMatch]       = useState([])
  const [cvsReportes,    setCvsReportes]    = useState([])
  const [cvsLinkedin,    setCvsLinkedin]    = useState([])
  const [cvsEntrevistas, setCvsEntrevistas] = useState([])
  const [cvsReporteComp, setCvsReporteComp] = useState([])
  const [checks, setChecks]                 = useState([])
  const [loading, setLoading]               = useState(true)
  const [descargando, setDescargando]       = useState({})
  // Tab inicial desde query string (?tab=reportes lo usa Entrevista, ?tab=linkedin lo usa LinkedinPro)
  const tabParam = searchParams.get('tab')
  const tabInicial = ['linkedin','reportes','match','compatibilidades','original'].includes(tabParam) ? tabParam : 'optimizados'
  const [tab, setTab]                       = useState(tabInicial)
  const [filtroCompatibilidad, setFiltroCompatibilidad] = useState('todos')
  const [seleccionados, setSeleccionados]   = useState(new Set())

  if (authLoading) return null

  if (!featuresDesbloqueadas) {
    return (
      <FeatureLocked
        titulo="Mis documentos guardados"
        descripcion="Administra tus CVs optimizados, reportes ejecutivos e historial de compatibilidad."
        icono={<FilePdf size={44} weight="light" />}
      />
    )
  }

  useEffect(() => {
    if (authLoading) return
    if (!user) { navigate('/auth'); return }
    cargarTodo()
  }, [user, authLoading])

  const cargarTodo = async () => {
    setLoading(true)
    const [{ data: cvData }, { data: checkData }, { data: savedData }] = await Promise.all([
      supabase.from('cv_results')
        .select('id, tipo, contenido, metadata, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase.from('job_checks')
        .select('id, job_key, score, motivos, job_data, created_at')
        .eq('user_id', user.id)
        .order('score', { ascending: false }),
      supabase.from('saved_jobs')
        .select('job_key, job_data')
        .eq('user_id', user.id),
    ])

    const savedMap = {}
    ;(savedData || []).forEach(s => { savedMap[s.job_key] = s.job_data })

    const todos = (cvData || []).map(cv => ({
      ...cv,
      // Normalizar subtipo para facilitar filtrado
      subtipo: cv.metadata?.subtipo || (cv.tipo === 'original' ? 'subida_usuario' : 'optimizacion_ia')
    }))

    // Categorización inteligente:
    // - Optimizados: tipo 'optimize' (incluye desde_cero y optimizacion_ia)
    // - Originales: tipo 'original'
    // - Reportes: subtipo 'infografia' o tipo 'infografia_proyecto' (legacy)
    
    // Optimizados: excluir infografía Y análisis LinkedIn (que tienen su propia tab)
    const SUBTIPOS_REPORTE = ['infografia_proyecto', 'linkedin_analysis', 'entrevista_simulada', 'reporte_compensacion']
    setCvsOptimizados(todos.filter(c => c.tipo === 'optimize' && !SUBTIPOS_REPORTE.includes(c.subtipo)))
    setCvsOriginal(todos.filter(c => c.tipo === 'original'))
    // Reportes: infografías + LinkedIn + entrevistas + compensación (todo lo que no es CV)
    const ahora = new Date()
    const entrevistas = todos.filter(c => c.subtipo === 'entrevista_simulada').map(c => ({
      ...c,
      expirado: c.metadata?.expires_at ? new Date(c.metadata.expires_at) < ahora : false,
      diasRestantes: c.metadata?.expires_at
        ? Math.max(0, Math.ceil((new Date(c.metadata.expires_at) - ahora) / (1000 * 60 * 60 * 24)))
        : null,
    }))
    setCvsEntrevistas(entrevistas)
    setCvsReportes(todos.filter(c => c.subtipo === 'infografia_proyecto'))
    setCvsLinkedin(todos.filter(c => c.subtipo === 'linkedin_analysis'))
    setCvsReporteComp(todos.filter(c => c.subtipo === 'reporte_compensacion'))
    
    setCvsMatch(todos.filter(c => c.tipo === 'match').map(cv => {
      const jobTitle   = cv.metadata?.jobData?.title || ''
      const jobCompany = cv.metadata?.jobData?.company || cv.metadata?.jobData?.empresa || ''
      const jobKey     = `${jobTitle.toLowerCase().trim()}|${jobCompany.toLowerCase().trim()}`
      return { ...cv, savedJob: savedMap[jobKey] || null }
    }))
    setChecks((checkData || []).map(c => ({
      ...c,
      jobData: c.job_data || savedMap[c.job_key] || null,
    })))
    setLoading(false)
  }

  const handleDescargar = async (id, formato) => {
    setDescargando(d => ({ ...d, [id]: formato }))
    try { await descargarCV(id, formato) }
    finally { setDescargando(d => ({ ...d, [id]: null })) }
  }

  const descargarLinkedinPDF = async (item) => {
    try {
      const { default: html2pdf } = await import('html2pdf.js')
      const meta = item.metadata || {}
      const nombreArchivo = (meta.filename || 'Analisis LinkedIn').replace(/_/g, ' ').replace(/\.pdf$/i, '')

      let payload = {}
      try {
        payload = typeof item.contenido === 'string' ? JSON.parse(item.contenido) : (item.contenido || {})
      } catch { /* usa vacío */ }

      const contenedor = document.createElement('div')
      contenedor.style.position = 'fixed'
      contenedor.style.left = '-9999px'
      contenedor.style.top = '0'
      document.body.appendChild(contenedor)

      const root = createRoot(contenedor)
      await new Promise(resolve => {
        root.render(
          <LinkedinReportePDF
            analisis={payload.analisis || payload}
            editables={payload.editables || {}}
            original={payload.original || {}}
          />
        )
        setTimeout(resolve, 300)
      })

      await html2pdf().set({
        margin: 8,
        filename: `${nombreArchivo}.pdf`,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      }).from(contenedor.firstChild).save()

      root.unmount()
      document.body.removeChild(contenedor)
    } catch (err) {
      console.error('[descargarLinkedinPDF]', err)
      alert('No se pudo generar el PDF. Intenta de nuevo.')
    }
  }

  const descargarReporteCompPDF = async (item) => {
    try {
      // Si tenemos el PDF pre-generado en base64, usarlo directamente
      const meta = item.metadata || {}
      if (meta.pdf_base64) {
        const byteChars = atob(meta.pdf_base64)
        const byteArr = new Uint8Array(byteChars.length)
        for (let i = 0; i < byteChars.length; i++) byteArr[i] = byteChars.charCodeAt(i)
        const blob = new Blob([byteArr], { type: 'application/pdf' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = meta.filename || 'Reporte de Compensacion.pdf'
        a.click()
        URL.revokeObjectURL(url)
        return
      }

      // Fallback: regenerar con html2pdf
      const { default: html2pdf } = await import('html2pdf.js')
      let payload = {}
      try {
        payload = typeof item.contenido === 'string' ? JSON.parse(item.contenido) : (item.contenido || {})
      } catch { /* usa vacío */ }

      const contenedor = document.createElement('div')
      contenedor.style.position = 'fixed'
      contenedor.style.left = '-9999px'
      contenedor.style.top = '0'
      document.body.appendChild(contenedor)

      const root = createRoot(contenedor)
      await new Promise(resolve => {
        root.render(
          <ReporteCompensacion
            data={payload}
            nombre={meta.nombre || 'Ejecutivo'}
          />
        )
        setTimeout(resolve, 400)
      })

      await html2pdf().set({
        margin: 0,
        filename: meta.filename || 'Reporte de Compensacion.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'px', format: [794, 1123], orientation: 'portrait' },
      }).from(contenedor.firstChild).save()

      root.unmount()
      document.body.removeChild(contenedor)
    } catch (err) {
      console.error('[descargarReporteCompPDF]', err)
      alert('No se pudo generar el PDF. Intenta de nuevo.')
    }
  }

  const eliminarCheck = async (id) => {
    await supabase.from('job_checks').delete().eq('id', id)
    setChecks(prev => prev.filter(c => c.id !== id))
    setSeleccionados(prev => { const s = new Set(prev); s.delete(id); return s })
  }

  const eliminarSeleccionados = async () => {
    const ids = [...seleccionados]
    await supabase.from('job_checks').delete().in('id', ids)
    setChecks(prev => prev.filter(c => !seleccionados.has(c.id)))
    setSeleccionados(new Set())
  }

  const toggleSeleccion = (id) => {
    setSeleccionados(prev => {
      const s = new Set(prev)
      s.has(id) ? s.delete(id) : s.add(id)
      return s
    })
  }

  const EmptyState = ({ mensaje, cta, ruta }) => (
    <div className="text-center py-16 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
      <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 border border-gray-100">
        <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
      </div>
      <p className="text-base text-gray-500 font-medium">{mensaje}</p>
      <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
        Construido y optimizado por mentores de carrera expertos y tecnología de última generación.
      </p>
      <button onClick={() => navigate(ruta)} 
        className="mt-6 px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-md shadow-primary/20">
        {cta}
      </button>
    </div>
  )

  // Filtrar compatibilidades
  const checksFiltrados = checks.filter(c => {
    if (filtroCompatibilidad === 'alto') return c.score >= 70
    if (filtroCompatibilidad === 'bajo') return c.score < 70
    return true
  })

  const checksAlto = checks.filter(c => c.score >= 70).length
  const checksBajo = checks.filter(c => c.score < 70).length

  const totalReportes = cvsLinkedin.length + cvsEntrevistas.length + cvsReportes.length + cvsReporteComp.length
  const tabs = [
    { key: 'optimizados',      label: `CV Optimizado (${cvsOptimizados.length})` },
    // Mostrar tab CV Inicial solo si hay documentos originales guardados
    ...(cvsOriginal.length > 0 ? [{ key: 'original', label: `CV Inicial (${cvsOriginal.length})` }] : []),
    { key: 'reportes',         label: `Reportes (${totalReportes})` },
    { key: 'compatibilidades', label: `Análisis Rápidos (${checks.length})` },
    { key: 'match',            label: `CV Adaptados (${cvsMatch.length})` },
  ]

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 transition-all duration-500">
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Mis Documentos</h1>
        <p className="mt-3 text-lg text-gray-500 max-w-2xl">
          Tu ecosistema de carrera centralizado. Optimizado por expertos y tecnología ELVIA®.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit flex-wrap">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`text-sm font-medium py-2 px-4 rounded-lg transition-colors ${tab === t.key ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400 text-sm">Cargando historial...</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">

          {/* Tab 1: CV Optimizado */}
          {tab === 'optimizados' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3 mb-2">
                <h3 className="text-sm font-bold text-gray-800">CVs Optimizados</h3>
                <HelpBadge id="miscvs.optimizados" />
              </div>
              {cvsOptimizados.length === 0
              ? <EmptyState mensaje="Aún no tienes documentos generados." cta="Crear mi CV ahora" ruta="/cv-desde-cero" />
              : <div className="space-y-4">
                  {cvsOptimizados.map((item, idx) => (
                    <div key={item.id} className={`group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white rounded-2xl hover:shadow-xl transition-all duration-300 ${idx === 0 ? 'border-2 border-primary/30 hover:border-primary/50' : 'border border-gray-100 hover:border-primary/30 hover:shadow-primary/5'}`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg ${
                            item.subtipo === 'desde_cero'
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                              : 'bg-primary/5 text-primary border border-primary/10'
                          }`}>
                            {item.subtipo === 'desde_cero' ? 'Perfect Resume' : 'IA Optimized'}
                          </span>
                          {idx === 0 && (
                            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-indigo-600 text-white">
                              CV Base
                            </span>
                          )}
                          {item.metadata?.language && (
                            <span className="text-[10px] font-bold text-gray-400 uppercase bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                              {item.metadata.language}
                            </span>
                          )}
                        </div>
                        <p className="text-lg font-bold text-gray-800 truncate group-hover:text-primary transition-colors">
                          {extraerNombre(item.contenido)}
                        </p>
                        <p className="text-sm text-gray-400 mt-1 flex items-center gap-1.5 font-medium">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {formatFecha(item.created_at)}
                        </p>
                      </div>
                      <BotonesDescarga id={item.id} descargando={descargando} onDescargar={handleDescargar} />
                    </div>
                  ))}
                </div>
              }
            </div>
          )}

          {/* Tab Reportes: Infografías + LinkedIn + Entrevistas */}
          {tab === 'reportes' && (
            <div className="space-y-8">

              {/* Sección: Entrevistas simuladas */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                  <h3 className="text-sm font-bold text-gray-800">Simulaciones de Entrevista</h3>
                  <span className="text-[10px] text-gray-400 font-medium">· disponibles 14 días</span>
                </div>
                {cvsEntrevistas.length === 0
                ? <EmptyState mensaje="Aún no tienes reportes de entrevista." cta="Practicar entrevista" ruta="/entrevista" />
                : <div className="space-y-3">
                    {cvsEntrevistas.map(item => {
                      const meta = item.metadata || {}
                      const score = meta.puntuacion
                      const scoreColor = score >= 80 ? 'bg-green-50 text-green-700 border-green-200'
                        : score >= 60 ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-red-50 text-red-600 border-red-200'
                      return (
                        <div key={item.id} className={`group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 border rounded-2xl transition-all duration-300 ${item.expirado ? 'opacity-50 bg-gray-50 border-gray-200' : 'bg-white border-gray-100 hover:border-primary/30 hover:shadow-lg'}`}>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-primary/5 text-primary border border-primary/10">
                                Entrevista — {meta.entrevistador || 'HR'}
                              </span>
                              {typeof score === 'number' && (
                                <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border ${scoreColor}`}>
                                  {score} / 100
                                </span>
                              )}
                              {item.expirado
                                ? <span className="text-[10px] font-bold text-gray-400 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full">Expirado</span>
                                : item.diasRestantes !== null && (
                                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                                    {item.diasRestantes}d restantes
                                  </span>
                                )
                              }
                            </div>
                            <p className="text-base font-bold text-gray-800 truncate">{meta.filename || `Entrevista ${meta.cargo}`}</p>
                            {meta.resumen && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{meta.resumen}</p>}
                            <p className="text-sm text-gray-400 mt-1.5 flex items-center gap-1.5 font-medium">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {formatFecha(item.created_at)}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                }
              </div>

              {/* Sección: Análisis LinkedIn */}
              {cvsLinkedin.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                    <LinkedinLogo size={16} weight="fill" className="text-[#0077B5]" />
                    <h3 className="text-sm font-bold text-gray-800">Análisis de LinkedIn®</h3>
                  </div>
                  <div className="space-y-4">
                    {cvsLinkedin.map(item => {
                      const meta = item.metadata || {}
                      const puntaje = meta.puntaje_global
                      const puntajeColor = puntaje >= 80 ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : puntaje >= 60 ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : puntaje >= 40 ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                      return (
                        <div key={item.id} className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white border border-gray-100 rounded-2xl hover:border-[#0077B5]/40 hover:shadow-xl hover:shadow-blue-50 transition-all duration-300">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-[#0077B5]/5 text-[#0077B5] border border-[#0077B5]/15">Análisis LinkedIn</span>
                              {typeof puntaje === 'number' && (
                                <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border ${puntajeColor}`}>{puntaje} / 100</span>
                              )}
                            </div>
                            <p className="text-lg font-bold text-gray-800 truncate group-hover:text-[#0077B5] transition-colors">
                              {(meta.filename || 'Informe LinkedIn').replace(/_/g, ' ').replace(/\.pdf$/i, '')}
                            </p>
                            <p className="text-sm text-gray-400 mt-1 flex items-center gap-1.5 font-medium">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              {formatFecha(item.created_at)}
                            </p>
                          </div>
                          <button onClick={() => descargarLinkedinPDF(item)}
                            className="px-6 py-2.5 text-sm font-bold text-white bg-[#0077B5] hover:bg-[#005e8d] rounded-xl flex items-center justify-center min-w-[160px] transition-all shadow-lg shadow-blue-100">
                            Descargar PDF
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Sección: Infografías de Proyecto */}
              {cvsReportes.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                    <h3 className="text-sm font-bold text-gray-800">Infografía de Autoconocimiento</h3>
                  </div>
                  <div className="space-y-4">
                    {cvsReportes.map(item => {
                      const meta = item.metadata || {}
                      return (
                        <div key={item.id} className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white border border-gray-100 rounded-2xl hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">Infografía</span>
                            </div>
                            <p className="text-base font-bold text-gray-800 truncate">{meta.filename || 'Plan de Carrera Ejecutivo.pdf'}</p>
                            <p className="text-sm text-gray-400 mt-1.5 flex items-center gap-1.5 font-medium">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {formatFecha(item.created_at)}
                            </p>
                          </div>
                          <button onClick={() => navigate(`/reporte/${item.id}`)}
                            className="px-6 py-2.5 text-sm font-bold text-white bg-primary hover:bg-primary/90 rounded-xl flex items-center justify-center gap-2 min-w-[160px] transition-all shadow-sm">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                            Descargar PDF
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Sección: Reportes de Compensación */}
              {cvsReporteComp.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                    <h3 className="text-sm font-bold text-gray-800">Reporte de Compensación</h3>
                  </div>
                  <div className="space-y-4">
                    {cvsReporteComp.map(item => {
                      const meta = item.metadata || {}
                      return (
                        <div key={item.id} className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white border border-gray-100 rounded-2xl hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-50 transition-all duration-300">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">Compensación</span>
                            </div>
                            <p className="text-base font-bold text-gray-800 truncate">{meta.filename || 'Reporte de Compensacion.pdf'}</p>
                            <p className="text-sm text-gray-400 mt-1.5 flex items-center gap-1.5 font-medium">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {formatFecha(item.created_at)}
                            </p>
                          </div>
                          <button onClick={() => descargarReporteCompPDF(item)}
                            className="px-6 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl flex items-center justify-center gap-2 min-w-[160px] transition-all shadow-sm">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                            Descargar PDF
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {totalReportes === 0 && (
                <EmptyState mensaje="Aún no tienes reportes generados." cta="Ir al simulador de entrevista" ruta="/entrevista" />
              )}
            </div>
          )}

          {/* Tab 1.5: CV Original */}
          {tab === 'original' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3 mb-2">
                <h3 className="text-sm font-bold text-gray-800">CV Iniciales (Originales)</h3>
                <HelpBadge id="miscvs.original" />
              </div>
              {cvsOriginal.length === 0
              ? <EmptyState mensaje="Aún no has creado tu CV base." cta="Crear mi CV ahora" ruta="/cv-desde-cero" />
              : <div className="space-y-4">
                  {cvsOriginal.map(item => (
                    <div key={item.id} className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white border border-gray-100 rounded-2xl hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-50 transition-all duration-300">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">Documento Inicial</span>
                        </div>
                        <p className="text-lg font-bold text-gray-800 truncate group-hover:text-emerald-600 transition-colors">
                          {item.metadata?.filename || extraerNombre(item.contenido)}
                        </p>
                        <p className="text-sm text-gray-400 mt-1 flex items-center gap-1.5 font-medium">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          {formatFecha(item.created_at)}
                        </p>
                      </div>
                      <BotonesDescarga id={item.id} descargando={descargando} onDescargar={handleDescargar} />
                    </div>
                  ))}
                </div>
              }
            </div>
          )}

          {/* Tab 2: Compatibilidades — ordenadas de mayor a menor */}
          {tab === 'compatibilidades' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3 mb-2">
                <h3 className="text-sm font-bold text-gray-800">Compatibilidad con Ofertas</h3>
                <HelpBadge id="miscvs.compatibilidades" />
              </div>
              {checks.length === 0
              ? <EmptyState mensaje="Aún no has verificado compatibilidades." cta="Buscar vacantes →" ruta="/jobs" />
              : <>
                  {/* Filtros y acciones */}
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-4 border-b border-gray-100">
                    <div className="flex gap-2 flex-wrap">
                      {[
                        { key: 'todos', label: `Todas (${checks.length})` },
                        { key: 'alto', label: `≥ 70% (${checksAlto})` },
                        { key: 'bajo', label: `< 70% (${checksBajo})` },
                      ].map(f => (
                        <button key={f.key} onClick={() => setFiltroCompatibilidad(f.key)}
                          className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${filtroCompatibilidad === f.key ? 'bg-primary text-white border-primary' : 'text-gray-500 border-gray-200 hover:border-primary hover:text-primary'}`}>
                          {f.label}
                        </button>
                      ))}
                    </div>
                    {seleccionados.size > 0 && (
                      <button onClick={eliminarSeleccionados}
                        className="text-xs font-medium text-red-500 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
                        Eliminar seleccionados ({seleccionados.size})
                      </button>
                    )}
                  </div>

                  <div className="space-y-4">
                    {checksFiltrados.map(item => {
                      const { titulo, empresa } = parsearJobKey(item.job_key)
                      const motivos = Array.isArray(item.motivos) ? item.motivos : []
                      const job = item.jobData
                      const esBajo = item.score < 70
                      return (
                        <div key={item.id} className={`p-6 bg-white border rounded-3xl transition-all duration-300 ${seleccionados.has(item.id) ? 'border-primary ring-4 ring-primary/5 bg-primary/[0.02]' : 'border-gray-100 hover:border-gray-200 hover:shadow-lg hover:shadow-gray-200/40'}`}>
                          <div className="flex items-start gap-4">
                            {/* Checkbox for selection */}
                            {esBajo && (
                              <div className="mt-1.5 ring-offset-2">
                                <input type="checkbox" checked={seleccionados.has(item.id)}
                                  onChange={() => toggleSeleccion(item.id)}
                                  className="w-5 h-5 accent-primary rounded-lg cursor-pointer" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap mb-1">
                                    <p className="text-xl font-bold text-slate-800 capitalize leading-tight group-hover:text-primary">{job?.title || titulo}</p>
                                    {job?.via && <span className="text-[10px] font-black text-gray-400 bg-gray-50 border border-gray-200 rounded-lg px-2 py-0.5 tracking-widest uppercase">{job.via}</span>}
                                  </div>
                                  {(job?.company || empresa) && (
                                    <p className="text-base text-slate-500 font-semibold capitalize mb-2">{job?.company || empresa}</p>
                                  )}
                                  <div className="flex items-center gap-4 flex-wrap mb-3">
                                    {job?.location && (
                                      <span className="text-sm text-gray-400 flex items-center gap-1.5 font-medium">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                                        </svg>
                                        {job.location}
                                      </span>
                                    )}
                                    <span className="text-sm text-gray-400 font-medium flex items-center gap-1.5">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                      {formatFecha(item.created_at)}
                                    </span>
                                  </div>
                                  {job?.link && (
                                    <a href={job.link} target="_blank" rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline group">
                                      Ver vacante original
                                      <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                                      </svg>
                                    </a>
                                  )}
                                </div>
                                <div className="text-right shrink-0 p-3 bg-white border border-gray-100 rounded-2xl shadow-sm min-w-[100px]">
                                  <span className={`text-4xl font-black ${colorScore(item.score)} tracking-tighter`}>{item.score}%</span>
                                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Match Rate</p>
                                </div>
                              </div>
                              {motivos.length > 0 && (
                                <div className="mt-5 p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Highlights del Análisis</p>
                                  <ul className="space-y-2">
                                    {motivos.slice(0, 3).map((m, i) => (
                                      <li key={i} className="text-sm text-slate-600 flex gap-2 font-medium">
                                        <span className="text-primary mt-0.5 font-bold">»</span>{m}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              <div className="mt-6 flex items-center justify-between gap-3">
                                {false && /* botón Adaptar CV eliminado */ null}
                                {esBajo && (
                                  <button onClick={() => eliminarCheck(item.id)}
                                    className="text-sm font-bold text-red-500 hover:text-red-700 transition-colors ml-auto flex items-center gap-1.5 opacity-50 hover:opacity-100">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    Eliminar
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {checksBajo > 0 && filtroCompatibilidad !== 'alto' && (
                    <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                      <button onClick={() => {
                        const idsBajos = checks.filter(c => c.score < 70).map(c => c.id)
                        setSeleccionados(new Set(idsBajos))
                      }}
                        className="text-xs text-gray-400 hover:text-red-500 transition-colors">
                        Seleccionar todas {'<'} 70%
                      </button>
                    </div>
                  )}
                </>
              }
            </div>
          )}

          {/* Tab 3: CV vs Vacante */}
          {tab === 'match' && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3 mb-2">
                <h3 className="text-sm font-bold text-gray-800">CV Adaptados a Vacante</h3>
                <HelpBadge id="miscvs.match" />
              </div>
              {cvsMatch.length === 0
              ? <EmptyState mensaje="Aún no tienes adaptaciones personalizadas." cta="Nuevo CV vs Vacante" ruta="/cv-vs-job" />
              : <div className="space-y-6">
                  {[...cvsMatch].sort((a, b) => (b.metadata?.matchScore || 0) - (a.metadata?.matchScore || 0)).map(item => {
                    const jd = item.metadata?.jobData || {}
                    const saved = item.savedJob
                    const score = item.metadata?.matchScore
                    const vacTitle    = saved?.title    || jd.title    || ''
                    const vacCompany  = saved?.company  || jd.company  || jd.empresa || ''
                    const vacLocation = saved?.location || [jd.location, jd.country].filter(Boolean).join(', ') || ''
                    const vacLink     = saved?.link     || jd.link     || ''
                    const vacVia      = saved?.via      || ''
                    const vacSnippet  = saved?.snippet  || ''
                    return (
                      <div key={item.id} className="p-6 bg-white border border-gray-100 rounded-[2rem] hover:border-purple-200 hover:shadow-2xl hover:shadow-purple-900/5 transition-all duration-300">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                              <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg bg-purple-50 text-purple-600 border border-purple-100">Adaptación Elite</span>
                              {item.metadata?.language && (
                                <span className="text-[10px] font-black text-gray-400 uppercase bg-gray-50 border border-gray-100 px-2 py-1 rounded-lg">
                                  {item.metadata.language}
                                </span>
                              )}
                            </div>
                            <p className="text-xl font-bold text-gray-800 truncate mb-1">{extraerNombre(item.contenido)}</p>
                            <p className="text-sm text-gray-400 font-medium flex items-center gap-1.5 leading-none">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                              {formatFecha(item.created_at)}
                            </p>
                          </div>
                          {score != null && (
                            <div className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 shrink-0 min-w-[120px] ${badgeScore(score)}`}>
                              <span className="text-3xl font-black tracking-tighter leading-none mb-1">{score}%</span>
                              <span className="text-[9px] font-black uppercase tracking-widest opacity-70">Match score</span>
                            </div>
                          )}
                        </div>

                        {vacTitle && (
                          <div className="mt-6 border-t border-gray-50 pt-4">
                             <InfoVacante title={vacTitle} company={vacCompany} location={vacLocation}
                                link={vacLink} via={vacVia} snippet={vacSnippet}
                                jobText={item.metadata?.jobText || ''} />
                          </div>
                        )}

                        <div className="mt-6 flex justify-end">
                          <BotonesDescarga id={item.id} descargando={descargando} onDescargar={handleDescargar}
                            soloSiOptimizado score={score} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              }
            </div>
          )}

        </div>
      )}
    </div>
  )
}
