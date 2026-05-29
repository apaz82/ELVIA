import { useState } from 'react'
import { Link } from 'react-router-dom'
import { X, Copy, Check, Spinner } from '@phosphor-icons/react'
import { useAuth } from '../../context/AuthContext'
import BarraEtapas from '../pipeline/BarraEtapas'
import { api } from '../../services/api'
import { supabase } from '../../services/authService'

export default function DetalleVacanteDrawer({
  item,
  isOpen,
  onClose,
  onMover,
  onGuardarNota,
  onGuardarContacto,
  onEliminar,
  onNavigate
}) {
  const { user } = useAuth()
  if (!item) return null

  const [editandoNota, setEditandoNota] = useState(false)
  const [nota, setNota] = useState(item.notas || '')
  const [editandoContacto, setEditandoContacto] = useState(false)
  const [contacto, setContacto] = useState(item.contacto || {})
  const [guardandoNota, setGuardandoNota] = useState(false)
  const [guardandoContacto, setGuardandoContacto] = useState(false)
  const [verDescripcion, setVerDescripcion] = useState(false)

  // 3.3 — Optimizar CV para esta vacante
  const [generandoCV, setGenerandoCV] = useState(false)
  const [cvOptimizado, setCvOptimizado] = useState(null)  // { changes, tailoredCV, matchScore }
  const [copiadoCV, setCopiadoCV] = useState(false)

  // 5.1 — Carta de presentación
  const [generandoCarta, setGenerandoCarta] = useState(false)
  const [carta, setCarta] = useState(null)
  const [copiadoCarta, setCopiadoCarta] = useState(false)

  const optimizarCV = async () => {
    if (!job.description || !user) return
    setGenerandoCV(true)
    setCvOptimizado(null)
    try {
      const { data: latestCV } = await supabase
        .from('cv_results')
        .select('id, contenido')
        .eq('user_id', user.id)
        .eq('tipo', 'optimize')
        .not('contenido', 'like', '{%')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      if (!latestCV) {
        setCvOptimizado({ error: 'Primero optimiza tu CV en "CV Optimizer" para usar esta función.' })
        return
      }
      const res = await api.post('/api/cv/match', { cvId: latestCV.id, jobText: job.description })
      setCvOptimizado(res)
    } catch {
      setCvOptimizado({ error: 'Error al generar el CV. Intenta de nuevo.' })
    } finally {
      setGenerandoCV(false)
    }
  }

  const generarCartaHandler = async () => {
    if (!user) return
    setGenerandoCarta(true)
    setCarta(null)
    try {
      const { data: latestCV } = await supabase
        .from('cv_results')
        .select('id, contenido')
        .eq('user_id', user.id)
        .eq('tipo', 'optimize')
        .not('contenido', 'like', '{%')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      const res = await api.post('/api/cv/carta', {
        empresa: job.company,
        cargo: job.title,
        descripcion: job.description,
        cvId: latestCV?.id || null,
      })
      setCarta(res.carta)
    } catch {
      setCarta('__error__')
    } finally {
      setGenerandoCarta(false)
    }
  }

  const copiar = (texto, setCopiado) => {
    navigator.clipboard.writeText(texto)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  const job = item.job_data || {}
  const check = item.check

  const guardarNotaHandler = async () => {
    setGuardandoNota(true)
    await onGuardarNota(item, nota)
    setGuardandoNota(false)
    setEditandoNota(false)
  }

  const guardarContactoHandler = async () => {
    setGuardandoContacto(true)
    await onGuardarContacto(item, contacto)
    setGuardandoContacto(false)
    setEditandoContacto(false)
  }

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Drawer panel */}
      <aside
        className={`
          fixed right-0 top-0 h-full w-full lg:w-[420px] bg-white shadow-2xl z-50
          transform transition-transform duration-300
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
          overflow-y-auto
        `}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 p-5 flex items-center justify-between">
          <h2 className="font-bold text-lg truncate">{job.title || '—'}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 shrink-0"
          >
            <X size={20} weight="bold" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-6">
          {/* Job details section */}
          <section>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Detalles</h3>
            <div className="space-y-1.5 text-sm">
              {job.company  && <p><span className="font-semibold text-gray-500">Empresa:</span> {job.company}</p>}
              {job.location && <p><span className="font-semibold text-gray-500">Ubicación:</span> {job.location}</p>}
              {job.via      && <p><span className="font-semibold text-gray-500">Vía:</span> {job.via}</p>}
              {job.link && (
                <a href={job.link} target="_blank" rel="noopener noreferrer"
                  className="text-primary font-medium hover:underline text-sm block mt-1">
                  Ver vacante →
                </a>
              )}
            </div>

            {/* Descripción colapsable */}
            {(job.description || job.snippet) && (
              <div className="mt-3">
                <button
                  onClick={() => setVerDescripcion(v => !v)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-gray-700 transition-colors"
                >
                  <svg className={`w-3.5 h-3.5 transition-transform ${verDescripcion ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                  </svg>
                  {verDescripcion ? 'Ocultar descripción' : 'Ver descripción de la vacante'}
                </button>
                {verDescripcion && (
                  <div className="mt-2 bg-gray-50 border border-gray-200 rounded-xl p-3 max-h-60 overflow-y-auto">
                    <p className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed">
                      {job.description || job.snippet}
                    </p>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Stage management */}
          <section>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              Etapa
            </h3>
            <BarraEtapas
              estadoActual={item.estado || 'Descubierto'}
              etapasFechas={item.etapas_fechas || {}}
              onCambiar={(nueva) => {
                onMover(item, nueva)
                onClose()
              }}
              perdida={item.estado === 'No avanzó'}
            />
          </section>

          {/* Match score if exists */}
          {check && (
            <section>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Compatibilidad</h3>
              <div className="flex items-center gap-3">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center font-black text-lg shrink-0 ${
                  check.score >= 75 ? 'bg-green-100 text-green-700'
                  : check.score >= 50 ? 'bg-amber-100 text-amber-700'
                  : 'bg-red-100 text-red-600'
                }`}>
                  {check.score}%
                </div>
                <div>
                  <p className="text-sm font-semibold">
                    {check.score >= 75 ? 'Top Match' : check.score >= 50 ? 'Buen Match' : 'Bajo Match'}
                  </p>
                  {check.motivos?.length > 0 && (
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{check.motivos[0]}</p>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Quick action: solo Preparar entrevista (Analizar CV vive en sección CV Adaptado abajo) */}
          <section>
            <button
              onClick={() => {
                sessionStorage.setItem('entrevista_prefill', JSON.stringify({
                  empresa: job.company,
                  cargo: job.title,
                  descripcion: job.description || job.snippet || '',
                  jobId: item.id
                }))
                onNavigate('/entrevista')
              }}
              className="w-full text-sm bg-blue-600 text-white font-semibold py-2.5 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
              </svg>
              Preparar entrevista
            </button>
          </section>

          {/* 3.3 — Optimizar CV para esta vacante */}
          {job.description && (
            <section>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                CV Adaptado
              </h3>
              {!cvOptimizado && (
                <button
                  onClick={optimizarCV}
                  disabled={generandoCV}
                  className="w-full text-sm border border-primary text-primary font-semibold py-2.5 rounded-lg hover:bg-primary/5 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {generandoCV
                    ? <><Spinner size={14} className="animate-spin" /> Adaptando CV...</>
                    : 'Optimizar CV para esta vacante →'}
                </button>
              )}
              {cvOptimizado?.error && (
                <p className="text-xs text-red-500">{cvOptimizado.error}</p>
              )}
              {cvOptimizado && !cvOptimizado.error && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-bold ${cvOptimizado.matchScore >= 75 ? 'text-emerald-600' : cvOptimizado.matchScore >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
                      Match: {cvOptimizado.matchScore}%
                    </span>
                    <button onClick={() => setCvOptimizado(null)} className="text-xs text-gray-400 hover:text-gray-600">Cerrar</button>
                  </div>
                  {cvOptimizado.changes?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-1.5">Cambios realizados</p>
                      <ul className="text-xs space-y-1 text-gray-600">
                        {cvOptimizado.changes.slice(0, 5).map((c, i) => (
                          <li key={i} className="flex items-start gap-1.5"><span className="text-emerald-500 shrink-0">✓</span>{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="relative">
                    <pre className="text-[11px] text-gray-600 bg-gray-50 rounded-lg p-3 max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                      {cvOptimizado.tailoredCV}
                    </pre>
                    <button
                      onClick={() => copiar(cvOptimizado.tailoredCV, setCopiadoCV)}
                      className="absolute top-2 right-2 bg-white border border-gray-200 rounded px-2 py-1 text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                    >
                      {copiadoCV ? <><Check size={11} className="text-emerald-500" /> Copiado</> : <><Copy size={11} /> Copiar</>}
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* 5.1 — Carta de presentación */}
          <section>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              Carta de Presentación
            </h3>
            {!carta && (
              <button
                onClick={generarCartaHandler}
                disabled={generandoCarta}
                className="w-full text-sm border border-violet-400 text-violet-600 font-semibold py-2.5 rounded-lg hover:bg-violet-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {generandoCarta
                  ? <><Spinner size={14} className="animate-spin" /> Generando carta...</>
                  : 'Generar carta de presentación →'}
              </button>
            )}
            {carta === '__error__' && (
              <p className="text-xs text-red-500">Error al generar la carta. Intenta de nuevo.</p>
            )}
            {carta && carta !== '__error__' && (
              <div className="relative">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-xs font-semibold text-gray-500">Lista para copiar</p>
                  <button onClick={() => setCarta(null)} className="text-xs text-gray-400 hover:text-gray-600">Cerrar</button>
                </div>
                <pre className="text-xs text-gray-700 bg-violet-50 rounded-lg p-3 max-h-64 overflow-y-auto whitespace-pre-wrap leading-relaxed border border-violet-100">
                  {carta}
                </pre>
                <button
                  onClick={() => copiar(carta, setCopiadoCarta)}
                  className="absolute top-8 right-2 bg-white border border-gray-200 rounded px-2 py-1 text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                >
                  {copiadoCarta ? <><Check size={11} className="text-emerald-500" /> Copiado</> : <><Copy size={11} /> Copiar</>}
                </button>
              </div>
            )}
          </section>

          {/* Notes section */}
          <section>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              Notas
            </h3>
            {editandoNota ? (
              <div className="space-y-2">
                <textarea
                  value={nota}
                  onChange={(e) => setNota(e.target.value)}
                  placeholder="Agregar notas..."
                  rows={3}
                  className="w-full text-sm border border-gray-300 rounded-lg p-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setNota(item.notas || '')
                      setEditandoNota(false)
                    }}
                    className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={guardarNotaHandler}
                    disabled={guardandoNota}
                    className="text-xs bg-primary text-white px-3 py-1.5 rounded hover:bg-primary/90 disabled:opacity-50 transition-colors"
                  >
                    {guardandoNota ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </div>
            ) : (
              <p
                onClick={() => setEditandoNota(true)}
                className="text-sm text-gray-600 cursor-pointer hover:text-gray-900 min-h-[2rem] flex items-center"
              >
                {nota || '📝 Agregar nota...'}
              </p>
            )}
          </section>

          {/* Contact section */}
          <section>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              Contacto
            </h3>
            {editandoContacto ? (
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Nombre"
                  value={contacto.nombre || ''}
                  onChange={(e) =>
                    setContacto({ ...contacto, nombre: e.target.value })
                  }
                  className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={contacto.email || ''}
                  onChange={(e) =>
                    setContacto({ ...contacto, email: e.target.value })
                  }
                  className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <input
                  type="tel"
                  placeholder="Teléfono"
                  value={contacto.telefono || ''}
                  onChange={(e) =>
                    setContacto({ ...contacto, telefono: e.target.value })
                  }
                  className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditandoContacto(false)}
                    className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={guardarContactoHandler}
                    disabled={guardandoContacto}
                    className="text-xs bg-primary text-white px-3 py-1.5 rounded hover:bg-primary/90 disabled:opacity-50 transition-colors"
                  >
                    {guardandoContacto ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </div>
            ) : (
              <p
                onClick={() => setEditandoContacto(true)}
                className="text-sm text-gray-600 cursor-pointer hover:text-gray-900 min-h-[2rem] flex items-center"
              >
                {contacto.nombre
                  ? `${contacto.nombre} — ${
                      contacto.email || contacto.telefono || ''
                    }`
                  : '👤 Agregar contacto...'}
              </p>
            )}
          </section>

          {/* Delete button */}
          <button
            onClick={() => {
              if (confirm(`¿Eliminar "${job.title}"?`)) {
                onEliminar(item)
                onClose()
              }
            }}
            className="w-full text-sm text-red-600 border border-red-200 py-2.5 rounded-lg hover:bg-red-50 transition-colors font-medium"
          >
            Eliminar vacante
          </button>
        </div>
      </aside>
    </>
  )
}
