// Bienestar.jsx — Bienestar Emocional durante la Búsqueda Laboral
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import FeatureLocked from '../components/common/FeatureLocked'
import HelpBadge from '../components/common/HelpBadge'
import { supabase } from '../services/authService'
import {
  Heart, Wind, ChartBar, BookOpen, Play,
  CheckCircle, Smiley, SmileyMeh, SmileySad,
  SmileyAngry, SmileyBlank, SmileyNervous,
  ArrowRight, Lightbulb, SpinnerGap
} from '@phosphor-icons/react'

// ─── Constantes ───────────────────────────────────────────────────────────────

const EMOCIONES = [
  { id: 'confiado',   label: 'Confiado',    bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300', Icon: Smiley        },
  { id: 'motivado',   label: 'Motivado',    bg: 'bg-blue-100',    text: 'text-blue-700',    border: 'border-blue-300',    Icon: Smiley        },
  { id: 'tranquilo',  label: 'Tranquilo',   bg: 'bg-teal-100',    text: 'text-teal-700',    border: 'border-teal-300',    Icon: SmileyBlank   },
  { id: 'cansado',    label: 'Cansado',     bg: 'bg-slate-100',   text: 'text-slate-600',   border: 'border-slate-300',   Icon: SmileyMeh     },
  { id: 'ansioso',    label: 'Ansioso',     bg: 'bg-amber-100',   text: 'text-amber-700',   border: 'border-amber-300',   Icon: SmileyNervous },
  { id: 'frustrado',  label: 'Frustrado',   bg: 'bg-orange-100',  text: 'text-orange-700',  border: 'border-orange-300',  Icon: SmileyAngry   },
  { id: 'triste',     label: 'Triste',      bg: 'bg-rose-100',    text: 'text-rose-700',    border: 'border-rose-300',    Icon: SmileySad     },
]

const RADAR_EJES = [
  { id: 'energia',     label: 'Energía',     color: 'text-amber-600',  bar: 'bg-amber-400'  },
  { id: 'confianza',   label: 'Confianza',   color: 'text-emerald-600',bar: 'bg-emerald-400'},
  { id: 'enfoque',     label: 'Enfoque',     color: 'text-blue-600',   bar: 'bg-blue-400'   },
  { id: 'ansiedad',    label: 'Ansiedad',    color: 'text-orange-600', bar: 'bg-orange-400' },
  { id: 'resiliencia', label: 'Resiliencia', color: 'text-violet-600', bar: 'bg-violet-400' },
]

const RESPIRACIONES = [
  {
    id: '478',
    nombre: '4-7-8 — Anti-ansiedad',
    descripcion: 'Activa el sistema parasimpático. Ideal para calmarte antes de una entrevista o después de un rechazo.',
    color: 'bg-blue-600',
    softBg: 'bg-blue-50',
    secuencia: [
      { nombre: 'inhala', ms: 4000, color: 'bg-blue-400', instruccion: 'Inhala por la nariz' },
      { nombre: 'sostén', ms: 7000, color: 'bg-violet-400', instruccion: 'Sostén la respiración' },
      { nombre: 'exhala', ms: 8000, color: 'bg-teal-400', instruccion: 'Exhala lentamente' },
    ],
  },
  {
    id: 'box',
    nombre: 'Box Breathing — Foco',
    descripcion: 'Tu usada por fuerzas especiales y atletas olímpicos. 4×4×4×4 para recuperar el control mental.',
    color: 'bg-teal-600',
    softBg: 'bg-teal-50',
    secuencia: [
      { nombre: 'inhala', ms: 4000, color: 'bg-teal-400', instruccion: 'Inhala contando hasta 4' },
      { nombre: 'sostén', ms: 4000, color: 'bg-slate-400', instruccion: 'Sostén contando hasta 4' },
      { nombre: 'exhala', ms: 4000, color: 'bg-teal-300', instruccion: 'Exhala contando hasta 4' },
      { nombre: 'pausa',  ms: 4000, color: 'bg-slate-300', instruccion: 'Pausa contando hasta 4' },
    ],
  },
  {
    id: 'cardiaca',
    nombre: 'Coherencia Cardiaca — Pre-entrevista',
    descripcion: '5 segundos de inhalación, 5 de exhalación. 6 ciclos/min. Sincroniza corazón y mente en 3 minutos.',
    color: 'bg-rose-600',
    softBg: 'bg-rose-50',
    secuencia: [
      { nombre: 'inhala', ms: 5000, color: 'bg-rose-400', instruccion: 'Inhala suavemente' },
      { nombre: 'exhala', ms: 5000, color: 'bg-rose-300', instruccion: 'Exhala completamente' },
    ],
  },
]

const LECTURAS = [
  {
    titulo: 'La regla del 5×5 para reducir la ansiedad',
    desc: 'Si el problema no te importará en 5 años, no le dediques más de 5 minutos de angustia hoy. Cambia tu perspectiva temporal.',
    tag: 'Ansiedad',
    color: 'border-l-amber-400',
  },
  {
    titulo: 'Síndrome del impostor en la búsqueda de empleo',
    desc: 'Sentir que no mereces el puesto es más común de lo que crees. No es una señal de incompetencia, es una señal de autoconciencia sana.',
    tag: 'Autoconcepto',
    color: 'border-l-violet-400',
  },
  {
    titulo: 'Cómo transformar el "no" en datos',
    desc: 'Cada rechazo es información. Analiza el proceso sin tomarlo personal. El candidato exitoso aprende de cada ciclo.',
    tag: 'Resiliencia',
    color: 'border-l-emerald-400',
  },
  {
    titulo: 'El poder de las micro-victorias diarias',
    desc: 'Celebra cada paso, no solo la oferta final. Aplicar, practicar una entrevista o actualizar tu LinkedIn cuenta.',
    tag: 'Motivación',
    color: 'border-l-blue-400',
  },
  {
    titulo: 'Burnout en la búsqueda de empleo',
    desc: 'El agotamiento es tan peligroso como la inacción. Si aplicas más de 8 horas al día sin descanso, tu calidad baja drásticamente.',
    tag: 'Energía',
    color: 'border-l-rose-400',
  },
  {
    titulo: 'Manejar la incertidumbre sin paralizarte',
    desc: 'La incertidumbre no es el enemigo. Es un estado temporal. Ancla tu identidad en tus valores, no en el status de tu candidatura.',
    tag: 'Incertidumbre',
    color: 'border-l-teal-400',
  },
  {
    titulo: 'El descanso estratégico como parte del proceso',
    desc: 'Los mejores candidatos saben cuándo parar. Un fin de semana sin LinkedIn es inversión, no pérdida de tiempo.',
    tag: 'Descanso',
    color: 'border-l-slate-400',
  },
]

const VIDEOS = [
  { titulo: 'Meditación antes de tu entrevista',   duracion: '8 min',  url: 'https://www.youtube.com/embed/inpok4MKVLM', tag: 'Pre-entrevista' },
  { titulo: 'Cómo manejar el rechazo laboral',     duracion: '10 min', url: 'https://www.youtube.com/embed/RcGyVTAoXEU', tag: 'Rechazo' },
  { titulo: 'Motivación para la búsqueda',         duracion: '6 min',  url: 'https://www.youtube.com/embed/u6XAPnuFjJc', tag: 'Motivación' },
]

// ─── Sección 1: Check-in Diario ──────────────────────────────────────────────

function CheckinDiario({ perfil, onSave }) {
  const today = new Date().toISOString().slice(0, 10)
  const checkins = perfil?.checkins || {}
  const todayCheckin = checkins[today] || null

  const [emocion, setEmocion]   = useState(todayCheckin?.emocion || '')
  const [nota, setNota]         = useState(todayCheckin?.nota    || '')
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)

  const handleSave = async () => {
    if (!emocion) return
    setSaving(true)
    const nuevos = { ...checkins, [today]: { emocion, nota, hora: new Date().toISOString() } }
    await onSave({ checkins: nuevos })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  // Últimos 7 días
  const ultimos7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    const label = i === 0 ? 'Hoy' : i === 1 ? 'Ayer' : d.toLocaleDateString('es', { weekday: 'short' })
    return { key, label, data: checkins[key] || null }
  }).reverse()

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xs font-bold text-rose-500 uppercase tracking-widest mb-1">¿Cómo te sientes hoy?</h3>
        <p className="text-xs text-slate-400 mb-4">Registra tu estado emocional. Sin juicios, solo observación.</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {EMOCIONES.map(e => {
            const Icon = e.Icon
            const sel = emocion === e.id
            return (
              <button key={e.id} onClick={() => setEmocion(e.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border-2 text-sm font-semibold transition-all cursor-pointer ${sel ? e.bg + ' ' + e.text + ' ' + e.border : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                <Icon size={16} weight={sel ? 'fill' : 'regular'} />
                {e.label}
              </button>
            )
          })}
        </div>
        <textarea
          value={nota}
          onChange={e => setNota(e.target.value)}
          placeholder="Una frase de cómo te encuentras hoy (opcional)..."
          rows={2}
          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 resize-none"
        />
        <button onClick={handleSave} disabled={!emocion || saving}
          className="mt-3 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-40 transition-colors cursor-pointer">
          {saving
            ? <><SpinnerGap size={14} className="animate-spin" /> Guardando...</>
            : saved
            ? <><CheckCircle size={14} weight="fill" /> ¡Registrado!</>
            : 'Guardar check-in'}
        </button>
      </div>

      {/* Historial 7 días */}
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Últimos 7 días</p>
        <div className="flex gap-2">
          {ultimos7.map(d => {
            const em = d.data ? EMOCIONES.find(e => e.id === d.data.emocion) : null
            const Icon = em ? em.Icon : null
            return (
              <div key={d.key} className="flex-1 flex flex-col items-center gap-1.5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 ${em ? em.bg + ' ' + em.border : 'bg-slate-100 border-slate-200'}`}>
                  {Icon ? <Icon size={18} weight="fill" className={em.text} /> : <span className="text-slate-300 text-lg">·</span>}
                </div>
                <span className="text-[10px] text-slate-400 font-medium capitalize">{d.label}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Sección 2: Respiración (con selector de técnica) ─────────────────────────

function Respiracion() {
  const [tecnica, setTecnica]  = useState(0)
  const [activa, setActiva]   = useState(false)
  const [fase, setFase]        = useState(0)
  const [seg, setSeg]          = useState(0)
  const t = RESPIRACIONES[tecnica]

  useEffect(() => {
    if (!activa) { setFase(0); setSeg(0); return }
    const duracion = t.secuencia[fase].ms
    const tick = setInterval(() => {
      setSeg(s => {
        if (s + 100 >= duracion) {
          setFase(f => (f + 1) % t.secuencia.length)
          return 0
        }
        return s + 100
      })
    }, 100)
    return () => clearInterval(tick)
  }, [activa, fase, t])

  const fasActual = t.secuencia[fase]
  const progreso = seg / fasActual.ms

  return (
    <div className="space-y-5">
      {/* Selector de técnica */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {RESPIRACIONES.map((r, i) => (
          <button key={r.id} onClick={() => { setTecnica(i); setActiva(false) }}
            className={`text-left p-4 rounded-2xl border-2 transition-all cursor-pointer ${tecnica === i ? r.softBg + ' border-rose-200' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
            <p className="text-xs font-black text-slate-800 leading-snug mb-1">{r.nombre}</p>
            <p className="text-[11px] text-slate-500 leading-snug">{r.descripcion}</p>
          </button>
        ))}
      </div>

      {/* Visualizador */}
      <div className={`rounded-3xl p-8 text-center ${t.softBg} border border-rose-100`}>
        <div className="relative w-32 h-32 mx-auto mb-6">
          {/* Anillo de progreso */}
          <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
            <circle cx="64" cy="64" r="54" strokeWidth="8" stroke="rgba(0,0,0,0.05)" fill="none"/>
            <circle cx="64" cy="64" r="54" strokeWidth="8"
              stroke={activa ? '#fb7185' : 'transparent'}
              strokeLinecap="round" fill="none"
              strokeDasharray={`${2 * Math.PI * 54}`}
              strokeDashoffset={`${2 * Math.PI * 54 * (1 - progreso)}`}
              style={{ transition: 'stroke-dashoffset 0.1s linear' }}/>
          </svg>
          {/* Bola pulsante */}
          <div className={`absolute inset-3 rounded-full flex flex-col items-center justify-center transition-all duration-1000
            ${activa ? fasActual.color : 'bg-white border-2 border-slate-200'}`}
            style={{ transform: activa ? (fasActual.nombre === 'inhala' ? 'scale(1.08)' : fasActual.nombre === 'exhala' ? 'scale(0.92)' : 'scale(1)') : 'scale(1)' }}>
            <span className={`text-xs font-black uppercase tracking-widest ${activa ? 'text-white' : 'text-slate-400'}`}>
              {activa ? fasActual.nombre : '●'}
            </span>
          </div>
        </div>

        <p className="text-sm font-semibold text-slate-600 mb-2 h-5">
          {activa ? fasActual.instruccion : 'Respira tranquilo, listo cuando quieras'}
        </p>

        <button onClick={() => setActiva(!activa)}
          className={`px-8 py-3 rounded-xl font-bold text-sm transition-colors cursor-pointer mt-2 ${activa ? 'bg-white border-2 border-rose-200 text-rose-600 hover:bg-rose-50' : 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm'}`}>
          {activa ? 'Detener' : `Comenzar ${t.nombre.split(' —')[0]}`}
        </button>
      </div>
    </div>
  )
}

// ─── Sección 3: Radar de Bienestar ───────────────────────────────────────────

function RadarBienestar({ perfil, onSave }) {
  const week = `semana_${getWeekId()}`
  const radar = perfil?.radar?.[week] || {}
  const [vals, setVals] = useState(radar)
  const [saved, setSaved] = useState(false)

  function getWeekId() {
    const d = new Date(); const jan1 = new Date(d.getFullYear(), 0, 1)
    return Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7) + '_' + d.getFullYear()
  }

  const handleSave = async () => {
    const nuevo = { ...(perfil?.radar || {}), [week]: vals }
    await onSave({ radar: nuevo })
    setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  const avg = RADAR_EJES.reduce((s, e) => s + (vals[e.id] || 0), 0) / RADAR_EJES.length

  return (
    <div className="space-y-5">
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Esta semana</p>
            <p className="text-lg font-black text-slate-800">¿Cómo estás en cada área?</p>
          </div>
          {avg > 0 && (
            <div className="text-right">
              <p className="text-3xl font-black text-rose-500">{avg.toFixed(1)}</p>
              <p className="text-[10px] text-slate-400">/ 5 promedio</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {RADAR_EJES.map(eje => (
            <div key={eje.id}>
              <div className="flex items-center justify-between mb-1.5">
                <span className={`text-sm font-bold ${eje.color}`}>{eje.label}</span>
                <span className="text-xs text-slate-500 font-semibold">{vals[eje.id] || 0}/5</span>
              </div>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} onClick={() => setVals({ ...vals, [eje.id]: n })}
                    className={`h-8 flex-1 rounded-lg font-bold text-xs border-2 transition-all cursor-pointer ${(vals[eje.id] || 0) >= n ? eje.bar + ' text-white border-transparent' : 'border-slate-200 text-slate-400 hover:border-slate-300'}`}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button onClick={handleSave} disabled={Object.keys(vals).length === 0}
          className="mt-5 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-bold hover:bg-rose-700 disabled:opacity-40 transition-colors cursor-pointer">
          {saved ? <><CheckCircle size={14} weight="fill" /> Guardado</> : 'Guardar evaluación semanal'}
        </button>
      </div>

      <p className="text-xs text-slate-400 text-center">
        La evaluación se reinicia cada semana. Monitorear estas métricas te ayuda a gestionar tu energía a lo largo del proceso.
      </p>
    </div>
  )
}

// ─── Sección 4: Lecturas ─────────────────────────────────────────────────────

function LecturasApoyo() {
  const [expanded, setExpanded] = useState(null)
  return (
    <div className="space-y-2.5">
      {LECTURAS.map((l, i) => (
        <div key={i}
          className={`border-l-4 ${l.color} bg-white border border-slate-200 rounded-r-2xl p-4 cursor-pointer hover:shadow-sm transition-all`}
          onClick={() => setExpanded(expanded === i ? null : i)}>
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-800 text-sm">{l.titulo}</h4>
            <div className="flex items-center gap-2 shrink-0 ml-3">
              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 rounded-full px-2 py-0.5">{l.tag}</span>
              <ArrowRight size={13} className={`text-slate-400 transition-transform ${expanded === i ? 'rotate-90' : ''}`} />
            </div>
          </div>
          {expanded === i && (
            <p className="text-sm text-slate-500 leading-relaxed mt-2">{l.desc}</p>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Sección 5: Videos ───────────────────────────────────────────────────────

function Videos() {
  const [activo, setActivo] = useState(null)
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {VIDEOS.map((v, i) => (
        <div key={i}>
          <span className="inline-flex mb-2 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 bg-rose-100 text-rose-600 rounded-full border border-rose-200">
            {v.tag}
          </span>
          {activo === i ? (
            <div className="rounded-2xl overflow-hidden aspect-video shadow-md">
              <iframe width="100%" height="100%" src={v.url + '?autoplay=1'} title={v.titulo}
                allow="autoplay; encrypted-media" allowFullScreen className="w-full h-full" />
            </div>
          ) : (
            <div onClick={() => setActivo(i)}
              className="aspect-video rounded-2xl bg-rose-50 border-2 border-rose-100 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-rose-300 hover:bg-rose-100/50 transition-colors group">
              <div className="w-14 h-14 rounded-full bg-rose-100 flex items-center justify-center group-hover:scale-105 transition-transform border-2 border-rose-200">
                <Play size={22} weight="fill" className="text-rose-500 ml-1" />
              </div>
              <div className="text-center px-3">
                <p className="text-sm font-bold text-slate-700 leading-snug">{v.titulo}</p>
                <p className="text-xs text-slate-400 mt-0.5">{v.duracion}</p>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Tab nav ─────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'checkin',    label: 'Check-in',     Icon: Smiley    },
  { id: 'respiracion',label: 'Respiración',  Icon: Wind      },
  { id: 'radar',      label: 'Radar',        Icon: ChartBar  },
  { id: 'lecturas',   label: 'Lecturas',     Icon: BookOpen  },
  // videos ocultos temporalmente
]

// ─── Componente Principal ────────────────────────────────────────────────────

export default function Bienestar() {
  const { user, featuresDesbloqueadas, loading } = useAuth()
  const [tab, setTab]     = useState('checkin')
  const [perfil, setPerfil] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) return
    supabase.from('profiles').select('bienestar_data').eq('id', user.id).single()
      .then(res => { if (res.data?.bienestar_data) setPerfil(res.data.bienestar_data) })
  }, [user])

  const savePerfil = async (patch) => {
    const nuevo = { ...perfil, ...patch }
    setPerfil(nuevo)
    setSaving(true)
    await supabase.from('profiles').update({ bienestar_data: nuevo }).eq('id', user.id)
    setSaving(false)
  }

  if (loading) return null

  if (!featuresDesbloqueadas) {
    return (
      <FeatureLocked
        titulo="Ecosistema de Bienestar"
        descripcion="Herramientas de salud mental, control de ansiedad y meditación guiada diseñadas específicamente para candidatos en transición."
        icono={<Heart size={44} weight="light" />}
      />
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* Hero */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 md:px-10 py-10">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-400 to-pink-600 flex items-center justify-center shadow-md shrink-0">
              <Heart size={24} weight="fill" className="text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-rose-500 uppercase tracking-widest">Tu proyecto laboral</span>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">Nuevo</span>
              </div>
              <h1 className="text-3xl font-black text-slate-900 leading-tight mb-3">
                Bienestar Emocional
              </h1>
              <p className="text-slate-500 text-base leading-relaxed max-w-2xl">
                La búsqueda de empleo es una maratón, no un sprint. Gestionar tu energía emocional 
                es tan importante como actualizar tu CV. Aquí tienes herramientas prácticas para mantenerte 
                <span className="font-semibold text-slate-700"> estable, enfocado y resiliente</span> durante todo el proceso.
              </p>

              {/* Stat chips */}
              <div className="flex flex-wrap gap-2 mt-5">
                {[
                  { v: '3 técnicas', l: 'de respiración guiada' },
                  { v: '7 lecturas', l: 'de apoyo emocional' },
                  { v: 'Radar diario', l: 'de bienestar' },
                ].map(s => (
                  <div key={s.l} className="flex items-baseline gap-1.5 bg-rose-50 border border-rose-100 rounded-xl px-3 py-1.5">
                    <span className="text-sm font-black text-rose-600">{s.v}</span>
                    <span className="text-xs text-rose-400">{s.l}</span>
                  </div>
                ))}
              </div>

              {/* Tip destacado — en el hero */}
              <div className="mt-5 p-4 rounded-2xl bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200 flex gap-3">
                <Lightbulb size={18} weight="fill" className="text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-slate-700 mb-0.5">Recuerda: tu bienestar no es un lujo</p>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Los candidatos que cuidan su salud mental toman mejores decisiones,
                    proyectan más confianza y encuentran roles más alineados con lo que realmente quieren.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-4xl mx-auto px-4 md:px-10 mt-8">

        {/* Tab nav */}
        <div className="flex gap-2 flex-wrap mb-6">
          {TABS.map(t => {
            const isAct = tab === t.id
            const Icon = t.Icon
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border-2 transition-all cursor-pointer ${isAct ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-slate-600 border-slate-200 hover:border-rose-300 hover:text-rose-600'}`}>
                <Icon size={16} weight={isAct ? 'fill' : 'regular'} />
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            )
          })}
        </div>

        {/* Content card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100 bg-rose-50">
            {(() => {
              const t = TABS.find(t => t.id === tab)
              const Icon = t.Icon
              return <Icon size={20} weight="duotone" className="text-rose-500" />
            })()}
            <div>
              <h2 className="font-black text-slate-800 text-base flex items-center gap-2">
                {TABS.find(t => t.id === tab)?.label}
                <HelpBadge id={`bienestar.${tab}`} />
              </h2>
              <p className="text-xs text-slate-500">
                {tab === 'checkin'    && 'Registra cómo te sientes hoy y observa tu progreso emocional'}
                {tab === 'respiracion'&& 'Tres técnicas clínicas para regular tu sistema nervioso'}
                {tab === 'radar'      && 'Evalúa tus 5 dimensiones de bienestar esta semana'}
                {tab === 'lecturas'   && 'Perspectivas que cambian la mentalidad durante la búsqueda'}
                {tab === 'videos'     && 'Guías audiovisuales de meditación, resiliencia y motivación'}
              </p>
            </div>
          </div>

          <div className="p-6 md:p-8">
            {tab === 'checkin'    && <CheckinDiario  perfil={perfil}  onSave={savePerfil} />}
            {tab === 'respiracion'&& <Respiracion />}
            {tab === 'radar'      && <RadarBienestar perfil={perfil}  onSave={savePerfil} />}
            {tab === 'lecturas'   && <LecturasApoyo />}
            {tab === 'videos'     && <Videos />}
          </div>
        </div>

      </div>
    </div>
  )
}
