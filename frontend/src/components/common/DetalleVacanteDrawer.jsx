import { useState } from 'react'
import { Link } from 'react-router-dom'
import { X } from '@phosphor-icons/react'
import BarraEtapas from '../pipeline/BarraEtapas'

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
  if (!item) return null

  const [editandoNota, setEditandoNota] = useState(false)
  const [nota, setNota] = useState(item.notas || '')
  const [editandoContacto, setEditandoContacto] = useState(false)
  const [contacto, setContacto] = useState(item.contacto || {})
  const [guardandoNota, setGuardandoNota] = useState(false)
  const [guardandoContacto, setGuardandoContacto] = useState(false)

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
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              Detalles
            </h3>
            <div className="space-y-2 text-sm">
              {job.company && <p><strong>Empresa:</strong> {job.company}</p>}
              {job.location && <p><strong>Ubicación:</strong> {job.location}</p>}
              {job.via && <p><strong>Vía:</strong> {job.via}</p>}
              {job.link && (
                <a
                  href={job.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary font-medium hover:underline text-sm block"
                >
                  Ver vacante →
                </a>
              )}
            </div>
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
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                Compatibilidad
              </h3>
              <div className="flex items-center gap-3">
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center font-black text-lg shrink-0 ${
                    check.score >= 75
                      ? 'bg-green-100 text-green-700'
                      : check.score >= 50
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-red-100 text-red-600'
                  }`}
                >
                  {check.score}%
                </div>
                <div>
                  <p className="text-sm font-semibold">
                    {check.score >= 75
                      ? 'Top Match'
                      : check.score >= 50
                      ? 'Good Match'
                      : 'Low Match'}
                  </p>
                  <Link
                    to="/cv-vs-job"
                    className="text-xs text-primary hover:underline"
                  >
                    Ver análisis →
                  </Link>
                </div>
              </div>
            </section>
          )}

          {/* Quick action buttons */}
          <section className="space-y-2">
            <button
              onClick={() => {
                sessionStorage.setItem(
                  'vacante_prefill',
                  JSON.stringify({ texto: job.description || '' })
                )
                onNavigate('/cv-vs-job')
              }}
              className="w-full text-sm bg-primary text-white font-semibold py-2.5 rounded-lg hover:bg-primary/90 transition-colors"
            >
              Analizar CV
            </button>
            <button
              onClick={() => {
                sessionStorage.setItem(
                  'entrevista_prefill',
                  JSON.stringify({
                    empresa: job.company,
                    cargo: job.title,
                    descripcion: job.description,
                    jobId: item.id
                  })
                )
                onNavigate('/entrevista')
              }}
              className="w-full text-sm bg-blue-500 text-white font-semibold py-2.5 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Preparar entrevista
            </button>
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
