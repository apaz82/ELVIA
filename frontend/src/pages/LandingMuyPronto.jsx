import * as React from 'react'
import { MotionConfig, motion } from 'framer-motion'
import { Link } from 'react-router-dom'

// ─── Utilidades ───────────────────────────────────────────────────────────────
function splitText(text) {
  const words = text.split(' ').map((w) => w.concat(' '))
  return words.map((w) => w.split('')).flat()
}

// ─── Context ──────────────────────────────────────────────────────────────────
const HoverSliderContext = React.createContext(undefined)

function useHoverSliderContext() {
  const ctx = React.useContext(HoverSliderContext)
  if (!ctx) throw new Error('Must be inside HoverSlider')
  return ctx
}

// ─── HoverSlider ──────────────────────────────────────────────────────────────
function HoverSlider({ children, className }) {
  const [activeSlide, setActiveSlide] = React.useState(0)
  const changeSlide = React.useCallback((i) => setActiveSlide(i), [])
  return (
    <HoverSliderContext.Provider value={{ activeSlide, changeSlide }}>
      <div className={className}>{children}</div>
    </HoverSliderContext.Provider>
  )
}

// ─── TextStaggerHover ─────────────────────────────────────────────────────────
function TextStaggerHover({ text, index, className }) {
  const { activeSlide, changeSlide } = useHoverSliderContext()
  const chars = splitText(text)
  const isActive = activeSlide === index
  return (
    <span
      className={`relative inline-block origin-bottom overflow-hidden cursor-default ${className ?? ''}`}
      onMouseEnter={() => changeSlide(index)}
      onClick={() => changeSlide(index)}
    >
      {chars.map((char, i) => (
        <span key={`${char}-${i}`} className="relative inline-block overflow-hidden">
          <MotionConfig transition={{ delay: i * 0.02, duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}>
            <motion.span
              className="inline-block opacity-30"
              initial={{ y: '0%' }}
              animate={isActive ? { y: '-110%' } : { y: '0%' }}
            >
              {char === ' ' ? ' ' : char}
            </motion.span>
            <motion.span
              className="absolute left-0 top-0 inline-block"
              initial={{ y: '110%' }}
              animate={isActive ? { y: '0%' } : { y: '110%' }}
            >
              {char === ' ' ? ' ' : char}
            </motion.span>
          </MotionConfig>
        </span>
      ))}
    </span>
  )
}

// ─── HoverSliderCard ──────────────────────────────────────────────────────────
const clipPathVariants = {
  visible: { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)' },
  hidden:  { clipPath: 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)' },
}

function HoverSliderCard({ index, image, alt }) {
  const { activeSlide } = useHoverSliderContext()
  return (
    <motion.div
      className="w-full h-full rounded-2xl overflow-hidden"
      transition={{ ease: [0.33, 1, 0.68, 1], duration: 0.7 }}
      variants={clipPathVariants}
      animate={activeSlide === index ? 'visible' : 'hidden'}
    >
      <img
        src={image}
        alt={alt}
        loading="lazy"
        className="w-full h-full object-cover object-center"
        draggable={false}
      />
    </motion.div>
  )
}

const SLIDES = [
  { text: 'AUTOCONOCIMIENTO',           image: '/landing/slide-autoconocimiento.webp' },
  { text: 'HERRAMIENTAS',               image: '/landing/slide-herramientas.webp' },
  { text: 'SEGUIMIENTO Y CONTROL',      image: '/landing/slide-seguimiento.webp' },
  { text: 'NUEVO PROYECTO PROFESIONAL', image: '/landing/slide-proyecto.webp' },
]

// ─── Página ───────────────────────────────────────────────────────────────────
export default function LandingMuyPronto() {
  return (
    <div
      className="min-h-screen flex flex-col relative"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      {/* Fondo */}
      <div
        className="absolute inset-0 z-0"
        style={{ background: 'radial-gradient(125% 125% at 50% 10%, #fff 42%, #e0fafa 78%, #e8f0fe 100%)' }}
      />

      {/* Hero */}
      <section className="relative z-10 flex-1 flex items-center justify-center px-5 py-10 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center text-center max-w-4xl mx-auto w-full"
        >
          {/* Logo */}
          <Link to="/" className="mb-8 block">
            <img src="/LOGOS/ELVIA_logo_fondo_transparente.png" alt="ELVIA®" className="h-12 w-auto object-contain mx-auto" />
          </Link>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/70 border border-gray-200 text-gray-600 text-sm md:text-base font-bold uppercase tracking-widest px-4 md:px-7 py-2 md:py-3 rounded-full mb-8 md:mb-10 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-[#14B8A6] animate-pulse" />
            Muy pronto
          </div>

          {/* Headline */}
          <h1
            className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 leading-tight mb-8"
            style={{ letterSpacing: '-0.03em' }}
          >
            Un sistema que te acompaña{' '}
            <span style={{ background: 'linear-gradient(135deg, #14B8A6 0%, #3B82F6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              durante todo el camino
            </span>{' '}
            de tu búsqueda profesional.
          </h1>

          {/* Sub-copy */}
          <p className="text-base md:text-xl text-gray-500 max-w-3xl leading-relaxed mb-3">
            Un sistema metodológicamente comprobado por expertos mentores de carrera profesional
            que te acompaña durante todo el camino de tu búsqueda profesional.
          </p>
          <p className="text-base md:text-xl text-gray-500 max-w-3xl leading-relaxed mb-8 md:mb-14">
            La primera plataforma de acompañamiento estratégico de inicio a fin para profesionales en LATAM.
          </p>

          {/* ── HoverSlider ── */}
          <HoverSlider className="w-full grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-12 items-center mb-8 md:mb-14">

            {/* Lista de palabras */}
            <div className="flex flex-col gap-3 text-left md:text-left">
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-1 md:hidden">Toca para explorar</p>
              {SLIDES.map((slide, i) => (
                <TextStaggerHover
                  key={slide.text}
                  text={slide.text}
                  index={i}
                  className="text-base md:text-lg font-black text-gray-900 block w-full py-0.5"
                />
              ))}
            </div>

            {/* Panel de imagen */}
            <div className="relative h-52 md:h-64 w-full grid [&>*]:col-start-1 [&>*]:col-end-1 [&>*]:row-start-1 [&>*]:row-end-1">
              {SLIDES.map((slide, i) => (
                <HoverSliderCard
                  key={slide.text}
                  index={i}
                  image={slide.image}
                  alt={slide.text}
                />
              ))}
            </div>
          </HoverSlider>

          {/* Tagline */}
          <h2
            className="text-base md:text-xl font-black text-gray-900 leading-tight text-center"
            style={{ letterSpacing: '-0.02em', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            <span style={{ background: 'linear-gradient(135deg, #0D9488 0%, #14B8A6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              CONECTA
            </span>
            {' '}TU PRESENTE CON EL FUTURO QUE QUIERES.
          </h2>
        </motion.div>
      </section>
    </div>
  )
}
