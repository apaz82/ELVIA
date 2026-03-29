import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../services/authService'
import PlanBanner from '../components/common/PlanBanner'

const ETAPAS = ['Descubierto', 'Apliqué', 'Pruebas/Assessment', 'En entrevistas', 'Ofertado']
const ETAPA_PERDIDA = 'No avanzó'

// Índice de la primera etapa que no permite retroceder a Descubierto
const IDX_MINIMO_SEGUN_ESTADO = (estado) => {
  const idx = ETAPAS.indexOf(estado)
  return idx >= 1 ? 1 : 0 // una vez que apliqué, no puedo volver a Descubierto
}

const colorEtapa = (etapa) => {
  if (etapa === 'Ofertado')            return { bg: 'bg-green-500',  ring: 'ring-green-300',  text: 'text-green-600' }
  if (etapa === 'En entrevistas')      return { bg: 'bg-blue-500',   ring: 'ring-blue-300',   text: 'text-blue-600' }
  if (etapa === 'Pruebas/Assessment')  return { bg: 'bg-amber-500',  ring: 'ring-amber-300',  text: 'text-amber-600' }
  if (etapa === 'Apliqué')             return { bg: 'bg-purple-500', ring: 'ring-purple-300', text: 'text-purple-600' }
  return { bg: 'bg-gray-400', ring: 'ring-gray-200', text: 'text-gray-500' }
}

const badgeScore = (score) => {
  if (score >= 70) return 'bg-green-100 text-green-700 border-green-200'
  if (score >= 50) return 'bg-amber-100 text-amber-700 border-amber-200'
  return 'bg-red-100 text-red-600 border-red-200'
}

const formatFechaCorta = (iso) => {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' })
}

function BarraEtapas({ estadoActual, etapasFechas = {}, onCambiar, perdida }) {
  const idxActual = ETAPAS.indexOf(estadoActual)
  const idxMinimo = IDX_MINIMO_SEGUN_ESTADO(estadoActual)

  return (
    <div className="mt-4">
      <div className="relative flex items-center">
        <div className="absolute left-0 right-0 h-1 bg-gray-200 rounded-full" style={{ top: '14px' }} />
        {idxActual >= 0 && (
          <div
            className={`absolute h-1 rounded-full transition-all duration-500 ${colorEtapa(estadoActual).bg}`}
            style={{ top: '14px', left: 0, width: `${(idxActual / (ETAPAS.length - 1)) * 100}%` }}
          />
        )}
        {ETAPAS.map((etapa, i) => {
          const pasado = i < idxActual
          const activo = i === idxActual
          const futuro = i > idxActual
          const bloqueado = perdida || (i < idxMinimo)
          const c = colorEtapa(etapa)
          const fechaEtapa = etapasFechas[etapa]
          return (
            <div key={etapa} className={`relative flex flex-col items-center flex-1 ${!bloqueado ? 'cursor-pointer group' : 'cursor-default'}`}
              onClick={() => !bloqueado && onCambiar(etapa)}>
              <div className={`w-7 h-7 rounded-full border-2 border-white flex items-center justify-center shadow-sm transition-all duration-300 z-10
                ${activo  ? `${c.bg} ring-4 ${c.ring} scale-110` : ''}
                ${pasado  ? `${c.bg}` : ''}
                ${futuro  ? `bg-gray-200 ${!bloqueado ? 'group-hover:bg-gray-300' : ''}` : ''}
                ${perdida ? 'opacity-40' : ''}`}>
                {activo && <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/></svg>}
                {pasado && <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
              </div>
              <span className={`mt-1.5 text-[10px] font-medium text-center leading-tight transition-colors
                ${activo ? `${c.text} font-semibold` : ''}
                ${pasado ? 'text-gray-500' : ''}
                ${futuro ? 'text-gray-300' : ''}
                ${!bloqueado ? 'group-hover:text-gray-700' : ''}`}>
                {etapa}
              </span>
              {fechaEtapa && (
                <span className="text-[9px] text-gray-400 mt-0.5">{formatFechaCorta(fechaEtapa)}</span>
              )}
            </div>
          )
        })}
      </div>

      {!perdida && (
        <div className="mt-4 flex justify-end">
          <button onClick={() => onCambiar(ETAPA_PERDIDA)}
            className="text-xs text-gray-400 hover:text-red-500 border border-dashed border-gray-200 hover:border-red-300 rounded-full px-3 py-1 transition-colors flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
            Marcar como No avanzó
          </button>
        </div>
      )}
    </div>
  )
}

function VacanteCard({ item, onMover, onEliminar, onGuardarNota, onGuardarContacto }) {
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
    <div className={`bg-white rounded-2xl border p-5 transition-all ${perdida ? 'border-red-200 opacity-70' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-900 text-base leading-snug">{job.title || '—'}</h3>
            {check && (
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${badgeScore(check.score)}`}>
                {check.score}% Compatibilidad
              </span>
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
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [vacantes, setVacantes]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [filtroPerdidas, setFiltro] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!user) { navigate('/auth'); return }
    cargarTodo()
  }, [user, authLoading])

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

  const { isPaidPlan } = useAuth()

  const activas  = vacantes.filter(v => (v.estado || 'Descubierto') !== ETAPA_PERDIDA)
  const perdidas = vacantes.filter(v => (v.estado || 'Descubierto') === ETAPA_PERDIDA)

  // Plan free: solo ver 3 vacantes (prioriza las que tienen análisis de compatibilidad)
  const activasVisibles = useMemo(() => {
    if (isPaidPlan) return activas
    const conAnalisis   = activas.filter(v => v.check)
    const sinAnalisis   = activas.filter(v => !v.check)
    const necesitamos   = Math.max(0, 3 - conAnalisis.length)
    return [...conAnalisis, ...sinAnalisis.slice(0, necesitamos)]
  }, [activas, isPaidPlan])

  const visibles = filtroPerdidas ? perdidas : activasVisibles
  const ocultasPorPlan = !isPaidPlan && !filtroPerdidas && activas.length > activasVisibles.length

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
            />
          ))}
        </div>
      )}
    </div>
  )
}
