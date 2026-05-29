import { useState } from 'react'
import { api } from '../../services/api'
import { descargarCV, matchCVVacante } from '../../services/cvService'
import Button from './Button'
import { useTenant } from '../../context/TenantContext'

/**
 * JobActionPanel handles:
 * 1. Compatibility analysis (CV vs Job)
 * 2. In-place tailored CV generation
 * 3. Download links for generated CV
 */
export default function JobActionPanel({
  vacante,
  cvId,
  cvText,
  compatibilidadInicial = null,
  onRefreshUsage,
  onSave,
  onCompatibilidadCalculada,
}) {
  const { isB2B } = useTenant()
  const [loadingCompat, setLoadingCompat] = useState(false)
  const [loadingMatch, setLoadingMatch]   = useState(false)
  const [resultadoCompat, setResultadoCompat] = useState(compatibilidadInicial)
  const [resultadoMatch, setResultadoMatch]   = useState(null)
  const [error, setError] = useState('')

  const verificarCompatibilidad = async () => {
    if (!cvText) return setError('Selecciona un CV primero')
    setLoadingCompat(true)
    setError('')
    try {
      const data = await api.post('/api/jobs/compatibility', {
        cvText,
        jobTitle:    vacante.title,
        jobCompany:  vacante.company,
        jobSnippet:  vacante.snippet,
        jobLink:     vacante.link,
        jobLocation: vacante.location,
        jobVia:      vacante.via,
      })
      if (data.error) return setError(data.error)
      setResultadoCompat(data)
      if (onCompatibilidadCalculada) onCompatibilidadCalculada(data.score)
      if (!data.fromCache && onRefreshUsage) onRefreshUsage()
      if (onSave) onSave()
    } catch {
      setError('Error al calcular compatibilidad')
    } finally {
      setLoadingCompat(false)
    }
  }

  const generarCV = async () => {
    if (!cvId) return setError('Selecciona un CV del historial')
    setLoadingMatch(true)
    setError('')
    try {
      const jobText = `${vacante.title}\n${vacante.company || ''}\n${vacante.location || ''}\n\n${vacante.snippet || ''}`
      const data = await matchCVVacante(cvId, jobText)
      if (data.error) {
        if (data.error === 'LIMIT_REACHED') {
          setError('Sin créditos suficientes. Revisa tu plan.')
        } else {
          setError(data.error)
        }
        return
      }
      setResultadoMatch(data)
      if (onRefreshUsage) onRefreshUsage()
    } catch (err) {
      setError(err.message || 'Error al conectar con el servidor')
    } finally {
      setLoadingMatch(false)
    }
  }

  const colorScore = (score) => {
    if (score >= 80) return { text: 'text-green-600', bg: 'bg-green-50 border-green-200' }
    if (score >= 50) return { text: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' }
    return { text: 'text-red-500', bg: 'bg-red-50 border-red-200' }
  }

  // Si ya tenemos resultado de compatibilidad o estamos cargando
  const tieneAnalisis = resultadoCompat || loadingCompat

  return (
    <div className="mt-4">
      {!tieneAnalisis && (
        <button onClick={verificarCompatibilidad} disabled={loadingCompat}
          className="flex items-center gap-2 text-xs font-medium text-primary hover:underline transition-all">
          Ver compatibilidad con mi CV →
          {!isB2B && (
            <span className="flex items-center gap-0.5 bg-amber-50 border border-amber-200 text-amber-600 text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-tight">
              1 crédito
            </span>
          )}
        </button>
      )}

      {loadingCompat && (
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Analizando compatibilidad...
        </div>
      )}

      {resultadoCompat && !resultadoMatch && (
        <div className={`rounded-xl border p-4 ${colorScore(resultadoCompat.score).bg}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Compatibilidad</span>
              {resultadoCompat.fromCache && (
                <span className="text-[10px] bg-white text-gray-400 px-1.5 py-0.5 rounded-full border font-medium">Historial</span>
              )}
            </div>
            <span className={`text-xl font-bold ${colorScore(resultadoCompat.score).text}`}>{resultadoCompat.score}%</span>
          </div>
          
          <ul className="space-y-1.5 mb-4">
            {resultadoCompat.motivos.map((m, i) => (
              <li key={i} className="text-xs text-gray-700 flex gap-2">
                <span className="shrink-0 text-gray-400">•</span>
                <span>{m}</span>
              </li>
            ))}
          </ul>

          <div className="pt-3 border-t border-black/5">
            {resultadoCompat.score >= 75 ? (
              <>
                <Button onClick={generarCV} loading={loadingMatch} variant="primary" className="w-full text-xs py-2">
                  Generar CV adaptado para esta vacante →
                </Button>
                <p className="text-[10px] text-gray-400 text-center mt-2 italic">
                  Se creará una versión optimizada de tu CV para los requisitos de este puesto.
                </p>
              </>
            ) : (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                <span className="text-red-500 text-base shrink-0">✕</span>
                <div>
                  <p className="text-xs font-bold text-red-800">CV adaptado no disponible para esta vacante</p>
                  <p className="text-xs text-red-700 mt-0.5">Los requerimientos de la vacante no coinciden suficientemente con tu CV, por lo que no podemos generar un CV adaptado a esta vacante (compatibilidad {resultadoCompat.score}% — se requiere mínimo 75%). Revisa el análisis para entender las brechas.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {resultadoMatch && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <div className="flex items-center gap-2 text-blue-800 font-bold text-sm mb-3">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            ¡CV Adaptado con éxito!
          </div>
          <p className="text-xs text-blue-700 mb-4">
            El CV ha sido guardado en tu sección de <strong>Mis documentos</strong>. También puedes descargarlo ahora:
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => descargarCV(resultadoMatch.id, 'pdf')} className="flex-1 text-xs">
              ↓ PDF
            </Button>
            <Button variant="outline" onClick={() => descargarCV(resultadoMatch.id, 'word')} className="flex-1 text-xs">
              ↓ Word
            </Button>
          </div>
        </div>
      )}

      {error && <p className="mt-2 text-xs text-red-500 font-medium">{error}</p>}
    </div>
  )
}
