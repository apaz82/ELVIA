// BienvenidaOnboarding.jsx — Premium dark · Fully accessible · Full content
// Font: Plus Jakarta Sans (app standard) · Large type · All-ages friendly
import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/authService'
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
        ctx.fillStyle = `rgba(99,102,241,${d.o * 0.4})`; ctx.fill()
      })
      for (let i = 0; i < dots.length; i++) for (let j = i + 1; j < dots.length; j++) {
        const dist = Math.hypot(dots[i].x - dots[j].x, dots[i].y - dots[j].y)
        if (dist < 110) {
          ctx.beginPath(); ctx.moveTo(dots[i].x, dots[i].y); ctx.lineTo(dots[j].x, dots[j].y)
          ctx.strokeStyle = `rgba(99,102,241,${0.04 * (1 - dist / 110)})`
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
    <div style={{ fontFamily: FONT, background: '#FFFFFF', minHeight: '100vh', position: 'relative', color: '#1D1D1F', overflow: 'hidden' }}>
      {/* Fixed ambient bg */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        {/* Blobs */}
        <div style={{
          position: 'absolute', width: '80vw', height: '80vw', top: '-30vw', left: '-20vw',
          borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }} />
        <div style={{
          position: 'absolute', width: '60vw', height: '60vw', bottom: '-15vw', right: '-10vw',
          borderRadius: '50%', background: 'radial-gradient(circle, rgba(20,184,166,0.05) 0%, transparent 70%)',
          filter: 'blur(70px)',
        }} />
        <div style={{
          position: 'absolute', width: '50vw', height: '50vw', top: '25vh', left: '35vw',
          borderRadius: '50%', background: 'radial-gradient(circle, rgba(167,139,250,0.04) 0%, transparent 70%)',
          filter: 'blur(90px)',
        }} />
        <AmbientCanvas />
      </div>

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 680, margin: '0 auto', padding: '0 24px 60px' }}>

        {/* ── Logo bar ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 28, paddingBottom: 0 }}>
          <img src="/LOGOS/ELVIA_logo_fondo_transparente.png" alt="ELVIA" style={{ height: 40, width: 'auto', opacity: 0.92 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 8px rgba(16,185,129,0.5)', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: 11, letterSpacing: '0.12em', color: '#86868B', fontWeight: 600, textTransform: 'uppercase' }}>
              Onboarding
            </span>
          </div>
        </div>

        {/* ── Hero badge ── */}
        <div style={{ marginTop: 48, textAlign: 'center', ...fade(0) }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(0,113,227,0.06)', border: '1px solid rgba(0,113,227,0.15)',
            borderRadius: 999, padding: '6px 18px',
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#0071E3', boxShadow: '0 0 6px rgba(0,113,227,0.4)' }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: '#0071E3', textTransform: 'uppercase' }}>
              Tu punto de partida
            </span>
          </div>
        </div>

        {/* ── Headline ── */}
        <h1 style={{
          ...fade(100),
          fontFamily: FONT,
          fontSize: 'clamp(2.1rem, 4vw, 2.85rem)',
          fontWeight: 800,
          lineHeight: 1.15,
          textAlign: 'center',
          color: '#1D1D1F',
          letterSpacing: '-0.03em',
          margin: '20px 0 16px',
        }}>
          Este es el inicio de tu proceso<br />de{' '}
          <span style={{
            background: 'linear-gradient(135deg, #0071E3 0%, #14B8A6 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            autodescubrimiento profesional
          </span>
        </h1>

        {/* Accent */}
        <div style={{ ...fade(160), width: 40, height: 3, borderRadius: 9, margin: '0 auto 32px', background: 'linear-gradient(90deg, #0071E3, #14B8A6)' }} />

        {/* ── Motivational copy — full, large ── */}
        <div style={{ ...fade(200), fontSize: '1.1rem', lineHeight: 1.85, color: '#434347', marginBottom: 18 }}>
          El tiempo que te tomes <strong style={{ color: '#1D1D1F', fontWeight: 700 }}>no importa</strong> — lo que importa es conocerte. Por muy trivial que parezca una pregunta, todo nos sirve para sacar el mayor potencial de ELVIA y acompañarte durante todo el proceso. Sean 5, 15 o 45 minutos, lo que realmente importa es que el tiempo que le dediques <strong style={{ color: '#1D1D1F', fontWeight: 700 }}>sea el de mayor valor posible</strong>.
        </div>

        <div style={{ ...fade(260), fontSize: '1.1rem', lineHeight: 1.85, color: '#434347', marginBottom: 18 }}>
          Este momento es <strong style={{ color: '#1D1D1F', fontWeight: 700 }}>único, y es tuyo</strong>. Es el momento de entender para lo que eres increíble, lo que no, y enfocarte en lo que realmente quieres para tu próxima etapa laboral, profesional y personal.
        </div>

        <div style={{ ...fade(320), fontSize: '1.05rem', lineHeight: 1.85, color: '#86868B', marginBottom: 36 }}>
          En caso de que lo inicies y debas interrumpir, no te preocupes — quedará guardado en tu sección de Gerente de Búsqueda.
        </div>

        {/* ── Recommendations card ── */}
        <div style={{
          ...fade(380),
          background: 'rgba(255, 255, 255, 0.45)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(0, 113, 227, 0.08)',
          borderRadius: 22,
          padding: '24px 26px',
          marginBottom: 40,
          boxShadow: '0 20px 44px rgba(0, 0, 0, 0.03)',
        }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: '#86868B', textTransform: 'uppercase', marginBottom: 18 }}>
            Te recomendamos estar con…
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
            {RECS.map(({ Icon, text }, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                padding: '14px 16px',
                background: 'rgba(255, 255, 255, 0.5)',
                border: '1px solid rgba(0, 113, 227, 0.06)',
                borderRadius: 14,
                transition: 'all 0.25s ease',
                cursor: 'pointer',
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(0, 113, 227, 0.05)'
                  e.currentTarget.style.borderColor = 'rgba(0, 113, 227, 0.2)'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.5)'
                  e.currentTarget.style.borderColor = 'rgba(0, 113, 227, 0.06)'
                  e.currentTarget.style.transform = 'none'
                }}
              >
                <div style={{
                  width: 34, height: 34, borderRadius: 9, flexShrink: 0, marginTop: 1,
                  background: 'rgba(0,113,227,0.07)', border: '1px solid rgba(0,113,227,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={15} weight="duotone" style={{ color: '#0071E3' }} />
                </div>
                <span style={{ fontSize: '0.9rem', color: '#434347', fontWeight: 500, lineHeight: 1.5 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── CTA ── */}
        <div style={{ ...fade(440), textAlign: 'center' }}>
          <button
            onClick={async () => {
            await supabase.auth.updateUser({ data: { bienvenida_pendiente: false } }).catch(() => {})
            navigate('/proyecto-laboral')
          }}
            style={{
              position: 'relative', overflow: 'hidden',
              background: 'linear-gradient(135deg, #0071E3 0%, #005BB5 100%)',
              border: 'none', borderRadius: 16,
              padding: '17px 44px',
              color: '#fff', fontFamily: FONT,
              fontSize: '1.05rem', fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 10,
              boxShadow: '0 10px 30px rgba(0, 113, 227, 0.25), 0 4px 12px rgba(0,0,0,0.05)',
              transition: 'all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)',
              letterSpacing: '-0.01em',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.boxShadow = '0 15px 40px rgba(0, 113, 227, 0.4), 0 6px 18px rgba(0,0,0,0.1)'
              e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 113, 227, 0.25), 0 4px 12px rgba(0,0,0,0.05)'
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
            <ShieldCheck size={14} weight="duotone" style={{ color: '#86868B' }} />
            <span style={{ fontSize: '0.82rem', color: '#86868B', fontWeight: 400 }}>
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
