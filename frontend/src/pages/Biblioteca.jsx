// Biblioteca — centro de conocimiento con artículos y búsqueda
import { useState } from 'react'
import { BookOpen, MagnifyingGlass, Clock, Tag, X, ArrowRight, Lightbulb, Star } from '@phosphor-icons/react'

// ── Contenido de artículos ────────────────────────────────────────────────────
const ARTICULOS = [
  {
    id: 1,
    titulo: '10 Estrategias para Dominar tu Próxima Entrevista',
    categoria: 'Entrevistas',
    tiempo_lectura: 8,
    descripcion: 'Desde la investigación previa hasta el seguimiento post-entrevista: el método completo que usan los candidatos exitosos.',
    tags: ['entrevista', 'preparación', 'STAR', 'salario', 'negociación'],
    fecha: 'Marzo 2026',
    color: 'blue',
    secciones: [
      { t: 'intro', v: 'Una entrevista no se improvisa. Los candidatos que obtienen la oferta no son necesariamente los más calificados — son los mejor preparados. Estas 10 estrategias te darán una ventaja real.' },
      { t: 'h2', v: '1. Investiga antes de entrar' },
      { t: 'p', v: 'Dedica mínimo 30 minutos a investigar la empresa: su modelo de negocio, cultura, noticias recientes, retos del sector. Revisa el LinkedIn del entrevistador. Este contexto te permite personalizar tus respuestas y hacer preguntas inteligentes al final.' },
      { t: 'tip', title: 'PRO TIP', v: 'Busca en Google: "nombre empresa" + "site:linkedin.com" para ver qué comparten sus líderes. Eso revela mucho sobre la cultura.' },
      { t: 'h2', v: '2. Domina el método STAR' },
      { t: 'p', v: 'Para cualquier pregunta conductual ("cuéntame de una vez que..."), usa esta estructura:' },
      { t: 'ol', v: ['Situación: el contexto en que ocurrió', 'Tarea: tu responsabilidad específica', 'Acción: lo que hiciste (usa "yo", no "nosotros")', 'Resultado: el impacto medible que lograste'] },
      { t: 'p', v: 'Prepara al menos 5 historias STAR antes de cualquier entrevista. Cúbrelas: liderazgo, conflicto, fracaso, logro bajo presión, trabajo en equipo.' },
      { t: 'h2', v: '3. Conoce tu CV de memoria' },
      { t: 'p', v: 'Cada número, fecha y logro en tu CV debe salir de forma natural. Si dudas sobre un dato de tu propio perfil, pierdes credibilidad. Practica en voz alta explicando cada experiencia en 60 segundos.' },
      { t: 'h2', v: '4. Prepara respuestas para las preguntas trampa' },
      { t: 'ul', v: [
        '"¿Cuál es tu mayor debilidad?" → Elige una real pero en mejora activa. Nunca digas "soy perfeccionista".',
        '"¿Por qué dejas tu trabajo?" → Siempre enmarca en crecimiento, nunca en crítica al empleador anterior.',
        '"¿Dónde te ves en 5 años?" → Alinea tu respuesta con el crecimiento interno de la empresa.',
        '"¿Cuánto ganas actualmente?" → En LATAM puedes responder con un rango de mercado en vez de tu salario actual.',
      ]},
      { t: 'h2', v: '5. Practica con voz alta, no en tu cabeza' },
      { t: 'p', v: 'La diferencia entre pensar una respuesta y verbalizarla es enorme. Usa el Simulador de Entrevista de OPTIMA para practicar con preguntas reales y recibir feedback de IA antes de la entrevista real.' },
      { t: 'tip', title: 'DATO', v: 'Los candidatos que practican en voz alta al menos 3 veces antes de una entrevista reportan hasta un 40% menos de ansiedad durante el proceso real.' },
      { t: 'h2', v: '6. Maneja la conversación de salario' },
      { t: 'p', v: 'Investiga el rango de mercado antes (LinkedIn Salary, Glassdoor, oferta de la vacante). Si te preguntan primero, responde con un rango: "Basado en el mercado para este rol en [ciudad], estoy buscando entre X y Y". Nunca des un número sin haber investigado.' },
      { t: 'h2', v: '7. Cuida tu lenguaje corporal' },
      { t: 'ul', v: [
        'Postura recta, no rígida — transmite confianza',
        'Contacto visual directo, especialmente al responder',
        'Evita cruzar los brazos — señal defensiva',
        'En videollamada: mira a la cámara, no a la pantalla',
        'Sonríe genuinamente al inicio y al cierre',
      ]},
      { t: 'h2', v: '8. Prepara 3–5 preguntas inteligentes' },
      { t: 'p', v: 'Las preguntas que haces revelan tu nivel de pensamiento. Evita lo básico ("¿tienen beneficios?"). Apunta a:' },
      { t: 'ul', v: [
        '"¿Cuál es el mayor reto que enfrenta el equipo actualmente?"',
        '"¿Qué diferencia a las personas que más avanzan aquí?"',
        '"¿Cómo se mide el éxito en los primeros 90 días?"',
      ]},
      { t: 'h2', v: '9. Cierra con intención' },
      { t: 'p', v: 'Al terminar, reafirma tu interés explícitamente: "Tras esta conversación, estoy aún más interesado en esta oportunidad. ¿Cuáles son los siguientes pasos?" Muestra iniciativa sin desesperación.' },
      { t: 'h2', v: '10. Email de seguimiento en menos de 24 horas' },
      { t: 'p', v: 'Envía un email corto de agradecimiento al entrevistador: menciona algo específico de la conversación, reitera tu propuesta de valor para el rol, y expresa disponibilidad. El 70% de los candidatos no hace esto — es una ventaja directa.' },
      { t: 'tip', title: 'PLANTILLA', v: '"Gracias por el tiempo de hoy. La conversación sobre [tema específico] confirmó mi interés. Mi experiencia en [habilidad] podría contribuir directamente a [objetivo que mencionaron]. Quedo atento a los próximos pasos."' },
    ],
  },
  {
    id: 2,
    titulo: 'LinkedIn 2026: Guía Completa para Profesionales de LATAM',
    categoria: 'LinkedIn',
    tiempo_lectura: 12,
    descripcion: 'El algoritmo semántico, el SSI y la estrategia de contenidos que todo profesional debe dominar para destacar en 2026.',
    tags: ['linkedin', 'networking', 'SSI', 'algoritmo', 'perfil', 'habilidades'],
    fecha: 'Marzo 2026',
    color: 'teal',
    secciones: [
      { t: 'intro', v: 'LinkedIn en 2026 no es la red de contactos que conocías. Es un ecosistema gobernado por IA semántica que evalúa tu perfil en milisegundos. Dominar sus reglas es la diferencia entre ser encontrado o ser invisible.' },
      { t: 'h2', v: 'El algoritmo semántico: más allá de las palabras clave' },
      { t: 'p', v: 'El nuevo Semantic Skill Graph de LinkedIn no busca palabras exactas — entiende el contexto. Si indicas "Machine Learning", el sistema infiere relaciones con "Data Science", "TensorFlow" y "IA Generativa". Esto significa que repetir keywords está penalizado; lo que importa es la coherencia semántica de tu perfil.' },
      { t: 'tip', title: 'CLAVE', v: 'El AI Hiring Assistant de LinkedIn filtra candidatos en lenguaje natural. Las empresas que lo usan revisan un 62% menos de perfiles. Si tu perfil no está optimizado, nunca llegas a ojos humanos.' },
      { t: 'h2', v: 'Tu foto y banner: el apretón de manos digital' },
      { t: 'p', v: 'Un perfil con foto profesional recibe hasta 14x más visualizaciones. Los estándares 2026:' },
      { t: 'ul', v: [
        'Resolución mínima 400×400px, idealmente mucho mayor',
        'Tu rostro debe ocupar el 60% del encuadre',
        'Fondo neutro o desenfocado (bokeh)',
        'Luz natural indirecta, sin sombras duras',
        'Autenticidad: no uses filtros que cambien tu apariencia real',
      ]},
      { t: 'p', v: 'Para el banner (1584×396px): centra tu mensaje principal a la derecha. La foto de perfil se superpone en la esquina inferior izquierda en móvil — no pongas texto crítico en ese área.' },
      { t: 'h2', v: 'El titular: 220 caracteres que lo cambian todo' },
      { t: 'p', v: 'Es el campo con mayor peso individual en el algoritmo. Trata estos 220 caracteres como un anuncio publicitario personal. La fórmula validada:' },
      { t: 'tip', title: 'FÓRMULA', v: '[Cargo Principal] | [Especialidad o Nicho] | [Hard Skills clave] | [Propuesta de valor con métrica]' },
      { t: 'ul', v: [
        'Ejemplo Tech: "Senior Software Engineer | Cloud Architecture | Python, React, AWS | Escalando productos para +10M usuarios"',
        'Ejemplo Ventas: "B2B Sales Director | SaaS Fintech | Pipeline Management | Generando +$5M en ingresos anuales"',
        'EVITA: "En búsqueda activa", "Abierto a oportunidades" — no generan búsquedas y proyectan vulnerabilidad',
      ]},
      { t: 'h2', v: 'La sección Acerca de: tu carta de ventas de 2,600 caracteres' },
      { t: 'p', v: 'Estructura en 4 bloques:' },
      { t: 'ol', v: [
        'El Gancho: Las primeras 2-3 líneas (las únicas visibles sin hacer clic). Deben ser impactantes y capturar atención inmediatamente.',
        'El Contexto (The Why): Tu filosofía de trabajo o motivación. Humaniza el perfil — las IAs no pueden replicar tu historia personal.',
        'La Prueba: 3-5 logros específicos con números. Usa viñetas para lectura rápida.',
        'La CTA: "¿Interesado en [tema]? Conectemos o escríbeme a nombre@email.com" — incluye email porque no todos tienen créditos de InMail.',
      ]},
      { t: 'h2', v: 'Experiencia: de funciones a resultados' },
      { t: 'p', v: 'El reclutador ya sabe qué hace un Gerente de Marketing. Lo que quiere ver es qué LOGRASTE tú específicamente. Para cada rol, elige 3-5 logros usando el método STAR con verbos de acción:' },
      { t: 'ul', v: [
        'MAL: "Responsable de gestionar el equipo de ventas"',
        'BIEN: "Lideré equipo de 15 ejecutivos de cuenta, superando cuota anual en 20% durante 3 años consecutivos"',
        'Verbos de alto impacto: implementé, lideré, generé, reduje, escalé, diseñé, migré, automaticé',
      ]},
      { t: 'h2', v: 'Habilidades: estrategia, no cantidad' },
      { t: 'ul', v: [
        'LinkedIn permite hasta 100 habilidades en 2026 — no las rellenes todas',
        'Las TOP 3 (las primeras visibles) deben ser las core del cargo que buscas',
        'Completa las evaluaciones técnicas de LinkedIn — los Verified Badges pesan enormemente en el algoritmo',
        'Busca endorsements de personas que el algoritmo ya reconoce como autoridades en tu área',
      ]},
      { t: 'h2', v: 'SSI: tu índice de visibilidad activa' },
      { t: 'p', v: 'El Social Selling Index (SSI) mide tu actividad en una escala de 0-100. Los perfiles con SSI >75 están en el percentil superior de visibilidad. Se construye con 4 pilares:' },
      { t: 'ol', v: [
        'Marca profesional: perfil completo al 100% (All-Star status) + contenido que te posicione como experto',
        'Red relevante: conecta con tomadores de decisión de tus empresas objetivo, no con todos',
        'Interacción de calidad: un comentario profundo tiene 5-7x más peso algorítmico que un "like"',
        'Relaciones: responde rápido, personaliza tus mensajes — ser "More likely to respond" es un filtro real en LinkedIn Recruiter',
      ]},
      { t: 'h2', v: 'Estrategia de contenidos 2026' },
      { t: 'p', v: 'Formatos por rendimiento este año:' },
      { t: 'ul', v: [
        'Vídeo vertical corto (<90s): máximo crecimiento orgánico (+25% alcance)',
        'Texto solo: alta autenticidad — párrafos de una frase con gancho potente',
        'Carruseles PDF nativos: alta interacción (6-12 slides, <50 palabras cada uno)',
        'Encuestas: alto volumen de participación rápida',
      ]},
      { t: 'tip', title: 'HORARIO ÓPTIMO', v: 'Para España y LATAM: publica entre 8:00 AM y 10:00 AM, martes a jueves. Coincide con el inicio de jornada y el pico de revisión de feed.' },
    ],
  },
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
  const [busqueda, setBusqueda] = useState('')
  const [categoriaActiva, setCategoriaActiva] = useState('Todos')
  const [articuloAbierto, setArticuloAbierto] = useState(null)

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
          <h1 className="text-2xl font-bold text-gray-900">Biblioteca</h1>
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

      {/* CTA próximos artículos */}
      <div className="mt-10 bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/10 rounded-2xl p-6 text-center">
        <Star size={20} weight="duotone" className="text-primary mx-auto mb-2" />
        <p className="text-sm font-semibold text-gray-800 mb-1">Más artículos en camino</p>
        <p className="text-xs text-gray-500">Próximamente: negociación salarial, personal branding, cambio de carrera a Tech y más.</p>
      </div>
    </div>
  )
}
