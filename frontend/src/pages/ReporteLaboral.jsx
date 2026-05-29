import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../services/authService'
import html2pdf from 'html2pdf.js'
import { ArrowLeft, DownloadSimple } from '@phosphor-icons/react'

const FONT = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"

// Paleta ELVIA — alineada con la plataforma
const C = {
  navy:       '#002650',
  blue:       '#019DF4',
  slate:      '#0f172a',
  slate2:     '#1e293b',
  muted:      '#475569',
  muted2:     '#94a3b8',
  hairline:   '#e2e8f0',
  bg:         '#f8fafc',
  white:      '#ffffff',
  indigo:     '#4f46e5',
  indigoSoft: '#eef2ff',
  emerald:    '#059669',
  emeraldSoft:'#ecfdf5',
  amber:      '#d97706',
  amberSoft:  '#fffbeb',
  rose:       '#e11d48',
  roseSoft:   '#fff1f2',
}

// Cuadrante Ikigai — 4 tarjetas
const IKIGAI_CONFIG = [
  { key: 'ikigai_amas',     label: 'Lo que amas hacer',         color: C.amber,   bg: C.amberSoft,   icon: '❤️' },
  { key: 'ikigai_bueno',    label: 'En lo que destacas',        color: C.indigo,  bg: C.indigoSoft,  icon: '⭐' },
  { key: 'ikigai_necesita', label: 'Lo que el mundo necesita',  color: C.emerald, bg: C.emeraldSoft, icon: '🌍' },
  { key: 'ikigai_pagar',    label: 'Por lo que te pagarían',    color: C.navy,    bg: '#eff6ff',     icon: '💼' },
]

const CULTURA_COLORS = [
  { bg: C.indigoSoft,  color: C.indigo  },
  { bg: C.amberSoft,   color: C.amber   },
  { bg: C.emeraldSoft, color: C.emerald },
  { bg: '#fdf4ff',     color: '#7e22ce' },
  { bg: '#f0fdf4',     color: '#166534' },
  { bg: '#fff7ed',     color: '#c2410c' },
]

const DIAS_KEYS  = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes']
const DIAS_SHORT = ['L', 'M', 'X', 'J', 'V']

function SecTitle({ children, color = C.blue }) {
  return (
    <div style={{
      fontFamily: FONT, fontSize: 9, fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: '0.18em',
      color,
      paddingBottom: 6,
      borderBottom: `2px solid ${color}22`,
      marginBottom: 10,
    }}>
      {children}
    </div>
  )
}

export default function ReporteLaboral() {
  const { id }    = useParams()
  const navigate  = useNavigate()
  const [data,    setData]        = useState(null)
  const [loading, setLoading]     = useState(true)
  const [error,   setError]       = useState('')
  const [descargando, setDescargando] = useState(false)
  const reporteRef = useRef(null)

  useEffect(() => { cargarTodo() }, [id])

  const cargarTodo = async () => {
    try {
      const { data: row, error: cvError } = await supabase
        .from('cv_results')
        .select('contenido, metadata')
        .eq('id', id)
        .single()
      if (cvError || !row) throw new Error('No se encontró el reporte')
      setData(JSON.parse(row.contenido))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDescargar = () => {
    if (!reporteRef.current || descargando) return
    setDescargando(true)
    const nombre = (data?.nombreCandidato || 'Ejecutivo').replace(/\s+/g, '_')
    html2pdf()
      .set({
        margin: 0,
        filename: `Autoconocimiento_${nombre}.pdf`,
        image: { type: 'jpeg', quality: 0.97 },
        html2canvas: { scale: 2, useCORS: true, scrollY: 0, windowWidth: 794 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'] },
      })
      .from(reporteRef.current)
      .save()
      .finally(() => setDescargando(false))
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg, fontFamily: FONT }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: `3px solid ${C.hairline}`, borderTopColor: C.blue, animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
        <p style={{ color: C.muted, fontSize: 13 }}>Cargando infografía…</p>
      </div>
    </div>
  )

  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT }}>
      <p style={{ color: C.rose, fontSize: 16, fontWeight: 600 }}>{error}</p>
    </div>
  )

  // ── Extraer datos ────────────────────────────────────────────────────────────
  const jsp          = data || {}
  const perfil       = jsp.perfil           || {}
  const auto         = jsp.autoconocimiento || {}
  const oferta       = jsp.oferta           || {}
  const recursos     = jsp.recursos         || {}
  const semana       = jsp.semana           || {}

  const nombre       = data?.nombreCandidato || `${perfil.nombre1 || ''} ${perfil.apellido1 || ''}`.trim() || 'Ejecutivo'
  const cargo        = perfil.nombre_cargo   || data?.cargo    || 'Profesional'
  const ciudad       = perfil.ciudad         || data?.ciudad   || ''
  const pais         = perfil.pais           || data?.pais     || ''
  const ubicacion    = [ciudad, pais].filter(Boolean).join(', ')

  const hardSkills   = auto.hard_skills  || []
  const softSkills   = auto.soft_skills  || []
  const empresas     = auto.top5empresas || []

  const ofertaValor  = oferta.oferta_valor    || ''
  const cultura      = oferta.cultura         || []

  const ikigaiData   = {
    ikigai_amas:     oferta.ikigai_amas     || '',
    ikigai_bueno:    oferta.ikigai_bueno    || '',
    ikigai_necesita: oferta.ikigai_necesita || '',
    ikigai_pagar:    oferta.ikigai_pagar    || '',
  }

  const semanaBloques   = semana.bloques || {}
  const totalBloques    = Object.values(semanaBloques).filter(Boolean).length

  const rawRecursos     = Array.isArray(recursos) ? recursos : (Array.isArray(recursos.recursos) ? recursos.recursos : [])
  const recursosActivos = rawRecursos.filter(r => r.tengo).slice(0, 8)

  const expAnios     = perfil.experiencia_anios || data?.experiencia_anios || ''
  const salarioRaw   = perfil.salario_esperado  || data?.salario_esperado  || ''
  const moneda       = (salarioRaw.trim().split(' ')[1]) || perfil.moneda || ''
  const salario      = salarioRaw.trim().split(' ')[0] || ''
  const equipoPersonas = perfil.equipo_personas || data?.equipo_personas || ''

  const initials = (() => {
    const parts = nombre.split(' ').filter(Boolean)
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    return (parts[0]?.[0] || 'E').toUpperCase()
  })()

  const fecha = new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ background: '#e8edf2', minHeight: '100vh', fontFamily: FONT, paddingBottom: 80 }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @media print { .no-print { display: none !important } }
      `}</style>

      {/* Barra de acción */}
      <div className="no-print" style={{ maxWidth: 860, margin: '0 auto', padding: '20px 16px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <button
          onClick={() => navigate(-1)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: C.white, border: `1px solid ${C.hairline}`, borderRadius: 10, padding: '9px 18px', fontSize: 13, fontWeight: 600, color: C.muted, cursor: 'pointer', fontFamily: FONT }}
        >
          <ArrowLeft size={15} weight="bold" /> Volver
        </button>
        <button
          onClick={handleDescargar}
          disabled={descargando}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: C.navy, color: C.white, border: 'none', borderRadius: 10, padding: '10px 24px', fontSize: 13, fontWeight: 700, cursor: descargando ? 'not-allowed' : 'pointer', opacity: descargando ? 0.6 : 1, fontFamily: FONT }}
        >
          <DownloadSimple size={17} weight="bold" />
          {descargando ? 'Generando…' : 'Descargar PDF'}
        </button>
      </div>

      {/* ── SHEET A4 ──────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '0 16px' }}>
        <div
          ref={reporteRef}
          style={{
            width: '210mm',
            background: C.white,
            boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
            borderRadius: 4,
            overflow: 'hidden',
          }}
        >

          {/* ── HEADER ─────────────────────────────────────────────────────────── */}
          <div style={{
            background: '#f1f5f9',
            borderBottom: `3px solid ${C.blue}`,
            padding: '24px 36px',
            display: 'grid',
            gridTemplateColumns: 'auto 1fr auto',
            gap: 20,
            alignItems: 'center',
          }}>
            {/* Avatar */}
            <div style={{
              width: 68, height: 68, borderRadius: '50%',
              background: C.navy,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, fontWeight: 800, color: C.white,
              flexShrink: 0,
            }}>
              {initials}
            </div>

            {/* Nombre y cargo */}
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: C.blue, marginBottom: 4 }}>
                Resumen de Autoconocimiento
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: C.slate, letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 4 }}>
                {nombre}
              </div>
              <div style={{ fontSize: 12, color: C.muted, fontWeight: 500 }}>
                {cargo}{ubicacion ? ` · ${ubicacion}` : ''}
              </div>
            </div>

            {/* Logo ELVIA */}
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <img
                src="/LOGOS/ELVIA_logo_fondo_transparente.png"
                alt="ELVIA"
                style={{ height: 28, objectFit: 'contain', filter: 'brightness(0) saturate(100%) invert(13%) sepia(50%) saturate(700%) hue-rotate(192deg) brightness(90%)' }}
              />
              <div style={{ fontSize: 9, color: C.muted2, marginTop: 6, letterSpacing: '0.1em' }}>
                {fecha}
              </div>
            </div>
          </div>

          {/* ── OFERTA DE VALOR ────────────────────────────────────────────────── */}
          {ofertaValor && (
            <div style={{ background: C.indigoSoft, borderBottom: `1px solid ${C.hairline}`, padding: '16px 36px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{ fontSize: 42, fontWeight: 900, color: C.indigo, lineHeight: 0.8, marginTop: 2, flexShrink: 0 }}>&ldquo;</div>
              <div>
                <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.indigo, marginBottom: 5 }}>Mi oferta de valor</div>
                <p style={{ fontSize: 13, lineHeight: 1.55, color: C.slate2, margin: 0, fontWeight: 500 }}>{ofertaValor}</p>
              </div>
            </div>
          )}

          {/* ── STATS STRIP ───────────────────────────────────────────────────── */}
          {(expAnios || salario || equipoPersonas || hardSkills.length > 0) && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', background: C.bg, borderBottom: `1px solid ${C.hairline}` }}>
              {[
                { v: expAnios || '—', unit: expAnios ? 'años' : '', label: 'Experiencia', color: C.navy },
                { v: salario ? Number(String(salario).replace(/\./g, '').replace(',', '')).toLocaleString('es') : '—', unit: salario ? moneda : '', label: 'Expectativa salarial/mes', color: C.amber },
                { v: equipoPersonas ? `+${equipoPersonas}` : hardSkills.length > 0 ? hardSkills.length : '—', unit: '', label: equipoPersonas ? 'Personas lideradas' : 'Hard Skills', color: C.emerald },
                { v: empresas.length > 0 ? empresas.length : softSkills.length > 0 ? softSkills.length : '—', unit: '', label: empresas.length > 0 ? 'Empresas objetivo' : 'Power Skills', color: C.indigo },
              ].map((s, i) => (
                <div key={i} style={{ padding: '12px 20px', borderRight: i < 3 ? `1px solid ${C.hairline}` : 'none' }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: s.color, letterSpacing: '-0.03em', lineHeight: 1 }}>
                    {s.v}
                    {s.unit && <span style={{ fontSize: 13, fontWeight: 500, color: C.muted2, marginLeft: 3 }}>{s.unit}</span>}
                  </div>
                  <div style={{ fontSize: 9, color: C.muted2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* ── BODY: 2 columnas ──────────────────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px' }}>

            {/* Columna izquierda */}
            <div style={{ padding: '22px 28px 22px 36px', borderRight: `1px solid ${C.hairline}` }}>

              {/* IKIGAI */}
              {(ikigaiData.ikigai_amas || ikigaiData.ikigai_bueno || ikigaiData.ikigai_necesita || ikigaiData.ikigai_pagar) && (
                <div style={{ marginBottom: 20 }}>
                  <SecTitle color={C.navy}>Propósito · Ikigai</SecTitle>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {IKIGAI_CONFIG.map((q) => (
                      <div key={q.key} style={{ background: q.bg, borderRadius: 8, padding: '10px 12px', borderLeft: `3px solid ${q.color}` }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: q.color, marginBottom: 3 }}>
                          {q.icon} {q.label}
                        </div>
                        <p style={{ fontSize: 11, color: C.slate2, margin: 0, lineHeight: 1.45 }}>
                          {ikigaiData[q.key] || <span style={{ color: C.muted2, fontStyle: 'italic' }}>Sin completar</span>}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* HARD SKILLS */}
              {hardSkills.length > 0 && (
                <div style={{ marginBottom: 18 }}>
                  <SecTitle color={C.blue}>Hard Skills</SecTitle>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {hardSkills.map((s, i) => (
                      <span key={i} style={{
                        background: '#eff6ff', color: '#1d4ed8',
                        border: '1px solid #bfdbfe',
                        padding: '3px 10px', borderRadius: 20,
                        fontSize: 11, fontWeight: 600, lineHeight: 1.4,
                      }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* POWER SKILLS */}
              {softSkills.length > 0 && (
                <div style={{ marginBottom: 18 }}>
                  <SecTitle color={C.indigo}>Power Skills</SecTitle>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {softSkills.map((s, i) => (
                      <span key={i} style={{
                        background: C.indigoSoft, color: C.indigo,
                        border: `1px solid ${C.indigo}33`,
                        padding: '3px 10px', borderRadius: 20,
                        fontSize: 11, fontWeight: 600, lineHeight: 1.4,
                      }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* CULTURA */}
              {cultura.length > 0 && (
                <div>
                  <SecTitle color={C.emerald}>Cultura que busco</SecTitle>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {cultura.map((c, i) => {
                      const tc = CULTURA_COLORS[i % CULTURA_COLORS.length]
                      return (
                        <span key={i} style={{
                          background: tc.bg, color: tc.color,
                          padding: '3px 10px', borderRadius: 20,
                          fontSize: 11, fontWeight: 600,
                        }}>
                          # {c}
                        </span>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Columna derecha */}
            <div style={{ padding: '22px 36px 22px 20px', background: C.bg, display: 'flex', flexDirection: 'column', gap: 18 }}>

              {/* EMPRESAS OBJETIVO */}
              {empresas.length > 0 && (
                <div>
                  <SecTitle color={C.navy}>Empresas objetivo</SecTitle>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {empresas.map((emp, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        background: C.white, borderRadius: 8, padding: '6px 10px',
                        border: `1px solid ${C.hairline}`,
                        fontSize: 12, fontWeight: 600, color: C.slate,
                      }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.blue, flexShrink: 0 }} />
                        {emp}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* RITMO SEMANAL */}
              {totalBloques > 0 && (
                <div>
                  <SecTitle color={C.navy}>Ritmo semanal</SecTitle>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 3, marginBottom: 6 }}>
                    {DIAS_SHORT.map((day, di) => {
                      const key = DIAS_KEYS[di]
                      const amOn = !!semanaBloques[`${key}_am`]
                      const pmOn = !!semanaBloques[`${key}_pm`]
                      return (
                        <div key={di} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <div style={{ textAlign: 'center', fontSize: 8, fontWeight: 700, color: C.muted2, letterSpacing: '0.1em', marginBottom: 1 }}>{day}</div>
                          <div style={{ height: 18, borderRadius: 3, background: amOn ? C.blue : C.hairline }} />
                          <div style={{ height: 18, borderRadius: 3, background: pmOn ? `${C.blue}88` : C.hairline }} />
                        </div>
                      )
                    })}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: C.muted }}>
                    <span><b style={{ color: C.slate, fontSize: 13 }}>{totalBloques}</b> bloques</span>
                    <span><b style={{ color: C.slate, fontSize: 13 }}>{totalBloques * 2}h</b> / sem</span>
                  </div>
                </div>
              )}

              {/* RECURSOS ACTIVOS */}
              {recursosActivos.length > 0 && (
                <div>
                  <SecTitle color={C.navy}>Recursos activos</SecTitle>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {recursosActivos.map((r, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '4px 0',
                        borderTop: i > 0 ? `1px dashed ${C.hairline}` : 'none',
                        fontSize: 11, color: C.slate2,
                      }}>
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: C.emerald, flexShrink: 0 }} />
                        {r.nombre}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── FOOTER ────────────────────────────────────────────────────────── */}
          <div style={{
            background: C.navy,
            padding: '10px 36px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>
              Generado por <span style={{ color: C.blue, fontWeight: 700 }}>ELVIA®</span> · Ecosistema de Carrera
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>
              {fecha}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
