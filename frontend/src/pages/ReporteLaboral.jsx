import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../services/authService'
import html2pdf from 'html2pdf.js'
import { CheckCircle, Target, Briefcase, MapPin, CurrencyCircleDollar, DownloadSimple, ArrowLeft } from '@phosphor-icons/react'

export default function ReporteLaboral() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [descargando, setDescargando] = useState(false)
  const reporteRef = useRef(null)

  useEffect(() => {
    cargarDatos()
  }, [id])

  const cargarDatos = async () => {
    try {
      const { data: row, error } = await supabase
        .from('cv_results')
        .select('contenido')
        .eq('id', id)
        .single()

      if (error || !row) throw new Error('No se encontró el reporte')
      setData(JSON.parse(row.contenido))
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
      filename:     `Plan de Carrera - ${data?.nombreCandidato || 'Ejecutivo'}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    }

    html2pdf().from(element).set(opt).save().then(() => setDescargando(false))
  }

  if (loading) return <div className="min-h-screen pt-24 text-center text-gray-500">Cargando reporte ejecutivo...</div>
  if (error) return <div className="min-h-screen pt-24 text-center text-red-500">{error}</div>

  return (
    <div className="bg-gray-50 min-h-screen py-10 px-4 md:px-8">
      {/* Controles (no se imprimen) */}
      <div className="max-w-[816px] mx-auto mb-6 flex items-center justify-between">
        <button onClick={() => navigate('/mis-cvs')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors bg-white px-4 py-2 rounded-xl border border-gray-200">
          <ArrowLeft size={18} /> Volver a Mis CVs
        </button>
        <button 
          onClick={handleDescargar}
          disabled={descargando}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-medium px-5 py-2.5 rounded-xl transition-colors shadow-sm disabled:opacity-50"
        >
          <DownloadSimple size={20} /> {descargando ? 'Generando PDF...' : 'Descargar PDF Oficial'}
        </button>
      </div>

      {/* Contenedor A4 (Este es el que html2pdf convertirá) */}
      <div className="w-full flex justify-center pb-20">
        <div 
          ref={reporteRef} 
          className="bg-white shadow-2xl relative overflow-hidden" 
          style={{ width: '8.5in', minHeight: '11in', boxSizing: 'border-box' }}
        >
          {/* Header Visual */}
          <div className="bg-gradient-to-r from-purple-800 to-indigo-900 text-white px-12 py-10">
            <h1 className="text-4xl font-bold tracking-tight mb-2 uppercase">{data?.nombreCandidato}</h1>
            <p className="text-purple-200 text-lg font-medium">Plan Estratégico de Carrera 2026</p>
          </div>

          <div className="px-12 py-10 space-y-10">
            {/* Objetivo Principal */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
                <Target size={24} weight="fill" className="text-purple-600" /> 
                Objetivo Profesional de Alto Nivel
              </h2>
              <p className="text-gray-700 leading-relaxed text-lg">{data?.objetivoLaboral}</p>
            </section>

            {/* Configuración Táctica (Grid 2 columnas) */}
            <div className="grid grid-cols-2 gap-8">
              {/* Condiciones Salariales */}
              <div className="bg-gray-50 border border-gray-100 p-6 rounded-2xl">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4 flex items-center gap-2">
                  <CurrencyCircleDollar size={20} className="text-indigo-600" weight="bold" /> Expectativa Salarial
                </h3>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {data?.salarioMinimo ? `${data.moneda} ${Number(data.salarioMinimo).toLocaleString()}` : 'A convenir'}
                </div>
                <p className="text-sm text-gray-500 font-medium">Salario Base Mensual Mínimo</p>
                {data?.esquemasTrabajo && data.esquemasTrabajo.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">Modalidad</p>
                    <div className="flex flex-wrap gap-2">
                      {data.esquemasTrabajo.map((esq, i) => (
                        <span key={i} className="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-700">
                          {esq}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Geografía */}
              <div className="bg-gray-50 border border-gray-100 p-6 rounded-2xl">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4 flex items-center gap-2">
                  <MapPin size={20} className="text-indigo-600" weight="bold" /> Enfoque Geográfico
                </h3>
                <div className="space-y-3">
                  <p className="text-sm">
                    <span className="font-medium text-gray-900">Ubicación Base:</span> <span className="text-gray-600">{data?.ciudad || 'No especificada'}, {data?.pais || ''}</span>
                  </p>
                  {data?.dispuestoRelocalizarse && data?.ciudadesDestino?.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">Destinos de Relocalización Aprobados</p>
                      <div className="flex flex-wrap gap-1.5">
                        {data.ciudadesDestino.map((cd, i) => (
                          <span key={i} className="text-xs font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                            {cd}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sectores y Empresas Target */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
                <Briefcase size={24} weight="fill" className="text-purple-600" /> 
                Perímetro de Búsqueda
              </h2>
              
              <div className="grid grid-cols-2 gap-8 mt-6">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3">Industrias Objetivo</h3>
                  <ul className="space-y-2">
                    {data?.sectoresInteres?.length > 0 ? data.sectoresInteres.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <CheckCircle size={18} weight="fill" className="text-green-500 shrink-0 mt-0.5" />
                        {s}
                      </li>
                    )) : <li className="text-sm text-gray-500">Abierto a múltiples industrias</li>}
                  </ul>
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3">Empresas Target (Mock)</h3>
                  <div className="flex flex-wrap gap-2">
                    {data?.empresasMock?.length > 0 ? data.empresasMock.map((emp, i) => (
                      <span key={i} className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm font-medium text-gray-800">
                        {emp}
                      </span>
                    )) : <span className="text-sm text-gray-500">Por definir</span>}
                  </div>
                </div>
              </div>
            </section>

          </div>
          
          {/* Footer PDF */}
          <div className="absolute bottom-0 w-full px-12 py-6 bg-gray-50 border-t border-gray-100 flex justify-between items-center text-xs text-gray-400">
            <p>Generado confidencialmente en ELVIA AI</p>
            <p>{new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
