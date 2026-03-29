// Página pública de precios — accesible sin login
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  CheckCircle, XCircle, Lightning, Sparkle, Crown,
  ShieldCheck, ArrowRight, Users, Star, WhatsappLogo,
  EnvelopeSimple, X, CalendarBlank, Globe
} from '@phosphor-icons/react'

// ─── Países, monedas y precios ───────────────────────────────────────────────

const PAISES = [
  { codigo: 'MX', nombre: 'México',              moneda: 'MXN', bandera: '🇲🇽' },
  { codigo: 'CO', nombre: 'Colombia',            moneda: 'COP', bandera: '🇨🇴' },
  { codigo: 'AR', nombre: 'Argentina',           moneda: 'ARS', bandera: '🇦🇷' },
  { codigo: 'US', nombre: 'USA / Internacional', moneda: 'USD', bandera: '🇺🇸' },
]

const PRECIOS = {
  MXN: { semanal: 99,    mensual: 299,   trim_total: 699,    trim_mensual: 233,   antes_trim: 897,    competencia: 499    },
  COP: { semanal: 20000, mensual: 60000, trim_total: 140000, trim_mensual: 46600, antes_trim: 180000, competencia: 100000 },
  ARS: { semanal: 5000,  mensual: 15000, trim_total: 35000,  trim_mensual: 11600, antes_trim: 45000,  competencia: 25000  },
  USD: { semanal: 5,     mensual: 15,    trim_total: 35,     trim_mensual: 11.67, antes_trim: 45,     competencia: 25     },
}

function formatPrecio(valor, moneda) {
  if (moneda === 'USD') return `USD ${Number.isInteger(valor) ? valor : valor.toFixed(2)}`
  if (moneda === 'COP' || moneda === 'ARS') return `${moneda} ${valor.toLocaleString('es')}`
  return `MXN ${valor}`
}

// ─── Datos de planes ─────────────────────────────────────────────────────────

const PLANES = [
  {
    id: 'free',
    nombre: 'Gratis',
    icono: <Sparkle size={22} weight="duotone" className="text-gray-400" />,
    etiqueta: null,
    descripcion: 'Para explorar la plataforma',
    color: 'gray',
    creditos: 3,
    features: [
      { texto: '3 análisis de CV',                            incluido: true  },
      { texto: 'CV optimizado formato Harvard',               incluido: true  },
      { texto: 'Descarga en PDF y Word',                      incluido: true  },
      { texto: 'CVs en múltiples idiomas',                    incluido: true  },
      { texto: 'Biblioteca de conocimiento',                  incluido: true  },
      { texto: 'Acceso a Mentores',                           incluido: true  },
      { texto: 'CV adaptado a vacante específica',            incluido: false },
      { texto: '% de compatibilidad con vacante',             incluido: false },
      { texto: 'Vacantes similares en tu área',               incluido: false },
      { texto: 'Optimización de perfil LinkedIn',             incluido: false },
      { texto: 'Preparación para entrevistas',                incluido: false },
      { texto: 'Dashboard de usuario optimizado',             incluido: false },
    ],
  },
  {
    id: 'semanal',
    nombre: 'Pro Semanal',
    icono: <CalendarBlank size={22} weight="duotone" className="text-emerald-500" />,
    etiqueta: 'IDEAL PARA ENTREVISTAS',
    descripcion: 'Acceso completo por 7 días',
    color: 'emerald',
    creditos: 10,
    features: [
      { texto: '10 análisis de CV',                           incluido: true  },
      { texto: 'CV optimizado formato Harvard',               incluido: true  },
      { texto: 'Descarga en PDF y Word',                      incluido: true  },
      { texto: 'CVs en múltiples idiomas',                    incluido: true  },
      { texto: 'Biblioteca de conocimiento',                  incluido: true  },
      { texto: 'Acceso a Mentores',                           incluido: true  },
      { texto: 'CV adaptado a vacante específica',            incluido: true  },
      { texto: '% de compatibilidad con vacante',             incluido: true  },
      { texto: 'Vacantes similares en tu área',               incluido: true  },
      { texto: 'Optimización de perfil LinkedIn',             incluido: true  },
      { texto: 'Preparación para entrevistas',                incluido: true  },
      { texto: 'Dashboard de usuario optimizado',             incluido: true  },
    ],
  },
  {
    id: 'mensual',
    nombre: 'Pro Mensual',
    icono: <Lightning size={22} weight="duotone" className="text-[#002650]" />,
    etiqueta: 'MÁS POPULAR',
    descripcion: 'Para tu búsqueda activa de empleo',
    color: 'primary',
    creditos: 'Ilimitado',
    features: [
      { texto: 'Análisis de CV ilimitados',                   incluido: true },
      { texto: 'CV optimizado formato Harvard',               incluido: true },
      { texto: 'Descarga en PDF y Word',                      incluido: true },
      { texto: 'CVs en múltiples idiomas',                    incluido: true },
      { texto: 'Biblioteca de conocimiento',                  incluido: true },
      { texto: 'Acceso a Mentores',                           incluido: true },
      { texto: 'CV adaptado a vacante específica',            incluido: true },
      { texto: '% de compatibilidad con vacante',             incluido: true },
      { texto: 'Vacantes similares en tu área',               incluido: true },
      { texto: 'Optimización de perfil LinkedIn',             incluido: true },
      { texto: 'Preparación para entrevistas',                incluido: true },
      { texto: 'Dashboard de usuario optimizado',             incluido: true },
    ],
  },
  {
    id: 'trimestral',
    nombre: 'Pro Trimestral',
    icono: <Crown size={22} weight="duotone" className="text-amber-500" />,
    etiqueta: 'AHORRA 22%',
    descripcion: 'El mejor valor — 3 meses completos',
    color: 'amber',
    creditos: 'Ilimitado',
    features: [
      { texto: 'Análisis de CV ilimitados',                   incluido: true },
      { texto: 'CV optimizado formato Harvard',               incluido: true },
      { texto: 'Descarga en PDF y Word',                      incluido: true },
      { texto: 'CVs en múltiples idiomas',                    incluido: true },
      { texto: 'Biblioteca de conocimiento',                  incluido: true },
      { texto: 'Acceso a Mentores con valor preferencial',    incluido: true, destacado: true },
      { texto: 'CV adaptado a vacante específica',            incluido: true },
      { texto: '% de compatibilidad con vacante',             incluido: true },
      { texto: 'Vacantes similares en tu área',               incluido: true },
      { texto: 'Optimización de perfil LinkedIn',             incluido: true },
      { texto: 'Preparación para entrevistas',                incluido: true },
      { texto: 'Dashboard de usuario optimizado',             incluido: true },
    ],
  },
]

const GARANTIAS = [
  { icono: <ShieldCheck size={18} weight="duotone" className="text-emerald-500" />, texto: 'Cancela cuando quieras' },
  { icono: <Star        size={18} weight="duotone" className="text-amber-400"   />, texto: 'Sin cobro automático sorpresa' },
  { icono: <Users       size={18} weight="duotone" className="text-blue-500"    />, texto: 'Soporte por email incluido' },
]

// ─── Modal de selección de plan ──────────────────────────────────────────────

function ModalPlan({ plan, user, perfil, moneda, precios, onClose }) {
  const nombre = perfil?.nombre1 ? `${perfil.nombre1} ${perfil.apellido1 || ''}`.trim() : ''
  const email  = perfil?.email_principal || user?.email || ''

  let precioStr
  if (plan.id === 'semanal')     precioStr = `${formatPrecio(precios.semanal, moneda)} / semana`
  else if (plan.id === 'trimestral') precioStr = `${formatPrecio(precios.trim_total, moneda)} / trimestre`
  else if (plan.id !== 'free')   precioStr = `${formatPrecio(precios.mensual, moneda)} / mes`
  else                           precioStr = 'Gratis'

  const WA_NUMBER      = ''
  const CONTACTO_EMAIL = ''

  const msgWA = encodeURIComponent(
    `Hola! Quiero activar el plan *${plan.nombre}* (${precioStr}) en OPTIMA-CV.\n` +
    `${nombre ? `Nombre: ${nombre}\n` : ''}` +
    `${email   ? `Email: ${email}\n`  : ''}` +
    `Por favor indíquenme los pasos para completar el pago. ¡Gracias!`
  )
  const waLink     = WA_NUMBER      ? `https://wa.me/${WA_NUMBER}?text=${msgWA}` : null
  const mailtoLink = CONTACTO_EMAIL
    ? `mailto:${CONTACTO_EMAIL}?subject=${encodeURIComponent(`Quiero activar ${plan.nombre} - OPTIMA-CV`)}&body=${encodeURIComponent(`Hola equipo OPTIMA-CV,\n\nQuiero activar el plan ${plan.nombre} (${precioStr}).\n\n${nombre ? `Nombre: ${nombre}\n` : ''}${email ? `Email: ${email}\n` : ''}\n\nQuedo al pendiente de sus instrucciones para el pago.\n\nGracias!`)}`
    : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Activar {plan.nombre}</h3>
            <p className="text-sm text-gray-500 mt-0.5">{precioStr}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-5">
          <p className="text-sm text-blue-800 leading-relaxed">
            Estamos en fase beta — el pago se coordina directamente con nuestro equipo.
            Te respondemos en <strong>menos de 24 horas</strong> y activamos tu plan al instante.
          </p>
        </div>

        {/* Datos pre-llenados */}
        {(nombre || email) && (
          <div className="bg-gray-50 rounded-xl p-3 mb-5 space-y-1">
            {nombre && <p className="text-xs text-gray-500"><span className="font-medium text-gray-700">Nombre:</span> {nombre}</p>}
            {email  && <p className="text-xs text-gray-500"><span className="font-medium text-gray-700">Email:</span>  {email}</p>}
          </div>
        )}

        {/* CTAs */}
        <div className="space-y-3">
          {waLink ? (
            <a href={waLink} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2.5 w-full bg-[#25D366] text-white font-bold py-3 rounded-xl hover:bg-[#20bb5a] transition-colors text-sm shadow-sm">
              <WhatsappLogo size={20} weight="fill" />
              Contactar por WhatsApp
            </a>
          ) : (
            <div className="flex items-center justify-center gap-2.5 w-full bg-gray-100 text-gray-400 font-bold py-3 rounded-xl text-sm cursor-not-allowed">
              <WhatsappLogo size={20} weight="fill" />
              WhatsApp — próximamente
            </div>
          )}
          {mailtoLink ? (
            <a href={mailtoLink}
              className="flex items-center justify-center gap-2.5 w-full border border-gray-300 text-gray-700 font-semibold py-3 rounded-xl hover:border-[#002650] hover:text-[#002650] transition-colors text-sm">
              <EnvelopeSimple size={18} weight="bold" />
              Enviar email al equipo
            </a>
          ) : (
            <div className="flex items-center justify-center gap-2.5 w-full border border-gray-200 text-gray-300 font-semibold py-3 rounded-xl text-sm cursor-not-allowed">
              <EnvelopeSimple size={18} weight="bold" />
              Email — próximamente
            </div>
          )}
        </div>

        <p className="text-xs text-gray-400 text-center mt-4">
          Sin tarjeta de crédito por adelantado · Sin renovación automática
        </p>
      </div>
    </div>
  )
}

// ─── Card de plan ─────────────────────────────────────────────────────────────

function PlanCard({ plan, user, perfil, moneda, precios, onSeleccionar }) {
  const esPrimary = plan.color === 'primary'
  const esAmber   = plan.color === 'amber'
  const esEmerald = plan.color === 'emerald'
  const esGratis  = plan.id === 'free'

  const planActual   = perfil?.plan || 'free'
  const esActual     = planActual === plan.id || (plan.id === 'free' && planActual === 'free')
  const esPro        = ['mensual', 'trimestral', 'pro', 'semanal'].includes(planActual)
  const credAgotados = (perfil?.usage_count || 0) >= 3 && planActual === 'free'

  const borderCls = esPrimary ? 'border-[#002650]'
    : esAmber   ? 'border-amber-400'
    : esEmerald ? 'border-emerald-400'
    : 'border-gray-200'

  const headerBg = esPrimary ? 'bg-[#002650]/5'
    : esAmber   ? 'bg-amber-50'
    : esEmerald ? 'bg-emerald-50'
    : 'bg-gray-50'

  const renderCTA = () => {
    if (!user) {
      if (esGratis) {
        return (
          <Link to="/auth?register=true" className="block w-full text-center border border-gray-300 text-gray-700 font-bold py-3 rounded-xl hover:border-[#002650] hover:text-[#002650] transition-colors text-sm">
            Comenzar gratis
          </Link>
        )
      }
      return (
        <button onClick={() => onSeleccionar(plan)}
          className={`w-full font-bold py-3 rounded-xl text-sm transition-colors ${
            esPrimary ? 'bg-[#002650] text-white hover:bg-[#001a3d]'
            : esAmber  ? 'bg-amber-500 text-white hover:bg-amber-400'
            : 'bg-emerald-600 text-white hover:bg-emerald-500'
          }`}>
          Seleccionar plan
        </button>
      )
    }

    if (esActual && !esGratis) {
      return (
        <div className="w-full text-center bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold py-3 rounded-xl text-sm">
          ✓ Tu plan actual
        </div>
      )
    }

    if (esGratis && !esPro) {
      return (
        <Link to="/cv-optimizer" className="block w-full text-center border border-gray-300 text-gray-700 font-bold py-3 rounded-xl hover:border-[#002650] hover:text-[#002650] transition-colors text-sm">
          Ir a la plataforma
        </Link>
      )
    }

    if (perfil?.is_admin) {
      return (
        <div className="w-full text-center bg-purple-50 border border-purple-200 text-purple-700 font-semibold py-3 rounded-xl text-sm">
          Panel Admin
        </div>
      )
    }

    return (
      <button onClick={() => onSeleccionar(plan)}
        className={`w-full font-bold py-3 rounded-xl text-sm transition-colors shadow-sm ${
          esPrimary ? 'bg-[#002650] text-white hover:bg-[#001a3d]'
          : esAmber  ? 'bg-amber-500 text-white hover:bg-amber-400'
          : 'bg-emerald-600 text-white hover:bg-emerald-500'
        } ${credAgotados ? 'ring-2 ring-red-400 ring-offset-2' : ''}`}>
        {credAgotados ? '¡Seleccionar plan ahora!' : 'Seleccionar plan'}
      </button>
    )
  }

  // Bloque de precio según plan
  const renderPrecio = () => {
    if (esGratis) return <p className="text-4xl font-black text-gray-900 mb-1">Gratis</p>

    if (plan.id === 'semanal') return (
      <div className="mb-1">
        <div className="flex items-end gap-1">
          <span className="text-4xl font-black text-gray-900">{formatPrecio(precios.semanal, moneda)}</span>
          <span className="text-sm text-gray-400 mb-1">/semana</span>
        </div>
        <p className="text-xs text-gray-400">Acceso completo por 7 días</p>
      </div>
    )

    if (plan.id === 'trimestral') return (
      <div className="mb-1">
        <div className="flex items-end gap-1">
          <span className="text-4xl font-black text-gray-900">{formatPrecio(precios.trim_total, moneda)}</span>
          <span className="text-sm text-gray-400 mb-1">/trimestre</span>
        </div>
        <p className="text-xs text-gray-400">= {formatPrecio(precios.trim_mensual, moneda)}/mes · antes {formatPrecio(precios.antes_trim, moneda)}</p>
      </div>
    )

    return (
      <div className="mb-1">
        <div className="flex items-end gap-1">
          <span className="text-4xl font-black text-gray-900">{formatPrecio(precios.mensual, moneda)}</span>
          <span className="text-sm text-gray-400 mb-1">/mes</span>
        </div>
        <p className="text-xs text-gray-400">Sin cobro automático</p>
      </div>
    )
  }

  return (
    <div className={`relative flex flex-col rounded-2xl border-2 bg-white overflow-hidden transition-all ${borderCls}`}>

      {/* Header coloreado */}
      <div className={`px-5 pt-6 pb-4 ${headerBg}`}>
        {plan.etiqueta && (
          <div className={`absolute top-3 right-2 px-2 py-0.5 rounded-full text-[9px] font-black tracking-wide leading-tight text-center max-w-[110px]
            ${esPrimary ? 'bg-[#002650] text-white' : esAmber ? 'bg-amber-400 text-white' : 'bg-emerald-500 text-white'}`}>
            {plan.etiqueta}
          </div>
        )}

        <div className="flex items-center gap-2 mb-1">
          {plan.icono}
          <h3 className="font-bold text-gray-900 text-sm">{plan.nombre}</h3>
        </div>
        <p className="text-xs text-gray-400 mb-3">{plan.descripcion}</p>

        {renderPrecio()}

        {/* Badge créditos */}
        <div className={`mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold
          ${esGratis ? 'bg-gray-200 text-gray-600'
          : esPrimary ? 'bg-[#002650]/10 text-[#002650]'
          : esAmber   ? 'bg-amber-100 text-amber-700'
          : 'bg-emerald-100 text-emerald-700'}`}>
          <Lightning size={12} weight="fill" />
          {plan.creditos} {typeof plan.creditos === 'number' ? 'análisis incluidos' : 'análisis'}
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4 flex flex-col flex-1">
        {credAgotados && !esGratis && !esPro && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
            Agotaste tus créditos gratuitos — desbloquea acceso ilimitado
          </div>
        )}

        {renderCTA()}

        <ul className="mt-4 space-y-2">
          {plan.features.map((f, i) => (
            <li key={i} className={`flex items-start gap-2 ${f.destacado ? 'bg-amber-50 -mx-2 px-2 py-1 rounded-lg' : ''}`}>
              {f.incluido
                ? <CheckCircle size={15} weight="fill" className={`shrink-0 mt-0.5 ${f.destacado ? 'text-amber-500' : 'text-emerald-500'}`} />
                : <XCircle    size={15} weight="fill" className="text-gray-200 shrink-0 mt-0.5" />
              }
              <span className={`text-xs leading-snug ${f.incluido ? f.destacado ? 'text-amber-700 font-semibold' : 'text-gray-700' : 'text-gray-300'}`}>
                {f.texto}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

// ─── Navbar público ───────────────────────────────────────────────────────────

function NavPublic({ user }) {
  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-6 h-16 bg-white border-b border-gray-200 shadow-sm">
      <Link to="/" className="flex items-center">
        <img src="/optima_logo_v3_clean_1.png" alt="OPTIMA-CV" className="h-10 w-auto object-contain" />
      </Link>
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <Link to="/mi-plan" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors hidden sm:block">
              Mi Plan
            </Link>
            <Link to="/cv-optimizer"
              className="flex items-center gap-2 bg-[#002650] text-white font-bold text-sm px-5 py-2 rounded-xl hover:bg-[#001a3d] transition-colors">
              Plataforma <ArrowRight size={14} weight="bold" />
            </Link>
          </>
        ) : (
          <>
            <Link to="/auth" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors hidden sm:block">
              Iniciar sesión
            </Link>
            <Link to="/auth?register=true"
              className="flex items-center gap-2 bg-[#002650] text-white font-bold text-sm px-5 py-2 rounded-xl hover:bg-[#001a3d] transition-colors">
              Comenzar gratis
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}

// ─── Selector de país / moneda ───────────────────────────────────────────────

function SelectorPais({ pais, onChange }) {
  return (
    <div className="inline-flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2 bg-white">
      <Globe size={15} className="text-gray-400 shrink-0" />
      <select
        value={pais.codigo}
        onChange={e => onChange(PAISES.find(p => p.codigo === e.target.value))}
        className="text-sm text-gray-600 bg-transparent focus:outline-none cursor-pointer pr-1"
      >
        {PAISES.map(p => (
          <option key={p.codigo} value={p.codigo}>{p.bandera} {p.nombre}</option>
        ))}
      </select>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function Pricing() {
  const navigate         = useNavigate()
  const { user, perfil } = useAuth()
  const [planModal, setPlanModal] = useState(null)
  const [pais, setPais]           = useState(PAISES[0]) // default México

  // Detectar país por IP al cargar
  useEffect(() => {
    fetch('https://ipapi.co/json/')
      .then(r => r.json())
      .then(data => {
        const encontrado = PAISES.find(p => p.codigo === data.country_code)
        if (encontrado) setPais(encontrado)
      })
      .catch(() => {}) // falla silenciosa — queda en MXN por defecto
  }, [])

  const moneda  = pais.moneda
  const precios = PRECIOS[moneda]

  const credAgotados = user && (perfil?.usage_count || 0) >= 3 && (!perfil?.plan || perfil.plan === 'free')

  return (
    <div className="min-h-screen bg-white">
      <NavPublic user={user} />

      <div className="max-w-6xl mx-auto px-6 py-12 space-y-12">

        {/* Botón regresar al dashboard — solo para usuarios logueados */}
        {user && (
          <div>
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary transition-colors"
            >
              ← Regresar al Dashboard
            </button>
          </div>
        )}

        {/* Encabezado */}
        <div className="text-center">
          <h1 className="text-4xl font-black text-gray-900 mb-3">Planes y precios</h1>
          <p className="text-gray-500 text-base max-w-xl mx-auto">
            Optima te ayuda a optimizar tu CV para cualquier mercado laboral. Sin inventar, sin sesgo, con la mentoría que necesitas.
          </p>

          {credAgotados && (
            <div className="mt-5 inline-flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm font-semibold px-5 py-2.5 rounded-full">
              <Lightning size={16} weight="fill" />
              Agotaste tus créditos gratuitos — elige un plan para continuar
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-5 mt-5">
            {GARANTIAS.map((g, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs text-gray-500">
                {g.icono}
                <span>{g.texto}</span>
              </div>
            ))}
          </div>

          {/* Selector de moneda */}
          <div className="flex justify-center mt-4">
            <SelectorPais pais={pais} onChange={setPais} />
          </div>
        </div>

        {/* Cards — 4 columnas en pantallas grandes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {PLANES.map(plan => (
            <PlanCard
              key={plan.id}
              plan={plan}
              user={user}
              perfil={perfil}
              moneda={moneda}
              precios={precios}
              onSeleccionar={setPlanModal}
            />
          ))}
        </div>
        <p className="text-xs text-gray-400 text-center -mt-6">
          Plataformas similares cobran {formatPrecio(precios.competencia, moneda)}/mes con renovación automática. Nosotros no.
        </p>

        {/* ¿Por qué Optima-CV? */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">¿Por qué Optima?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { titulo: 'Tu mentora inteligente',    desc: 'Optima no solo reformatea — analiza profundamente tu experiencia y mejora el impacto de cada sección de tu CV.',                 icon: '👩‍💼', color: 'bg-blue-50 border-blue-100'     },
              { titulo: 'Sin inventar información',  desc: 'Solo optimizamos lo que ya está en tu CV. Sin datos ficticios, sin inflación de experiencia. Ética y efectividad.',            icon: '✅',   color: 'bg-emerald-50 border-emerald-100' },
              { titulo: 'Para cualquier industria',  desc: 'Tecnología, finanzas, salud, marketing, ventas — Optima adapta su análisis a tu sector y contexto laboral.',                   icon: '🌍',   color: 'bg-amber-50 border-amber-100'    },
              { titulo: '% de match con la vacante', desc: 'Sube la descripción de la vacante y descubre qué tan compatible eres, más consejos específicos para mejorar tu candidatura.', icon: '🎯',   color: 'bg-purple-50 border-purple-100'  },
            ].map((item, i) => (
              <div key={i} className={`rounded-2xl border p-5 ${item.color}`}>
                <div className="text-2xl mb-2">{item.icon}</div>
                <h3 className="font-semibold text-gray-800 mb-1 text-sm">{item.titulo}</h3>
                <p className="text-xs text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-5">Preguntas frecuentes</h2>
          <div className="space-y-3">
            {[
              { q: '¿Se renueva automáticamente?',           a: 'No. A diferencia de otras plataformas, no te cobramos sin tu confirmación. Cada pago es una decisión tuya.' },
              { q: '¿Puedo usar el plan gratuito sin tarjeta?', a: 'Sí. Los 3 análisis gratuitos no requieren ningún método de pago. Solo crea tu cuenta.' },
              { q: '¿Qué pasa si agoto mis créditos?',       a: 'Puedes adquirir un plan en cualquier momento. Tus CVs guardados no se eliminan.' },
              { q: '¿En qué idiomas funciona?',              a: 'Español, inglés y portugués. El sistema detecta automáticamente el idioma de tu CV y de la vacante.' },
              { q: '¿Funciona para cualquier industria?',    a: 'Sí. Tecnología, finanzas, salud, marketing, ventas, manufactura — el análisis se adapta a tu sector.' },
            ].map((item, i) => (
              <div key={i} className="bg-gray-50 border border-gray-100 rounded-2xl p-5">
                <h4 className="font-semibold text-gray-800 mb-1 text-sm">{item.q}</h4>
                <p className="text-xs text-gray-500 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Final */}
        <div className="bg-[#002650] rounded-2xl py-10 px-6 text-center">
          <h2 className="text-2xl font-black text-white mb-2">Conoce a Optima, tu mentora en búsqueda laboral</h2>
          <p className="text-blue-200 mb-6 text-sm">3 análisis gratuitos · Sin tarjeta · Sin renovación automática</p>
          <button
            onClick={() => navigate(user ? '/cv-optimizer' : '/auth')}
            className="inline-flex items-center gap-2 bg-white text-[#002650] font-bold px-8 py-3 rounded-xl hover:bg-blue-50 transition-colors text-sm shadow-md">
            {user ? 'Ir al CV Optimizer' : 'Crear cuenta gratis'}
            <ArrowRight size={18} weight="bold" />
          </button>
        </div>

      </div>

      {/* Modal de selección de plan */}
      {planModal && (
        <ModalPlan
          plan={planModal}
          user={user}
          perfil={perfil}
          moneda={moneda}
          precios={precios}
          onClose={() => setPlanModal(null)}
        />
      )}
    </div>
  )
}
