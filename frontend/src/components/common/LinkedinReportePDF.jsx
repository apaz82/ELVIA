// LinkedinReportePDF — Vista lista-para-imprimir del análisis de LinkedIn.
// Se renderiza off-screen (posición absoluta fuera del viewport) cuando el usuario
// pide descargar el PDF. html2pdf.js captura este nodo vía ref y genera el archivo.
//
// IMPORTANTE: este componente NO debe contener botones, inputs ni interacciones.
// Solo presentación. Mantén estilos inline (html2pdf renderiza con html2canvas y
// puede ignorar ciertas reglas Tailwind dinámicas).

const ELVIA = {
  azul:       '#002650',
  azulBrand:  '#019DF4',
  emerald:    '#10b981',
  amber:      '#f59e0b',
  rose:       '#ef4444',
  slate900:   '#0f172a',
  slate700:   '#334155',
  slate500:   '#64748b',
  slate300:   '#cbd5e1',
  slate100:   '#f1f5f9',
  slate50:    '#f8fafc',
  white:      '#ffffff',
}

function tonoPuntaje(score) {
  if (score == null) return { color: ELVIA.slate500, label: 'Sin evaluar' }
  if (score >= 80)   return { color: ELVIA.emerald,  label: 'Excelente' }
  if (score >= 60)   return { color: ELVIA.azulBrand, label: 'Bueno' }
  if (score >= 40)   return { color: ELVIA.amber,    label: 'Regular' }
  return                    { color: ELVIA.rose,     label: 'Urgente' }
}

const SECCION_LABELS = {
  titular:     'Titular (Headline)',
  extracto:    'Extracto (Acerca de)',
  experiencia: 'Experiencia',
  habilidades: 'Habilidades',
  educacion:   'Educación',
}

export default function LinkedinReportePDF({ reporteRef, nombre, fecha, resultado, editables }) {
  const r = resultado || {}
  const ed = editables || {}
  const tonoGlobal = tonoPuntaje(r.puntaje_global)
  const fechaTxt = fecha || new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })

  const Section = ({ id }) => {
    const datos = r.secciones?.[id]
    if (!datos || datos.puntaje == null) return null
    const tono = tonoPuntaje(datos.puntaje)
    const valorAplicable = id === 'habilidades'
      ? (Array.isArray(ed.habilidades) ? ed.habilidades.join(' · ') : '')
      : (ed[id] || '')
    return (
      <div style={{ marginBottom: 24, pageBreakInside: 'avoid' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, background: tono.color,
            color: ELVIA.white, fontWeight: 900, fontSize: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{datos.puntaje}</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: ELVIA.slate900 }}>{SECCION_LABELS[id]}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: tono.color, textTransform: 'uppercase', letterSpacing: 1 }}>
              {tono.label}
            </div>
          </div>
        </div>
        {datos.diagnostico ? (
          <p style={{ fontSize: 12, color: ELVIA.slate700, lineHeight: 1.55, margin: '6px 0 10px' }}>{datos.diagnostico}</p>
        ) : null}
        {Array.isArray(datos.fortalezas) && datos.fortalezas.length > 0 ? (
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: ELVIA.emerald, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Fortalezas</div>
            <ul style={{ margin: 0, paddingLeft: 16, color: ELVIA.slate700, fontSize: 11.5, lineHeight: 1.6 }}>
              {datos.fortalezas.map((f, i) => <li key={i}>{f}</li>)}
            </ul>
          </div>
        ) : null}
        {Array.isArray(datos.mejoras) && datos.mejoras.length > 0 ? (
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: ELVIA.amber, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Qué mejorar</div>
            <ul style={{ margin: 0, paddingLeft: 16, color: ELVIA.slate700, fontSize: 11.5, lineHeight: 1.6 }}>
              {datos.mejoras.map((m, i) => <li key={i}>{m}</li>)}
            </ul>
          </div>
        ) : null}
        {valorAplicable ? (
          <div style={{
            marginTop: 10,
            background: ELVIA.slate50,
            border: `1px solid ${ELVIA.slate300}`,
            borderRadius: 12,
            padding: 12,
          }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: ELVIA.azul, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
              Texto sugerido para pegar en LinkedIn
            </div>
            <p style={{ fontSize: 11.5, color: ELVIA.slate900, lineHeight: 1.6, whiteSpace: 'pre-line', margin: 0 }}>
              {valorAplicable}
            </p>
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div
      ref={reporteRef}
      style={{
        // Off-screen rendering: fuera del viewport hasta que html2pdf lo capture.
        position: 'absolute',
        top: -10000,
        left: 0,
        width: 816, // 8.5in @ 96dpi (mismo viewport virtual que ReporteLaboral)
        background: ELVIA.white,
        fontFamily: '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif',
        color: ELVIA.slate900,
        padding: 40,
        boxSizing: 'border-box',
      }}
    >
      {/* Header con logo + título */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `2px solid ${ELVIA.slate100}`, paddingBottom: 16, marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, color: ELVIA.azulBrand, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 }}>
            Análisis de Perfil LinkedIn — ELVIA®
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: ELVIA.azul, margin: 0, lineHeight: 1.1 }}>
            Tu plan de optimización
          </h1>
          {nombre ? (
            <div style={{ fontSize: 13, color: ELVIA.slate700, marginTop: 6 }}>
              Para <strong>{nombre}</strong> · {fechaTxt}
            </div>
          ) : (
            <div style={{ fontSize: 13, color: ELVIA.slate700, marginTop: 6 }}>{fechaTxt}</div>
          )}
        </div>
        <img
          src="/LOGOS/ELVIA_logo_fondo_transparente.png"
          alt="ELVIA"
          style={{ height: 56, width: 'auto', objectFit: 'contain' }}
          crossOrigin="anonymous"
        />
      </div>

      {/* Puntaje global */}
      <div style={{
        background: ELVIA.slate50,
        border: `1px solid ${ELVIA.slate100}`,
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        gap: 20,
      }}>
        <div style={{
          width: 90, height: 90, borderRadius: '50%',
          border: `6px solid ${tonoGlobal.color}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column',
          background: ELVIA.white,
        }}>
          <div style={{ fontSize: 30, fontWeight: 900, color: tonoGlobal.color, lineHeight: 1 }}>
            {r.puntaje_global ?? '—'}
          </div>
          <div style={{ fontSize: 8, fontWeight: 800, color: tonoGlobal.color, letterSpacing: 1 }}>/ 100</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: tonoGlobal.color, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 }}>
            Puntaje global · {tonoGlobal.label}
          </div>
          <p style={{ fontSize: 13, color: ELVIA.slate700, margin: 0, lineHeight: 1.55 }}>
            {r.resumen_global || 'Sin resumen disponible.'}
          </p>
        </div>
      </div>

      {/* Top acciones */}
      {Array.isArray(r.top_acciones) && r.top_acciones.length > 0 ? (
        <div style={{ marginBottom: 24, pageBreakInside: 'avoid' }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: ELVIA.azul, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>
            Top acciones para mejorar tu perfil
          </div>
          <ol style={{ margin: 0, paddingLeft: 20, color: ELVIA.slate700, fontSize: 12.5, lineHeight: 1.7 }}>
            {r.top_acciones.map((a, i) => <li key={i}>{a}</li>)}
          </ol>
        </div>
      ) : null}

      {/* Análisis por sección */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: ELVIA.azul, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 14 }}>
          Análisis por sección
        </div>
        <Section id="titular" />
        <Section id="extracto" />
        <Section id="experiencia" />
        <Section id="habilidades" />
        <Section id="educacion" />
      </div>

      {/* Disclaimer obligatorio */}
      <div style={{
        background: '#FEF3C7',
        borderLeft: `4px solid ${ELVIA.amber}`,
        borderRadius: 8,
        padding: 14,
        marginTop: 8,
        marginBottom: 16,
        pageBreakInside: 'avoid',
      }}>
        <div style={{ fontSize: 11, fontWeight: 900, color: '#92400E', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
          ⚠️ Importante — lee antes de aplicar
        </div>
        <p style={{ fontSize: 11.5, color: '#78350F', lineHeight: 1.55, margin: 0 }}>
          Estas son <strong>sugerencias generadas con IA</strong>. Tómate el tiempo para revisar cuidadosamente cada propuesta
          antes de aplicarla a tu perfil. <strong>Cambiar mucho tu perfil de LinkedIn de golpe puede confundir al mercado y a tu red</strong> —
          implementa los cambios gradualmente y mantén coherencia con tu marca personal.
        </p>
      </div>

      {/* Footer ELVIA */}
      <div style={{
        marginTop: 30,
        paddingTop: 14,
        borderTop: `1px solid ${ELVIA.slate100}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
      }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, color: ELVIA.azul, textTransform: 'uppercase', letterSpacing: 2 }}>
            Certificado de Calidad ELVIA
          </div>
          <div style={{ fontSize: 10, color: ELVIA.slate500, fontStyle: 'italic', marginTop: 2 }}>
            Construido y optimizado por mentores de carrera expertos y tecnología de última generación.
          </div>
        </div>
        <img
          src="/LOGOS/ELVIA_logo_fondo_transparente.png"
          alt="ELVIA"
          style={{ height: 28, width: 'auto', objectFit: 'contain' }}
          crossOrigin="anonymous"
        />
      </div>
    </div>
  )
}
