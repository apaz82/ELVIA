// ProyectoLaboral.jsx  — Gerente de Proyecto de tu Búsqueda Laboral
// Design: Plus Jakarta Sans · SaaS Professional · Light mode
import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../services/authService'
import {
  Brain, CalendarCheck, Toolbox, FileText,
  Heart, CheckSquare, Square,
  ArrowRight, Trophy, Play, Robot,
  LinkedinLogo, FileMagnifyingGlass, MagnifyingGlass,
  Notepad, PlusMinus, Trash, Target, SpinnerGap,
  CheckCircle, ChartLine, Briefcase
} from '@phosphor-icons/react'

/* ─── Design tokens (Plus Jakarta Sans via Google Fonts) ─── */
const FONT_LINK = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap'
if (!document.getElementById('pjs-font')) {
  const link = document.createElement('link')
  link.id   = 'pjs-font'
  link.rel  = 'stylesheet'
  link.href = FONT_LINK
  document.head.appendChild(link)
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const PILARES = [
  { id: 'autoconocimiento', label: 'Autoconocimiento',    icon: Brain,         color: 'violet', weight: 35 },
  { id: 'recursos',         label: 'Recursos',            icon: Toolbox,       color: 'blue',   weight: 10 },
  { id: 'semana',           label: 'Semana Laboral',      icon: CalendarCheck, color: 'teal',   weight: 25 },
  { id: 'documentos',       label: 'Documentos',          icon: FileText,      color: 'amber',  weight: 30 },
]

const COLORES = {
  violet: {
    pill:   'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100',
    active: 'bg-violet-600 text-white border-violet-600',
    header: 'bg-violet-50 border-violet-100',
    icon:   'text-violet-600',
    bar:    'bg-violet-500',
    soft:   'bg-violet-50',
    badge:  'bg-violet-100 text-violet-700',
    ring:   'ring-violet-200',
  },
  blue: {
    pill:   'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
    active: 'bg-blue-600 text-white border-blue-600',
    header: 'bg-blue-50 border-blue-100',
    icon:   'text-blue-600',
    bar:    'bg-blue-500',
    soft:   'bg-blue-50',
    badge:  'bg-blue-100 text-blue-700',
    ring:   'ring-blue-200',
  },
  teal: {
    pill:   'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100',
    active: 'bg-teal-600 text-white border-teal-600',
    header: 'bg-teal-50 border-teal-100',
    icon:   'text-teal-600',
    bar:    'bg-teal-500',
    soft:   'bg-teal-50',
    badge:  'bg-teal-100 text-teal-700',
    ring:   'ring-teal-200',
  },
  amber: {
    pill:   'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
    active: 'bg-amber-500 text-white border-amber-500',
    header: 'bg-amber-50 border-amber-100',
    icon:   'text-amber-600',
    bar:    'bg-amber-500',
    soft:   'bg-amber-50',
    badge:  'bg-amber-100 text-amber-700',
    ring:   'ring-amber-200',
  },
  rose: {
    pill:   'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100',
    active: 'bg-rose-600 text-white border-rose-600',
    header: 'bg-rose-50 border-rose-100',
    icon:   'text-rose-600',
    bar:    'bg-rose-500',
    soft:   'bg-rose-50',
    badge:  'bg-rose-100 text-rose-700',
    ring:   'ring-rose-200',
  },
}

const DIAS     = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const HORARIOS = ['7am-9am','9am-11am','11am-1pm','1pm-3pm','3pm-5pm','5pm-7pm','7pm-9pm']

const RECURSOS_DEFAULT = [
  { id:'1', nombre:'Espacio de trabajo tranquilo',  descripcion:'Un lugar donde puedas concentrarte sin interrupciones.', costo:0,   tengo:true  },
  { id:'2', nombre:'Conexión a internet estable',   descripcion:'Necesaria para aplicar, videollamadas y LinkedIn.',      costo:350, tengo:true  },
  { id:'3', nombre:'Celular activo',                descripcion:'Para recibir llamadas de reclutadores.',                 costo:0,   tengo:true  },
  { id:'4', nombre:'LinkedIn (perfil al día)',      descripcion:'La red #1 para ser encontrado por reclutadores.',        costo:0,   tengo:false },
  { id:'5', nombre:'OPTIMA-CV Pro',                 descripcion:'CV optimizado, análisis de vacantes y entrevistas.',     costo:299, tengo:false },
  { id:'6', nombre:'Transporte a entrevistas',      descripcion:'Transporte público o privado + estacionamiento.',        costo:200, tengo:true  },
  { id:'7', nombre:'Ropa de presentación',          descripcion:'Outfit adecuado para entrevistas presenciales.',         costo:0,   tengo:true  },
  { id:'8', nombre:'Café / Coworking',              descripcion:'Si prefieres salir de casa para más productividad.',    costo:0,   tengo:false },
]

const DOCS_LIST = [
  { id:'cv',          label:'CV optimizado con OPTIMA',            link:'/cv-optimizer',   Icon:FileMagnifyingGlass },
  { id:'linkedin',    label:'LinkedIn actualizado y auditado',      link:'/linkedin-optima', Icon:LinkedinLogo       },
  { id:'cv_vacante',  label:'CV adaptado a una vacante objetivo',  link:'/cv-vs-job',      Icon:MagnifyingGlass    },
  { id:'entrevista',  label:'Práctica de entrevista realizada',    link:'/entrevista',     Icon:Robot              },
  { id:'carta',       label:'Carta de presentación lista',         link:null,              Icon:Notepad            },
  { id:'referencias', label:'Referencias profesionales confirmadas',link:null,              Icon:CheckCircle        },
]

// ─── Cálculo de progreso ─────────────────────────────────────────────────────

function calcularProgreso(data) {
  let total = 0
  const auto = (data && data.autoconocimiento) ? data.autoconocimiento : {}
  let autoPts = 0
  if (String(auto.cargo_objetivo||'').trim().length>2) autoPts+=10
  if (Array.isArray(auto.areas)&&auto.areas.length>=2) autoPts+=8
  if (Array.isArray(auto.industrias)&&auto.industrias.length>=1) autoPts+=7
  if (Array.isArray(auto.top5empresas)&&auto.top5empresas.filter(function(e){return e&&String(e).trim()}).length>=3) autoPts+=5
  if (Array.isArray(auto.modalidad)&&auto.modalidad.length>=1) autoPts+=5
  total += Math.min(autoPts, 35)

  const checks = (data&&data.documentos&&data.documentos.checks) ? data.documentos.checks : {}
  total += Math.round((DOCS_LIST.filter(function(d){return checks[d.id]}).length / DOCS_LIST.length)*30)

  const bloques = (data&&data.semana&&data.semana.bloques) ? data.semana.bloques : {}
  const bN = Object.values(bloques).filter(Boolean).length
  if (bN>=8) total+=20; else if (bN>=5) total+=14; else if (bN>=2) total+=8; else if (bN>=1) total+=4

  const rec = (data&&data.recursos&&data.recursos.recursos) ? data.recursos.recursos : RECURSOS_DEFAULT
  const cN = rec.filter(function(r){return Number(r.costo)>0||r.tengo!==undefined}).length
  if (cN>=5) total+=10; else if (cN>=3) total+=6; else if (cN>=1) total+=3

  return Math.min(total, 100)
}

function calcularPorPilar(data) {
  const auto = (data&&data.autoconocimiento) ? data.autoconocimiento : {}
  let autoPts = 0
  if (String(auto.cargo_objetivo||'').trim().length>2) autoPts+=10
  if (Array.isArray(auto.areas)&&auto.areas.length>=2) autoPts+=8
  if (Array.isArray(auto.industrias)&&auto.industrias.length>=1) autoPts+=7
  if (Array.isArray(auto.top5empresas)&&auto.top5empresas.filter(function(e){return e&&String(e).trim()}).length>=3) autoPts+=5
  if (Array.isArray(auto.modalidad)&&auto.modalidad.length>=1) autoPts+=5

  const checks = (data&&data.documentos&&data.documentos.checks) ? data.documentos.checks : {}
  const docsDone = DOCS_LIST.filter(function(d){return checks[d.id]}).length

  const bloques = (data&&data.semana&&data.semana.bloques) ? data.semana.bloques : {}
  const bN = Object.values(bloques).filter(Boolean).length
  let semanaPts = 0
  if (bN>=8) semanaPts=20; else if (bN>=5) semanaPts=14; else if (bN>=2) semanaPts=8; else if (bN>=1) semanaPts=4

  const rec = (data&&data.recursos&&data.recursos.recursos) ? data.recursos.recursos : RECURSOS_DEFAULT
  const cN = rec.filter(function(r){return Number(r.costo)>0||r.tengo!==undefined}).length
  let recPts = 0
  if (cN>=5) recPts=10; else if (cN>=3) recPts=6; else if (cN>=1) recPts=3

  return {
    autoconocimiento: Math.round((Math.min(autoPts,35)/35)*100),
    documentos:       Math.round((docsDone/DOCS_LIST.length)*100),
    semana:           Math.round((semanaPts/20)*100),
    recursos:         Math.round((recPts/10)*100),
    bienestar:        0,
  }
}

// ─── Dashboard de resumen ────────────────────────────────────────────────────

function DashboardResumen({ data, pct, onSelect }) {
  const porPilar = calcularPorPilar(data)
  const auto = (data&&data.autoconocimiento) ? data.autoconocimiento : {}
  const checks = (data&&data.documentos&&data.documentos.checks) ? data.documentos.checks : {}
  const docsDone = DOCS_LIST.filter(function(d){return checks[d.id]}).length
  const bloques = (data&&data.semana&&data.semana.bloques) ? data.semana.bloques : {}
  const horas = Object.values(bloques).filter(Boolean).length * 2
  const rec = (data&&data.recursos&&data.recursos.recursos) ? data.recursos.recursos : RECURSOS_DEFAULT
  const costoTotal = rec.reduce(function(s,r){return s+(Number(r.costo)||0)},0)

  const statusLabel = pct===100 ? 'Completo' : pct>=70 ? 'Avanzado' : pct>=40 ? 'En progreso' : pct>0 ? 'Iniciado' : 'Sin inicio'
  const statusColor = pct>=70 ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : pct>=40 ? 'text-amber-600 bg-amber-50 border-amber-200' : 'text-violet-600 bg-violet-50 border-violet-200'

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
      {/* Header strip */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
            <ChartLine size={16} weight="duotone" className="text-violet-600" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Mi Proyecto Laboral</p>
            <p className="text-sm font-bold text-slate-800 leading-tight mt-0.5">Resumen de avance</p>
          </div>
        </div>
        <span className={'text-[11px] font-bold px-3 py-1 rounded-full border ' + statusColor}>{statusLabel}</span>
      </div>

      {/* Progress arc + big number */}
      <div className="px-6 py-5 flex items-center gap-6 border-b border-slate-100">
        {/* Circle */}
        <div className="relative w-20 h-20 shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="31" strokeWidth="8" stroke="#f1f5f9" fill="none"/>
            <circle cx="40" cy="40" r="31" strokeWidth="8"
              stroke={pct>=70?'#10b981':pct>=40?'#f59e0b':'#7c3aed'}
              strokeLinecap="round" fill="none"
              strokeDasharray={`${2*Math.PI*31}`}
              strokeDashoffset={`${2*Math.PI*31*(1-pct/100)}`}
              style={{transition:'stroke-dashoffset 0.7s ease'}}/>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-black text-slate-800">{pct}%</span>
          </div>
        </div>

        {/* Stats grid */}
        <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Horas/sem', value: horas>0?horas+'h':'—', icon:CalendarCheck, color:'text-teal-600' },
            { label: 'Docs listos', value: docsDone+'/'+DOCS_LIST.length, icon:FileText, color:'text-amber-600' },
            { label: 'Costo mes', value: costoTotal>0?'$'+costoTotal.toLocaleString():'—', icon:Briefcase, color:'text-blue-600' },
            { label: 'Cargo obj.', value: String(auto.cargo_objetivo||'').trim()||'—', icon:Target, color:'text-violet-600', small:true },
          ].map(function(s) {
            const Icon = s.icon
            return (
              <div key={s.label} className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5">
                  <Icon size={13} weight="duotone" className={s.color} />
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{s.label}</span>
                </div>
                <p className={'font-black text-slate-800 leading-tight ' + (s.small?'text-sm truncate':'text-base')}>{s.value}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* 5 Pilares pills */}
      <div className="px-6 py-4">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">5 Pilares del proyecto</p>
        <div className="grid grid-cols-5 gap-2">
          {PILARES.map(function(p) {
            const pp = porPilar[p.id] || 0
            const c  = COLORES[p.color]
            const Icon = p.icon
            return (
              <button key={p.id} onClick={function(){onSelect(p.id)}}
                title={p.label}
                className={'group flex flex-col items-center gap-2 p-3 rounded-xl border transition-all cursor-pointer hover:shadow-md ' + c.soft + ' border-transparent hover:border-current hover:'+c.ring}>
                <div className={'w-9 h-9 rounded-xl flex items-center justify-center ' + c.badge}>
                  <Icon size={18} weight="duotone" className={c.icon} />
                </div>
                {/* mini bar */}
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div className={'h-full rounded-full transition-all duration-500 ' + c.bar} style={{width:pp+'%'}} />
                </div>
                <span className="text-[10px] font-bold text-slate-500 text-center leading-tight hidden sm:block">{p.label.split(' ')[0]}</span>
                <span className={'text-[10px] font-black ' + c.icon}>{pp}%</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Pilar 1: Autoconocimiento ───────────────────────────────────────────────

function PilarAutoconocimiento({ data, onChange }) {
  const d = data || {}
  const up = function(key, val) { onChange(Object.assign({}, d, {[key]:val})) }
  const AREAS = ['Técnico / Programación','Gestión de Proyectos','Herramientas Tech','Soft Skills / Liderazgo','Ventas / Comercial','Finanzas','Diseño / Creatividad','Datos / Analytics']
  const INDUSTRIAS = ['Tecnología','Finanzas / Banca','Salud','Retail / FMCG','Manufactura','Consultoría','Educación','Gobierno','Startups','Energía']
  const MOVILIDAD = ['Presencial','Remoto','Híbrido']
  const toggle = function(key,val){
    const list = Array.isArray(d[key])?d[key]:[]
    up(key,list.includes(val)?list.filter(function(x){return x!==val}):list.concat([val]))
  }
  const updateE = function(i,val){
    const arr = Array.isArray(d.top5empresas)?d.top5empresas.slice():['','','','','']
    arr[i]=val; up('top5empresas',arr)
  }
  return (
    <div className="space-y-8">
      <div>
        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Cargo objetivo</label>
        <input value={d.cargo_objetivo||''} onChange={function(e){up('cargo_objetivo',e.target.value)}}
          placeholder="Ej: Product Manager Senior, Gerente de Finanzas..."
          className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/40 focus:border-violet-400"/>
      </div>
      <div className="p-6 rounded-2xl bg-violet-50 border border-violet-100">
        <h3 className="font-bold text-slate-800 mb-1 flex items-center gap-2"><Brain size={16} className="text-violet-600" weight="duotone"/>¿En qué eres genuinamente bueno?</h3>
        <p className="text-xs text-slate-500 mb-4">Selecciona áreas donde tienes experiencia real y resultados comprobables.</p>
        <div className="flex flex-wrap gap-2">
          {AREAS.map(function(a){
            const sel = Array.isArray(d.areas)&&d.areas.includes(a)
            return <button key={a} onClick={function(){toggle('areas',a)}}
              className={'px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors cursor-pointer '+(sel?'bg-violet-600 text-white border-violet-600':'border-slate-300 text-slate-600 hover:border-violet-400 hover:text-violet-700')}>{a}</button>
          })}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {key:'puede_mejorar',label:'Puede mejorar',border:'border-blue-200 bg-blue-50',ph:'Ej: inglés escrito...'},
          {key:'no_le_gusta',  label:'Prefiere evitar',border:'border-amber-200 bg-amber-50',ph:'Ej: atención al cliente...'},
          {key:'no_es_bueno',  label:'No haría',border:'border-red-200 bg-red-50',ph:'Ej: programación backend...'},
        ].map(function(it){return(
          <div key={it.key} className={'p-4 rounded-xl border '+it.border}>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">{it.label}</label>
            <textarea value={d[it.key]||''} onChange={function(e){up(it.key,e.target.value)}}
              placeholder={it.ph} rows={3}
              className="w-full bg-white/70 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-violet-300 resize-none"/>
          </div>
        )})}
      </div>
      <div>
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Industrias con más potencial</h3>
        <div className="flex flex-wrap gap-2">
          {INDUSTRIAS.map(function(ind){
            const sel=Array.isArray(d.industrias)&&d.industrias.includes(ind)
            return <button key={ind} onClick={function(){toggle('industrias',ind)}}
              className={'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer '+(sel?'bg-teal-600 text-white border-teal-600':'border-slate-300 text-slate-600 hover:border-teal-400')}>{ind}</button>
          })}
        </div>
      </div>
      <div>
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Top 5 Compañías objetivo</h3>
        <p className="text-xs text-slate-400 mb-4">Estas empresas aparecerán primero en tu radar de Vacantes.</p>
        <div className="space-y-2">
          {[0,1,2,3,4].map(function(i){return(
            <div key={i} className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 text-xs font-black flex items-center justify-center shrink-0 border border-amber-200">{i+1}</span>
              <input value={(Array.isArray(d.top5empresas)?d.top5empresas:[])[i]||''} onChange={function(e){updateE(i,e.target.value)}}
                placeholder={'Empresa #'+(i+1)+' (ej: Google, Banorte...)'}
                className="flex-1 border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300/50 focus:border-amber-400"/>
            </div>
          )})}
        </div>
      </div>
      <div>
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Modalidad preferida</h3>
        <div className="flex flex-wrap gap-3 mb-3">
          {MOVILIDAD.map(function(m){
            const sel=Array.isArray(d.modalidad)&&d.modalidad.includes(m)
            return <button key={m} onClick={function(){toggle('modalidad',m)}}
              className={'px-4 py-2 rounded-xl text-sm font-semibold border transition-colors cursor-pointer '+(sel?'bg-blue-600 text-white border-blue-600':'border-slate-300 text-slate-600 hover:border-blue-400')}>{m}</button>
          })}
        </div>
        <input value={d.ciudad_objetivo||''} onChange={function(e){up('ciudad_objetivo',e.target.value)}}
          placeholder="Ciudad / País objetivo (ej: Ciudad de México, remoto LATAM...)"
          className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300/50 focus:border-blue-400"/>
      </div>
    </div>
  )
}

// ─── Pilar 2: Recursos ───────────────────────────────────────────────────────

function PilarRecursos({ data, onChange }) {
  const recursos = (data&&data.recursos)?data.recursos:RECURSOS_DEFAULT
  const upR = function(id,f,v){onChange({recursos:recursos.map(function(r){return r.id===id?Object.assign({},r,{[f]:v}):r})})}
  const addR = function(){onChange({recursos:recursos.concat([{id:String(Date.now()),nombre:'',descripcion:'',costo:0,tengo:false}])})}
  const delR = function(id){onChange({recursos:recursos.filter(function(r){return r.id!==id})})}
  const totalAll = recursos.reduce(function(s,r){return s+(Number(r.costo)||0)},0)
  const totalFalta = recursos.filter(function(r){return!r.tengo}).reduce(function(s,r){return s+(Number(r.costo)||0)},0)
  return (
    <div className="space-y-6">
      <div className="p-5 rounded-2xl bg-blue-50 border border-blue-100">
        <p className="text-sm text-slate-700 leading-relaxed">
          <span className="text-blue-700 font-bold">¿Cuánto cuesta tu búsqueda laboral?</span>{' '}
          Identifica lo que ya tienes y lo que aún necesitas. Todos los costos son <strong>mensuales en MXN</strong>.
        </p>
      </div>
      <div className="space-y-2.5">
        {recursos.map(function(r){return(
          <div key={r.id} className={'border rounded-2xl p-4 transition-all '+(r.tengo?'bg-green-50 border-green-200':'bg-white border-slate-200')}>
            <div className="flex items-center gap-4">
              <button onClick={function(){upR(r.id,'tengo',!r.tengo)}} className={'w-10 h-5.5 rounded-full relative shrink-0 transition-colors cursor-pointer '+(r.tengo?'bg-green-500':'bg-slate-300')} style={{height:22}}>
                <span className={'absolute top-[3px] w-4 h-4 bg-white rounded-full shadow transition-all '+(r.tengo?'right-[3px]':'left-[3px]')}/>
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <input value={r.nombre} onChange={function(e){upR(r.id,'nombre',e.target.value)}}
                      placeholder="Nombre del recurso"
                      className="font-semibold text-sm text-slate-800 bg-transparent focus:outline-none border-b border-transparent focus:border-slate-300 w-full"/>
                    <input value={r.descripcion||''} onChange={function(e){upR(r.id,'descripcion',e.target.value)}}
                      placeholder="Describe para qué lo necesitas..."
                      className="text-xs text-slate-500 bg-transparent focus:outline-none border-b border-transparent focus:border-slate-200 w-full mt-0.5"/>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1 bg-slate-100 rounded-lg px-2.5 py-1.5">
                      <span className="text-xs text-slate-500">$</span>
                      <input type="number" value={r.costo} onChange={function(e){upR(r.id,'costo',e.target.value)}}
                        className="w-14 text-xs text-slate-700 font-bold bg-transparent focus:outline-none text-right"/>
                      <span className="text-xs text-slate-400">MXN</span>
                    </div>
                    <button onClick={function(){delR(r.id)}} className="text-slate-300 hover:text-red-400 transition-colors p-1 cursor-pointer">
                      <Trash size={14}/>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )})}
      </div>
      <button onClick={addR} className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 border border-dashed border-blue-300 rounded-xl px-4 py-3 hover:border-blue-400 transition-colors w-full justify-center cursor-pointer">
        <PlusMinus size={16}/> Agregar recurso
      </button>
      <div className="grid grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">Total mensual</p>
          <p className="text-2xl font-black text-slate-800">${totalAll.toLocaleString()} <span className="text-sm text-slate-400 font-normal">MXN</span></p>
        </div>
        <div className="p-5 rounded-2xl bg-blue-50 border border-blue-200">
          <p className="text-xs text-blue-600 font-bold uppercase tracking-widest mb-1">Aún necesito</p>
          <p className="text-2xl font-black text-blue-700">${totalFalta.toLocaleString()} <span className="text-sm text-blue-400 font-normal">MXN</span></p>
        </div>
      </div>
    </div>
  )
}

// ─── Pilar 3: Semana Laboral ─────────────────────────────────────────────────

function PilarSemana({ data, onChange }) {
  const d = data||{}
  const dias = Array.isArray(d.dias)?d.dias:[]
  const bloques = d.bloques||{}
  const toggleDia = function(dia){ onChange(Object.assign({},d,{dias:dias.includes(dia)?dias.filter(function(x){return x!==dia}):dias.concat([dia])})) }
  const toggleB = function(dia,h){ const k=dia+'_'+h; onChange(Object.assign({},d,{bloques:Object.assign({},bloques,{[k]:!bloques[k]})})) }
  const totalH = Object.values(bloques).filter(Boolean).length*2
  const bench = totalH>=15?'green':totalH>=8?'amber':'red'
  return (
    <div className="space-y-8">
      <div className="p-5 rounded-2xl bg-teal-50 border border-teal-100">
        <p className="text-sm text-slate-700 leading-relaxed">
          <span className="text-teal-700 font-bold">Trátalo como un trabajo de medio tiempo.</span>{' '}
          Los candidatos exitosos dedican consistentemente <strong>15+ horas/semana</strong> a su búsqueda.
        </p>
      </div>
      <div>
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Días activos de búsqueda</h3>
        <div className="flex flex-wrap gap-2">
          {DIAS.map(function(d){ const sel=dias.includes(d); return (
            <button key={d} onClick={function(){toggleDia(d)}} className={'w-14 h-14 rounded-2xl font-bold text-sm transition-all border-2 cursor-pointer '+(sel?'bg-teal-600 text-white border-teal-600 shadow-sm':'border-slate-200 text-slate-500 hover:border-teal-400')}>{d}</button>
          )})}
        </div>
      </div>
      {dias.length>0&&(
        <div className="overflow-x-auto">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Bloques de 2 horas por día</h3>
          <table className="min-w-[480px]">
            <thead><tr>
              <th className="text-left text-[10px] text-slate-400 pb-2 pr-4 font-semibold">Horario</th>
              {dias.map(function(d){return <th key={d} className="text-center text-xs text-slate-600 pb-2 px-2 font-bold">{d}</th>})}
            </tr></thead>
            <tbody>
              {HORARIOS.map(function(h){return(
                <tr key={h}>
                  <td className="text-xs text-slate-500 pr-4 py-1.5 whitespace-nowrap">{h}</td>
                  {dias.map(function(d){ const k=d+'_'+h; const act=bloques[k]; return(
                    <td key={d} className="px-2 py-1.5 text-center">
                      <button onClick={function(){toggleB(d,h)}} className={'w-8 h-8 rounded-lg mx-auto block transition-all border-2 cursor-pointer '+(act?'bg-teal-500 border-teal-500':'border-slate-200 hover:border-teal-400')}>
                        {act&&<CheckCircle size={16} weight="fill" className="text-white mx-auto"/>}
                      </button>
                    </td>
                  )})}
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      )}
      {totalH>0&&(
        <div className={'p-5 rounded-2xl border-2 flex items-center justify-between '+(bench==='green'?'bg-teal-50 border-teal-200':bench==='amber'?'bg-amber-50 border-amber-200':'bg-red-50 border-red-200')}>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Horas por semana</p>
            <p className={'text-sm font-semibold mt-0.5 '+(bench==='green'?'text-teal-700':bench==='amber'?'text-amber-700':'text-red-600')}>
              {bench==='green'?'Excelente — en la zona de éxito':bench==='amber'?'Bien, agrega algunos bloques más':'Muy poco — el proceso tomará más tiempo'}
            </p>
          </div>
          <p className={'text-3xl font-black '+(bench==='green'?'text-teal-600':bench==='amber'?'text-amber-600':'text-red-500')}>{totalH}h</p>
        </div>
      )}
    </div>
  )
}

// ─── Pilar 4: Documentos ────────────────────────────────────────────────────

function PilarDocumentos({ data, onChange }) {
  const checks = (data&&data.checks)?data.checks:{}
  const toggle = function(id){onChange({checks:Object.assign({},checks,{[id]:!checks[id]})})}
  const completados = DOCS_LIST.filter(function(d){return checks[d.id]}).length
  const pct = Math.round((completados/DOCS_LIST.length)*100)
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Progreso de tu carpeta</h3>
          <span className="text-xs font-bold text-amber-600">{completados}/{DOCS_LIST.length} listos</span>
        </div>
        <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500" style={{width:pct+'%'}}/>
        </div>
      </div>
      <div className="space-y-3">
        {DOCS_LIST.map(function(item){
          const done=!!checks[item.id]; const Icon=item.Icon
          return (
            <div key={item.id} className={'flex items-center gap-4 p-4 rounded-2xl border-2 transition-all '+(done?'bg-amber-50 border-amber-200':'bg-white border-slate-200')}>
              <button onClick={function(){toggle(item.id)}} className="shrink-0 cursor-pointer">
                {done?<CheckSquare size={22} weight="fill" className="text-amber-500"/>:<Square size={22} className="text-slate-300 hover:text-slate-500 transition-colors"/>}
              </button>
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Icon size={18} className={done?'text-amber-500':'text-slate-400'} weight="duotone"/>
                <span className={'text-sm font-semibold '+(done?'text-amber-700 line-through':'text-slate-700')}>{item.label}</span>
              </div>
              {item.link&&(
                <Link to={item.link} className="shrink-0 flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-amber-600 border border-slate-200 hover:border-amber-300 rounded-lg px-3 py-1.5 transition-colors cursor-pointer">
                  {done?'Revisar':'Ir ahora'} <ArrowRight size={12}/>
                </Link>
              )}
            </div>
          )
        })}
      </div>
      {pct===100&&(
        <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-50 to-teal-50 border-2 border-amber-200 text-center">
          <Trophy size={40} weight="duotone" className="text-amber-500 mx-auto mb-2"/>
          <h3 className="font-black text-slate-800 text-lg mb-1">¡Carpeta 100% lista!</h3>
          <p className="text-sm text-slate-500">Estás listo para postular con confianza.</p>
        </div>
      )}
    </div>
  )
}

// ─── Pilar 5: Bienestar ──────────────────────────────────────────────────────

function PilarBienestar() {
  const [respira,setRespira] = useState(false)
  const [fase,setFase]       = useState('inhala')
  const [video,setVideo]     = useState(null)
  const VIDEOS = [
    {titulo:'Meditación antes de tu entrevista', duracion:'8 min', url:'https://www.youtube.com/embed/inpok4MKVLM'},
    {titulo:'Cómo manejar el rechazo laboral',   duracion:'10 min',url:'https://www.youtube.com/embed/RcGyVTAoXEU'},
    {titulo:'Motivación para la búsqueda',       duracion:'6 min', url:'https://www.youtube.com/embed/u6XAPnuFjJc'},
  ]
  useEffect(function(){
    if (!respira) return
    const seq=[{n:'inhala',ms:4000},{n:'sostén',ms:7000},{n:'exhala',ms:8000}]
    let i=0; setFase('inhala')
    const tick=function(){ i++; setFase(seq[i%3].n); return setTimeout(tick,seq[i%3].ms) }
    const t=setTimeout(tick,4000)
    return function(){clearTimeout(t)}
  },[respira])
  const faseBg = fase==='inhala'?'bg-blue-400':fase==='sostén'?'bg-violet-400':'bg-teal-400'
  const faseScale = fase==='inhala'?'scale-125':fase==='sostén'?'scale-110':'scale-90'
  return (
    <div className="space-y-10">
      <div className="p-8 rounded-3xl bg-rose-50 border-2 border-rose-100 text-center">
        <h3 className="font-black text-slate-800 text-lg mb-1">Ejercicio de Respiración Guiado</h3>
        <p className="text-sm text-slate-500 mb-6">Técnica 4-7-8. Ideal antes de una entrevista.</p>
        <div className="flex flex-col items-center gap-6">
          <div className={'w-24 h-24 rounded-full transition-all duration-[4000ms] ease-in-out flex items-center justify-center shadow-lg '+(respira?faseBg+' '+faseScale:'bg-slate-200 scale-100')}>
            <span className="text-white text-xs font-black uppercase tracking-widest">{respira?fase:'●'}</span>
          </div>
          <button onClick={function(){setRespira(!respira)}} className={'px-8 py-3 rounded-xl font-bold text-sm transition-colors cursor-pointer '+(respira?'bg-rose-100 text-rose-700 border-2 border-rose-200 hover:bg-rose-200':'bg-rose-600 text-white hover:bg-rose-700 shadow-sm')}>
            {respira?'Detener':'Iniciar respiración guiada'}
          </button>
        </div>
      </div>
      <div>
        <h3 className="font-black text-slate-800 text-base mb-4">Meditación y Motivación</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {VIDEOS.map(function(v,i){return(
            <div key={i}>
              {video===i?(
                <div className="rounded-2xl overflow-hidden aspect-video shadow-md">
                  <iframe width="100%" height="100%" src={v.url+'?autoplay=1'} title={v.titulo} allow="autoplay; encrypted-media" allowFullScreen className="w-full h-full"/>
                </div>
              ):(
                <div onClick={function(){setVideo(i)}} className="aspect-video rounded-2xl bg-slate-100 border-2 border-slate-200 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-rose-300 hover:bg-rose-50 transition-colors group">
                  <div className="w-14 h-14 rounded-full bg-rose-100 flex items-center justify-center group-hover:scale-105 transition-transform border-2 border-rose-200">
                    <Play size={22} weight="fill" className="text-rose-500 ml-1"/>
                  </div>
                  <div className="text-center px-3">
                    <p className="text-sm font-bold text-slate-700 leading-snug">{v.titulo}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{v.duracion}</p>
                  </div>
                </div>
              )}
            </div>
          )})}
        </div>
      </div>
      <div>
        <h3 className="font-black text-slate-800 text-base mb-4">Para leer cuando el proceso se siente pesado</h3>
        <div className="space-y-3">
          {[
            {titulo:'La regla del 5×5 para reducir la ansiedad',desc:'Si el problema no te importará en 5 años, no le dediques más de 5 minutos de angustia hoy.'},
            {titulo:'Cómo transformar el "no" en aprendizaje',  desc:'Cada rechazo es datos. Analiza tus procesos y mejora sin tomarlo personal.'},
            {titulo:'El poder de las micro-victorias diarias',   desc:'Celebra cada paso, no solo la oferta final. El momentum positivo es tu mejor aliado.'},
          ].map(function(a,i){return(
            <div key={i} className="p-5 rounded-2xl bg-white border-2 border-slate-200 hover:border-rose-200 hover:bg-rose-50/30 transition-colors cursor-pointer">
              <h4 className="font-bold text-slate-800 text-sm mb-1">{a.titulo}</h4>
              <p className="text-xs text-slate-500 leading-relaxed">{a.desc}</p>
            </div>
          )})}
        </div>
      </div>
    </div>
  )
}

// ─── Componente Principal ────────────────────────────────────────────────────

export default function ProyectoLaboral() {
  const { user } = useAuth()
  const [pilarId,setPilarId] = useState('autoconocimiento')
  const [data,setData]       = useState({})
  const [saving,setSaving]   = useState(false)
  const [saved,setSaved]     = useState(false)

  useEffect(function(){
    if (!user) return
    supabase.from('profiles').select('job_search_profile').eq('id',user.id).single()
      .then(function(res){ if (res.data&&res.data.job_search_profile) setData(res.data.job_search_profile) })
  },[user])

  const saveData = useCallback(function(nd){
    if (!user) return
    setSaving(true)
    supabase.from('profiles').update({job_search_profile:nd}).eq('id',user.id)
      .then(function(){ setSaving(false); setSaved(true); setTimeout(function(){setSaved(false)},2500) })
  },[user])

  const updatePilar = useCallback(function(key,val){
    const nd = Object.assign({},data,{[key]:val})
    setData(nd); saveData(nd)
  },[data,saveData])

  const pct      = calcularProgreso(data)
  const pilarObj = PILARES.find(function(p){return p.id===pilarId})||PILARES[0]
  const col      = COLORES[pilarObj.color]||COLORES.violet
  const PilarIcon= pilarObj.icon

  const pctColor = pct>=70?'text-emerald-600':pct>=40?'text-amber-600':'text-violet-700'

  return (
    <div className="min-h-screen bg-slate-50 pb-20" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>

      {/* ══════════ HERO HEADER ══════════
          Design: clean SaaS light — no dark bg
          Pattern: left headline + right stat card (split layout)
      ══════════ */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 md:px-10 py-10 md:py-14">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">

            {/* Left: text */}
            <div className="flex-1">
              {/* Eyebrow */}
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center">
                  <Target size={14} weight="fill" className="text-violet-600"/>
                </div>
                <span className="text-xs font-bold text-violet-600 uppercase tracking-widest">Marco PMI · Planificación</span>
              </div>

              <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight tracking-tight mb-4">
                Sé Gerente de Proyecto<br/>
                <span className="text-violet-600">de tu Búsqueda Laboral</span>
              </h1>

              <p className="text-slate-500 text-base leading-relaxed max-w-xl mb-5">
                Tómate este tiempo para reflexionar. Deja de lado urgencias y concéntrate en
                entender <span className="font-semibold text-slate-700">muy bien tu propio perfil</span>.
                Es el mejor momento para evaluar, reevaluar y avanzar con claridad.
              </p>

              {/* Stat inline */}
              <div className="inline-flex items-center gap-2 bg-violet-50 border border-violet-200 rounded-xl px-4 py-2.5">
                <span className="text-xl font-black text-violet-700">73%</span>
                <span className="text-xs text-violet-600 leading-snug max-w-[200px]">de quienes lo completan ganan claridad sobre su oferta de valor</span>
              </div>

              {/* Save indicator */}
              <div className="mt-4 h-5">
                {saving&&<span className="flex items-center gap-1.5 text-xs text-slate-400"><SpinnerGap size={12} className="animate-spin"/> Guardando...</span>}
                {saved &&<span className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold"><CheckCircle size={12} weight="fill"/> Guardado automáticamente</span>}
              </div>
            </div>

            {/* Right: progress card */}
            <div className="md:w-64 shrink-0">
              <div className="bg-slate-900 rounded-2xl p-6 text-white">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Avance del proyecto</p>

                {/* Circle */}
                <div className="relative w-28 h-28 mx-auto mb-4">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 112 112">
                    <circle cx="56" cy="56" r="44" strokeWidth="10" stroke="#1e293b" fill="none"/>
                    <circle cx="56" cy="56" r="44" strokeWidth="10"
                      stroke={pct>=70?'#10b981':pct>=40?'#f59e0b':'#8b5cf6'}
                      strokeLinecap="round" fill="none"
                      strokeDasharray={`${2*Math.PI*44}`}
                      strokeDashoffset={`${2*Math.PI*44*(1-pct/100)}`}
                      style={{transition:'stroke-dashoffset 0.8s cubic-bezier(.4,0,.2,1)'}}/>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-white leading-none">{pct}%</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">completo</span>
                  </div>
                </div>

                {/* Mini legend */}
                <div className="space-y-2">
                  {[
                    {label:'Autoconocimiento',w:35,color:'bg-violet-500'},
                    {label:'Documentos',      w:30,color:'bg-amber-400'},
                    {label:'Horario',         w:20,color:'bg-teal-400'},
                    {label:'Recursos',        w:10,color:'bg-blue-400'},
                  ].map(function(l){return(
                    <div key={l.label} className="flex items-center gap-2">
                      <div className={'w-1.5 h-1.5 rounded-full shrink-0 '+l.color}/>
                      <span className="text-[11px] text-slate-400 flex-1">{l.label}</span>
                      <span className="text-[11px] text-slate-500 font-semibold">{l.w}%</span>
                    </div>
                  )})}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════ DASHBOARD RESUMEN ══════════ */}
      <div className="max-w-5xl mx-auto px-4 md:px-10 mt-8">
        <DashboardResumen
          data={data}
          pct={pct}
          onSelect={function(id){setPilarId(id)}}
        />
      </div>

      {/* ══════════ CUERPO — Pilares ══════════ */}
      <div className="max-w-5xl mx-auto px-4 md:px-10 mt-6">

        {/* Nav tabs */}
        <div className="flex gap-2 flex-wrap mb-6">
          {PILARES.map(function(p){
            const isAct = pilarId===p.id
            const c = COLORES[p.color]
            const Icon = p.icon
            return (
              <button key={p.id} onClick={function(){setPilarId(p.id)}}
                className={'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border-2 transition-colors cursor-pointer '+(isAct?c.active:c.pill)}>
                <Icon size={16} weight={isAct?'fill':'duotone'}/>
                <span className="hidden sm:inline">{p.label}</span>
              </button>
            )
          })}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-10">
          <div className={'flex items-center gap-3 px-6 py-5 border-b border-slate-100 '+col.header}>
            <PilarIcon size={22} weight="duotone" className={col.icon}/>
            <div>
              <h2 className="font-black text-slate-800 text-lg">{pilarObj.label}</h2>
              <p className="text-xs text-slate-500 font-medium">
                {pilarId==='autoconocimiento'&&'Iniciación · Define tu punto de partida y tu objetivo'}
                {pilarId==='recursos'        &&'Planificación · Entiende la inversión real de tu búsqueda'}
                {pilarId==='semana'          &&'Ejecución · Comprométete con el tiempo que dedicarás'}
                {pilarId==='documentos'      &&'Monitoreo · Estado de tus materiales de candidatura'}
                {pilarId==='bienestar'       &&'Gestión de Riesgos · Cuida tu energía y salud mental'}
              </p>
            </div>
          </div>
          <div className="p-6 md:p-8">
            {pilarId==='autoconocimiento'&&<PilarAutoconocimiento data={data.autoconocimiento} onChange={function(v){updatePilar('autoconocimiento',v)}}/>}
            {pilarId==='recursos'        &&<PilarRecursos         data={data.recursos}         onChange={function(v){updatePilar('recursos',v)}}/>}
            {pilarId==='semana'          &&<PilarSemana           data={data.semana}           onChange={function(v){updatePilar('semana',v)}}/>}
            {pilarId==='documentos'      &&<PilarDocumentos       data={data.documentos}       onChange={function(v){updatePilar('documentos',v)}}/>}
            {pilarId==='bienestar'       &&<PilarBienestar/>}
          </div>
        </div>
      </div>
    </div>
  )
}
