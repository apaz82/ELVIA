// Componente de renderizado para html2pdf — NO se muestra en la UI.
// Recibe análisis completo + textos editables finales del usuario.
import { forwardRef } from 'react'

const colorLabel = (score) => {
  if (score >= 80) return { label: 'Excelente', color: '#059669', bg: '#ecfdf5', border: '#6ee7b7' }
  if (score >= 60) return { label: 'Bueno',     color: '#2563eb', bg: '#eff6ff', border: '#93c5fd' }
  if (score >= 40) return { label: 'Regular',   color: '#d97706', bg: '#fffbeb', border: '#fcd34d' }
  return             { label: 'Urgente',   color: '#dc2626', bg: '#fef2f2', border: '#fca5a5' }
}

const SECCIONES_LABELS = {
  titular:     'Titular (Headline)',
  extracto:    'Extracto (About)',
  experiencia: 'Experiencia',
  habilidades: 'Aptitudes (Skills)',
  idiomas:     'Idiomas (Languages)',
  educacion:   'Educación',
}

const IDIOMAS_TIP = 'Es ideal determinar el nivel de inglés realista. Te recomendamos hacer algún test gratuito en línea de buena reputación o si tienes de alguna institución avalada del idioma, y tenerlo en cuenta para esta sección.'

const LinkedinReportePDF = forwardRef(function LinkedinReportePDF({ analisis, editables, original }, ref) {
  if (!analisis) return null
  const colorG = colorLabel(analisis.puntaje_global || 0)
  const fecha = new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })

  const secciones = Object.entries(analisis.secciones || {}).filter(([, v]) => v && v.puntaje !== null)

  return (
    <div ref={ref} style={{ fontFamily: "'Plus Jakarta Sans', Arial, sans-serif", color: '#0f172a', background: '#fff', padding: '32px 40px', maxWidth: '800px', margin: '0 auto', fontSize: '12px', lineHeight: '1.6' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '3px solid #019DF4', paddingBottom: '16px', marginBottom: '24px' }}>
        <div>
          <img src="/LOGOS/ELVIA_logo_fondo_transparente.png" alt="ELVIA" style={{ height: '32px', objectFit: 'contain' }} />
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a' }}>Análisis LinkedIn® Pro</div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{fecha}</div>
        </div>
      </div>

      {/* Puntaje global */}
      <div style={{ background: colorG.bg, border: `2px solid ${colorG.border}`, borderRadius: '12px', padding: '16px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ width: '72px', height: '72px', borderRadius: '50%', border: `5px solid ${colorG.color}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fff', flexShrink: 0 }}>
          <span style={{ fontSize: '22px', fontWeight: '900', color: colorG.color }}>{analisis.puntaje_global}</span>
          <span style={{ fontSize: '9px', color: colorG.color, fontWeight: '700' }}>/ 100</span>
        </div>
        <div>
          <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', marginBottom: '4px' }}>
            Puntaje Global — <span style={{ color: colorG.color }}>{colorG.label}</span>
          </div>
          <div style={{ fontSize: '11px', color: '#475569', lineHeight: '1.5' }}>{analisis.resumen_global}</div>
        </div>
      </div>

      {/* Top acciones */}
      {analisis.top_acciones?.length > 0 && (
        <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '10px', padding: '14px 18px', marginBottom: '20px' }}>
          <div style={{ fontWeight: '800', fontSize: '11px', color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>⚡ Top acciones para mejorar tu perfil</div>
          <ol style={{ margin: 0, paddingLeft: '18px' }}>
            {analisis.top_acciones.map((a, i) => (
              <li key={i} style={{ fontSize: '11px', color: '#78350f', marginBottom: '4px' }}>{a}</li>
            ))}
          </ol>
        </div>
      )}

      {/* Disclaimer */}
      <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '8px', padding: '10px 14px', marginBottom: '24px' }}>
        <span style={{ fontWeight: '800', color: '#92400e' }}>⚠️ Importante: </span>
        <span style={{ color: '#78350f', fontSize: '10px' }}>Estas son sugerencias generadas con IA. Tómate tiempo para revisar cada propuesta antes de aplicarla. Cambiar mucho tu perfil de golpe puede confundir al mercado — implementa los cambios gradualmente.</span>
      </div>

      {/* Secciones */}
      {secciones.map(([secId, datos]) => {
        const c = colorLabel(datos.puntaje || 0)
        const label = SECCIONES_LABELS[secId] || secId
        const esHabilidades = secId === 'habilidades'
        const esIdiomas = secId === 'idiomas'
        const habilidadesArray = esHabilidades
          ? (Array.isArray(editables?.[secId])
              ? editables[secId].filter(Boolean)
              : String(editables?.[secId] || '').split(/[,\n;]+/).map(s => s.trim()).filter(Boolean))
          : []
        const textoEditable = esHabilidades ? '' : (editables?.[secId] || '')
        const textoOriginal = original?.[secId] || ''

        return (
          <div key={secId} style={{ border: `1px solid ${c.border}`, borderRadius: '10px', marginBottom: '20px', overflow: 'hidden', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
            {/* Header sección: título a la izquierda, círculo de score a la derecha */}
            <div style={{ background: c.bg, padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: '800', fontSize: '14px', color: '#0f172a', lineHeight: '1.3' }}>{label}</div>
                <span style={{ fontSize: '10px', fontWeight: '700', color: c.color, background: '#fff', border: `1px solid ${c.border}`, padding: '1px 8px', borderRadius: '20px', display: 'inline-block', marginTop: '2px' }}>{c.label}</span>
              </div>
              <div style={{ width: '44px', height: '44px', borderRadius: '50%', border: `3px solid ${c.color}`, background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: '14px', fontWeight: '900', color: c.color, lineHeight: '1' }}>{datos.puntaje}</span>
                <span style={{ fontSize: '7px', color: c.color, fontWeight: '700' }}>/ 100</span>
              </div>
            </div>

            <div style={{ padding: '12px 16px' }}>
              {/* Diagnóstico */}
              {datos.diagnostico && (
                <p style={{ fontSize: '11px', color: '#475569', marginBottom: '10px', fontStyle: 'italic' }}>{datos.diagnostico}</p>
              )}

              {/* Fortalezas */}
              {datos.fortalezas?.length > 0 && (
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ fontSize: '10px', fontWeight: '800', color: '#059669', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>✓ Fortalezas</div>
                  {datos.fortalezas.map((f, i) => (
                    <div key={i} style={{ fontSize: '11px', color: '#374151', paddingLeft: '12px' }}>• {f}</div>
                  ))}
                </div>
              )}

              {/* Mejoras */}
              {datos.mejoras?.length > 0 && (
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ fontSize: '10px', fontWeight: '800', color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>→ Qué mejorar</div>
                  {datos.mejoras.map((m, i) => (
                    <div key={i} style={{ fontSize: '11px', color: '#374151', paddingLeft: '12px' }}>→ {m}</div>
                  ))}
                </div>
              )}

              {/* Tip especial idiomas */}
              {esIdiomas && (
                <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', padding: '10px 12px', marginBottom: '10px' }}>
                  <div style={{ fontSize: '10px', fontWeight: '800', color: '#0369a1', marginBottom: '4px' }}>💡 Tip ELVIA</div>
                  <div style={{ fontSize: '10px', color: '#0c4a6e', lineHeight: '1.5' }}>{IDIOMAS_TIP}</div>
                </div>
              )}

              {/* Sugerencia — habilidades como chips */}
              {esHabilidades && habilidadesArray.length > 0 && (
                <div style={{ background: '#f0fdf4', border: '2px solid #86efac', borderRadius: '8px', padding: '10px 12px', marginBottom: '8px' }}>
                  <div style={{ fontSize: '10px', fontWeight: '800', color: '#166534', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Sugerencia</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {habilidadesArray.map((s, i) => (
                      <span key={i} style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: '20px', padding: '2px 10px', fontSize: '10px', color: '#15803d', fontWeight: '600' }}>{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Sugerencia — texto largo para las demás secciones */}
              {!esHabilidades && textoEditable && (
                <div style={{ background: '#f0fdf4', border: '2px solid #86efac', borderRadius: '8px', padding: '10px 12px', marginBottom: '8px' }}>
                  <div style={{ fontSize: '10px', fontWeight: '800', color: '#166534', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Sugerencia</div>
                  <div style={{ fontSize: '11px', color: '#15803d', lineHeight: '1.6', whiteSpace: 'pre-line' }}>{textoEditable}</div>
                </div>
              )}

              {/* Texto original */}
              {textoOriginal && textoOriginal.trim() && (
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 12px' }}>
                  <div style={{ fontSize: '10px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Texto original tuyo</div>
                  <div style={{ fontSize: '10px', color: '#64748b', lineHeight: '1.5', whiteSpace: 'pre-line' }}>{textoOriginal}</div>
                </div>
              )}
            </div>
          </div>
        )
      })}

      {/* Footer */}
      <div style={{ borderTop: '2px solid #e2e8f0', marginTop: '24px', paddingTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <img src="/LOGOS/ELVIA_logo_fondo_transparente.png" alt="ELVIA" style={{ height: '20px', objectFit: 'contain', filter: 'brightness(0) saturate(100%) invert(30%) sepia(50%) saturate(300%) hue-rotate(160deg)' }} />
        <div style={{ fontSize: '9px', color: '#94a3b8', textAlign: 'right' }}>
          Generado por ELVIA® · {fecha}<br />
          Sugerencias de IA — tu criterio es la palabra final
        </div>
      </div>
    </div>
  )
})

export default LinkedinReportePDF
