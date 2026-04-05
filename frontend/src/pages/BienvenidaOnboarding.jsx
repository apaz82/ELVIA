// BienvenidaOnboarding.jsx — Premium dark · Fully accessible · Full content
// Font: Plus Jakarta Sans (app standard) · Large type · All-ages friendly
import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight, MapPin, MusicNote, Coffee, Lightbulb, ShieldCheck
} from '@phosphor-icons/react'

// ── Ensure app font ──
;[`https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&display=swap`].forEach(href => {
  if (!document.querySelector(`link[href="${href}"]`)) {
    Object.assign(document.createElement('link'), { rel: 'stylesheet', href, onload: null })
    const l = document.createElement('link')
    l.rel = 'stylesheet'; l.href = href
    document.head.appendChild(l)
  }
})

const FONT = "'Plus Jakarta Sans', sans-serif"

// ── Subtle ambient canvas ──
function AmbientCanvas() {
  const ref = useRef(null)
  useEffect(() => {
    const cvs = ref.current; if (!cvs) return
    const ctx = cvs.getContext('2d')
    let W = cvs.width = cvs.offsetWidth
    let H = cvs.height = cvs.offsetHeight
    const dots = Array.from({ length: 32 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 1.2 + 0.2,
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.15,
      o: Math.random() * 0.28 + 0.07,
    }))
    let raf
    const draw = () => {
      ctx.clearRect(0, 0, W, H)
      dots.forEach(d => {
        d.x = (d.x + d.vx + W) % W
        d.y = (d.y + d.vy + H) % H
        ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(167,139,250,${d.o})`; ctx.fill()
      })
      for (let i = 0; i < dots.length; i++) for (let j = i + 1; j < dots.length; j++) {
        const dist = Math.hypot(dots[i].x - dots[j].x, dots[i].y - dots[j].y)
        if (dist < 110) {
          ctx.beginPath(); ctx.moveTo(dots[i].x, dots[i].y); ctx.lineTo(dots[j].x, dots[j].y)
          ctx.strokeStyle = `rgba(139,92,246,${0.08 * (1 - dist / 110)})`
          ctx.lineWidth = 0.5; ctx.stroke()
        }
      }
      raf = requestAnimationFrame(draw)
    }
    draw()
    const ro = new ResizeObserver(() => { W = cvs.width = cvs.offsetWidth; H = cvs.height = cvs.offsetHeight })
    ro.observe(cvs)
    return () => { cancelAnimationFrame(raf); ro.disconnect() }
  }, [])
  return <canvas ref={ref} style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
}

const RECS = [
  { Icon: MapPin,    text: 'Un lugar tranquilo y sin interrupciones' },
  { Icon: MusicNote, text: 'Música relajante de fondo' },
  { Icon: Coffee,    text: 'Tu información laboral disponible' },
  { Icon: Lightbulb, text: 'Toda la actitud de quien está listo para el cambio' },
]

export default function BienvenidaOnboarding() {
  const navigate = useNavigate()
  const [vis, setVis] = useState(false)
  useEffect(() => { const t = setTimeout(() => setVis(true), 80); return () => clearTimeout(t) }, [])

  const fade = (delay = 0) => ({
    opacity: vis ? 1 : 0,
    transform: vis ? 'translateY(0)' : 'translateY(20px)',
    transition: `opacity 0.75s ease ${delay}ms, transform 0.75s cubic-bezier(.22,1,.36,1) ${delay}ms`,
  })

  return (
    <div style={{ fontFamily: FONT, background: '#07050f', minHeight: '100vh', position: 'relative', color: '#fff' }}>
      {/* Fixed ambient bg */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        {/* Blobs */}
        <div style={{
          position: 'absolute', width: '70vw', height: '70vw', top: '-25vw', left: '-15vw',
          borderRadius: '50%', background: 'radial-gradient(circle, rgba(109,40,217,0.2) 0%, transparent 70%)',
          filter: 'blur(50px)',
        }} />
        <div style={{
          position: 'absolute', width: '45vw', height: '45vw', bottom: '-10vw', right: '-5vw',
          borderRadius: '50%', background: 'radial-gradient(circle, rgba(20,184,166,0.1) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }} />
        <AmbientCanvas />
      </div>

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 680, margin: '0 auto', padding: '0 24px 60px' }}>

        {/* ── Logo bar ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 28, paddingBottom: 0 }}>
          <img src="/optima_logo_v3_clean_1.png" alt="OPTIMA" style={{ height: 40, width: 'auto', opacity: 0.92 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 8px #34d399', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: 11, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.35)', fontWeight: 600, textTransform: 'uppercase' }}>
              Onboarding
            </span>
          </div>
        </div>

        {/* ── Hero badge ── */}
        <div style={{ marginTop: 48, textAlign: 'center', ...fade(0) }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)',
            borderRadius: 999, padding: '6px 18px',
          }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#a78bfa', boxShadow: '0 0 8px #a78bfa' }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: '#c4b5fd', textTransform: 'uppercase' }}>
              Tu punto de partida
            </span>
          </div>
        </div>

        {/* ── Headline ── */}
        <h1 style={{
          ...fade(100),
          fontFamily: FONT,
          fontSize: 'clamp(2rem, 4vw, 2.8rem)',
          fontWeight: 800,
          lineHeight: 1.12,
          textAlign: 'center',
          color: '#ffffff',
          letterSpacing: '-0.02em',
          margin: '20px 0 16px',
        }}>
          Este es el inicio de tu proceso<br />de{' '}
          <span style={{
            background: 'linear-gradient(120deg, #a78bfa 10%, #38bdf8 60%, #34d399 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            autodescubrimiento profesional
          </span>
        </h1>

        {/* Accent */}
        <div style={{ ...fade(160), width: 44, height: 3, borderRadius: 4, margin: '0 auto 32px', background: 'linear-gradient(90deg,#7c3aed,#0ea5e9)' }} />

        {/* ── Motivational copy — full, large ── */}
        <div style={{ ...fade(200), fontSize: '1.1rem', lineHeight: 1.85, color: 'rgba(255,255,255,0.92)', marginBottom: 18 }}>
          El tiempo que te tomes <strong style={{ color: 'rgba(255,255,255,0.95)', fontWeight: 700 }}>no importa</strong> — lo que importa es conocerte. Por muy trivial que parezca una pregunta, todo nos sirve para sacar el mayor potencial de OPTIMA y acompañarte durante todo el proceso. Sean 5, 15 o 45 minutos, lo que realmente importa es que el tiempo que le dediques <strong style={{ color: 'rgba(255,255,255,0.95)', fontWeight: 700 }}>sea el de mayor valor posible</strong>.
        </div>

        <div style={{ ...fade(260), fontSize: '1.1rem', lineHeight: 1.85, color: 'rgba(255,255,255,0.92)', marginBottom: 18 }}>
          Este momento es <strong style={{ color: 'rgba(255,255,255,0.95)', fontWeight: 700 }}>único, y es tuyo</strong>. Es el momento de entender para lo que eres increíble, lo que no, y enfocarte en lo que realmente quieres para tu próxima etapa laboral, profesional y personal.
        </div>

        <div style={{ ...fade(320), fontSize: '1.05rem', lineHeight: 1.85, color: 'rgba(255,255,255,0.75)', marginBottom: 36 }}>
          En caso de que lo inicies y debas interrumpir, no te preocupes — quedará guardado en tu sección de Gerente de Búsqueda.
        </div>

        {/* ── Recommendations card ── */}
        <div style={{
          ...fade(380),
          background: 'rgba(255,255,255,0.04)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: 22,
          padding: '24px 26px',
          marginBottom: 40,
          boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
        }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 18 }}>
            Te recomendamos estar con…
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {RECS.map(({ Icon, text }, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                padding: '14px 16px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 14,
                transition: 'all 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.09)'; e.currentTarget.style.borderColor = 'rgba(139,92,246,0.22)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)' }}
              >
                <div style={{
                  width: 34, height: 34, borderRadius: 9, flexShrink: 0, marginTop: 1,
                  background: 'rgba(139,92,246,0.14)', border: '1px solid rgba(139,92,246,0.22)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={15} weight="duotone" style={{ color: '#a78bfa' }} />
                </div>
                <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.65)', fontWeight: 500, lineHeight: 1.5 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── CTA ── */}
        <div style={{ ...fade(440), textAlign: 'center' }}>
          <button
            onClick={() => navigate('/proyecto-laboral')}
            style={{
              position: 'relative', overflow: 'hidden',
              background: 'linear-gradient(135deg,#7c3aed 0%,#5b21b6 100%)',
              border: 'none', borderRadius: 16,
              padding: '17px 44px',
              color: '#fff', fontFamily: FONT,
              fontSize: '1.05rem', fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 10,
              boxShadow: '0 0 38px rgba(124,58,237,0.5), 0 6px 20px rgba(0,0,0,0.45)',
              transition: 'all 0.22s ease',
              letterSpacing: '-0.01em',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.boxShadow = '0 0 56px rgba(124,58,237,0.75), 0 6px 24px rgba(0,0,0,0.5)'
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.boxShadow = '0 0 38px rgba(124,58,237,0.5), 0 6px 20px rgba(0,0,0,0.45)'
              e.currentTarget.style.transform = 'none'
            }}
          >
            <span style={{
              position: 'absolute', inset: 0, borderRadius: 16,
              background: 'linear-gradient(105deg,transparent 20%,rgba(255,255,255,0.1) 50%,transparent 80%)',
              transform: 'translateX(-100%)', animation: 'shimmer 2.8s infinite',
            }} />
            Comenzar mi proceso
            <ArrowRight size={18} weight="bold" />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 14 }}>
            <ShieldCheck size={14} weight="duotone" style={{ color: 'rgba(255,255,255,0.3)' }} />
            <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}>
              Guardado automáticamente — puedes retomar donde lo dejaste en cualquier momento
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shimmer { 0% { transform: translateX(-100%) } 100% { transform: translateX(250%) } }
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.5 } }
      `}</style>
    </div>
  )
}
