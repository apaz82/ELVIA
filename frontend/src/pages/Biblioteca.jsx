// Biblioteca — centro de conocimiento con artículos y búsqueda
import { useState } from 'react'
import { BookOpen, MagnifyingGlass, Clock, Tag, X, ArrowRight, Lightbulb, Star, Images, ArrowSquareOut } from '@phosphor-icons/react'
import { useAuth } from '../context/AuthContext'
import FeatureLocked from '../components/common/FeatureLocked'
import HelpBadge from '../components/common/HelpBadge'

// ── Infografías ───────────────────────────────────────────────────────────────
const INFOGRAFIAS = [
  {
    id: 'cv',
    titulo: 'Anatomía del CV Perfecto',
    descripcion: 'Estructura visual de una hoja de vida optimizada para sistemas ATS y reclutadores en 2026.',
    src: '/info_cv.png',
    tags: ['cv', 'ats', 'formato'],
    categoria: 'CV',
  },
  {
    id: 'ats',
    titulo: 'Cómo Piensa un ATS',
    descripcion: 'Mapa visual del proceso de escaneo y parseo de palabras clave que realiza un ATS.',
    src: '/info_ats.png',
    tags: ['ats', 'parsing', 'keywords'],
    categoria: 'CV',
  },
  {
    id: 'transicion',
    titulo: 'Ruta Estratégica de Transición de Carrera',
    descripcion: 'El paso a paso en 5 fases clave para lograr una recolocación exitosa y de alto nivel.',
    src: '/info_ruta_carrera.png',
    tags: ['transicion', 'estrategia', 'carrera'],
    categoria: 'Carrera',
  },
]

// ── Contenido de artículos ────────────────────────────────────────────────────
const ARTICULOS = [
  {
    id: 1,
    titulo: 'CV Harvard de Alto Impacto: Menos es Más',
    categoria: 'CV',
    tiempo_lectura: 4,
    descripcion: 'Estructura tu currículum en una sola página con el estándar que prefieren los reclutadores internacionales.',
    tags: ['cv', 'formato', 'harvard', 'impacto'],
    fecha: 'Mayo 2026',
    color: 'purple',
    secciones: [
      { t: 'intro', v: 'En el reclutamiento ejecutivo, la brevedad es sinónimo de claridad. Un currículum sobrecargado de funciones rutinarias solo logra diluir tus verdaderos logros. El estándar Harvard de una sola página te obliga a destacar únicamente lo que genera valor real.' },
      { t: 'h2', v: 'Estructura Esencial de un CV de Alto Impacto' },
      { t: 'ol', v: [
        'Datos de contacto y LinkedIn optimizados en el encabezado.',
        'Resumen ejecutivo (Summary) de máximo 3 o 4 líneas que declare tu propuesta de valor.',
        'Experiencia profesional en orden cronológico inverso, enfocada en resultados, no en tareas.',
        'Educación formal y certificaciones de alta relevancia para la vacante.',
        'Habilidades técnicas y competencias clave agrupadas de manera limpia.'
      ] },
      { t: 'tip', title: 'REGLA DE ORO', v: 'Si una experiencia de hace más de 10 años no aporta directamente al rol que buscas hoy, redúcela a una sola línea o elimínala. Tu CV no es un registro histórico, es un documento de mercadeo personal.' }
    ]
  },
  {
    id: 2,
    titulo: 'Cómo Superar los Filtros ATS en Latinoamérica',
    categoria: 'CV',
    tiempo_lectura: 5,
    descripcion: 'Entiende cómo leen los sistemas automatizados de reclutamiento para evitar que descarten tu perfil.',
    tags: ['ats', 'filtro', 'keywords', 'tecnologia'],
    fecha: 'Mayo 2026',
    color: 'purple',
    secciones: [
      { t: 'intro', v: 'Más del 70% de las hojas de vida enviadas a vacantes corporativas son descartadas por un software ATS (Applicant Tracking System) antes de llegar a ojos humanos. Comprender cómo operan estos algoritmos es clave para que tu postulación avance.' },
      { t: 'h2', v: 'Estrategias Clave para Ser Aprobado por el ATS' },
      { t: 'ul', v: [
        'Formato Lineal y Limpio: Evita a toda costa plantillas con dos columnas, tablas complejas, iconos, barras de nivel o imágenes. Los ATS leen de izquierda a derecha y de arriba a abajo, por lo que las columnas mezclan la lectura.',
        'Coincidencia de Palabras Clave: Utiliza los términos exactos de la oferta de empleo. Si la vacante solicita "Dirección de Proyectos", no lo traduzcas a "Project Management" en tu CV de forma aislada; mantén la terminología nativa de la vacante.',
        'Tipografías Estándar: Usa fuentes universales como Arial, Calibri o Inter. Evita fuentes de diseño que el software no logre codificar adecuadamente.'
      ] },
      { t: 'tip', title: 'ALERTA DE SEGURIDAD', v: 'Nunca intentes engañar al sistema copiando la vacante completa en letras blancas al fondo del archivo. Los ATS modernos extraen el texto sin formato y esta práctica te descalificará de inmediato por manipulación de información.' }
    ]
  },
  {
    id: 3,
    titulo: 'La Fórmula de Impacto de Google (X-Y-Z) en Español',
    categoria: 'CV',
    tiempo_lectura: 4,
    descripcion: 'Aprende a redactar tus logros profesionales de forma cuantitativa y altamente persuasiva.',
    tags: ['cv', 'logros', 'xyz', 'google'],
    fecha: 'Mayo 2026',
    color: 'purple',
    secciones: [
      { t: 'intro', v: 'Las viñetas de tu experiencia profesional deben demostrar tu impacto directo en el negocio. En lugar de listar tareas, utiliza la famosa fórmula X-Y-Z popularizada por los líderes de reclutamiento de Google.' },
      { t: 'h2', v: '¿Cómo funciona la Fórmula X-Y-Z?' },
      { t: 'p', v: 'La estructura lógica que debes aplicar en cada uno de tus logros profesionales es la siguiente:' },
      { t: 'tip', title: 'FÓRMULA MÁGICA', v: 'Logré [X], medido cuantitativamente por [Y], mediante la realización de [Z].' },
      { t: 'h2', v: 'Ejemplos de Transformación en Español' },
      { t: 'ul', v: [
        'Antes (Enfoque en tarea): "Encargado del envío de campañas de correo electrónico institucional y newsletters de la empresa."',
        'Después (Fórmula X-Y-Z): "Incrementé la tasa de apertura en un 25% (X) al depurar la base de contactos y rediseñar los asuntos (Z) en un periodo de 3 meses (Y)."',
        'Antes (Enfoque en tarea): "Lideré la migración de la base de datos de clientes corporativos del equipo de ventas."',
        'Después (Fórmula X-Y-Z): "Reduje el tiempo de consulta de registros en un 40% (X) al diseñar y migrar la arquitectura de datos corporativa (Z) beneficiando a más de 50 usuarios internos (Y)."'
      ] }
    ]
  },
  {
    id: 4,
    titulo: 'Marca Personal en LinkedIn: Estrategia de Visibilidad',
    categoria: 'LinkedIn',
    tiempo_lectura: 5,
    descripcion: 'Configura tu perfil con enfoque semántico para posicionarte en la mira de los mejores reclutadores.',
    tags: ['linkedin', 'perfil', 'algoritmo', 'ssi'],
    fecha: 'Mayo 2026',
    color: 'teal',
    secciones: [
      { t: 'intro', v: 'LinkedIn en 2026 no es un currículum estático en línea; es un buscador semántico potenciado por Inteligencia Artificial. Los reclutadores buscan talento mediante descripciones de habilidades complejas. Si tu perfil no está optimizado, serás invisible.' },
      { t: 'h2', v: 'Puntos Críticos para Optimizar tu Perfil' },
      { t: 'ol', v: [
        'Titular Profesional (Headline): Tienes 220 caracteres. No escribas "En búsqueda activa". En su lugar, usa la fórmula: [Cargo Core] | [Especialidad o Industria] | [3 Palabras Clave Clave] | [Breve propuesta de valor con logro].',
        'Sección Acerca de (About): Redacta tu historia profesional en primera persona. Captura la atención en las primeras 3 líneas. Explica tus motivaciones, tu trayectoria, 3 hitos clave con números y cierra con tu correo de contacto.',
        'Habilidades (Skills): Selecciona hasta 50 habilidades de gran demanda técnica. Las 3 principales deben ser las más críticas del mercado para tu rol deseado.'
      ] },
      { t: 'tip', title: 'DATO TÉCNICO', v: 'El SSI (Social Selling Index) mide tu actividad en LinkedIn. Mantener un puntaje superior a 70 en tu sector incrementa exponencialmente la prioridad con la que apareces en las búsquedas de los reclutadores.' }
    ]
  },
  {
    id: 5,
    titulo: 'Storytelling para Transición y Cambio de Carrera',
    categoria: 'LinkedIn',
    tiempo_lectura: 5,
    descripcion: 'Conecta tus habilidades transferibles de manera atractiva para proyectar coherencia ante nuevos retos.',
    tags: ['storytelling', 'transicion', 'carrera', 'cambio'],
    fecha: 'Mayo 2026',
    color: 'teal',
    secciones: [
      { t: 'intro', v: 'Cambiar de rol o industria no significa empezar desde cero. El reto principal consiste en explicar tu trayectoria previa de una manera que adquiera un sentido lógico y de alto valor para tu nuevo objetivo profesional.' },
      { t: 'h2', v: 'Cómo Construir un Relato de Transición Coherente' },
      { t: 'ul', v: [
        'Identifica tus Habilidades Transferibles: Gestión de proyectos, liderazgo de equipos, optimización de presupuestos, o metodologías ágiles son de alto valor en cualquier sector. Destaca estas destrezas por encima del conocimiento técnico ultra-específico.',
        'Enfócate en la Solución del Dolor: Investiga cuáles son los problemas comunes de la industria a la que aspiras ingresar. Ajusta tu narrativa demostrando cómo resolviste problemas similares en el pasado.',
        'Usa el Resumen de tu Perfil para dar Contexto: Redacta abiertamente: "Luego de más de 8 años liderando el área de operaciones en consumo masivo, he decidido canalizar mi experiencia en optimización de procesos hacia el sector de tecnología (Fintech)..."'
      ] },
      { t: 'tip', title: 'CONSEJO DE LIDERAZGO', v: 'No trates tu pasado profesional como un error que debes ocultar. La diversidad de experiencia es altamente valorada en las organizaciones modernas por aportar perspectivas frescas e innovadoras.' }
    ]
  },
  {
    id: 6,
    titulo: 'Contenido de Valor B2B: Destaca sin ser Cringe',
    categoria: 'LinkedIn',
    tiempo_lectura: 4,
    descripcion: 'Comparte tu expertise técnico y aprendizajes profesionales de forma auténtica y profesional.',
    tags: ['linkedin', 'contenido', 'b2b', 'networking'],
    fecha: 'Mayo 2026',
    color: 'teal',
    secciones: [
      { t: 'intro', v: 'Escribir en LinkedIn genera un gran temor a "parecer pretencioso". Sin embargo, menos del 3% de los profesionales activos comparte contenido semanalmente. Crear publicaciones enfocadas en valor y educación te posicionará de inmediato como un referente en tu sector.' },
      { t: 'h2', v: 'Tipos de Publicaciones de Alto Impacto' },
      { t: 'ol', v: [
        'Casos de Estudio Breves: Explica un problema real que enfrentó tu equipo, qué alternativas evaluaron, cómo lo solucionaron y cuál fue el resultado numérico.',
        'Lecciones de un Fracaso: Comparte un error operativo que costó tiempo o recursos, qué aprendiste de ello y qué procesos implementaste para prevenir que vuelva a suceder. Esto proyecta madurez y honestidad intelectual.',
        'Herramientas o Recursos Prácticos: Haz una lista corta de tus lecturas de industria recomendadas o herramientas digitales que hayan optimizado tus actividades semanales.'
      ] },
      { t: 'tip', title: 'FÓRMULA DE REDACCIÓN', v: 'Comienza siempre con un gancho potente en las primeras dos líneas (ej: "Optimizar la base de datos nos ahorró un 40% de tiempo operativo. Aquí el paso a paso..."). Si no capturas al usuario allí, no dará clic en "ver más".' }
    ]
  },
  {
    id: 7,
    titulo: 'El Método STAR para Responder Preguntas Conductuales',
    categoria: 'Entrevistas',
    tiempo_lectura: 4,
    descripcion: 'Domina las preguntas sobre comportamiento y resolución de problemas estructurando tus respuestas en 2 minutos.',
    tags: ['entrevista', 'star', 'metodologia', 'comportamiento'],
    fecha: 'Mayo 2026',
    color: 'blue',
    secciones: [
      { t: 'intro', v: 'Las preguntas que inician con "Cuéntame de alguna ocasión en la que tuviste que..." buscan evaluar tus competencias a través de tu comportamiento real en el pasado. Responder sin una estructura clara puede hacer que divagues y pierdas el enfoque del entrevistador.' },
      { t: 'h2', v: 'La Estructura STAR al Detalle' },
      { t: 'ul', v: [
        'Situación: Describe brevemente el contexto del problema o proyecto. Debe tomar el 15% del tiempo de tu respuesta.',
        'Tarea: Explica cuál era tu responsabilidad u objetivo específico frente a dicha situación (15% del tiempo).',
        'Acción: Detalla las acciones concretas que ejecutaste para resolver el problema de manera individual o liderando a otros. Es la parte más importante (50% del tiempo). Usa "yo", no "nosotros".',
        'Resultado: Muestra el impacto directo de tus acciones respaldado por datos cuantitativos o aprendizajes corporativos (20% del tiempo).'
      ] },
      { t: 'tip', title: 'RECOMENDACIÓN CLAVE', v: 'Prepara con anticipación de 4 a 5 historias de tu carrera profesional usando esta plantilla. Asegúrate de tener al menos una historia sobre un logro destacado, una situación de conflicto, un error solucionado y un cambio imprevisto.' }
    ]
  },
  {
    id: 8,
    titulo: 'Respuestas de Alto Impacto para Preguntas Clave',
    categoria: 'Entrevistas',
    tiempo_lectura: 5,
    descripcion: 'Aprende a formular respuestas seguras, concisas y orientadas a resultados ante los desafíos de la entrevista.',
    tags: ['entrevista', 'respuestas', 'preparacion', 'tips'],
    fecha: 'Mayo 2026',
    color: 'blue',
    secciones: [
      { t: 'intro', v: 'Existen preguntas clásicas que siguen siendo el filtro principal para evaluar el fit cultural y la estabilidad del candidato. Una respuesta improvisada puede enviar señales de alerta involuntarias al reclutador.' },
      { t: 'h2', v: 'Tres Preguntas Clave y Cómo Abordarlas' },
      { t: 'ol', v: [
        '"Háblame de ti": No recites tu currículum de memoria. Enfoca tu respuesta en tus últimos 3 años de trayectoria, tu principal área de especialidad y por qué esta vacante en particular representa el paso lógico y natural en tu carrera.',
        '"¿Por qué saliste de tu último empleo?": Nunca hables de forma negativa sobre tus jefes anteriores o la cultura de tu empresa anterior. Enmarca tu salida como una búsqueda consciente de mayor crecimiento profesional, nuevos retos técnicos o reestructuración organizacional.',
        '"¿Cuál es tu mayor área de mejora?": Evita clichés como "soy perfeccionista". Menciona una debilidad técnica o de proceso real en la que estés trabajando activamente para mitigar (ej: "Antes solía centralizar muchas tareas; ahora utilizo herramientas de gestión para delegar de forma estructurada").'
      ] },
      { t: 'tip', title: 'PRÁCTICA ACTIVA', v: 'Grábate con el celular o utiliza el Simulador de Entrevista de ELVIA para responder estas preguntas en voz alta. Escuchar tu propio tono de voz te ayudará a ganar solidez y corregir muletillas.' }
    ]
  },
  {
    id: 9,
    titulo: 'Negociación Salarial: Defiende tu Valor de Mercado',
    categoria: 'Entrevistas',
    tiempo_lectura: 5,
    descripcion: 'Aprende a gestionar la expectativa salarial de manera estratégica para no dejar dinero sobre la mesa.',
    tags: ['salario', 'negociacion', 'oferta', 'estrategia'],
    fecha: 'Mayo 2026',
    color: 'blue',
    secciones: [
      { t: 'intro', v: 'La negociación salarial comienza desde el primer contacto telefónico con el reclutador, no al recibir la oferta final. Dar un número exacto muy temprano puede descartarte por exceder el presupuesto o subvaluar tu talento.' },
      { t: 'h2', v: 'Estrategias de Negociación Efectiva' },
      { t: 'ul', v: [
        'Indaga Primero: Si te preguntan tu expectativa económica al inicio, puedes responder de forma diplomática: "Antes de hablar de una cifra exacta, me encantaría conocer a detalle el alcance del rol y el paquete de compensación total. ¿Cuál es el rango presupuestado para esta posición?".',
        'Usa el Rango Asimétrico: Si te ves obligado a dar una cifra, presenta siempre un rango donde tu número objetivo ideal sea el límite inferior (ej: si deseas percibir $4,000, solicita "un rango de entre $4,100 y $4,800 de acuerdo con las responsabilidades").',
        'Evalúa la Compensación Total: Considera que el salario base es solo una parte de la ecuación. Los días adicionales de vacaciones, bonos de desempeño, seguro médico de gastos mayores o presupuesto para educación formal pueden compensar un salario base ligeramente menor.'
      ] },
      { t: 'tip', title: 'PERSPECTIVA', v: 'Una oferta de trabajo inicial rara vez es inamovible. Las empresas serias suelen reservar un margen de negociación de entre un 10% y un 15% para los candidatos que demuestran un valor excepcional durante el proceso de selección.' }
    ]
  },
  {
    id: 10,
    titulo: 'El Mapa del Mercado Oculto de Empleo',
    categoria: 'Networking',
    tiempo_lectura: 4,
    descripcion: 'Accede al 70% de las vacantes profesionales que nunca se publican de forma abierta.',
    tags: ['networking', 'mercado oculto', 'estrategia', 'vacantes'],
    fecha: 'Mayo 2026',
    color: 'amber',
    secciones: [
      { t: 'intro', v: 'La mayoría de los profesionales enfoca el 100% de su esfuerzo diario en postular a través de portales de empleo tradicionales. Sin embargo, más de dos tercios de las vacantes a nivel gerencial o de especialización técnica se cubren por referidos directos o búsqueda ejecutiva (headhunting).' },
      { t: 'h2', v: 'Cómo Conectarte con el Mercado Oculto' },
      { t: 'ol', v: [
        'Identifica tus 15 Empresas Objetivo: No busques vacantes genéricas. Diseña una lista con las empresas donde realmente deseas laborar basándote en tu perfil e industria.',
        'Mapea a los Tomadores de Decisión: Utiliza los filtros de LinkedIn para encontrar a los directores o gerentes del área en la que trabajarías (Hiring Managers), no solo al equipo de Recursos Humanos.',
        'Solicita Entrevistas Informativas: Conéctate con profesionales de tu área en esas empresas objetivo con el fin de conocer sus retos operativos cotidianos, no para pedirles trabajo directamente.'
      ] },
      { t: 'tip', title: 'CLAVE DE ACCESO', v: 'Al conversar con un colega de tu sector en otra empresa, pregúntale: "¿Qué tipo de retos o necesidades técnicas están enfrentando en su departamento este trimestre?". Esa simple pregunta te revelará vacantes ocultas antes de que se redacten y publiquen.' }
    ]
  },
  {
    id: 11,
    titulo: 'Mensajes en Frío (Cold Outreach) que Sí se Responden',
    categoria: 'Networking',
    tiempo_lectura: 4,
    descripcion: 'Aprende a redactar plantillas cortas y respetuosas de 3 oraciones para conectar con tomadores de decisión.',
    tags: ['cold outreach', 'linkedin', 'mensajes', 'networking'],
    fecha: 'Mayo 2026',
    color: 'amber',
    secciones: [
      { t: 'intro', v: 'Enviar tu currículum sin presentación previa a un directivo saturado de mensajes es el camino rápido hacia la papelera de reciclaje. El "Cold Outreach" exitoso debe ser corto, de muy baja fricción para el receptor y enfocado en generar conversación.' },
      { t: 'h2', v: 'La Estructura Perfecta de 3 Oraciones' },
      { t: 'ul', v: [
        'Oración 1 (El Contexto/Gancho): Conexión directa y personalizada (ej: "Hola [Nombre], sigo con mucho interés tus aportaciones sobre transformación digital en el sector retail...").',
        'Oración 2 (El Valor/Propuesta): Tu especialidad sintetizada orientada a sus posibles retos (ej: "Llevo más de 6 años liderando la migración a la nube de e-commerce locales logrando reducir costos operativos...").',
        'Oración 3 (La Llamada a la Acción de Baja Fricción): No solicites trabajo ni una llamada de una hora. Pide algo mínimo (ej: "¿Estarías abierto a conectar para intercambiar mejores prácticas sobre la gestión de infraestructura la próxima semana?").'
      ] },
      { t: 'tip', title: 'PLANTILLA DE EJEMPLO', v: '"Hola Carlos. Leí tu reciente publicación sobre los retos de escalabilidad en microservicios. Como DevOps Engineer especializado en Kubernetes en LATAM, me encantaría sumar tu perfil a mi red para compartir aprendizajes de la industria. ¡Saludos!"' }
    ]
  },
  {
    id: 12,
    titulo: 'Networking con Sentido: La Rutina de 15 Minutos',
    categoria: 'Networking',
    tiempo_lectura: 4,
    descripcion: 'Implementa un hábito diario simple para nutrir tu red profesional de manera orgánica y sin presiones.',
    tags: ['networking', 'rutina', 'habito', 'relaciones'],
    fecha: 'Mayo 2026',
    color: 'amber',
    secciones: [
      { t: 'intro', v: 'El gran error del networking es iniciarlo únicamente cuando te encuentras desempleado o necesitas un favor urgente. La forma más sana e inteligente de construir una red sólida es aportar valor de manera constante y desinteresada en tu día a día.' },
      { t: 'h2', v: 'La Rutina Diaria de 15 Minutos' },
      { t: 'ol', v: [
        'Minuto 1 a 5 (Aportación de Valor): Abre tu feed de LinkedIn y deja 2 comentarios significativos y técnicos en publicaciones de profesionales de tu interés. Evita el "Excelente post"; aporta datos adicionales.',
        'Minuto 8 a 10 (Conexión Genuina): Envía una solicitud de contacto personalizada a un colega de tu sector en otra empresa de tu interés sin intenciones de venta o postulación.',
        'Minuto 11 a 15 (Mantenimiento de Relación): Escribe un mensaje breve a un antiguo compañero de trabajo o jefe para saludarle, felicitarle por un nuevo logro corporativo o compartirle un artículo técnico de valor.'
      ] },
      { t: 'tip', title: 'EFECTO COMPUESTO', v: 'Hacer esto de lunes a viernes sumará más de 40 interacciones de valor al mes. Cuando surja una posición idónea en sus empresas, no serás un desconocido postulando a ciegas; serás un colega activo y respetado.' }
    ]
  }
]

// ── Colores por categoría ──────────────────────────────────────────────────────
const CATEGORIA_COLORS = {
  Entrevistas: 'bg-blue-50 text-blue-600 border-blue-100',
  LinkedIn:    'bg-teal-50 text-teal-600 border-teal-100',
  CV:          'bg-purple-50 text-purple-600 border-purple-100',
  Networking:  'bg-amber-50 text-amber-600 border-amber-100',
}

// ── Renderizador de contenido de artículo ─────────────────────────────────────
function RenderContenido({ secciones }) {
  return (
    <div className="prose prose-sm max-w-none space-y-4">
      {secciones.map((s, i) => {
        if (s.t === 'intro') return (
          <p key={i} className="text-base text-gray-600 leading-relaxed border-l-4 border-primary/30 pl-4 italic">{s.v}</p>
        )
        if (s.t === 'h2') return (
          <h2 key={i} className="text-base font-bold text-gray-900 mt-6 mb-2">{s.v}</h2>
        )
        if (s.t === 'p') return (
          <p key={i} className="text-sm text-gray-600 leading-relaxed">{s.v}</p>
        )
        if (s.t === 'ul') return (
          <ul key={i} className="space-y-1.5 ml-1">
            {s.v.map((item, j) => (
              <li key={j} className="flex gap-2 text-sm text-gray-600">
                <span className="text-primary shrink-0 mt-0.5">•</span>{item}
              </li>
            ))}
          </ul>
        )
        if (s.t === 'ol') return (
          <ol key={i} className="space-y-2 ml-1">
            {s.v.map((item, j) => (
              <li key={j} className="flex gap-2.5 text-sm text-gray-600">
                <span className="font-bold text-primary shrink-0 w-4">{j + 1}.</span>{item}
              </li>
            ))}
          </ol>
        )
        if (s.t === 'tip') return (
          <div key={i} className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex gap-3">
            <Lightbulb size={16} weight="fill" className="text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-1">{s.title}</p>
              <p className="text-sm text-amber-800 leading-relaxed">{s.v}</p>
            </div>
          </div>
        )
        return null
      })}
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function Biblioteca() {
  const { featuresDesbloqueadas, loading } = useAuth()
  const [busqueda, setBusqueda] = useState('')
  const [categoriaActiva, setCategoriaActiva] = useState('Todos')
  const [articuloAbierto, setArticuloAbierto] = useState(null)
  const [infografiaAbierta, setInfografiaAbierta] = useState(null)

  if (loading) return null

  if (!featuresDesbloqueadas) {
    return (
      <FeatureLocked
        titulo="Biblioteca de Recursos" 
        descripcion="Accede a guías exclusivas, infografías y artículos creados por expertos para acelerar tu búsqueda laboral."
        icono={<BookOpen size={44} weight="light" />}
      />
    )
  }

  const categorias = ['Todos', ...new Set(ARTICULOS.map(a => a.categoria))]

  const filtrados = ARTICULOS.filter(a => {
    const matchBusqueda = !busqueda
      || a.titulo.toLowerCase().includes(busqueda.toLowerCase())
      || a.tags.some(t => t.includes(busqueda.toLowerCase()))
      || a.descripcion.toLowerCase().includes(busqueda.toLowerCase())
    const matchCategoria = categoriaActiva === 'Todos' || a.categoria === categoriaActiva
    return matchBusqueda && matchCategoria
  })

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">

      {/* Modal Infografía */}
      {infografiaAbierta && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setInfografiaAbierta(null)}>
          <div className="relative max-w-3xl w-full" onClick={e => e.stopPropagation()}>
            <button onClick={() => setInfografiaAbierta(null)}
              className="absolute -top-10 right-0 text-white/70 hover:text-white transition-colors flex items-center gap-1.5 text-sm font-semibold">
              <X size={18} /> Cerrar
            </button>
            <img src={infografiaAbierta.src} alt={infografiaAbierta.titulo} className="w-full rounded-2xl shadow-2xl" />
            <p className="text-white/70 text-xs text-center mt-3">{infografiaAbierta.titulo}</p>
          </div>
        </div>
      )}

      {/* Modal artículo */}
      {articuloAbierto && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8">
            {/* Header modal */}
            <div className="flex items-start justify-between p-6 border-b border-gray-100">
              <div className="flex-1 pr-4">
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${CATEGORIA_COLORS[articuloAbierto.categoria]}`}>
                  {articuloAbierto.categoria}
                </span>
                <h2 className="text-xl font-bold text-gray-900 mt-2 leading-snug">{articuloAbierto.titulo}</h2>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><Clock size={12} />{articuloAbierto.tiempo_lectura} min de lectura</span>
                  <span>{articuloAbierto.fecha}</span>
                </div>
              </div>
              <button onClick={() => setArticuloAbierto(null)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors shrink-0">
                <X size={18} />
              </button>
            </div>
            {/* Contenido */}
            <div className="p-6">
              <RenderContenido secciones={articuloAbierto.secciones} />
            </div>
            {/* Tags */}
            <div className="px-6 pb-6 flex flex-wrap gap-1.5">
              {articuloAbierto.tags.map(t => (
                <span key={t} className="text-[10px] text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">#{t}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            Biblioteca
            <HelpBadge id="biblioteca.main" />
          </h1>
          <span className="text-xs font-semibold bg-primary/10 text-primary rounded-full px-2.5 py-0.5">
            {ARTICULOS.length} artículos
          </span>
        </div>
        <p className="text-sm text-gray-500">Conocimiento práctico para acelerar tu carrera profesional.</p>
      </div>

      {/* Buscador */}
      <div className="relative mb-5">
        <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar por tema, título o etiqueta..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
        />
        {busqueda && (
          <button onClick={() => setBusqueda('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Filtros de categoría */}
      <div className="flex gap-2 flex-wrap mb-6">
        {categorias.map(cat => (
          <button key={cat} onClick={() => setCategoriaActiva(cat)}
            className={`text-xs font-semibold px-3.5 py-1.5 rounded-full border transition-colors
              ${categoriaActiva === cat
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
            {cat}
          </button>
        ))}
      </div>

      {/* Grid de artículos */}
      {filtrados.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No encontramos artículos para "{busqueda}"</p>
          <p className="text-sm mt-1">Intenta con otro término o explora todas las categorías</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-5">
          {filtrados.map(articulo => (
            <button key={articulo.id} onClick={() => setArticuloAbierto(articulo)}
              className="group text-left bg-white border border-gray-200 rounded-2xl p-6 hover:border-primary/40 hover:shadow-md transition-all duration-200">

              {/* Categoría */}
              <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${CATEGORIA_COLORS[articulo.categoria]}`}>
                {articulo.categoria}
              </span>

              {/* Título */}
              <h3 className="text-base font-bold text-gray-900 mt-3 mb-2 leading-snug group-hover:text-primary transition-colors">
                {articulo.titulo}
              </h3>

              {/* Descripción */}
              <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">{articulo.descripcion}</p>

              {/* Meta */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><Clock size={12} />{articulo.tiempo_lectura} min</span>
                  <span>{articulo.fecha}</span>
                </div>
                <span className="text-xs font-semibold text-primary flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  Leer <ArrowRight size={12} weight="bold" />
                </span>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1 mt-3">
                {articulo.tags.slice(0, 3).map(t => (
                  <span key={t} className="text-[10px] text-gray-400 bg-gray-50 rounded-full px-2 py-0.5 flex items-center gap-0.5">
                    <Tag size={9} />{t}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* ── Sección Infografías ── */}
      <div className="mt-12">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
            <Images size={16} weight="duotone" className="text-purple-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Infografías</h2>
            <p className="text-xs text-gray-400">Referencia visual rápida — guárdalas o compártelas</p>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-5">
          {INFOGRAFIAS.map(inf => (
            <div key={inf.id} className="group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-purple-200 hover:shadow-md transition-all duration-200">
              {/* Preview */}
              <div className="relative overflow-hidden bg-gray-50 cursor-pointer" onClick={() => setInfografiaAbierta(inf)}>
                <img src={inf.src} alt={inf.titulo} className="w-full object-cover h-48 object-top group-hover:scale-[1.02] transition-transform duration-300" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-xl px-4 py-2 flex items-center gap-2 text-sm font-semibold text-gray-800">
                    <ArrowSquareOut size={15} /> Ver completa
                  </div>
                </div>
              </div>
              {/* Info */}
              <div className="p-5">
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border bg-purple-50 text-purple-600 border-purple-100">
                  {inf.categoria}
                </span>
                <h3 className="text-base font-bold text-gray-900 mt-2 mb-1">{inf.titulo}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{inf.descripcion}</p>
                <div className="flex flex-wrap gap-1 mt-3">
                  {inf.tags.map(t => (
                    <span key={t} className="text-[10px] text-gray-400 bg-gray-50 rounded-full px-2 py-0.5 flex items-center gap-0.5">
                      <Tag size={9} />{t}
                    </span>
                  ))}
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={() => setInfografiaAbierta(inf)}
                    className="flex-1 text-xs font-semibold border border-gray-200 hover:border-purple-300 hover:text-purple-600 text-gray-600 rounded-xl py-2 transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
                    <ArrowSquareOut size={13} /> Ver completa
                  </button>
                  <a href={inf.src} download
                    className="flex-1 text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-xl py-2 transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
                    Descargar
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA próximos artículos */}
      <div className="mt-10 bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/10 rounded-2xl p-6 text-center">
        <Star size={20} weight="duotone" className="text-primary mx-auto mb-2" />
        <p className="text-sm font-semibold text-gray-800 mb-1">Más artículos en camino</p>
        <p className="text-xs text-gray-500">Próximamente: negociación salarial, personal branding, cambio de carrera a Tech y más.</p>
      </div>
    </div>
  )
}
