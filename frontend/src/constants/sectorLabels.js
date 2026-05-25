// sectorLabels — Diccionario centralizado de copy por sector del tenant.
// Usado por LoginHR, CompanyAdmin, BienvenidaOnboarding, LandingEmpresa
// y cualquier componente que dependa de la naturaleza del tenant.
//
// Sectores soportados:
//   corporate  → empresas (Telefónica, outplacement)
//   university → universidades (egresados, prácticas, inserción laboral)
//   government → gobierno / sector público (programas de empleabilidad estatales)
//   b2c        → ELVIA puro (usuario individual sin tenant)
//
// Cuando un componente necesite copy sector-aware, importar useSectorLabels.

const corporate = {
  // Organización
  org:               'empresa',
  orgArticle:        'la empresa',
  orgPossessive:     'tu empresa',
  orgCapitalized:    'Empresa',
  orgData:           'Datos de la empresa',

  // Persona HR / admin del tenant
  adminRole:         'HR Director',
  adminRoleLong:     'HR Director / Gestor de programa',
  adminTeam:         'área de Personas',
  adminTeamFormal:   'comité de Personas',
  adminPersona:      'HR Directors de empresas grandes',
  adminAccessBadge:  'Acceso restringido a HR',
  adminPanelTitle:   'Panel HR',

  // Miembros del programa (candidatos)
  member:            'colaborador',
  memberFem:         'colaboradora',
  members:           'colaboradores',
  membersCap:        'Colaboradores',
  membersActiveLabel:'Colaboradores activos',
  inviteMember:      'Invitar colaborador',
  uploadListTitle:   'Cargar lista de colaboradores aprobados',
  csvSampleEmail:    'maria@empresa.com',

  // Métricas
  successMetric:     'Empleo logrado',
  successAchieved:   'reportaron empleo',
  successProcess:    'En proceso',

  // Programa
  programPurpose:    'transición laboral',
  programSubject:    'tu equipo en transición',
  programMission:    'acompañar la transición de tu equipo',

  // Bullets institucionales (LoginHR side panel)
  bullet1Title:      'Gestión de cohortes',
  bullet1Desc:       'Carga listas por CSV, agrupa por área o promoción, controla quién accede.',
  bullet2Title:      'Métricas anónimas',
  bullet2Desc:       'Adopción, engagement, funnel del programa. Nunca contenido individual.',
  bullet3Title:      'Confidencialidad total',
  bullet3Desc:       'Tu equipo confía: nunca ves su CV, conversaciones ni postulaciones.',
  bullet4Title:      'Reportes ejecutivos',
  bullet4Desc:       'Exporta PDFs y CSVs listos para presentar al comité de Personas.',

  // Footers / placeholders
  contactEmailHint:  'hr@empresa.com',
}

const university = {
  // Organización
  org:               'institución',
  orgArticle:        'la institución',
  orgPossessive:     'tu universidad',
  orgCapitalized:    'Institución',
  orgData:           'Datos de la institución',

  // Persona admin
  adminRole:         'Coordinador de Empleabilidad',
  adminRoleLong:     'Coordinador / Decanatura de Empleabilidad',
  adminTeam:         'área de Empleabilidad',
  adminTeamFormal:   'comité académico',
  adminPersona:      'coordinadores académicos y de empleabilidad',
  adminAccessBadge:  'Acceso restringido al equipo del programa',
  adminPanelTitle:   'Panel de Empleabilidad',

  // Miembros del programa (estudiantes / egresados)
  member:            'estudiante',
  memberFem:         'estudiante',
  members:           'estudiantes',
  membersCap:        'Estudiantes',
  membersActiveLabel:'Estudiantes activos',
  inviteMember:      'Invitar estudiante',
  uploadListTitle:   'Cargar lista de estudiantes inscritos',
  csvSampleEmail:    'estudiante@universidad.edu',

  // Métricas
  successMetric:     'Inserción laboral',
  successAchieved:   'consiguieron práctica o empleo',
  successProcess:    'En búsqueda',

  // Programa
  programPurpose:    'inserción al mercado laboral',
  programSubject:    'tus estudiantes en búsqueda',
  programMission:    'acompañar la inserción laboral de tus estudiantes',

  bullet1Title:      'Gestión de cohortes',
  bullet1Desc:       'Carga listas por CSV, agrupa por carrera o semestre, controla quién accede.',
  bullet2Title:      'Métricas anónimas',
  bullet2Desc:       'Adopción, engagement, embudo de inserción. Nunca contenido individual.',
  bullet3Title:      'Confidencialidad total',
  bullet3Desc:       'Tus estudiantes confían: nunca ves su CV, conversaciones ni postulaciones.',
  bullet4Title:      'Reportes institucionales',
  bullet4Desc:       'Exporta PDFs y CSVs listos para presentar al comité académico.',

  contactEmailHint:  'empleabilidad@universidad.edu',
}

const government = {
  org:               'institución',
  orgArticle:        'la institución',
  orgPossessive:     'tu programa',
  orgCapitalized:    'Programa',
  orgData:           'Datos del programa',

  adminRole:         'Coordinador del Programa',
  adminRoleLong:     'Coordinador / Gestor del programa',
  adminTeam:         'equipo coordinador',
  adminTeamFormal:   'mesa coordinadora',
  adminPersona:      'coordinadores de programa',
  adminAccessBadge:  'Acceso restringido al equipo coordinador',
  adminPanelTitle:   'Panel del Programa',

  member:            'participante',
  memberFem:         'participante',
  members:           'participantes',
  membersCap:        'Participantes',
  membersActiveLabel:'Participantes activos',
  inviteMember:      'Invitar participante',
  uploadListTitle:   'Cargar lista de participantes aprobados',
  csvSampleEmail:    'participante@programa.gob',

  successMetric:     'Inserción laboral',
  successAchieved:   'consiguieron empleo',
  successProcess:    'En proceso',

  programPurpose:    'inserción al mercado laboral',
  programSubject:    'los participantes del programa',
  programMission:    'acompañar la inserción laboral de los participantes',

  bullet1Title:      'Gestión de cohortes',
  bullet1Desc:       'Carga listas por CSV, agrupa por programa o territorio, controla quién accede.',
  bullet2Title:      'Métricas anónimas',
  bullet2Desc:       'Adopción, engagement, embudo de inserción. Nunca contenido individual.',
  bullet3Title:      'Confidencialidad total',
  bullet3Desc:       'Los participantes confían: nunca ves su CV ni conversaciones.',
  bullet4Title:      'Reportes institucionales',
  bullet4Desc:       'Exporta PDFs y CSVs listos para informes oficiales.',

  contactEmailHint:  'coordinacion@programa.gob',
}

// B2C usa corporate como fallback semántico (raramente se renderiza copy de tenant)
const b2c = corporate

const LABELS = { corporate, university, government, b2c }

export function getSectorLabels(sector) {
  return LABELS[sector] || LABELS.corporate
}

export const SECTORS = Object.keys(LABELS)
