// LinkedinResultModal — Aparece UNA SOLA VEZ después de generar un análisis nuevo.
// No se muestra al revisar análisis del historial.
// Contiene el disclaimer obligatorio sobre cambios graduales en LinkedIn.
import { useEffect } from 'react'
import { X, DownloadSimple, ArrowRight, WarningCircle, Sparkle } from '@phosphor-icons/react'

function colorPuntaje(score) {
  if (score == null) return { text: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200', label: 'Sin evaluar' }
  if (score >= 80) return { text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', label: 'Excelente' }
  if (score >= 60) return { text: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-200',    label: 'Bueno' }
  if (score >= 40) return { text: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-200',   label: 'Regular' }
  return               { text: 'text-rose-600',     bg: 'bg-rose-50',     border: 'border-rose-200',     label: 'Urgente' }
}

export default function LinkedinResultModal({ open, onClose, puntajeGlobal, restantes, onDescargarPDF, onIrMisDocumentos, descargando }) {
  // Bloquea scroll del body mientras el modal está abierto.
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])

  if (!open) return null
  const color = colorPuntaje(puntajeGlobal)

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="linkedin-result-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header con puntaje */}
        <div className={`${color.bg} ${color.border} border-b px-6 py-6 text-center relative`}>
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/60 hover:bg-white text-slate-500 hover:text-slate-700 flex items-center justify-center transition-colors"
            aria-label="Cerrar"
          >
            <X size={16} weight="bold" />
          </button>
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full border-[6px] bg-white shadow-lg mb-3" style={{ borderColor: 'currentColor' }}>
            <div className="text-center">
              <div className={`text-3xl font-black ${color.text} leading-none`}>{puntajeGlobal ?? '—'}</div>
              <div className={`text-[9px] font-black ${color.text} uppercase tracking-widest mt-1 opacity-70`}>/ 100</div>
            </div>
          </div>
          <h2 id="linkedin-result-modal-title" className="text-xl font-black text-slate-900 tracking-tight flex items-center justify-center gap-2">
            <Sparkle size={18} weight="fill" className="text-amber-500" />
            Tu análisis está listo
          </h2>
          <p className={`text-xs font-bold uppercase tracking-widest ${color.text} mt-1`}>{color.label}</p>
        </div>

        {/* Disclaimer obligatorio */}
        <div className="px-6 py-5 space-y-4">
          <div className="bg-amber-50 border-l-4 border-amber-400 rounded-r-xl px-4 py-3">
            <div className="flex items-start gap-2">
              <WarningCircle size={20} weight="fill" className="text-amber-500 shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="text-xs font-black text-amber-900 uppercase tracking-wider">Importante — lee antes de aplicar</p>
                <p className="text-xs text-amber-900 leading-relaxed">
                  Estas son <strong>sugerencias generadas con IA</strong>. Tómate tiempo para revisar
                  cada propuesta antes de aplicarla a tu perfil. <strong>Cambiar mucho tu perfil de
                  LinkedIn de golpe puede confundir al mercado y a tu red</strong> — implementa los
                  cambios gradualmente.
                </p>
              </div>
            </div>
          </div>

          {typeof restantes === 'number' ? (
            <div className="text-center text-[11px] font-bold text-slate-500">
              Te quedan <span className="text-indigo-700 font-black">{restantes}</span> análisis de IA este mes.
            </div>
          ) : null}

          {/* Acciones */}
          <div className="space-y-2 pt-2">
            <button
              onClick={onDescargarPDF}
              disabled={descargando}
              className="w-full py-3.5 rounded-2xl bg-[#019DF4] hover:bg-[#0288d1] text-white text-sm font-black uppercase tracking-wider shadow-lg disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <DownloadSimple size={16} weight="bold" />
              {descargando ? 'Generando PDF...' : 'Descargar Informe PDF'}
            </button>
            <button
              onClick={onClose}
              className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider transition-all"
            >
              Ver análisis completo
            </button>
            <button
              onClick={onIrMisDocumentos}
              className="w-full py-2.5 rounded-2xl bg-transparent text-slate-500 hover:text-slate-700 text-xs font-bold flex items-center justify-center gap-1 transition-all"
            >
              Ir a Mis Documentos <ArrowRight size={12} weight="bold" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
