import { useState, useEffect, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../services/authService'
import PlanBanner from '../components/common/PlanBanner'
import FeatureLocked from '../components/common/FeatureLocked'
import DetalleVacanteDrawer from '../components/common/DetalleVacanteDrawer'
import { Kanban, FileText, Headphones, Trash } from '@phosphor-icons/react'
import BarraEtapas, { ETAPAS, ETAPA_PERDIDA, colorEtapa, formatFechaCorta } from '../components/pipeline/BarraEtapas'

const badgeScore = (score) => {
  if (score >= 70) return 'bg-green-100 text-green-700 border-green-200'
  if (score >= 50) return 'bg-amber-100 text-amber-700 border-amber-200'
  return 'bg-red-100 text-red-600 border-red-200'
}

function VacanteCard({ item, onMover, onEliminar, onGuardarNota, onGuardarContacto, onAbrirDetalle }) {
  const job     = item.job_data || {}
  const check   = item.check
  const estado  = item.estado || 'Descubierto'
  const perdida = estado === ETAPA_PERDIDA
  const etapasFechas = item.etapas_fechas || {}
  const contactoInicial = item.contacto || {}

  const [nota, setNota]             = useState(item.notas || '')
  const [editandoNota, setEditando] = useState(false)
  const [guardando, setGuardando]   = useState(false)
  const [mostrarContacto, setMostrarContacto] = useState(false)
  const [contacto, setContacto]     = useState(contactoInicial)
  const [guardandoContacto, setGuardandoContacto] = useState(false)
  const [mostrarMenu, setMostrarMenu] = useState(false)

  const guardarNota = async () => {
    setGuardando(true)
    await onGuardarNota(item, nota)
    setGuardando(false)
    setEditando(false)
  }

  const guardarContactoHandler = async () => {
    setGuardandoContacto(true)
    await onGuardarContacto(item, contacto)
    setGuardandoContacto(false)
    setMostrarContacto(false)
  }

  return (
    <div
      onClick={() => !mostrarMenu && onAbrirDetalle(item.id)}
      onMouseEnter={() => setMostrarMenu(true)}
      onMouseLeave={() => setMostrarMenu(false)}
      className={`bg-white rounded-2xl border p-5 transition-all relative ${perdida ? 'border-red-200 opacity-70 cursor-default' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm cursor-pointer'}`}
    >
      {/* Hover menu — 4.2 */}
      {mostrarMenu && !perdida && (
        <div className="absolute top-5 right-5 flex flex-col gap-1 bg-white rounded-xl shadow-lg border border-gray-200 z-10 p-1">
          <button
            onClick={(e) => {
              e.stopPropagation()
              job.description && sessionStorage.setItem('vacante_prefill', JSON.stringify({ texto: job.description }))
              navigate('/cv-vs-job')
            }}
            title="Ver análisis de compatibilidad"
            className="flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 rounded-lg transition-colors whitespace-nowrap"
          >
            <span>Analizar</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              // TODO: navigate to letter generation page
            }}
            title="Generar carta de presentación"
            className="flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 rounded-lg transition-colors whitespace-nowrap"
          >
            <FileText size={14} />
            <span>Carta</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              sessionStorage.setItem(
                'entrevista_prefill',
                JSON.stringify({
                  empresa: job.company,
                  cargo: job.title,
                  descripcion: job.description,
                  jobId: item.id
                })
              )
              navigate('/entrevista')
            }}
            title="Preparar para entrevista"
            className="flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 rounded-lg transition-colors whitespace-nowrap"
          >
            <Headphones size={14} />
            <span>Entrevista</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onMover(item, ETAPA_PERDIDA)
            }}
            title="Marcar como no avanzó"
            className="flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors whitespace-nowrap"
          >
            <Trash size={14} />
            <span>Archivar</span>
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-900 text-base leading-snug">{job.title || '—'}</h3>
            {check ? (
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${badgeScore(check.score)}`}>
                {check.score}% · {check.score >= 75 ? 'Top Match' : check.score >= 50 ? 'Good Match' : 'Low Match'}
              </span>
            ) : !perdida && (
              <Link
                to="/cv-vs-job"
                onClick={() => job.description && sessionStorage.setItem('vacante_prefill', JSON.stringify({ texto: job.description }))}
                className="text-xs font-medium text-primary border border-primary/30 rounded-full px-2 py-0.5 hover:bg-primary/5 transition-colors"
              >
                Analizar →
              </Link>
            )}
            {perdida && (
              <span className="text-xs bg-red-50 text-red-500 border border-red-200 rounded-full px-2 py-0.5 font-medium">No avanzó</span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
            {job.company  && <span className="text-sm text-gray-600">{job.company}</span>}
            {job.location && <span className="text-xs text-gray-400">{job.location}</span>}
            {job.via      && <span className="text-xs text-gray-400 bg-gray-50 border border-gray-100 rounded px-1.5 py-0.5">{job.via}</span>}
            {item.created_at && <span className="text-xs text-gray-400">Descubierta: {formatFechaCorta(item.created_at)}</span>}
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          {job.link && (
            <a href={job.link} target="_blank" rel="noopener noreferrer"
              className="text-xs font-medium text-primary border border-primary rounded-lg px-3 py-1.5 hover:bg-primary hover:text-white transition-colors flex items-center gap-1">
              Ver
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
              </svg>
            </a>
          )}
          {perdida && (
            <button onClick={() => onMover(item, 'Apliqué')}
              className="text-xs border border-gray-300 text-gray-500 hover:border-primary hover:text-primary rounded-lg px-3 py-1.5 transition-colors">
              Reactivar
            </button>
          )}
          <button onClick={() => onEliminar(item)} className="text-gray-300 hover:text-red-400 transition-colors p-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Barra de etapas con fechas */}
      <BarraEtapas
        estadoActual={estado}
        etapasFechas={etapasFechas}
        onCambiar={(nueva) => onMover(item, nueva)}
        perdida={perdida}
      />

      {/* Urgency coloring — entrevistas */}
      {estado === 'En entrevistas' && etapasFechas['En entrevistas'] && (() => {
        const dias = Math.floor((Date.now() - new Date(etapasFechas['En entrevistas']).getTime()) / 86400000)
        if (dias < 3) return null
        const urgente = dias >= 7
        return (
          <div className={`mt-2 text-xs flex items-center gap-1.5 font-medium ${urgente ? 'text-red-500' : 'text-amber-500'}`}>
            <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
            </svg>
            {dias === 1 ? '1 día en entrevistas' : `${dias} días en entrevistas`}
            {urgente && ' — considera hacer seguimiento'}
          </div>
        )
      })()}

      {/* Comentarios */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        {editandoNota ? (
          <div className="space-y-2">
            <textarea value={nota} onChange={e => setNota(e.target.value)}
              placeholder="Agrega notas sobre esta vacante..."
              rows={3}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              autoFocus />
            <div className="flex gap-2 justify-end">
              <button onClick={() => { setNota(item.notas || ''); setEditando(false) }}
                className="text-xs text-gray-400 hover:text-gray-600 px-3 py-1.5">Cancelar</button>
              <button onClick={guardarNota} disabled={guardando}
                className="text-xs bg-primary text-white rounded-lg px-3 py-1.5 hover:bg-primary-dark disabled:opacity-50 transition-colors">
                {guardando ? 'Guardando...' : 'Guardar nota'}
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setEditando(true)} className="w-full text-left group">
            {nota ? (
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                </svg>
                <p className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">{nota}</p>
              </div>
            ) : (
              <span className="text-xs text-gray-300 group-hover:text-gray-500 transition-colors flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
                </svg>
                Agregar comentario
              </span>
            )}
          </button>
        )}

        {/* Contacto de la vacante */}
        <div className="mt-3">
          <button onClick={() => setMostrarContacto(!mostrarContacto)}
            className="text-xs text-gray-400 hover:text-primary transition-colors flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
            {contacto.nombre ? `Contacto: ${contacto.nombre} ${contacto.apellido || ''}`.trim() : 'Agregar contacto de la vacante'}
          </button>

          {mostrarContacto && (
            <div className="mt-2 p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Datos del contacto</p>
              <div className="grid grid-cols-2 gap-2">
                <input value={contacto.nombre || ''} onChange={e => setContacto(c => ({...c, nombre: e.target.value}))}
                  placeholder="Nombre" className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary" />
                <input value={contacto.apellido || ''} onChange={e => setContacto(c => ({...c, apellido: e.target.value}))}
                  placeholder="Apellido" className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary" />
                <input value={contacto.email || ''} onChange={e => setContacto(c => ({...c, email: e.target.value}))}
                  placeholder="Email" type="email" className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary" />
                <input value={contacto.telefono || ''} onChange={e => setContacto(c => ({...c, telefono: e.target.value}))}
                  placeholder="Teléfono" className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setMostrarContacto(false)} className="text-xs text-gray-400 px-2 py-1">Cancelar</button>
                <button onClick={guardarContactoHandler} disabled={guardandoContacto}
                  className="text-xs bg-primary text-white rounded-lg px-3 py-1.5 disabled:opacity-50 transition-colors">
                  {guardandoContacto ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Genera y descarga CSV con el resumen de vacantes
const exportarExcel = (vacantes) => {
  const headers = ['Título', 'Empresa', 'Ubicación', 'Etapa', 'Compatibilidad %', 'Fecha descubierta', 'Fecha Apliqué', 'Fecha Pruebas', 'Fecha Entrevistas', 'Fecha Oferta', 'Notas', 'Contacto Nombre', 'Contacto Email', 'Contacto Tel']
  const rows = vacantes.map(v => {
    const job = v.job_data || {}
    const ef  = v.etapas_fechas || {}
    const ct  = v.contacto || {}
    return [
      job.title || '',
      job.company || '',
      job.location || '',
      v.estado || 'Descubierto',
      v.check?.score || '',
      v.created_at ? new Date(v.created_at).toLocaleDateString('es-MX') : '',
      ef['Apliqué'] ? new Date(ef['Apliqué']).toLocaleDateString('es-MX') : '',
      ef['Pruebas/Assessment'] ? new Date(ef['Pruebas/Assessment']).toLocaleDateString('es-MX') : '',
      ef['En entrevistas'] ? new Date(ef['En entrevistas']).toLocaleDateString('es-MX') : '',
      ef['Ofertado'] ? new Date(ef['Ofertado']).toLocaleDateString('es-MX') : '',
      (v.notas || '').replace(/,/g, ';'),
      ct.nombre || '',
      ct.email || '',
      ct.telefono || '',
    ]
  })

  const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url
  a.download = `Pipeline_${new Date().toLocaleDateString('es-MX').replace(/\//g, '')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function Pipeline() {
  const { user, loading: authLoading, featuresDesbloqueadas, isPaidPlan } = useAuth()
  const navigate = useNavigate()

  const [vacantes, setVacantes]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [filtroPerdidas, setFiltro] = useState(false)
  const [detalleAbierto, setDetalleAbierto] = useState(null)

  const cargarTodo = async () => {
    setLoading(true)
    const [{ data: saved }, { data: checks }] = await Promise.all([
      supabase.from('saved_jobs').select('*').order('created_at', { ascending: false }),
      supabase.from('job_checks').select('job_key, score, motivos'),
    ])
    const checkMap = {}
    ;(checks || []).forEach(c => { checkMap[c.job_key] = c })
    setVacantes((saved || []).map(s => ({ ...s, check: checkMap[s.job_key] || null })))
    setLoading(false)
  }

  useEffect(() => {
    if (authLoading) return
    if (!user) { navigate('/auth'); return }
    cargarTodo()
  }, [user, authLoading])

  if (!featuresDesbloqueadas) {
    return (
      <FeatureLocked
        titulo="Pipeline de Aplicaciones"
        descripcion="Sigue el estado de cada una de tus aplicaciones en tiempo real y gestiona tu proceso como un profesional."
        icono={<Kanban size={44} weight="light" />}
      />
    )
  }

  const mover = async (item, nuevaEtapa) => {
    const etapasFechas = { ...(item.etapas_fechas || {}) }
    if (nuevaEtapa !== ETAPA_PERDIDA && !etapasFechas[nuevaEtapa]) {
      etapasFechas[nuevaEtapa] = new Date().toISOString()
    }
    await supabase.from('saved_jobs').update({ estado: nuevaEtapa, etapas_fechas: etapasFechas }).eq('id', item.id)
    setVacantes(prev => prev.map(v => v.id === item.id ? { ...v, estado: nuevaEtapa, etapas_fechas: etapasFechas } : v))
  }

  const eliminar = async (item) => {
    if (!confirm(`¿Eliminar "${item.job_data?.title}"?`)) return
    await supabase.from('saved_jobs').delete().eq('id', item.id)
    setVacantes(prev => prev.filter(v => v.id !== item.id))
  }

  const guardarNota = async (item, nota) => {
    await supabase.from('saved_jobs').update({ notas: nota }).eq('id', item.id)
    setVacantes(prev => prev.map(v => v.id === item.id ? { ...v, notas: nota } : v))
  }

  const guardarContacto = async (item, contacto) => {
    await supabase.from('saved_jobs').update({ contacto }).eq('id', item.id)
    setVacantes(prev => prev.map(v => v.id === item.id ? { ...v, contacto } : v))
  }

  const activas  = vacantes.filter(v => (v.estado || 'Descubierto') !== ETAPA_PERDIDA)
  const perdidas = vacantes.filter(v => (v.estado || 'Descubierto') === ETAPA_PERDIDA)

  // Plan free vs Pro: ya manejado por el gate superior (FeatureLocked)
  // Si estamos aquí, el usuario tiene acceso total.
  const activasVisibles = activas

  const visibles = filtroPerdidas ? perdidas : activasVisibles
  const ocultasPorPlan = !isPaidPlan && !featuresDesbloqueadas && !filtroPerdidas && activas.length > activasVisibles.length

  const conteo = ETAPAS.reduce((acc, e) => {
    acc[e] = activas.filter(v => (v.estado || 'Descubierto') === e).length
    return acc
  }, {})

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Banner cuando hay vacantes ocultas por plan */}
      {ocultasPorPlan && (
        <PlanBanner
          tipo="upgrade_teaser"
          mensaje={`Tienes ${activas.length - activasVisibles.length} vacante${activas.length - activasVisibles.length !== 1 ? 's' : ''} más en tu pipeline. Actívalas con un plan Pro.`}
          className="mb-5"
        />
      )}
      <div className="mb-6 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pipeline</h1>
          <p className="mt-1 text-gray-500 text-sm">Seguimiento de tu búsqueda de empleo.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportarExcel(vacantes)}
            className="text-sm border border-gray-300 text-gray-600 rounded-lg px-3 py-2 hover:border-primary hover:text-primary transition-colors flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
            </svg>
            Exportar CSV
          </button>
          <button onClick={() => navigate('/mis-vacantes')}
            className="text-sm border border-gray-300 text-gray-500 rounded-lg px-3 py-2 hover:border-primary hover:text-primary transition-colors">
            Lista
          </button>
          <button onClick={() => navigate('/jobs')}
            className="text-sm bg-primary text-white font-medium rounded-lg px-4 py-2 hover:bg-primary-dark transition-colors">
            + Vacantes
          </button>
        </div>
      </div>

      {!loading && activas.length > 0 && (
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          <button onClick={() => setFiltro(false)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium shrink-0 transition-colors
              ${!filtroPerdidas ? 'bg-primary text-white border-primary' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>
            Activas ({activas.length})
          </button>
          {ETAPAS.map(etapa => {
            const c = colorEtapa(etapa)
            return (
              <div key={etapa} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs shrink-0">
                <div className={`w-2 h-2 rounded-full ${c.bg}`} />
                <span className="text-gray-500">{etapa}</span>
                <span className={`font-bold ${c.text}`}>{conteo[etapa]}</span>
              </div>
            )
          })}
          {perdidas.length > 0 && (
            <button onClick={() => setFiltro(true)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium shrink-0 transition-colors
                ${filtroPerdidas ? 'bg-red-500 text-white border-red-500' : 'bg-white text-red-500 border-red-200 hover:border-red-300'}`}>
              No avanzó ({perdidas.length})
            </button>
          )}
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-gray-400 text-sm">Cargando pipeline...</div>
      ) : visibles.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <p className="text-gray-400 text-sm mb-3">
            {filtroPerdidas ? 'No tienes vacantes marcadas como No avanzó.' : 'No tienes vacantes activas en seguimiento.'}
          </p>
          {!filtroPerdidas && (
            <button onClick={() => navigate('/jobs')} className="text-sm text-primary font-medium hover:underline">
              Buscar vacantes →
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {visibles.map(item => (
            <VacanteCard
              key={item.id}
              item={item}
              onMover={mover}
              onEliminar={eliminar}
              onGuardarNota={guardarNota}
              onGuardarContacto={guardarContacto}
              onAbrirDetalle={setDetalleAbierto}
            />
          ))}
        </div>
      )}

      {/* Drawer — 4.3 */}
      <DetalleVacanteDrawer
        item={vacantes.find(v => v.id === detalleAbierto)}
        isOpen={!!detalleAbierto}
        onClose={() => setDetalleAbierto(null)}
        onMover={mover}
        onGuardarNota={guardarNota}
        onGuardarContacto={guardarContacto}
        onEliminar={eliminar}
        onNavigate={navigate}
      />
    </div>
  )
}
