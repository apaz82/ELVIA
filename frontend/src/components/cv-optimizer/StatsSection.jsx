// Sección animada de estadísticas — por qué optimizar tu CV
import { useEffect, useRef, useState } from 'react'

// Hook para detectar cuando el elemento entra en pantalla
function useInView(threshold = 0.2) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true) },
      { threshold }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [threshold])
  return [ref, inView]
}

// Contador animado
function AnimatedCounter({ target, suffix = '', duration = 1800 }) {
  const [count, setCount] = useState(0)
  const [ref, inView]     = useInView()

  useEffect(() => {
    if (!inView) return
    let start = 0
    const step = Math.ceil(target / (duration / 16))
    const timer = setInterval(() => {
      start += step
      if (start >= target) { setCount(target); clearInterval(timer) }
      else setCount(start)
    }, 16)
    return () => clearInterval(timer)
  }, [inView, target, duration])

  return (
    <span ref={ref} className="tabular-nums">
      {count}{suffix}
    </span>
  )
}

const stats = [
  {
    value: 75, suffix: '%',
    label: 'de CVs son rechazados',
    detail: 'antes de llegar a un humano, filtrados por sistemas ATS',
    color: 'text-red-400',
    bg: '',
  },
  {
    value: 7, suffix: 's',
    label: 'dedica un reclutador',
    detail: 'en promedio a revisar un CV en su primera lectura',
    color: 'text-amber-400',
    bg: '',
  },
  {
    value: 3, suffix: 'x',
    label: 'más entrevistas',
    detail: 'obtienen los profesionales con un CV en formato Harvard optimizado',
    color: 'text-primary',
    bg: '',
  },
  {
    value: 40, suffix: '%',
    label: 'más probabilidad',
    detail: 'de pasar el filtro ATS con palabras clave alineadas a la vacante',
    color: 'text-teal',
    bg: '',
  },
]

const puntos = [
  {
    icon: '🎯',
    titulo: 'Palabras clave que importan',
    desc: 'Los sistemas ATS filtran CVs por términos específicos. Un CV optimizado habla el idioma correcto.',
  },
  {
    icon: '📐',
    titulo: 'Formato Harvard estándar',
    desc: 'El formato más aceptado globalmente por reclutadores en LATAM, USA y Europa.',
  },
  {
    icon: '⚡',
    titulo: 'Impacto en 6 segundos',
    desc: 'La primera impresión lo es todo. Un CV bien estructurado comunica valor desde el primer vistazo.',
  },
]

export default function StatsSection() {
  const [sectionRef, sectionInView] = useInView(0.1)

  return (
    <div ref={sectionRef} className="border-y border-line py-14 px-6 mb-8">
      <div className="max-w-3xl mx-auto">

        {/* Título sección */}
        <div className={`text-center mb-10 transition-all duration-700 ${sectionInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-2">¿Por qué optimizar tu CV?</p>
          <h2 className="text-2xl font-bold text-white">La realidad del mercado laboral</h2>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          {stats.map((s, i) => (
            <div
              key={i}
              className="text-center p-5 rounded-2xl bg-card border border-line transition-all duration-700 hover:border-primary/30"
              style={{ transitionDelay: sectionInView ? `${i * 100}ms` : '0ms',
                       opacity: sectionInView ? 1 : 0,
                       transform: sectionInView ? 'translateY(0)' : 'translateY(16px)' }}
            >
              <p className={`text-4xl font-bold ${s.color} mb-1`}>
                <AnimatedCounter target={s.value} suffix={s.suffix} />
              </p>
              <p className="text-xs font-semibold text-white leading-tight mb-1">{s.label}</p>
              <p className="text-[11px] text-muted leading-tight hidden sm:block">{s.detail}</p>
            </div>
          ))}
        </div>

        {/* Puntos clave */}
        <div className="grid sm:grid-cols-3 gap-4">
          {puntos.map((p, i) => (
            <div
              key={i}
              className="bg-card border border-line rounded-2xl p-5 transition-all duration-700 hover:border-primary/30"
              style={{ transitionDelay: sectionInView ? `${400 + i * 100}ms` : '0ms',
                       opacity: sectionInView ? 1 : 0,
                       transform: sectionInView ? 'translateY(0)' : 'translateY(16px)' }}
            >
              <span className="text-2xl mb-3 block">{p.icon}</span>
              <h3 className="text-sm font-semibold text-white mb-1">{p.titulo}</h3>
              <p className="text-xs text-muted leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
