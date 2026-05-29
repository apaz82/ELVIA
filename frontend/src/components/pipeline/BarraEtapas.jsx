const ETAPAS = ['Descubierto', 'Apliqué', 'Pruebas/Assessment', 'En entrevistas', 'Ofertado']
const ETAPA_PERDIDA = 'No avanzó'

const IDX_MINIMO_SEGUN_ESTADO = (estado) => {
  const idx = ETAPAS.indexOf(estado)
  return idx >= 1 ? 1 : 0
}

const colorEtapa = (etapa) => {
  if (etapa === 'Ofertado')            return { bg: 'bg-green-500',  ring: 'ring-green-300',  text: 'text-green-600' }
  if (etapa === 'En entrevistas')      return { bg: 'bg-blue-500',   ring: 'ring-blue-300',   text: 'text-blue-600' }
  if (etapa === 'Pruebas/Assessment')  return { bg: 'bg-amber-500',  ring: 'ring-amber-300',  text: 'text-amber-600' }
  if (etapa === 'Apliqué')             return { bg: 'bg-purple-500', ring: 'ring-purple-300', text: 'text-purple-600' }
  return { bg: 'bg-gray-400', ring: 'ring-gray-200', text: 'text-gray-500' }
}

const formatFechaCorta = (iso) => {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' })
}

export { ETAPAS, ETAPA_PERDIDA, colorEtapa, formatFechaCorta }

export default function BarraEtapas({ estadoActual, etapasFechas = {}, onCambiar, perdida }) {
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
                {etapa === 'Pruebas/Assessment' ? 'Pruebas' : etapa}
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
