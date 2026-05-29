import React from 'react'

const C = {
  navy: '#002650', blue: '#019DF4', slate: '#0f172a', slate2: '#1e293b',
  muted: '#475569', muted2: '#94a3b8', hairline: '#e2e8f0', bg: '#f8fafc',
  white: '#ffffff', emerald: '#059669', emeraldSoft: '#ecfdf5',
  amber: '#d97706', amberSoft: '#fffbeb', indigo: '#4f46e5', indigoSoft: '#eef2ff',
}
const FONT = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"

function Row({ label, value, highlight }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '8px 0', borderBottom: `1px solid ${C.hairline}`,
    }}>
      <span style={{ fontSize: 12, color: C.muted, fontFamily: FONT }}>{label}</span>
      <span style={{
        fontSize: 13, fontWeight: 700, color: highlight ? C.emerald : C.slate,
        fontFamily: FONT,
      }}>{value || '—'}</span>
    </div>
  )
}

function Section({ title, color, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
        paddingBottom: 6, borderBottom: `2px solid ${color}`,
      }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: C.slate, fontFamily: FONT, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</span>
      </div>
      {children}
    </div>
  )
}

export default function ReporteCompensacion({ data, nombre, reporteRef }) {
  const perfil = data?.perfil || {}
  const recursos = data?.recursos?.recursos || (Array.isArray(data?.recursos) ? data.recursos : [])

  const salario = perfil.salario_monto || ''
  const moneda = perfil.moneda || 'MXN'
  const pais = perfil.pais_prestaciones || ''
  const prestaciones = perfil.prestaciones || []
  const prestacionesDetalle = perfil.prestaciones_detalle || {}
  const expectativa = perfil.expectativa_prestaciones || ''

  // Bonos
  const bonos = []
  if (perfil.bono_activo && perfil.bono_tipo) {
    let desc = perfil.bono_tipo
    if (perfil.bono_esquema === '%' && perfil.bono_pct) desc += ` — ${perfil.bono_pct}% del salario`
    else if (perfil.bono_esquema === 'Número de salarios' && perfil.bono_num_salarios) desc += ` — ${perfil.bono_num_salarios} salarios`
    else if (perfil.bono_monto) desc += ` — ${moneda} ${perfil.bono_monto}`
    if (perfil.bono_frecuencia) desc += ` (${perfil.bono_frecuencia})`
    bonos.push(desc)
  }
  ;(perfil.bonos_extra || []).forEach(b => {
    if (b.tipo) {
      let desc = b.tipo
      if (b.esquema === '%' && b.pct) desc += ` — ${b.pct}%`
      else if (b.esquema === 'Número de salarios' && b.num_salarios) desc += ` — ${b.num_salarios} salarios`
      else if (b.monto) desc += ` — ${moneda} ${b.monto}`
      if (b.frecuencia) desc += ` (${b.frecuencia})`
      bonos.push(desc)
    }
  })

  // Recursos con costo
  const recursosActivos = recursos.filter(r => r.tengo && Number(r.costo) > 0)
  const totalRecursos = recursosActivos.reduce((s, r) => s + (Number(r.costo) || 0), 0)

  const fecha = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div ref={reporteRef} style={{
      fontFamily: FONT, background: C.white, width: '794px', minHeight: '1123px',
      margin: '0 auto', boxSizing: 'border-box',
    }}>
      {/* Header */}
      <div style={{
        background: '#f1f5f9', borderBottom: `3px solid ${C.blue}`,
        padding: '24px 36px', display: 'grid', gridTemplateColumns: 'auto 1fr auto',
        alignItems: 'center', gap: 16,
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%', background: C.navy,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: C.white, fontSize: 20, fontWeight: 800, fontFamily: FONT,
        }}>
          {(nombre || 'U')[0].toUpperCase()}
        </div>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: C.slate, fontFamily: FONT }}>{nombre || 'Ejecutivo'}</div>
          <div style={{ fontSize: 11, color: C.muted, fontFamily: FONT, marginTop: 2 }}>Reporte de Compensación · {fecha}</div>
        </div>
        <img
          src="/LOGOS/ELVIA_logo_fondo_transparente.png" alt="ELVIA"
          style={{
            height: 28, width: 'auto', objectFit: 'contain',
            filter: 'brightness(0) saturate(100%) invert(13%) sepia(50%) saturate(700%) hue-rotate(192deg) brightness(90%)',
          }}
        />
      </div>

      {/* Body */}
      <div style={{ padding: '28px 36px' }}>

        {/* Salario */}
        <Section title="Salario Base" color={C.blue}>
          <Row label="Monto mensual" value={salario ? `${moneda} ${salario}` : ''} highlight />
          <Row label="Moneda" value={moneda} />
          {pais && <Row label="País / Región de prestaciones" value={pais} />}
        </Section>

        {/* Prestaciones */}
        {prestaciones.length > 0 && (
          <Section title="Prestaciones" color={C.emerald}>
            {prestaciones.map(p => {
              const detalle = prestacionesDetalle[p]
              return (
                <Row key={p} label={p}
                  value={detalle ? (typeof detalle === 'object' ? Object.values(detalle).filter(Boolean).join(' · ') : String(detalle)) : 'Incluida'} />
              )
            })}
          </Section>
        )}

        {/* Bonos */}
        {bonos.length > 0 && (
          <Section title="Bonos e Incentivos Variables" color={C.amber}>
            {bonos.map((b, i) => (
              <div key={i} style={{
                padding: '8px 12px', marginBottom: 6, borderRadius: 8,
                background: C.amberSoft, fontSize: 12, color: C.slate, fontFamily: FONT,
              }}>{b}</div>
            ))}
          </Section>
        )}

        {/* Otros comentarios */}
        {expectativa && (
          <Section title="Comentarios adicionales" color={C.indigo}>
            <div style={{
              background: C.indigoSoft, borderLeft: `3px solid ${C.indigo}`,
              borderRadius: 8, padding: '10px 14px',
              fontSize: 12, color: C.slate2, fontFamily: FONT, lineHeight: 1.6,
            }}>{expectativa}</div>
          </Section>
        )}

        {/* Inversión en búsqueda */}
        {recursosActivos.length > 0 && (
          <Section title="Inversión en la Búsqueda (mensual)" color={C.muted}>
            {recursosActivos.map(r => (
              <Row key={r.id} label={r.nombre || 'Recurso'} value={`${moneda} ${Number(r.costo).toLocaleString()}`} />
            ))}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginTop: 8, padding: '8px 12px', borderRadius: 8,
              background: C.bg, fontFamily: FONT,
            }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: C.slate }}>Total mensual estimado</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: C.navy }}>{moneda} {totalRecursos.toLocaleString()}</span>
            </div>
          </Section>
        )}

        {/* Disclaimer */}
        <div style={{
          marginTop: 28, padding: '12px 16px', borderRadius: 10,
          background: '#fff7ed', borderLeft: `3px solid ${C.amber}`,
          fontSize: 10, color: C.muted, fontFamily: FONT, lineHeight: 1.6,
        }}>
          <strong style={{ color: C.amber }}>Nota ELVIA®:</strong> Este reporte es un resumen de la información proporcionada por el usuario para su búsqueda laboral. Los montos y prestaciones son referencias personales y no constituyen una oferta de empleo.
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding: '12px 36px', background: C.navy,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontFamily: FONT }}>Reporte de Compensación · Generado con ELVIA®</span>
        <img src="/LOGOS/ELVIA_logo_fondo_transparente.png" alt="ELVIA" style={{ height: 20, width: 'auto', objectFit: 'contain', opacity: 0.7 }} />
      </div>
    </div>
  )
}
