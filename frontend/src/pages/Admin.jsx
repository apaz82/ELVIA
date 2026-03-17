import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../services/authService'
import { descargarCV } from '../services/cvService'
import Button from '../components/common/Button'

// Extrae el nombre de la primera línea del CV (formato Harvard)
const extraerNombre = (contenido) => {
  if (!contenido) return 'CV sin nombre'
  return contenido.split('\n').find(l => l.trim().length > 2)?.trim() || 'CV sin nombre'
}

// Genera nombre legible para cada resultado
const generarNombre = (resultado) => {
  const nombre = extraerNombre(resultado.contenido)
  if (resultado.tipo === 'match' && resultado.metadata?.jobData?.title) {
    return `${nombre} — ${resultado.metadata.jobData.title}`
  }
  return nombre
}

const formatFecha = (iso) => {
  const d = new Date(iso)
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function Admin() {
  const { user, loading: authLoading, usageCount, LIMITE_PLAN } = useAuth()
  const navigate = useNavigate()

  const [historial, setHistorial] = useState([])
  const [loading, setLoading]     = useState(true)
  const [descargando, setDescargando] = useState({}) // { [id]: 'pdf'|'word' }

  useEffect(() => {
    if (authLoading) return
    if (!user) { navigate('/auth'); return }
    cargarHistorial()
  }, [user, authLoading])

  const cargarHistorial = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('cv_results')
      .select('id, tipo, contenido, metadata, created_at')
      .order('created_at', { ascending: false })
    if (!error) setHistorial(data || [])
    setLoading(false)
  }

  const handleDescargar = async (id, formato) => {
    setDescargando(d => ({ ...d, [id]: formato }))
    try {
      await descargarCV(id, formato)
    } finally {
      setDescargando(d => ({ ...d, [id]: null }))
    }
  }

  const creditosRestantes = Math.max(0, LIMITE_PLAN - usageCount)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Mi Panel</h1>
        <p className="mt-1 text-gray-500 text-sm">{user?.email}</p>
      </div>

      {/* Tarjeta de créditos */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Plan actual</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {creditosRestantes}
              <span className="text-base font-normal text-gray-400"> / {LIMITE_PLAN} créditos disponibles</span>
            </p>
            <p className="text-sm text-gray-500 mt-1">Plan gratuito</p>
          </div>
          <div className="w-32">
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${creditosRestantes === 0 ? 'bg-red-400' : creditosRestantes === 1 ? 'bg-amber-400' : 'bg-green-500'}`}
                style={{ width: `${(creditosRestantes / LIMITE_PLAN) * 100}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1 text-right">{usageCount} utilizados</p>
          </div>
        </div>
        {creditosRestantes === 0 && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
            Agotaste tus análisis gratuitos. Próximamente planes de pago.
          </div>
        )}
      </div>

      {/* Historial de CVs */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Historial de CVs</h2>
          <span className="text-xs text-gray-400">{historial.length} documento{historial.length !== 1 ? 's' : ''}</span>
        </div>

        {loading ? (
          <div className="text-center py-10 text-gray-400 text-sm">Cargando historial...</div>
        ) : historial.length === 0 ? (
          <div className="text-center py-10">
            <svg className="w-10 h-10 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            <p className="text-sm text-gray-400">Aún no tienes CVs generados.<br/>Ve a CV Optimizer para empezar.</p>
            <button onClick={() => navigate('/')} className="mt-4 text-sm text-primary font-medium hover:underline">
              Optimizar mi CV →
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {historial.map((item) => (
              <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border border-gray-100 rounded-xl hover:border-gray-200 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Badge tipo */}
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      item.tipo === 'match'
                        ? 'bg-purple-50 text-purple-600'
                        : 'bg-blue-50 text-blue-600'
                    }`}>
                      {item.tipo === 'match' ? 'CV vs Vacante' : 'CV Optimizado'}
                    </span>

                    {/* Score si es match */}
                    {item.tipo === 'match' && item.metadata?.matchScore != null && (
                      <span className={`text-xs font-bold ${
                        item.metadata.matchScore >= 75 ? 'text-green-600'
                        : item.metadata.matchScore >= 50 ? 'text-amber-500'
                        : 'text-red-400'
                      }`}>
                        {item.metadata.matchScore}% match
                      </span>
                    )}
                  </div>

                  {/* Nombre del CV */}
                  <p className="text-sm font-medium text-gray-800 mt-1 truncate">
                    {generarNombre(item)}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatFecha(item.created_at)}</p>
                </div>

                {/* Botones de descarga */}
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleDescargar(item.id, 'pdf')}
                    disabled={!!descargando[item.id]}
                    className="text-xs border border-gray-300 text-gray-600 hover:border-primary hover:text-primary rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
                  >
                    {descargando[item.id] === 'pdf' ? '...' : '↓ PDF'}
                  </button>
                  <button
                    onClick={() => handleDescargar(item.id, 'word')}
                    disabled={!!descargando[item.id]}
                    className="text-xs border border-gray-300 text-gray-600 hover:border-primary hover:text-primary rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
                  >
                    {descargando[item.id] === 'word' ? '...' : '↓ Word'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
