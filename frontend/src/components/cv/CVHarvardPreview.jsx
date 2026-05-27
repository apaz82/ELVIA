// Vista previa de CV en formato Harvard ATS-friendly
// Props: datos (estado del wizard CVDesdeCero)
// Diseño 100% inline styles → renderiza como documento real, independiente de Tailwind

const S = {
  paper: {
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: 11,
    lineHeight: 1.5,
    color: '#111',
    backgroundColor: '#fff',
    width: '100%',
    maxWidth: 680,
    margin: '0 auto',
    padding: 'clamp(24px, 6vw, 52px) clamp(20px, 7vw, 60px)',
    boxSizing: 'border-box',
    wordWrap: 'break-word',
    overflowWrap: 'break-word',
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 0.4,
    margin: 0,
    textAlign: 'center',
  },
  cargo: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#444',
    textAlign: 'center',
    margin: '4px 0 0',
  },
  contacto: {
    fontSize: 10,
    color: '#555',
    textAlign: 'center',
    margin: '6px 0 0',
    letterSpacing: 0.2,
  },
  dividerTop: {
    borderTop: '2px solid #111',
    marginTop: 14,
    marginBottom: 14,
  },
  sectionHeader: {
    fontSize: 10.5,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    margin: '0 0 5px',
    paddingBottom: 3,
    borderBottom: '1px solid #555',
  },
  section: {
    marginBottom: 16,
  },
  expRow: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 1,
    gap: 4,
  },
  expCargo: {
    fontSize: 11.5,
    fontWeight: 'bold',
    flex: '1 1 auto',
    minWidth: 0,
  },
  expFechas: {
    fontSize: 10,
    color: '#555',
    whiteSpace: 'nowrap',
    marginLeft: 10,
  },
  expEmpresa: {
    fontSize: 11,
    fontStyle: 'italic',
    color: '#333',
    marginBottom: 3,
  },
  bullet: {
    margin: '0 0 0 16px',
    padding: 0,
    listStyle: 'disc',
  },
  bulletItem: {
    marginBottom: 2,
  },
  inlineList: {
    margin: '3px 0 0',
  },
  resumen: {
    margin: '3px 0 0',
    textAlign: 'justify',
  },
  eduRow: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 1,
    gap: 4,
  },
  eduTitulo: {
    fontSize: 11.5,
    fontWeight: 'bold',
    flex: '1 1 auto',
    minWidth: 0,
  },
  eduAnio: {
    fontSize: 10,
    color: '#555',
    marginLeft: 10,
    whiteSpace: 'nowrap',
  },
  eduInst: {
    fontSize: 11,
    fontStyle: 'italic',
    color: '#333',
  },
}

function SectionTitle({ children }) {
  return <h2 style={S.sectionHeader}>{children}</h2>
}

function renderDescripcion(texto) {
  if (!texto) return null
  const lineas = texto.split('\n').map(l => l.replace(/^[•\-\*]\s*/, '').trim()).filter(Boolean)
  if (lineas.length === 1) {
    return <p style={{ margin: '2px 0 0' }}>{lineas[0]}</p>
  }
  return (
    <ul style={S.bullet}>
      {lineas.map((l, i) => <li key={i} style={S.bulletItem}>{l}</li>)}
    </ul>
  )
}

export default function CVHarvardPreview({ datos }) {
  if (!datos) return null

  const nombre = [datos.nombre, datos.nombre2, datos.apellido, datos.apellido2]
    .filter(Boolean).join(' ')

  const contacto = [
    datos.email,
    datos.telefono ? `${datos.indicativo || ''} ${datos.telefono}`.trim() : null,
    datos.ciudad,
    datos.pais,
  ].filter(Boolean).join(' · ')

  const exps = (datos.experiencias || []).filter(e => e.empresa || e.cargo)
  const edus = (datos.educacion || []).filter(e => e.institucion || e.titulo)
  const habs = datos.habilidades || []
  const idiomas = datos.idiomas || []

  return (
    <div style={S.paper}>

      {/* ── Encabezado ─────────────────────────────────── */}
      <div>
        <h1 style={S.name}>{nombre || '—'}</h1>
        {datos.cargo_objetivo && <p style={S.cargo}>{datos.cargo_objetivo}</p>}
        {contacto && <p style={S.contacto}>{contacto}</p>}
      </div>

      <div style={S.dividerTop} />

      {/* ── Resumen Profesional ────────────────────────── */}
      {datos.resumen && (
        <div style={S.section}>
          <SectionTitle>Resumen Profesional</SectionTitle>
          <p style={S.resumen}>{datos.resumen}</p>
        </div>
      )}

      {/* ── Experiencia Laboral ────────────────────────── */}
      {exps.length > 0 && (
        <div style={S.section}>
          <SectionTitle>Experiencia Laboral</SectionTitle>
          {exps.map((exp, i) => (
            <div key={i} style={{ marginBottom: i < exps.length - 1 ? 10 : 0 }}>
              <div style={S.expRow}>
                <span style={S.expCargo}>{exp.cargo || '—'}</span>
                <span style={S.expFechas}>
                  {[exp.fecha_inicio, exp.fecha_fin || 'Actualidad'].filter(Boolean).join(' – ')}
                </span>
              </div>
              {exp.empresa && <div style={S.expEmpresa}>{exp.empresa}</div>}
              {exp.descripcion && renderDescripcion(exp.descripcion)}
            </div>
          ))}
        </div>
      )}

      {/* ── Educación ──────────────────────────────────── */}
      {edus.length > 0 && (
        <div style={S.section}>
          <SectionTitle>Educación</SectionTitle>
          {edus.map((edu, i) => (
            <div key={i} style={{ marginBottom: i < edus.length - 1 ? 6 : 0 }}>
              <div style={S.eduRow}>
                <span style={S.eduTitulo}>{edu.titulo || '—'}</span>
                {edu.anio && <span style={S.eduAnio}>{edu.anio}</span>}
              </div>
              {edu.institucion && <div style={S.eduInst}>{edu.institucion}</div>}
            </div>
          ))}
        </div>
      )}

      {/* ── Habilidades ────────────────────────────────── */}
      {habs.length > 0 && (
        <div style={S.section}>
          <SectionTitle>Habilidades</SectionTitle>
          <p style={S.inlineList}>{habs.join(' · ')}</p>
        </div>
      )}

      {/* ── Idiomas ────────────────────────────────────── */}
      {idiomas.length > 0 && (
        <div style={{ ...S.section, marginBottom: 0 }}>
          <SectionTitle>Idiomas</SectionTitle>
          <p style={S.inlineList}>
            {idiomas.map(l => `${l.idioma}${l.nivel ? ` (${l.nivel})` : ''}`).join(' · ')}
          </p>
        </div>
      )}

    </div>
  )
}
