import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../services/authService'
import html2pdf from 'html2pdf.js'
import { ArrowLeft, DownloadSimple } from '@phosphor-icons/react'
import HelpBadge from '../components/common/HelpBadge'

// ── Design tokens ────────────────────────────────────────────────────────────
const C = {
  paper:       '#F5F1E6',
  paper2:      '#ECE7D6',
  ink:         '#0E0D0A',
  inkSoft:     '#2A2722',
  muted:       '#6B675E',
  muted2:      '#9A968C',
  hairline:    '#D6D1BF',
  navy:        '#0F1B3D',
  navy2:       '#1A2952',
  marine:      '#1E3A8A',
  marineSoft:  '#DCE3F2',
  saffron:     '#D97706',
  saffronSoft: '#FBE8C7',
  saffronLight:'#F2B450',
  sage:        '#365314',
  sageSoft:    '#DBE4C9',
  plum:        '#831843',
  plumSoft:    '#F2D6E1',
}
const DISPLAY = '"Bricolage Grotesque", system-ui, sans-serif'
const BODY    = '"Inter Tight", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
const MONO    = '"JetBrains Mono", ui-monospace, Menlo, monospace'

// SVG resource icons (stroke-based, curated)
const RES_ICONS = [
  <svg viewBox="0 0 24 24" style={{ width: 18, height: 18, stroke: 'currentColor', fill: 'none', strokeWidth: 1.4, strokeLinecap: 'round', strokeLinejoin: 'round' }}><rect x="6" y="3" width="12" height="18" rx="1"/><circle cx="14.5" cy="12" r="0.7" fill="currentColor"/></svg>,
  <svg viewBox="0 0 24 24" style={{ width: 18, height: 18, stroke: 'currentColor', fill: 'none', strokeWidth: 1.4, strokeLinecap: 'round', strokeLinejoin: 'round' }}><path d="M3 12c2 0 2-4 4-4s2 8 4 8 2-6 4-6 2 4 4 4"/></svg>,
  <svg viewBox="0 0 24 24" style={{ width: 18, height: 18, stroke: 'currentColor', fill: 'none', strokeWidth: 1.4, strokeLinecap: 'round', strokeLinejoin: 'round' }}><path d="M5 5h14v10H5z"/><path d="M3 17h18l-1 2H4z"/></svg>,
  <svg viewBox="0 0 24 24" style={{ width: 18, height: 18, stroke: 'currentColor', fill: 'none', strokeWidth: 1.4, strokeLinecap: 'round', strokeLinejoin: 'round' }}><circle cx="6" cy="6" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/><path d="M8 6h8M6 8v8M18 8v8M8 18h8"/></svg>,
  <svg viewBox="0 0 24 24" style={{ width: 18, height: 18, stroke: 'currentColor', fill: 'none', strokeWidth: 1.4, strokeLinecap: 'round', strokeLinejoin: 'round' }}><circle cx="12" cy="12" r="9"/><path d="M16 8l-2 6-6 2 2-6z" fill="currentColor" stroke="none"/></svg>,
]

// ── Word cloud size assignments ───────────────────────────────────────────────
const CLOUD_SIZES = ['xl', 'lg', 'xl', 'md', 'lg', 'sm', 'md', 'sm', 'lg', 'md', 'sm', 'md']
const CLOUD_STYLE = {
  xl: { fontSize: 32, fontWeight: 800, color: 'white', letterSpacing: '-0.04em' },
  lg: { fontSize: 22, fontWeight: 700, color: 'white' },
  md: { fontSize: 16, fontWeight: 600, color: '#F2B450' },
  sm: { fontSize: 12, fontWeight: 500, color: 'rgba(242,180,80,0.7)' },
}

// Cultura tag color cycling
const TAG_COLORS = [
  { bg: '#FBE8C7', color: '#D97706' },
  { bg: '#DCE3F2', color: '#1E3A8A' },
  { bg: '#DBE4C9', color: '#365314' },
  { bg: '#F2D6E1', color: '#831843' },
]

// Company style cycling (typographic logos)
const CO_STYLES = [
  { fontWeight: 600, color: '#0E0D0A' },
  { fontStyle: 'italic', fontWeight: 500, color: '#1E3A8A' },
  { fontWeight: 700, letterSpacing: '-0.045em', color: '#D97706' },
  { fontWeight: 500, color: '#365314' },
  { fontWeight: 600, letterSpacing: 0, color: '#831843' },
]

const DIAS_SHORT = ['L', 'M', 'M', 'J', 'V']
const DIAS_KEYS  = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes']

// ── SecLabel helper ───────────────────────────────────────────────────────────
function SecLabel({ children }) {
  return (
    <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.24em', textTransform: 'uppercase', color: C.muted2, fontWeight: 600, marginBottom: 14 }}>
      {children}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function ReporteLaboral() {
  const { id }    = useParams()
  const navigate  = useNavigate()
  const [data,    setData]        = useState(null)
  const [profile, setProfile]     = useState(null)
  const [loading, setLoading]     = useState(true)
  const [error,   setError]       = useState('')
  const [descargando, setDescargando] = useState(false)
  const reporteRef = useRef(null)

  // Load Google Fonts for the Executive Atlas design
  useEffect(() => {
    const link = document.createElement('link')
    link.rel  = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,300;12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&family=Inter+Tight:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap'
    document.head.appendChild(link)
    return () => { try { document.head.removeChild(link) } catch (_) {} }
  }, [])

  useEffect(() => { cargarTodo() }, [id])

  const cargarTodo = async () => {
    try {
      const { data: row, error: cvError } = await supabase
        .from('cv_results')
        .select('user_id, contenido, metadata')
        .eq('id', id)
        .single()

      if (cvError || !row) throw new Error('No se encontró el reporte profesional')
      setData(JSON.parse(row.contenido))

      const { data: prof, error: pError } = await supabase
        .from('profiles')
        .select('job_search_profile, autoconocimiento')
        .eq('id', row.user_id)
        .single()

      if (!pError && prof) setProfile(prof)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDescargar = () => {
    if (!reporteRef.current) return
    setDescargando(true)
    const jsp        = data || profile?.job_search_profile || {}
    const perfilInfo = jsp.perfil || {}
    const nombre     = data?.nombreCandidato || `${perfilInfo.nombre1 || ''} ${perfilInfo.apellido1 || ''}`.trim() || 'ELVIA'
    const opt = {
      margin:      0,
      filename:    `Infografia_Ejecutiva_${nombre.replace(/\s+/g, '_')}.pdf`,
      image:       { type: 'jpeg', quality: 1 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF:       { unit: 'in', format: 'letter', orientation: 'portrait' },
    }
    html2pdf().from(reporteRef.current).set(opt).save().then(() => setDescargando(false))
  }

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: '#D9D5C8' }}>
      <div style={{ width: 48, height: 48, borderRadius: '50%', border: `4px solid ${C.saffronSoft}`, borderTopColor: C.saffron, animation: 'spin 1s linear infinite', marginBottom: 16 }} />
      <p style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.muted }}>
        Renderizando infografía ejecutiva…
      </p>
    </div>
  )

  if (error) return (
    <div className="min-h-screen pt-24 text-center" style={{ color: '#991b1b', fontFamily: DISPLAY, fontSize: 18, fontWeight: 600 }}>
      {error}
    </div>
  )

  // ── Data extraction ──────────────────────────────────────────────────────────
  const jsp          = data || profile?.job_search_profile || {}
  const perfilInfo   = jsp.perfil           || {}
  const auto         = jsp.autoconocimiento || {}
  const oferta       = jsp.oferta           || {}
  const recursos     = jsp.recursos         || {}
  const semana       = jsp.semana           || {}

  const nombreCandidato  = data?.nombreCandidato || `${perfilInfo.nombre1 || ''} ${perfilInfo.apellido1 || ''}`.trim() || 'Ejecutivo'
  const cargoDeseado     = perfilInfo.nombre_cargo || data?.cargo || 'Líder Estratégico'
  const ciudad           = perfilInfo.ciudad || data?.ciudad || ''
  const pais             = perfilInfo.pais   || data?.pais   || ''

  const hardSkills     = auto.hard_skills   || []
  const softSkills     = auto.soft_skills   || []
  const powerSkills    = auto.power_skills  || []
  const targetEmpresas = auto.top5empresas  || []

  const ofertaValor    = oferta.oferta_valor    || 'Profesional de alto impacto enfocado en resultados estratégicos.'
  const culturaLaboral = oferta.cultura         || []
  const ikigaiAmas     = oferta.ikigai_amas     || ''
  const ikigaiBueno    = oferta.ikigai_bueno    || ''
  const ikigaiNecesita = oferta.ikigai_necesita || ''
  const ikigaiPagar    = oferta.ikigai_pagar    || ''

  const semanaBloques    = semana.bloques || {}
  const totalBloques     = Object.values(semanaBloques).filter(Boolean).length
  const totalHoras       = totalBloques * 2

  const rawRecursos      = Array.isArray(recursos) ? recursos : (Array.isArray(recursos.recursos) ? recursos.recursos : [])
  const recursosActivos  = rawRecursos.filter(r => r.tengo)

  // Avatar initials
  const n1 = perfilInfo.nombre1   || nombreCandidato.split(' ')[0] || 'E'
  const a1 = perfilInfo.apellido1 || nombreCandidato.split(' ')[1] || 'X'
  const initials = `${n1[0]}${a1[0]}`.toUpperCase()

  // Word cloud from hard skills
  const cloudTerms = hardSkills.length >= 4
    ? hardSkills.slice(0, 12).map((s, i) => ({ text: s.toUpperCase(), size: CLOUD_SIZES[i % CLOUD_SIZES.length] }))
    : [
        { text: 'LIDERAZGO', size: 'xl' }, { text: 'ESTRATEGIA', size: 'lg' },
        { text: 'GESTIÓN', size: 'xl' }, { text: 'INNOVACIÓN', size: 'md' },
      ]

  // Stats strip — use available profile fields
  const expAnios    = perfilInfo.experiencia_anios || data?.experiencia_anios
  const equipoPers  = perfilInfo.equipo_personas   || data?.equipo_personas
  const salario     = perfilInfo.salario_monto     || data?.salarioMinimo
  const moneda      = perfilInfo.moneda            || data?.moneda || '$'

  const stats = [
    {
      v: expAnios ? `${expAnios}` : '—',
      unit: expAnios ? 'años' : '',
      k: 'Experiencia ejecutiva',
      color: C.marine,
    },
    {
      v: salario ? Number(salario).toLocaleString('es') : '—',
      unit: salario ? moneda : '',
      k: 'Expectativa salarial',
      color: C.saffron,
    },
    {
      v: equipoPers ? `+${Number(equipoPers).toLocaleString('es')}` : hardSkills.length > 0 ? `${hardSkills.length}` : '—',
      unit: '',
      k: equipoPers ? 'Personas lideradas' : 'Hard skills',
      color: C.sage,
    },
    {
      v: targetEmpresas.length > 0 ? `${targetEmpresas.length}` : softSkills.length > 0 ? `${softSkills.length}` : '—',
      unit: '',
      k: targetEmpresas.length > 0 ? 'Empresas objetivo' : 'Soft skills',
      color: C.plum,
    },
  ]

  const ikigaiQuadrants = [
    { num: '01', prefix: 'Lo que ', em: 'amo', suffix: ' hacer', body: ikigaiAmas, color: C.saffron },
    { num: '02', prefix: 'En lo que ', em: 'destaco', suffix: '', body: ikigaiBueno, color: C.marine },
    { num: '03', prefix: 'Lo que el mundo ', em: 'necesita', suffix: '', body: ikigaiNecesita, color: C.sage },
    { num: '04', prefix: 'Por lo que me ', em: 'pagarían', suffix: '', body: ikigaiPagar, color: C.plum },
  ]

  const repertorioCols = [
    { label: 'Hard',  count: hardSkills.length,  color: C.marine,  skills: hardSkills  },
    { label: 'Soft',  count: softSkills.length,  color: C.saffron, skills: softSkills  },
    { label: 'Power', count: powerSkills.length, color: C.plum,    skills: powerSkills },
  ]

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ background: '#D9D5C8', minHeight: '100vh', paddingBottom: 96 }}>

      {/* Action bar — hidden in PDF */}
      <div className="no-print" style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          onClick={() => navigate('/mis-cvs')}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)', border: `1px solid ${C.hairline}`, borderRadius: 12, padding: '10px 20px', fontFamily: MONO, fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.inkSoft, cursor: 'pointer' }}
        >
          <ArrowLeft size={16} weight="bold" /> Volver a mis documentos
        </button>
        <button
          onClick={handleDescargar}
          disabled={descargando}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: C.navy, color: 'white', border: 'none', borderRadius: 12, padding: '12px 28px', fontFamily: MONO, fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', cursor: descargando ? 'not-allowed' : 'pointer', opacity: descargando ? 0.6 : 1 }}
        >
          <DownloadSimple size={18} weight="bold" />
          {descargando ? 'Generando PDF…' : 'Descargar Infografía'}
        </button>
      </div>

      {/* ── SHEET ─────────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '0 16px' }}>
        <div
          ref={reporteRef}
          style={{ width: '8.5in', background: C.paper, boxShadow: '0 50px 100px -30px rgba(20,20,18,0.28), 0 8px 24px -8px rgba(20,20,18,0.10)', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}
        >

          {/* ── HEADER — navy + avatar + word cloud ───────────────────────────── */}
          <header style={{ position: 'relative', background: `linear-gradient(135deg, ${C.navy} 0%, ${C.navy2} 100%)`, color: 'white', padding: '36px 44px 32px', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(900px 500px at 100% -20%, rgba(217,119,6,0.18), transparent 55%), radial-gradient(700px 400px at -10% 120%, rgba(30,64,175,0.25), transparent 50%)', pointerEvents: 'none' }} />
            <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1.05fr 1fr', gap: 32, alignItems: 'center' }}>

              {/* Identity: avatar + name + role */}
              <div style={{ display: 'grid', gridTemplateColumns: '96px 1fr', gap: 22, alignItems: 'center' }}>
                <div style={{ width: 96, height: 96, borderRadius: '50%', background: C.paper, color: C.ink, fontFamily: DISPLAY, fontWeight: 700, fontSize: 36, letterSpacing: '-0.025em', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid rgba(255,255,255,0.15)', boxShadow: '0 4px 24px rgba(0,0,0,0.35)', flexShrink: 0 }}>
                  {initials}
                </div>
                <div>
                  <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', color: C.saffronLight, fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                    Resumen autoconocimiento
                    <span className="no-print"><HelpBadge id="reporte.main" /></span>
                  </div>
                  <h1 style={{ fontFamily: DISPLAY, fontSize: 36, fontWeight: 700, letterSpacing: '-0.035em', lineHeight: 0.95, color: 'white', margin: '0 0 6px' }}>
                    {nombreCandidato}
                  </h1>
                  <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)', fontWeight: 500, lineHeight: 1.7 }}>
                    <b style={{ color: 'white', fontWeight: 700 }}>{cargoDeseado}</b>
                    {ciudad && ` · ${ciudad}${pais ? `, ${pais}` : ''}`}
                  </div>
                </div>
              </div>

              {/* Word cloud — right side of header */}
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '6px 12px', fontFamily: DISPLAY, lineHeight: 1.0, letterSpacing: '-0.03em', justifyContent: 'flex-end', maxHeight: 130, overflow: 'hidden' }}>
                {cloudTerms.map((term, i) => (
                  <span key={i} style={{ lineHeight: 1.0, ...CLOUD_STYLE[term.size] }}>
                    {term.text}
                  </span>
                ))}
              </div>
            </div>
          </header>

          {/* ── STATEMENT — oferta de valor ───────────────────────────────────── */}
          <section style={{ padding: '40px 44px 36px', background: C.paper, borderBottom: `1px solid ${C.hairline}`, display: 'grid', gridTemplateColumns: '80px 1fr', gap: 0, alignItems: 'start' }}>
            <div style={{ fontFamily: DISPLAY, fontSize: 140, fontWeight: 400, color: C.saffron, lineHeight: 0.7, marginTop: 18, textAlign: 'center', letterSpacing: '-0.06em' }}>&ldquo;</div>
            <div style={{ borderLeft: `2px solid ${C.saffron}`, paddingLeft: 22 }}>
              <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.24em', textTransform: 'uppercase', color: C.saffron, fontWeight: 700, marginBottom: 14 }}>Mi oferta de valor</div>
              <p style={{ fontFamily: DISPLAY, fontSize: 22, lineHeight: 1.22, letterSpacing: '-0.022em', fontWeight: 500, color: C.ink, margin: 0, maxWidth: 660 }}>
                {ofertaValor}
              </p>
            </div>
          </section>

          {/* ── STATS STRIP ───────────────────────────────────────────────────── */}
          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', background: C.paper, borderBottom: `1px solid ${C.hairline}` }}>
            {stats.map((s, i) => (
              <div key={i} style={{ padding: '20px 24px', borderRight: i < 3 ? `1px solid ${C.hairline}` : 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 40, fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1.0, color: s.color, fontVariantNumeric: 'tabular-nums' }}>
                  {s.v}
                  {s.unit && <small style={{ fontSize: 18, fontWeight: 500, color: C.muted, marginLeft: 4 }}>{s.unit}</small>}
                </div>
                <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.20em', textTransform: 'uppercase', color: C.muted, fontWeight: 600 }}>{s.k}</div>
              </div>
            ))}
          </section>

          {/* ── IKIGAI VENN ───────────────────────────────────────────────────── */}
          <section style={{ padding: '30px 44px', display: 'grid', gridTemplateColumns: '300px 1fr', gap: 32, borderBottom: `1px solid ${C.hairline}`, background: C.paper }}>
            <div style={{ gridColumn: '1 / -1', fontFamily: MONO, fontSize: 9, letterSpacing: '0.24em', textTransform: 'uppercase', color: C.muted2, fontWeight: 600, marginBottom: 6 }}>
              Propósito · método <b style={{ color: C.ink, fontWeight: 700 }}>Ikigai</b>
            </div>

            {/* SVG Venn */}
            <div>
              <svg viewBox="0 0 320 320" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 'auto', display: 'block', mixBlendMode: 'multiply' }}>
                <circle cx="120" cy="120" r="100" fill="#D97706" fillOpacity="0.55" />
                <circle cx="200" cy="120" r="100" fill="#1E3A8A" fillOpacity="0.55" />
                <circle cx="120" cy="200" r="100" fill="#365314" fillOpacity="0.55" />
                <circle cx="200" cy="200" r="100" fill="#831843" fillOpacity="0.55" />
                <text x="50"  y="50"  textAnchor="middle" fill="#D97706" fontFamily="Bricolage Grotesque" fontSize="11" fontWeight="700" letterSpacing="0.05em">AMAS</text>
                <text x="270" y="50"  textAnchor="middle" fill="#1E3A8A" fontFamily="Bricolage Grotesque" fontSize="11" fontWeight="700" letterSpacing="0.05em">DESTACAS</text>
                <text x="50"  y="290" textAnchor="middle" fill="#365314" fontFamily="Bricolage Grotesque" fontSize="11" fontWeight="700" letterSpacing="0.05em">NECESITA</text>
                <text x="270" y="290" textAnchor="middle" fill="#831843" fontFamily="Bricolage Grotesque" fontSize="11" fontWeight="700" letterSpacing="0.05em">PAGARÁN</text>
                <text x="160" y="158" textAnchor="middle" fill="#0E0D0A" fontFamily="Bricolage Grotesque" fontSize="18" fontWeight="800" letterSpacing="-0.02em">IKIGAI</text>
                <text x="160" y="174" textAnchor="middle" fill="#0E0D0A" fontFamily="JetBrains Mono" fontSize="7" fontWeight="600" letterSpacing="0.18em">RAZÓN DE SER</text>
              </svg>
              <div style={{ textAlign: 'center', marginTop: -6, fontFamily: MONO, fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.muted, fontWeight: 600 }}>
                4 vectores · 1 <b style={{ color: C.ink, fontFamily: DISPLAY, fontSize: 13, fontWeight: 700, letterSpacing: 0, textTransform: 'none', margin: '0 4px' }}>propósito</b> · método japonés
              </div>
            </div>

            {/* Quadrants */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 18px' }}>
              {ikigaiQuadrants.map((q, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.18em', fontWeight: 700, color: 'white', background: q.color, padding: '2px 5px', borderRadius: 2 }}>{q.num}</span>
                    <span style={{ fontFamily: DISPLAY, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.1 }}>
                      {q.prefix}<em style={{ color: q.color, fontStyle: 'normal' }}>{q.em}</em>{q.suffix}
                    </span>
                  </div>
                  <div style={{ fontFamily: BODY, fontSize: 10.5, lineHeight: 1.5, color: C.inkSoft }}>
                    {q.body || 'Aún no completado.'}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── MERCADO — typographic company logos ───────────────────────────── */}
          {targetEmpresas.length > 0 && (
            <section style={{ padding: '28px 44px 26px', borderBottom: `1px solid ${C.hairline}`, background: C.paper2 }}>
              <SecLabel>Compañías objetivo</SecLabel>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px 28px', fontFamily: DISPLAY, fontSize: 28, lineHeight: 1, letterSpacing: '-0.025em' }}>
                {targetEmpresas.map((emp, i) => (
                  <span key={i}>
                    <span style={CO_STYLES[i % CO_STYLES.length]}>{emp}</span>
                    {i < targetEmpresas.length - 1 && (
                      <span style={{ fontFamily: MONO, fontSize: 14, color: C.muted2, fontWeight: 400, marginLeft: 14 }}>/</span>
                    )}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* ── REPERTORIO + HEATMAP + RESOURCES ─────────────────────────────── */}
          <section style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', background: C.paper, borderBottom: `1px solid ${C.hairline}` }}>

            {/* 3-column skill lists */}
            <div style={{ padding: '28px 28px 28px 44px', borderRight: `1px solid ${C.hairline}` }}>
              <SecLabel>Repertorio · competencias <b style={{ color: C.ink, fontWeight: 700 }}>seleccionadas</b></SecLabel>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 18 }}>
                {repertorioCols.map((col, ci) => (
                  <div key={ci}>
                    <h5 style={{ margin: '0 0 8px', fontFamily: DISPLAY, fontSize: 13, fontWeight: 700, letterSpacing: '-0.01em', color: col.color }}>
                      {col.label}
                      {col.count > 0 && <small style={{ fontFamily: MONO, fontSize: 9, color: C.muted2, marginLeft: 6, fontWeight: 500, letterSpacing: '0.12em' }}>{col.count}</small>}
                    </h5>
                    <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {col.skills.map((s, si) => (
                        <li key={si} style={{ fontFamily: BODY, fontSize: 9.5, lineHeight: 1.4, color: C.inkSoft, padding: '1px 0' }}>
                          <span style={{ color: C.muted2, marginRight: 6, fontWeight: 700 }}>·</span>{s}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Right stack: heatmap + resources */}
            <div style={{ padding: '28px 44px 28px 28px', display: 'flex', flexDirection: 'column', gap: 24 }}>

              {/* Heatmap */}
              <div>
                <SecLabel>Ritmo semanal</SecLabel>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 3 }}>
                  {DIAS_SHORT.map((day, di) => {
                    const key = DIAS_KEYS[di]
                    const amOn = !!semanaBloques[`${key}_am`]
                    const pmOn = !!semanaBloques[`${key}_pm`]
                    return (
                      <div key={di} style={{ display: 'grid', gridTemplateRows: 'auto 1fr 1fr', gap: 3 }}>
                        <div style={{ textAlign: 'center', fontFamily: MONO, fontSize: 9, letterSpacing: '0.18em', color: C.muted, fontWeight: 600, marginBottom: 2 }}>{day}</div>
                        <div style={{ height: 26, borderRadius: 2, background: amOn ? C.marine : C.paper2 }} />
                        <div style={{ height: 26, borderRadius: 2, background: pmOn ? 'rgba(30,58,138,0.55)' : C.paper2 }} />
                      </div>
                    )
                  })}
                </div>
                {totalBloques > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', color: C.muted }}>
                    <span><b style={{ color: C.ink, fontFamily: DISPLAY, fontSize: 14, fontWeight: 700, marginRight: 4 }}>{totalBloques}</b> bloques</span>
                    <span><b style={{ color: C.ink, fontFamily: DISPLAY, fontSize: 14, fontWeight: 700, marginRight: 4 }}>{totalHoras}h</b> · semana</span>
                  </div>
                )}
              </div>

              {/* Resources */}
              {recursosActivos.length > 0 && (
                <div>
                  <SecLabel>Recursos activos</SecLabel>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {recursosActivos.map((r, ri) => (
                      <div key={ri} style={{ display: 'grid', gridTemplateColumns: '22px 1fr', gap: 10, alignItems: 'center', padding: '6px 0', borderTop: ri > 0 ? `1px dashed ${C.hairline}` : 'none' }}>
                        <div style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.ink }}>
                          {RES_ICONS[ri % RES_ICONS.length]}
                        </div>
                        <span style={{ fontFamily: BODY, fontSize: 10.5, lineHeight: 1.3, color: C.ink }}>{r.nombre}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ── CULTURA TAGS ──────────────────────────────────────────────────── */}
          {culturaLaboral.length > 0 && (
            <section style={{ padding: '22px 44px 28px', background: C.paper, borderBottom: `1px solid ${C.hairline}` }}>
              <SecLabel>Cultura que busco</SecLabel>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 8px', fontFamily: DISPLAY, fontSize: 14, fontWeight: 600, letterSpacing: '-0.015em' }}>
                {culturaLaboral.map((cult, ci) => {
                  const tc = TAG_COLORS[ci % TAG_COLORS.length]
                  return (
                    <span key={ci} style={{ padding: '6px 14px', borderRadius: 999, lineHeight: 1.0, background: tc.bg, color: tc.color }}>
                      <span style={{ opacity: 0.5, fontWeight: 400 }}># </span>{cult}
                    </span>
                  )
                })}
              </div>
            </section>
          )}

          {/* ── FOOTER ────────────────────────────────────────────────────────── */}
          <footer style={{ padding: '14px 44px', background: C.ink, color: C.paper, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: MONO, fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase' }}>
            <svg viewBox="0 0 800 220" xmlns="http://www.w3.org/2000/svg" style={{ height: 32, width: 'auto' }} aria-label="ELVIA">
              <defs>
                <linearGradient id="ftSwoosh" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%"   stopColor="#00B8CC" stopOpacity="0"/>
                  <stop offset="28%"  stopColor="#00C8DC" stopOpacity="0.6"/>
                  <stop offset="62%"  stopColor="#00D8F0" stopOpacity="1"/>
                  <stop offset="80%"  stopColor="#00C0D4" stopOpacity="0.55"/>
                  <stop offset="100%" stopColor="#00B8CC" stopOpacity="0"/>
                </linearGradient>
                <filter id="ftGlow" x="-10%" y="-200%" width="120%" height="500%">
                  <feGaussianBlur stdDeviation="5" result="blur"/>
                  <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
              </defs>
              <text x="400" y="152" fontFamily="'Orbitron','Exo 2','Arial Black',sans-serif" fontWeight="700" fontSize="112" letterSpacing="6" fill="white" textAnchor="middle">ELVIA</text>
              <path d="M 235,164 C 340,150 480,144 595,157 C 640,162 690,159 740,154 L 740,161 C 690,167 640,170 595,165 C 480,154 340,162 235,173 Z" fill="url(#ftSwoosh)" filter="url(#ftGlow)"/>
            </svg>
            <span>01 / 01</span>
          </footer>

        </div>
      </div>
    </div>
  )
}
