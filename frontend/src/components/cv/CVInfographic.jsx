import { useRef, useState } from 'react'
import html2canvas from 'html2canvas'

// ── Helpers ─────────────────────────────────────────────────────────────────

const iniciales = (nombre) => {
  if (!nombre) return 'CV'
  return nombre.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase()
}

const puntosIdioma = (puntos = 0) =>
  Array.from({ length: 5 }, (_, i) => i < puntos)

// ── Componente principal ────────────────────────────────────────────────────

export default function CVInfographic({ datos, matchScore, jobData, analisis, watermark }) {
  const ref = useRef(null)
  const [descargando, setDescargando] = useState(false)

  const descargar = async () => {
    if (!ref.current) return
    setDescargando(true)
    try {
      const canvas = await html2canvas(ref.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      })
      const link = document.createElement('a')
      link.download = `CV-Infografico-${datos.nombre?.split(' ')[0] || 'CV'}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } finally {
      setDescargando(false)
    }
  }

  if (!datos) return null

  const tieneMatch = matchScore != null

  return (
    <div>
      {/* Botón de descarga fuera del área capturada */}
      <div className="flex justify-end mb-3">
        <button
          onClick={descargar}
          disabled={descargando}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60"
        >
          {descargando ? (
            <>
              <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              Generando...
            </>
          ) : (
            <>↓ Descargar PNG</>
          )}
        </button>
      </div>

      {/* Área capturada por html2canvas */}
      <div
        ref={ref}
        style={{
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          background: '#ffffff',
          width: '900px',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          position: 'relative',
        }}
      >
        {/* Watermark */}
        {watermark && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 50,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
          }}>
            <div style={{
              transform: 'rotate(-35deg)',
              fontSize: '72px', fontWeight: 900,
              color: 'rgba(0,0,0,0.06)',
              letterSpacing: '8px',
              userSelect: 'none',
              whiteSpace: 'nowrap',
            }}>
              ELVIA DEMO
            </div>
          </div>
        )}

        {/* ── HEADER ── */}
        <div style={{
          background: 'linear-gradient(135deg, #1e3a5f 0%, #2d6a4f 100%)',
          padding: '40px 48px',
          display: 'grid',
          gridTemplateColumns: 'auto 1fr',
          gap: '28px',
          alignItems: 'center',
        }}>
          {/* Avatar */}
          <div style={{
            width: 100, height: 100, borderRadius: '50%',
            background: 'linear-gradient(135deg, #52b788, #74c69d)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 36, fontWeight: 800, color: 'white',
            border: '4px solid rgba(255,255,255,0.25)',
            flexShrink: 0,
          }}>
            {iniciales(datos.nombre)}
          </div>

          <div>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'white', marginBottom: 4, letterSpacing: '-0.3px' }}>
              {datos.nombre || 'Nombre no detectado'}
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {datos.cargo || ''}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {[
                datos.contacto?.email && `✉ ${datos.contacto.email}`,
                datos.contacto?.telefono && `📱 ${datos.contacto.telefono}`,
                datos.contacto?.ciudad && `📍 ${datos.contacto.ciudad}`,
                datos.contacto?.linkedin && `💼 ${datos.contacto.linkedin}`,
              ].filter(Boolean).map((chip, i) => (
                <span key={i} style={{
                  background: 'rgba(255,255,255,0.12)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: 'rgba(255,255,255,0.9)',
                  padding: '4px 12px', borderRadius: 20,
                  fontSize: 11,
                }}>
                  {chip}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── BARRA DE MATCH (solo CV vs Vacante) ── */}
        {tieneMatch && (
          <div style={{
            background: '#f7fafc',
            borderBottom: '1px solid #e2e8f0',
            padding: '14px 48px',
            display: 'flex', alignItems: 'center', gap: 24,
          }}>
            <div>
              <div style={{ fontSize: 11, color: '#718096', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Match con vacante
              </div>
              {jobData?.title && (
                <div style={{ fontSize: 11, color: '#a0aec0', marginTop: 2 }}>
                  {jobData.title}{jobData.location ? ` · ${jobData.location}` : ''}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                fontSize: 26, fontWeight: 800,
                color: matchScore >= 75 ? '#2d6a4f' : matchScore >= 50 ? '#d97706' : '#dc2626',
              }}>
                {matchScore}%
              </div>
              <div style={{ width: 160, height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 4,
                  width: `${matchScore}%`,
                  background: matchScore >= 75
                    ? 'linear-gradient(90deg, #2d6a4f, #52b788)'
                    : matchScore >= 50
                    ? 'linear-gradient(90deg, #d97706, #f59e0b)'
                    : 'linear-gradient(90deg, #dc2626, #f87171)',
                }} />
              </div>
            </div>
            {analisis?.fortalezas?.slice(0, 2).map((f, i) => (
              <span key={i} style={{
                background: '#c6f6d5', color: '#276749',
                padding: '3px 10px', borderRadius: 10,
                fontSize: 11, fontWeight: 600,
              }}>
                ✓ {f.length > 28 ? f.substring(0, 28) + '…' : f}
              </span>
            ))}
          </div>
        )}

        {/* ── BODY ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px' }}>

          {/* Columna principal */}
          <div style={{ padding: '36px 36px 36px 48px', borderRight: '1px solid #e2e8f0' }}>

            {/* Resumen */}
            {datos.resumen && (
              <Section title="Resumen Profesional">
                <p style={{ fontSize: 13, lineHeight: 1.7, color: '#4a5568' }}>{datos.resumen}</p>
              </Section>
            )}

            {/* Experiencia */}
            {datos.experiencia?.length > 0 && (
              <Section title="Experiencia Profesional">
                <div style={{ position: 'relative' }}>
                  <div style={{
                    position: 'absolute', left: 7, top: 8, bottom: 8,
                    width: 2,
                    background: 'linear-gradient(to bottom, #2d6a4f, #e2e8f0)',
                  }} />
                  {datos.experiencia.map((exp, i) => (
                    <div key={i} style={{ paddingLeft: 28, marginBottom: 22, position: 'relative' }}>
                      <div style={{
                        position: 'absolute', left: 0, top: 6,
                        width: 16, height: 16, borderRadius: '50%',
                        background: i === 0 ? '#2d6a4f' : 'white',
                        border: '3px solid #2d6a4f',
                      }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#1a202c' }}>{exp.cargo}</div>
                        <div style={{
                          fontSize: 11, color: '#718096',
                          background: '#f7fafc', padding: '2px 10px', borderRadius: 10,
                          whiteSpace: 'nowrap', marginLeft: 8, flexShrink: 0,
                        }}>
                          {exp.periodo}
                        </div>
                      </div>
                      <div style={{ fontSize: 13, color: '#4a5568', marginBottom: 6 }}>{exp.empresa}</div>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {exp.bullets?.map((b, j) => (
                          <li key={j} style={{ fontSize: 12, color: '#4a5568', display: 'flex', gap: 6, marginBottom: 3, lineHeight: 1.5 }}>
                            <span style={{ color: '#52b788', flexShrink: 0 }}>▸</span>
                            {b}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Educación */}
            {datos.educacion?.length > 0 && (
              <Section title="Educación">
                {datos.educacion.map((edu, i) => (
                  <div key={i} style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#1a202c' }}>{edu.titulo}</div>
                    <div style={{ fontSize: 13, color: '#4a5568' }}>{edu.institucion}</div>
                    <div style={{ fontSize: 12, color: '#718096' }}>{edu.anio}</div>
                  </div>
                ))}
              </Section>
            )}

          </div>

          {/* Columna lateral */}
          <div style={{ padding: '36px 28px', background: '#fafbfc' }}>

            {/* Diferenciadores */}
            {datos.diferenciadores?.length > 0 && (
              <Section title="Sus Diferenciadores">
                {datos.diferenciadores.map((d, i) => (
                  <div key={i} style={{
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    borderLeft: '4px solid #1e3a5f',
                    borderRadius: '0 8px 8px 0',
                    padding: '8px 12px',
                    marginBottom: 8,
                    fontSize: 12, color: '#2d3748', lineHeight: 1.5,
                  }}>
                    ⭐ {d}
                  </div>
                ))}
              </Section>
            )}

            {/* Habilidades */}
            {datos.habilidades?.length > 0 && (
              <Section title="Habilidades Clave">
                {datos.habilidades.map((h, i) => (
                  <div key={i} style={{ marginBottom: 9 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 500, color: '#2d3748', marginBottom: 4 }}>
                      <span>{h.nombre}</span>
                      <span style={{ color: '#718096', fontSize: 11 }}>{h.nivel}%</span>
                    </div>
                    <div style={{ height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 3,
                        width: `${h.nivel}%`,
                        background: 'linear-gradient(90deg, #2d6a4f, #52b788)',
                      }} />
                    </div>
                  </div>
                ))}
              </Section>
            )}

            {/* Idiomas */}
            {datos.idiomas?.length > 0 && (
              <Section title="Idiomas">
                {datos.idiomas.map((lang, i) => (
                  <div key={i} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#2d3748' }}>{lang.idioma}</span>
                      <span style={{
                        fontSize: 11, fontWeight: 600,
                        background: '#c6f6d5', color: '#276749',
                        padding: '2px 8px', borderRadius: 10,
                      }}>
                        {lang.nivel}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {puntosIdioma(lang.puntos).map((filled, j) => (
                        <div key={j} style={{
                          width: 10, height: 10, borderRadius: '50%',
                          background: filled ? '#2d6a4f' : 'white',
                          border: `2px solid ${filled ? '#2d6a4f' : '#d1d5db'}`,
                        }} />
                      ))}
                    </div>
                  </div>
                ))}
              </Section>
            )}

            {/* Logros */}
            {datos.logros?.length > 0 && (
              <Section title="Logros Destacados">
                {datos.logros.map((logro, i) => (
                  <div key={i} style={{
                    background: 'white', border: '1px solid #e2e8f0',
                    borderLeft: '4px solid #2d6a4f',
                    borderRadius: '0 8px 8px 0',
                    padding: '8px 12px', marginBottom: 8,
                  }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#2d6a4f', lineHeight: 1 }}>{logro.numero}</div>
                    <div style={{ fontSize: 11, color: '#4a5568', marginTop: 2, lineHeight: 1.4 }}>{logro.descripcion}</div>
                  </div>
                ))}
              </Section>
            )}

            {/* Herramientas */}
            {datos.herramientas?.length > 0 && (
              <Section title="Herramientas">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {datos.herramientas.map((h, i) => (
                    <span key={i} style={{
                      background: '#ebf8ff', color: '#2b6cb0',
                      padding: '3px 10px', borderRadius: 10,
                      fontSize: 11, fontWeight: 500,
                    }}>
                      {h}
                    </span>
                  ))}
                </div>
              </Section>
            )}

          </div>
        </div>

        {/* ── FOOTER ── */}
        <div style={{
          background: '#1e3a5f',
          padding: '12px 48px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>
            Generado por <span style={{ color: '#52b788', fontWeight: 700 }}>ELVIA</span>
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
            {new Date().toLocaleDateString('es-MX', { month: 'short', year: 'numeric' })}
          </div>
        </div>

      </div>
    </div>
  )
}

// ── Sub-componente de sección ────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{
        fontSize: 10, fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '1.5px',
        color: '#2d6a4f',
        marginBottom: 12,
        paddingBottom: 6,
        borderBottom: '2px solid #c6f6d5',
      }}>
        {title}
      </div>
      {children}
    </div>
  )
}
