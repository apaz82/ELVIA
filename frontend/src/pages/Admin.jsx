import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import * as PI from '@phosphor-icons/react'

// Cliente Supabase propio del admin
const db = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  { auth: { storageKey: 'admin-auth', persistSession: true } }
)

// ─── Constants ──────────────────────────────────────────────────────────────
const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

function Badge({ color = 'gray', children }) {
  const cls = {
    green:  'bg-emerald-100 text-emerald-700',
    red:    'bg-red-100 text-red-700',
    amber:  'bg-amber-100 text-amber-700',
    blue:   'bg-blue-100 text-blue-700',
    gray:   'bg-gray-100 text-gray-600',
    purple: 'bg-purple-100 text-purple-700',
  }[color] || 'bg-gray-100 text-gray-600'
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>{children}</span>
}

function KpiCard({ label, value, sub, icon: Icon, color = 'blue' }) {
  const accent = {
    blue:   'text-blue-400 bg-blue-500/10 border-blue-500/20',
    green:  'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    amber:  'text-amber-400 bg-amber-500/10 border-amber-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  }[color]
  
  return (
    <div className="bg-[#111827] rounded-3xl p-6 border border-gray-800 shadow-xl transition-all hover:border-gray-700 group">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">{label}</p>
        {Icon && (
          <div className={`p-2 rounded-xl border ${accent.split(' ').slice(1).join(' ')} group-hover:scale-110 transition-transform`}>
            <Icon size={18} weight="duotone" className={accent.split(' ')[0]} />
          </div>
        )}
      </div>
      <p className="text-3xl font-black text-white tracking-tight">{value}</p>
      {sub && (
        <div className="mt-4 flex items-center gap-1.5">
          <div className="h-1 w-1 rounded-full bg-blue-500" />
          <p className="text-[10px] text-gray-500 font-medium">{sub}</p>
        </div>
      )}
    </div>
  )
}

// ─── Login standalone ────────────────────────────────────────────────────────

function AdminLogin({ onLogin }) {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { data, error: authErr } = await db.auth.signInWithPassword({ email, password })
    if (authErr) { setError('Credenciales de acceso no válidas'); setLoading(false); return }

    const { data: perfil } = await db.from('profiles').select('role').eq('id', data.user.id).single()
    if (!['super_admin', 'company_admin'].includes(perfil?.role)) {
      await db.auth.signOut()
      setError('Acceso restringido: Solamente personal autorizado.')
      setLoading(false)
      return
    }
    onLogin(data.user)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/30 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-600/30 blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-10">
          <div className="w-20 h-20 rounded-[2.5rem] bg-gradient-to-br from-blue-600 to-violet-700 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-900/40 border border-white/10 ring-8 ring-blue-600/5 anim-float">
            <span className="text-white font-black text-3xl">O</span>
          </div>
          <h1 className="text-white text-3xl font-black tracking-tighter uppercase italic">OPTIMA ADMIN</h1>
          <p className="text-blue-500/60 text-[10px] font-black tracking-[0.4em] mt-2 uppercase">Centro de Operaciones</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#111827] rounded-[2.5rem] p-8 border border-gray-800 shadow-2xl space-y-5">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Identificación</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full bg-gray-950/50 border border-gray-800 rounded-2xl px-5 py-3.5 text-white text-sm placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
              placeholder="admin@optima.pro"
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between ml-1">
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest">Clave de Acceso</label>
              <a 
                href="/auth?forgot=1" 
                className="text-[9px] font-black text-blue-500/60 hover:text-blue-400 uppercase tracking-widest transition-colors"
                title="Ir al portal de recuperación general"
              >
                ¿Olvidaste tu clave?
              </a>
            </div>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)} required
              className="w-full bg-gray-950/50 border border-gray-800 rounded-2xl px-5 py-3.5 text-white text-sm placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
              placeholder="••••••••"
            />
          </div>
          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-red-500 text-xs font-bold animate-shake">
                <PI.Warning size={16} />
                <span>{error}</span>
            </div>
          )}
          <button
            type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-black uppercase tracking-widest rounded-2xl py-4 text-xs transition-all shadow-xl shadow-blue-900/20 active:scale-95 flex items-center justify-center gap-3"
          >
            {loading ? <PI.ArrowClockwise size={18} className="animate-spin" /> : 'Autenticar Acceso'}
          </button>
        </form>
        
        <p className="text-center text-gray-600 text-[9px] font-bold uppercase tracking-widest mt-12">
            © 2026 OPTIMA CAREER MENTOR — SISTEMA DE GESTIÓN PROPIA
        </p>
      </div>
    </div>
  )
}

// ─── Overview Tab ────────────────────────────────────────────────────────────

function OverviewTab({ stats }) {
  return (
    <div className="space-y-8 max-w-6xl">
      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard label="Usuarios totales"  value={stats.totalUsers}    sub="Registrados"   icon={PI.UsersThree}    color="blue"   />
        <KpiCard label="Perfiles Full"     value={stats.conOnboarding} sub="Con onboarding" icon={PI.CheckCircle} color="green"  />
        <KpiCard label="Administradores"   value={stats.admins}        sub="Accesos nivel 1" icon={PI.UserCircle} color="purple" />
        <KpiCard label="Impacto Total"     value={stats.totalUsage}    sub="CVs optimizados" icon={PI.ChartBar} color="amber"  />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Gráfico de Planes */}
        <div className="lg:col-span-2 bg-[#111827] rounded-3xl p-8 border border-gray-800 shadow-2xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-bold text-white text-lg">Distribución de Ingresos</h3>
              <p className="text-xs text-gray-500 mt-1">Suscripciones activas por nivel</p>
            </div>
            <PI.Coins size={24} className="text-blue-500/50" />
          </div>
          
          <div className="space-y-8">
            {Object.entries(stats.planes).map(([plan, count]) => (
              <div key={plan} className="relative">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-400">{plan || 'Gratuito'}</span>
                  <span className="text-sm font-black text-white">{count} usuarios</span>
                </div>
                <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                  <div
                  className={`h-full rounded-full transition-all duration-1000 ${
                    plan === 'trimestral' ? 'bg-gradient-to-r from-amber-500 to-yellow-500' :
                    plan === 'mensual'    ? 'bg-gradient-to-r from-blue-600 to-cyan-600' :
                    plan === 'semanal'    ? 'bg-gradient-to-r from-emerald-500 to-teal-500' :
                    'bg-gray-600'
                  }`}
                  style={{ width: `${stats.totalUsers ? (count / stats.totalUsers) * 100 : 0}%` }}
                />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Listado de Países */}
        <div className="bg-[#111827] rounded-3xl p-8 border border-gray-800 shadow-2xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-white text-lg">Presencia Global</h3>
            <PI.House size={24} className="text-emerald-500/50" />
          </div>
          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {Object.entries(stats.paises).sort((a,b) => b[1] - a[1]).map(([pais, count]) => (
              <div key={pais} className="flex items-center justify-between p-3 rounded-2xl bg-gray-800/30 border border-gray-800/50 hover:bg-gray-800/50 transition-colors">
                <span className="text-xs font-medium text-gray-300">{pais || 'No detectado'}</span>
                <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Waitlist Tab ────────────────────────────────────────────────────────────

function WaitlistTab({ leads, views, events, onRefresh }) {
  const [search, setSearch] = useState('')

  const conversionRate = views > 0 ? ((leads.length / views) * 100).toFixed(1) : 0
  const simCount = events?.filter(e => e.event_name === 'simulation_completed').length || 0

  // Breakdown por país
  const porPais = leads.reduce((acc, l) => {
    const k = l.pais || 'Desconocido'
    acc[k] = (acc[k] || 0) + 1
    return acc
  }, {})
  const topPaises = Object.entries(porPais).sort((a, b) => b[1] - a[1]).slice(0, 6)

  // Breakdown por situación
  const SITUACION_LABEL = {
    'Estoy desempleada/o': 'Desempleada/o',
    'Empleada/o pero buscando alternativas': 'Buscando alternativas',
    'Quiero optimizar mi perfil para futuro': 'Optimizar perfil',
  }
  const porSituacion = leads.reduce((acc, l) => {
    const k = SITUACION_LABEL[l.situacion] || l.situacion || 'No especificada'
    acc[k] = (acc[k] || 0) + 1
    return acc
  }, {})

  // Registros últimos 7 días
  const hoy = new Date()
  const ultimos7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(hoy); d.setDate(hoy.getDate() - (6 - i))
    const key = d.toISOString().slice(0, 10)
    const count = leads.filter(l => l.created_at?.slice(0, 10) === key).length
    return { label: d.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric' }), count }
  })
  const maxDay = Math.max(...ultimos7.map(d => d.count), 1)

  // Exportar CSV
  const exportCSV = () => {
    const header = 'Nombre,Apellido,Email,País,Teléfono,Situación,Fecha\n'
    const rows = leads.map(l =>
      [l.nombre, l.apellido, l.email, l.pais, l.telefono, l.situacion, fmtDate(l.created_at)].join(',')
    ).join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'waitlist_leads.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const filtered = leads.filter(l =>
    !search || [l.nombre, l.apellido, l.email, l.pais].join(' ').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-8 max-w-6xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white">Lista de Espera</h2>
          <p className="text-gray-400 text-sm mt-1">Leads capturados desde la Landing Page</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={exportCSV} className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-xl border border-gray-700 transition-all">
            <PI.DownloadSimple size={15} /> Exportar CSV
          </button>
          <button onClick={onRefresh} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl border border-gray-700 transition-colors">
            <PI.ArrowsClockwise size={18} />
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Total Leads" value={leads.length} icon={PI.UsersThree} color="blue" />
        <KpiCard label="Visitas Landing" value={views} icon={PI.Eye} color="purple" />
        <KpiCard label="Conversión" value={`${conversionRate}%`} sub="Visitas → Leads" icon={PI.Target} color="green" />
        <KpiCard label="Simulaciones" value={simCount} icon={PI.Robot} color="amber" />
      </div>

      {/* Fila: Actividad últimos 7 días + Breakdown situación */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Barras últimos 7 días */}
        <div className="bg-[#111827] rounded-3xl p-6 border border-gray-800">
          <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-6">Registros últimos 7 días</h3>
          <div className="flex items-end gap-2 h-32">
            {ultimos7.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] font-bold text-white">{d.count > 0 ? d.count : ''}</span>
                <div className="w-full rounded-t-lg bg-teal-500/20 border border-teal-500/30 transition-all"
                  style={{ height: `${Math.max((d.count / maxDay) * 100, d.count > 0 ? 8 : 4)}%` }} />
                <span className="text-[9px] text-gray-600 text-center leading-tight">{d.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Breakdown situación */}
        <div className="bg-[#111827] rounded-3xl p-6 border border-gray-800">
          <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-6">Por Situación</h3>
          <div className="space-y-3">
            {Object.entries(porSituacion).map(([label, count]) => (
              <div key={label}>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-gray-300 truncate">{label}</span>
                  <span className="text-white ml-2">{count}</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all"
                    style={{ width: `${(count / leads.length) * 100}%` }} />
                </div>
              </div>
            ))}
            {Object.keys(porSituacion).length === 0 && <p className="text-gray-600 text-xs">Sin datos</p>}
          </div>
        </div>
      </div>

      {/* Top países */}
      {topPaises.length > 0 && (
        <div className="bg-[#111827] rounded-3xl p-6 border border-gray-800">
          <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-5">Top Países</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {topPaises.map(([pais, count]) => (
              <div key={pais} className="flex items-center justify-between bg-gray-800/50 rounded-2xl px-4 py-3 border border-gray-700/50">
                <span className="text-sm font-semibold text-gray-300">{pais}</span>
                <span className="text-sm font-black text-white bg-teal-500/20 text-teal-400 px-2.5 py-0.5 rounded-lg">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabla */}
      <div className="bg-[#111827] rounded-3xl border border-gray-800 shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800 flex items-center gap-3">
          <PI.MagnifyingGlass size={16} className="text-gray-500 shrink-0" />
          <input
            type="text"
            placeholder="Buscar por nombre, email o país..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 focus:outline-none"
          />
          {search && <button onClick={() => setSearch('')} className="text-gray-500 hover:text-white"><PI.X size={14} /></button>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0B0F1A] border-b border-gray-800 text-[10px] uppercase font-black tracking-widest text-gray-500">
                <th className="px-6 py-4">#</th>
                <th className="px-6 py-4">Usuario</th>
                <th className="px-6 py-4">Situación</th>
                <th className="px-6 py-4">País / Tel</th>
                <th className="px-6 py-4 text-right">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead, idx) => (
                <tr key={lead.id} className="border-b border-gray-800/50 hover:bg-gray-800/40 transition-colors">
                  <td className="px-6 py-4 text-xs text-gray-600 font-mono">{idx + 1}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                        <span className="text-emerald-400 font-black text-sm">{lead.nombre?.[0]?.toUpperCase()}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white truncate">{lead.nombre} {lead.apellido}</p>
                        <a href={`mailto:${lead.email}`} className="text-[10px] text-teal-500 hover:text-teal-400 truncate font-medium block">{lead.email}</a>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-gray-800 border border-gray-700 text-gray-300">
                      {SITUACION_LABEL[lead.situacion] || lead.situacion || '—'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs font-bold text-white">{lead.pais || '—'}</p>
                    <p className="text-[10px] text-gray-500 font-mono">{lead.telefono || '—'}</p>
                  </td>
                  <td className="px-6 py-4 text-right text-[10px] font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    {fmtDate(lead.created_at)}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm font-medium text-gray-600">
                    {leads.length === 0 ? 'Aún no hay registros en la lista de espera.' : 'Sin resultados para la búsqueda.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-800 text-[10px] font-bold text-gray-600 uppercase tracking-widest">
            {filtered.length} de {leads.length} registros
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Users Tab ───────────────────────────────────────────────────────────────

function UserRow({ u, onEdit, onView }) {
  const nombre = [u.nombre1, u.nombre2, u.apellido1, u.apellido2].filter(Boolean).join(' ') || '—'
  const inicial = (u.nombre1 || u.email_principal || '?')[0]?.toUpperCase()
  
  return (
    <tr className="border-b border-gray-800/50 hover:bg-gray-800/40 transition-colors group">
      <td className="px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500/10 to-violet-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <span className="text-blue-400 font-black text-sm">{inicial}</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-white truncate">{nombre}</p>
            <p className="text-[10px] text-gray-500 truncate font-medium">{u.email_principal || 'Sin dirección de correo'}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
          u.plan === 'trimestral' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
          u.plan === 'mensual'    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
          u.plan === 'semanal'    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
          'bg-gray-800 text-gray-400 border border-gray-700'
        }`}>
          {u.plan || 'free'}
          {u.plan === 'semanal' && u.plan_expires_at && (
            <span className="ml-1 opacity-70">· exp {new Date(u.plan_expires_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}</span>
          )}
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
           <PI.House size={14} className="text-gray-600" />
           <span className="text-xs text-gray-300 font-medium">{u.pais || '—'}</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center text-[10px] font-bold">
            <span className="text-gray-500">CONSUMO</span>
            <span className="text-blue-400">
              {u.cv_optimizer_count || 0}/1 CV · {u.cv_match_count || 0}/3 match
            </span>
          </div>
          <div className="bg-gray-800 rounded-full h-1.5 w-24 overflow-hidden border border-gray-700">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all"
              style={{ width: `${Math.min(100, ((u.usage_count || 0) / Math.max(1, u.plan === 'starter' ? 20 : 3)) * 100)}%` }} />
          </div>
          {/* Trial expirado */}
          {(!u.plan || u.plan === 'free') && u.free_trial_expires_at && new Date(u.free_trial_expires_at) < new Date() && (
            <span className="text-[9px] text-amber-500 font-bold uppercase">Trial expirado</span>
          )}
        </div>
      </td>
      <td className="px-6 py-4">
        {u.role === 'super_admin' ? (
          <div className="flex items-center gap-1 text-purple-400">
            <PI.UserCircle size={16} weight="fill" />
            <span className="text-[10px] font-black uppercase">Super Admin</span>
          </div>
        ) : u.role === 'company_admin' ? (
          <div className="flex items-center gap-1 text-blue-400">
            <PI.Briefcase size={16} weight="fill" />
            <span className="text-[10px] font-black uppercase">Empresa</span>
          </div>
        ) : (
          <span className="text-[10px] font-bold text-gray-600 uppercase">Usuario</span>
        )}
      </td>
      <td className="px-6 py-4">
        <div className={`flex items-center gap-1.5 ${u.suspended ? 'text-red-400' : 'text-emerald-400'}`}>
          <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${u.suspended ? 'bg-red-400' : 'bg-emerald-400'}`} />
          <span className="text-[10px] font-black uppercase tracking-widest">{u.suspended ? 'Bloqueado' : 'Activo'}</span>
        </div>
      </td>
      <td className="px-6 py-4 text-[10px] font-medium text-gray-500">{fmtDate(u.created_at)}</td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => onEdit(u)}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-all"
            title="Ajustes rápidos"
          >
            <PI.UserCircle size={18} />
          </button>
          <button 
            onClick={() => onView(u)}
            className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest bg-blue-600/10 text-blue-400 border border-blue-500/20 rounded-lg hover:bg-blue-600 hover:text-white transition-all"
          >
            Detalle
          </button>
        </div>
      </td>
    </tr>
  )
}

function UserEditModal({ user: u, onClose, onSave }) {
  const [form, setForm] = useState({
    plan:               u.plan || 'free',
    usage_count:        u.usage_count        || 0,
    cv_optimizer_count: u.cv_optimizer_count || 0,
    cv_match_count:     u.cv_match_count     || 0,
    role:               u.role || 'user',
    suspended:          u.suspended || false,
  })
  const [saving, setSaving]         = useState(false)
  const [deleting, setDeleting]     = useState(false)
  const [waitingOTP, setWaitingOTP] = useState(false)  // Step 1: esperando OTP
  const [otpCode, setOtpCode]       = useState('')     // Step 2: usuario ingresa OTP
  const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

  // Step 1: Solicitar OTP
  const handleDeleteRequest = async () => {
    const confirmed = window.confirm(
      `⚠️¿Eliminar permanentemente a "${u.email_principal || u.id}"?\n\nEsta acción no se puede deshacer. Se enviará un código OTP a tu email.`
    )
    if (!confirmed) return

    setDeleting(true)
    try {
      const { supabase } = await import('../services/authService')
      const { data: { session: s } } = await supabase.auth.getSession()
      if (!s?.access_token) {
        alert('No hay sesión activa. Inicia sesión nuevamente.')
        setDeleting(false)
        return
      }

      const response = await fetch(`${API}/api/admin/users/delete-otp-request/${u.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${s.access_token}`,
          'Content-Type': 'application/json'
        },
      })

      const body = await response.json()

      if (response.ok) {
        setWaitingOTP(true)
        setOtpCode('')
        alert(body.message || 'OTP enviado a tu email')
      } else {
        alert('Error: ' + (body.error || 'No se pudo enviar OTP'))
      }
    } catch (err) {
      console.error('Error en handleDeleteRequest:', err)
      alert('Error: ' + err.message)
    } finally {
      setDeleting(false)
    }
  }

  // Step 2: Confirmar con OTP y ejecutar borrado
  const handleDeleteConfirm = async () => {
    if (!otpCode || otpCode.length !== 6) {
      alert('Ingresa un código OTP válido (6 dígitos)')
      return
    }

    const confirmed = window.confirm('⚠️ Esta es tu última oportunidad de cancelar el borrado permanente.')
    if (!confirmed) return

    setDeleting(true)
    try {
      const { supabase } = await import('../services/authService')
      const { data: { session: s } } = await supabase.auth.getSession()
      if (!s?.access_token) {
        alert('No hay sesión activa.')
        setDeleting(false)
        return
      }

      const response = await fetch(`${API}/api/admin/users/${u.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${s.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ otp: otpCode }),
      })

      const body = await response.json()

      if (response.ok) {
        alert('✅ Usuario eliminado permanentemente. Auditado para compliance.')
        onSave()
        onClose()
      } else {
        alert('Error: ' + (body.error || 'No se pudo eliminar'))
      }
    } catch (err) {
      console.error('Error en handleDeleteConfirm:', err)
      alert('Error: ' + err.message)
    } finally {
      setDeleting(false)
    }
  }

  const handleCancelOTP = () => {
    setWaitingOTP(false)
    setOtpCode('')
  }

  const handleSave = async () => {
    setSaving(true)
    const payload = { ...form }
    // Al asignar plan semanal, establecer expiración a 7 días desde ahora
    if (form.plan === 'semanal' && u.plan !== 'semanal') {
      payload.plan_expires_at = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString()
    }
    // Al degradar a free, limpiar expiración de plan de pago
    if (form.plan === 'free') {
      payload.plan_expires_at = null
    }
    const { error } = await db.from('profiles').update(payload).eq('id', u.id)
    if (!error) onSave()
    setSaving(false)
    onClose()
  }

  const Toggle = ({ label, field, color = 'blue' }) => {
    const activeColor = {
      blue:   'bg-blue-600',
      purple: 'bg-purple-600',
      red:    'bg-red-600',
    }[color]
    
    return (
      <div className="flex items-center justify-between py-2 px-4 rounded-2xl bg-gray-800/20 border border-gray-800/50">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{label}</span>
        <button
          onClick={() => setForm(f => ({ ...f, [field]: !f[field] }))}
          className={`w-12 h-6 rounded-full transition-all duration-300 relative ${form[field] ? activeColor : 'bg-gray-700'}`}
        >
          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-xl transition-all duration-300 ${form[field] ? 'translate-x-7' : 'translate-x-1'}`} />
        </button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[70] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#111827] border border-gray-800 rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
                <PI.UserCircle size={24} weight="duotone" className="text-blue-400" />
            </div>
            <div>
                <h3 className="font-black text-white uppercase tracking-tight">Ajustes de Cuenta</h3>
                <p className="text-[10px] text-gray-500 font-bold uppercase truncate max-w-[180px]">{u.email_principal || u.id}</p>
            </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Nivel de Suscripción</label>
            <select 
              value={form.plan} 
              onChange={e => setForm(f => ({ ...f, plan: e.target.value }))}
              className="w-full bg-gray-950 border border-gray-800 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-bold transition-all"
            >
              <option value="free">Candidato Free</option>
              <option value="semanal">Semanal (7 días)</option>
              <option value="mensual">Mensual</option>
              <option value="trimestral">Trimestral</option>
            </select>
          </div>
          
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Usos de IA (Análisis)</label>
            <div className="flex items-center gap-3">
                <input 
                  type="number" min="0" value={form.usage_count}
                  onChange={e => setForm(f => ({ ...f, usage_count: parseInt(e.target.value) || 0 }))}
                  className="flex-1 bg-gray-950 border border-gray-800 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-bold" 
                />
                <button 
                    onClick={() => setForm(f => ({ ...f, usage_count: 0 }))}
                    className="p-3 bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-2xl transition-all"
                    title="Resetear a cero"
                >
                    <PI.ArrowClockwise size={18} />
                </button>
            </div>
          </div>

          {/* Contadores granulares */}
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">CV Optimizer (usado/1)</label>
            <div className="flex items-center gap-3">
              <input
                type="number" min="0" max="99" value={form.cv_optimizer_count}
                onChange={e => setForm(f => ({ ...f, cv_optimizer_count: parseInt(e.target.value) || 0 }))}
                className="flex-1 bg-gray-950 border border-gray-800 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-bold"
              />
              <button onClick={() => setForm(f => ({ ...f, cv_optimizer_count: 0 }))}
                className="p-3 bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-2xl transition-all" title="Resetear">
                <PI.ArrowClockwise size={18} />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">CV Match / Compatib. (usado/3)</label>
            <div className="flex items-center gap-3">
              <input
                type="number" min="0" max="99" value={form.cv_match_count}
                onChange={e => setForm(f => ({ ...f, cv_match_count: parseInt(e.target.value) || 0 }))}
                className="flex-1 bg-gray-950 border border-gray-800 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-bold"
              />
              <button onClick={() => setForm(f => ({ ...f, cv_match_count: 0 }))}
                className="p-3 bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-2xl transition-all" title="Resetear">
                <PI.ArrowClockwise size={18} />
              </button>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider mb-2 block font-semibold">Rol</label>
              <select
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white hover:border-gray-600 transition-colors"
              >
                <option value="user">Usuario</option>
                <option value="company_admin">Admin de Empresa</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>
            <Toggle label="Bloquear Cuenta"   field="suspended" color="red"    />
          </div>
        </div>

        <div className="mt-8 space-y-2">
          {/* OTP Input (aparece después de solicitar OTP) */}
          {waitingOTP && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 space-y-3">
              <div className="flex items-start gap-3">
                <PI.Warning size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-amber-500 text-xs font-bold uppercase">Se envió OTP a tu email</p>
                  <p className="text-gray-400 text-xs mt-1">Ingresa el código para confirmar el borrado.</p>
                </div>
              </div>
              <input
                type="text"
                maxLength="6"
                value={otpCode}
                onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full bg-gray-950 border border-amber-500/50 rounded-xl px-4 py-2 text-center text-2xl font-black text-white placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500/50 tracking-[0.5em]"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleCancelOTP}
                  disabled={deleting}
                  className="flex-1 px-3 py-2 rounded-xl border border-gray-800 text-gray-400 text-xs font-bold uppercase tracking-widest hover:bg-gray-800 disabled:opacity-50 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={deleting || otpCode.length !== 6}
                  className="flex-1 px-3 py-2 rounded-xl bg-red-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-red-500 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  <PI.Trash size={12} />
                  {deleting ? 'Borrando...' : 'Confirmar'}
                </button>
              </div>
            </div>
          )}

          {/* Botón de eliminar — zona de peligro */}
          {!waitingOTP && (
            <button
              onClick={handleDeleteRequest}
              disabled={deleting}
              className="w-full px-4 py-2.5 rounded-2xl border border-red-900/50 text-red-500 text-xs font-black uppercase tracking-widest hover:bg-red-950/40 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <PI.Trash size={14} />
              {deleting ? 'Enviando OTP...' : 'Eliminar usuario permanentemente'}
            </button>
          )}

          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 px-4 py-3 rounded-2xl border border-gray-800 text-gray-400 text-xs font-black uppercase tracking-widest hover:bg-gray-800 hover:text-white transition-all">
              Cerrar
            </button>
            <button onClick={handleSave} disabled={saving || waitingOTP}
              className="flex-1 px-4 py-3 rounded-2xl bg-blue-600 text-white text-xs font-black uppercase tracking-widest hover:bg-blue-500 shadow-lg shadow-blue-900/20 disabled:opacity-50 transition-all">
              {saving ? 'Guardando...' : 'Aplicar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function UsersTab({ users, onRefresh }) {
  const [search, setSearch]     = useState('')
  const [editUser, setEditUser] = useState(null)
  const [viewUser, setViewUser] = useState(null)
  const [page, setPage]         = useState(0)
  const PER_PAGE = 10

  const filtered = users.filter(u => {
    const q = search.toLowerCase()
    return !q
      || (u.email_principal || '').toLowerCase().includes(q)
      || [u.nombre1, u.nombre2, u.apellido1, u.apellido2].filter(Boolean).join(' ').toLowerCase().includes(q)
      || (u.pais || '').toLowerCase().includes(q)
  })

  const paginated  = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE)
  const totalPages = Math.ceil(filtered.length / PER_PAGE)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 bg-[#111827] p-4 rounded-3xl border border-gray-800 shadow-xl">
        <div className="flex-1 relative">
          <PI.MagnifyingGlass size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text" placeholder="Filtrar por nombre, email o país..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(0) }}
            className="w-full bg-gray-950/50 border border-gray-800 rounded-2xl pl-12 pr-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 placeholder:text-gray-700 transition-all font-medium"
          />
        </div>
        <button onClick={onRefresh}
          className="bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 text-xs font-black uppercase tracking-widest px-6 py-3 rounded-2xl border border-blue-500/20 transition-all flex items-center gap-2">
          <PI.ArrowClockwise size={16} /> Actualizar
        </button>
      </div>

      <div className="bg-[#111827] rounded-3xl border border-gray-800 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-900/50 border-b border-gray-800">
              <tr>
                {['Candidato', 'Suscripción', 'País', 'Consumo IA', 'Rol', 'Estado', 'Fecha Registro', 'Gestión'].map(h => (
                  <th key={h} className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {paginated.length === 0
                ? <tr><td colSpan={8} className="px-6 py-20 text-center text-gray-600 text-sm font-medium uppercase tracking-widest">No se detectaron usuarios con este criterio</td></tr>
                : paginated.map(u => <UserRow key={u.id} u={u} onEdit={setEditUser} onView={setViewUser} />)
              }
            </tbody>
          </table>
        </div>
        
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-8 py-4 bg-gray-900/30 border-t border-gray-800">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Mostrando {paginated.length} de {filtered.length} perfiles</span>
            <div className="flex gap-1.5">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button key={i} onClick={() => setPage(i)}
                  className={`min-w-[32px] h-8 rounded-xl text-[10px] font-black transition-all border ${
                    i === page 
                      ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-900/20' 
                      : 'text-gray-500 border-gray-800 hover:text-white hover:border-gray-600'
                  }`}>
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {editUser && (
        <UserEditModal user={editUser} onClose={() => setEditUser(null)} onSave={onRefresh} />
      )}
      
      {viewUser && (
        <div className="fixed inset-0 z-[60] flex justify-end">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setViewUser(null)} />
            <div className="relative w-full max-w-lg bg-[#111827] border-l border-gray-800 p-8 overflow-y-auto animate-slide-in-right">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl font-black text-white uppercase tracking-tight">Ficha de Candidato</h2>
                    <button onClick={() => setViewUser(null)} className="p-2 hover:bg-gray-800 rounded-xl transition-colors">
                        <PI.SignOut size={24} className="rotate-180 text-gray-500" />
                    </button>
                </div>
                
                <div className="space-y-6">
                    <div className="flex items-center gap-6 p-6 rounded-3xl bg-gray-950/50 border border-gray-800">
                        <div className="w-20 h-20 rounded-3xl bg-blue-600 flex items-center justify-center text-3xl font-black text-white shadow-2xl">
                            {viewUser.nombre1?.[0]}
                        </div>
                        <div>
                             <h3 className="text-2xl font-bold text-white capitalize">{viewUser.nombre1} {viewUser.apellido1}</h3>
                             <p className="text-blue-400 font-medium">{viewUser.email_principal}</p>
                             <div className="mt-2 flex gap-2">
                                <Badge color={viewUser.plan === 'pro' ? 'purple' : 'blue'}>{viewUser.plan || 'free'}</Badge>
                             </div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-2xl bg-gray-800/30 border border-gray-800">
                             <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">País</p>
                             <p className="text-sm text-gray-200 font-semibold">{viewUser.pais || '—'}</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-gray-800/30 border border-gray-800">
                             <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Ciudad</p>
                             <p className="text-sm text-gray-200 font-semibold">{viewUser.ciudad || '—'}</p>
                        </div>
                    </div>

                    <div className="p-6 rounded-3xl bg-gray-800/30 border border-gray-800">
                         <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Información Profesional</h4>
                         <div className="space-y-4">
                            <div>
                                <p className="text-[10px] font-bold text-gray-600 mb-1 uppercase">Aspiración Salarial</p>
                                <p className="text-lg font-black text-white">{viewUser.salario_esperado || 'No definida'}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-600 mb-1 uppercase">Área / Puesto</p>
                                <p className="text-sm text-gray-200 font-bold">{viewUser.area || '—'}</p>
                            </div>
                         </div>
                    </div>
                    
                    <div className="flex gap-4">
                         <button 
                            className="flex-1 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-blue-900/20"
                            onClick={() => { setEditUser(viewUser); setViewUser(null); }}
                         >
                            Configurar Cuenta
                         </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  )
}

// ─── Analytics Tab ───────────────────────────────────────────────────────────

function AnalyticsTab({ users }) {
  const monthlyData = (() => {
    const map = {}
    users.forEach(u => {
      if (!u.created_at) return
      const key = new Date(u.created_at).toLocaleDateString('es-MX', { month: 'short' })
      map[key] = (map[key] || 0) + 1
    })
    return Object.entries(map).slice(-6)
  })()

  const maxVal = Math.max(...monthlyData.map(([, v]) => v), 1)

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-[#111827] rounded-3xl p-8 border border-gray-800 shadow-2xl">
          <div className="flex items-center justify-between mb-8">
             <h3 className="font-bold text-white text-lg">Crecimiento Mensual</h3>
             <PI.ChartBar size={24} className="text-blue-500/50" />
          </div>
          {monthlyData.length === 0
            ? <div className="h-48 flex items-center justify-center text-gray-600 uppercase text-[10px] font-black tracking-widest">Sin datos</div>
            : (
              <div className="flex items-end gap-4 h-48 px-4">
                {monthlyData.map(([label, val]) => (
                  <div key={label} className="flex-1 flex flex-col items-center gap-2 group">
                    <span className="text-[10px] font-black text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">{val}</span>
                    <div className="w-full bg-gradient-to-t from-blue-600/20 to-blue-500 rounded-xl transition-all hover:scale-x-110 active:scale-95" style={{ height: `${(val / maxVal) * 100}%`, minHeight: 8 }} />
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter truncate w-full text-center">{label}</span>
                  </div>
                ))}
              </div>
            )
          }
        </div>

        <div className="bg-[#111827] rounded-3xl p-8 border border-gray-800 shadow-2xl">
           <div className="flex items-center justify-between mb-8">
             <h3 className="font-bold text-white text-lg">Nivel de Adopción</h3>
             <PI.ChartBar size={24} className="text-purple-500/50" />
           </div>
           <div className="space-y-6">
              {[
                { label: 'Conversión Total', val: '12.4%', color: 'bg-blue-500' },
                { label: 'Retención (30d)', val: '84%', color: 'bg-emerald-500' },
                { label: 'Uso de Mentora', val: '68%', color: 'bg-purple-500' },
              ].map(i => (
                <div key={i.label} className="space-y-2">
                   <div className="flex justify-between items-end">
                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{i.label}</span>
                      <span className="text-sm font-black text-white">{i.val}</span>
                   </div>
                   <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div className={`h-full ${i.color} rounded-full`} style={{ width: i.val }} />
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  )
}

function SubscriptionsTab({ users }) {
  const agotados   = users.filter(u => (u.usage_count || 0) >= 2).length
  const conPlan    = users.filter(u => u.plan && u.plan !== 'free').length
  const conversion = users.length ? ((conPlan / users.length) * 100).toFixed(1) : 0

  return (
    <div className="space-y-8 max-w-5xl">
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <KpiCard label="Candidatos Hot" value={agotados} sub="Agotaron créditos gratuitos" icon={PI.Warning} color="amber" />
          <KpiCard label="Tasa de Cierre" value={`${conversion}%`} sub="Conversión Free → Premium" icon={PI.Coins} color="green" />
       </div>

       <div className="bg-[#111827] rounded-3xl p-8 border border-gray-800 shadow-2xl">
          <div className="flex items-center justify-between mb-8">
             <h3 className="font-bold text-white text-lg">Resumen Financiero</h3>
             <PI.Sparkle size={24} className="text-gray-700" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
             <div className="space-y-4">
                {[
                  { l: 'Pro Mensual',   v: users.filter(u => u.plan === 'mensual').length },
                  { l: 'Pro Trimestral', v: users.filter(u => u.plan === 'trimestral').length },
                  { l: 'Pro Semanal',   v: users.filter(u => u.plan === 'semanal').length },
                  { l: 'Gratuitos',     v: users.filter(u => !u.plan || u.plan === 'free').length },
                  { l: 'Trial expirado', v: users.filter(u => (!u.plan || u.plan === 'free') && u.free_trial_expires_at && new Date(u.free_trial_expires_at) < new Date()).length },
                ].map(item => (
                  <div key={item.l} className="flex justify-between items-center p-4 rounded-2xl bg-gray-800/20 border border-gray-800/50">
                     <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">{item.l}</span>
                     <span className="text-lg font-black text-white">{item.v}</span>
                  </div>
                ))}
             </div>
             
             <div className="p-8 rounded-[2rem] bg-gradient-to-br from-blue-600/10 to-violet-600/10 border border-blue-500/20 flex flex-col justify-center items-center text-center">
                <PI.Coins size={48} weight="duotone" className="text-blue-400 mb-4" />
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-2">Ingreso Proyectado</p>
                <p className="text-4xl font-black text-white">$ {(
                  (users.filter(u => u.plan === 'semanal').length    *  9) +
                  (users.filter(u => u.plan === 'mensual').length    * 29) +
                  (users.filter(u => u.plan === 'trimestral').length * 69)
                ).toLocaleString()}</p>
                <p className="text-[10px] text-gray-500 mt-4 font-bold uppercase">Actualizado hace unos instantes</p>
             </div>
          </div>
       </div>
    </div>
  )
}

// ─── Codigos Tab ──────────────────────────────────────────────────────────────

const PLAN_COLORS = {
  semanal:    'text-emerald-400 bg-emerald-400/10 border-emerald-500/20',
  mensual:    'text-blue-400 bg-blue-400/10 border-blue-500/20',
  trimestral: 'text-amber-400 bg-amber-400/10 border-amber-500/20',
}

function generarCodigo() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let r = ''
  for (let i = 0; i < 8; i++) r += chars[Math.floor(Math.random() * chars.length)]
  return r
}

function CodigosTab() {
  const [codigos, setCodigos]         = useState([])
  const [redenidos, setRedimidos]     = useState([])
  const [loadingC, setLoadingC]       = useState(true)
  const [showForm, setShowForm]       = useState(false)
  const [saving, setSaving]           = useState(false)
  const [formErr, setFormErr]         = useState('')
  const [form, setForm] = useState({
    code:      generarCodigo(),
    plan:      'mensual',
    max_uses:  1,
    expires_at: '',
    notes:     '',
  })

  const fetchAll = async () => {
    setLoadingC(true)
    const [codsRes, redsRes] = await Promise.all([
      db.from('access_codes').select('*, code_redemptions(count)').order('created_at', { ascending: false }),
      db.from('code_redemptions')
        .select('*, access_codes(code, plan), profiles(email_principal)')
        .order('redeemed_at', { ascending: false })
        .limit(30),
    ])
    if (codsRes.data) setCodigos(codsRes.data)
    if (redsRes.data) setRedimidos(redsRes.data)
    setLoadingC(false)
  }

  useEffect(() => { fetchAll() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.code.trim()) { setFormErr('Ingresa un código'); return }
    setSaving(true); setFormErr('')
    const payload = {
      code:      form.code.trim().toUpperCase(),
      plan:      form.plan,
      max_uses:  Math.max(1, parseInt(form.max_uses) || 1),
      expires_at: form.expires_at || null,
      notes:     form.notes || null,
    }
    const { error } = await db.from('access_codes').insert(payload)
    if (error) {
      setFormErr(error.code === '23505' ? 'Ya existe un código con ese nombre' : error.message)
    } else {
      setShowForm(false)
      setForm({ code: generarCodigo(), plan: 'mensual', max_uses: 1, expires_at: '', notes: '' })
      fetchAll()
    }
    setSaving(false)
  }

  const handleDeactivate = async (id) => {
    await db.from('access_codes').update({ is_active: false }).eq('id', id)
    fetchAll()
  }

  const totalRedimidos = redenidos.length
  const porPlan = redenidos.reduce((acc, r) => {
    const p = r.access_codes?.plan || 'N/A'
    acc[p] = (acc[p] || 0) + 1
    return acc
  }, {})

  return (
    <div className="space-y-8 max-w-5xl">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KpiCard label="Códigos activos"  value={codigos.filter(c => c.is_active).length}  icon={PI.Tag}         color="blue"   />
        <KpiCard label="Canjeados (total)" value={totalRedimidos}                          icon={PI.CheckCircle} color="green"  />
        <KpiCard label="Tipos de plan"    value={Object.keys(porPlan).join(' · ') || '—'}  icon={PI.Coins}       color="amber"  sub="por tipo de acceso" />
      </div>

      {/* Header + botón */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-black text-white tracking-tight uppercase">Códigos de Acceso</h3>
          <p className="text-xs text-gray-500 font-medium mt-1">Genera códigos que otorgan acceso semanal, mensual o trimestral</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-blue-900/20 shrink-0"
        >
          <PI.Plus size={16} weight="bold" /> Nuevo Código
        </button>
      </div>

      {/* Formulario de creación */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-[#111827] rounded-3xl p-8 border border-blue-500/20 shadow-2xl space-y-5">
          <h4 className="text-sm font-black text-white uppercase tracking-widest mb-2">Configurar nuevo código</h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Código */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest">Código</label>
              <div className="flex gap-2">
                <input
                  value={form.code}
                  onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                  maxLength={20}
                  className="flex-1 bg-gray-950 border border-gray-800 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-mono tracking-widest"
                />
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, code: generarCodigo() }))}
                  className="p-3 bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-2xl transition-all"
                  title="Generar aleatorio"
                >
                  <PI.ArrowClockwise size={18} />
                </button>
              </div>
            </div>

            {/* Plan */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest">Plan que otorga</label>
              <select
                value={form.plan}
                onChange={e => setForm(f => ({ ...f, plan: e.target.value }))}
                className="w-full bg-gray-950 border border-gray-800 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-bold"
              >
                <option value="semanal">Semanal (7 días)</option>
                <option value="mensual">Mensual (30 días)</option>
                <option value="trimestral">Trimestral (90 días)</option>
              </select>
            </div>

            {/* Usos máximos */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest">Usos máximos</label>
              <input
                type="number" min="1" max="9999"
                value={form.max_uses}
                onChange={e => setForm(f => ({ ...f, max_uses: e.target.value }))}
                className="w-full bg-gray-950 border border-gray-800 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-bold"
              />
            </div>

            {/* Vencimiento del código */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest">Vence el (opcional)</label>
              <input
                type="date"
                value={form.expires_at}
                onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))}
                className="w-full bg-gray-950 border border-gray-800 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-bold"
              />
            </div>
          </div>

          {/* Notas */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest">Notas internas (opcional)</label>
            <input
              type="text"
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Ej: Para campaña de LinkedIn marzo 2026"
              className="w-full bg-gray-950 border border-gray-800 rounded-2xl px-4 py-3 text-sm text-white placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          {formErr && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-red-400 text-xs font-bold">
              <PI.Warning size={16} /> {formErr}
            </div>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={() => setShowForm(false)}
              className="flex-1 py-3 rounded-2xl border border-gray-800 text-gray-400 text-xs font-black uppercase tracking-widest hover:bg-gray-800 hover:text-white transition-all">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-3 rounded-2xl bg-blue-600 text-white text-xs font-black uppercase tracking-widest hover:bg-blue-500 shadow-lg shadow-blue-900/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
              {saving ? <PI.ArrowClockwise size={14} className="animate-spin" /> : <PI.Plus size={14} />}
              {saving ? 'Creando...' : 'Crear Código'}
            </button>
          </div>
        </form>
      )}

      {/* Lista de códigos */}
      {loadingC ? (
        <div className="py-20 text-center text-gray-600 text-sm uppercase tracking-widest">Cargando...</div>
      ) : codigos.length === 0 ? (
        <div className="py-20 text-center bg-[#111827] rounded-[2.5rem] border border-gray-800 border-dashed">
          <PI.Tag size={64} weight="duotone" className="mx-auto text-gray-800 mb-6" />
          <p className="text-gray-500 font-bold uppercase tracking-widest text-sm mb-2">No hay códigos creados aún</p>
          <p className="text-[10px] text-gray-700 max-w-xs mx-auto">Haz clic en "Nuevo Código" para crear el primero.</p>
        </div>
      ) : (
        <div className="bg-[#111827] rounded-3xl border border-gray-800 overflow-hidden shadow-2xl">
          <table className="w-full text-left">
            <thead className="bg-gray-900/50 border-b border-gray-800">
              <tr>
                {['Código', 'Plan', 'Usos', 'Vence', 'Estado', 'Notas', ''].map(h => (
                  <th key={h} className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {codigos.map(c => (
                <tr key={c.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-mono font-black text-white tracking-widest text-sm">{c.code}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${PLAN_COLORS[c.plan] || 'text-gray-400 bg-gray-800 border-gray-700'}`}>
                      {c.plan}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold text-white">{c.uses_count}</span>
                    <span className="text-xs text-gray-500"> / {c.max_uses}</span>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-400 font-medium">
                    {c.expires_at ? new Date(c.expires_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <div className={`flex items-center gap-1.5 ${c.is_active ? 'text-emerald-400' : 'text-gray-600'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${c.is_active ? 'bg-emerald-400 animate-pulse' : 'bg-gray-600'}`} />
                      <span className="text-[10px] font-black uppercase">{c.is_active ? 'Activo' : 'Inactivo'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500 max-w-[160px] truncate">{c.notes || '—'}</td>
                  <td className="px-6 py-4">
                    {c.is_active && (
                      <button
                        onClick={() => handleDeactivate(c.id)}
                        className="text-[10px] font-black uppercase text-red-500 hover:text-red-400 transition-colors"
                      >
                        Desactivar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Últimas redenciones */}
      {redenidos.length > 0 && (
        <div>
          <h4 className="text-sm font-black text-white uppercase tracking-widest mb-4">Últimas redenciones</h4>
          <div className="bg-[#111827] rounded-3xl border border-gray-800 overflow-hidden shadow-2xl">
            <table className="w-full text-left">
              <thead className="bg-gray-900/50 border-b border-gray-800">
                <tr>
                  {['Usuario', 'Código', 'Plan', 'Fecha'].map(h => (
                    <th key={h} className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {redenidos.map(r => (
                  <tr key={r.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-4 text-xs text-gray-300 font-medium truncate max-w-[180px]">
                      {r.profiles?.email_principal || r.user_id.slice(0, 8) + '...'}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs font-bold text-white tracking-widest">
                      {r.access_codes?.code || '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${PLAN_COLORS[r.plan_granted] || 'text-gray-400 bg-gray-800 border-gray-700'}`}>
                        {r.plan_granted}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[10px] text-gray-500 font-medium">
                      {new Date(r.redeemed_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function EmpresasB2BTab() {
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showAdminModal, setShowAdminModal] = useState(false)
  const [newCompany, setNewCompany] = useState(null)
  const [creating, setCreating] = useState(false)
  const [assigningAdmin, setAssigningAdmin] = useState(false)

  useEffect(() => {
    fetchCompanies()
  }, [])

  const fetchCompanies = async () => {
    try {
      setLoading(true)
      const { data: { session } } = await db.auth.getSession()
      const response = await fetch(`${API}/api/admin/companies`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      })
      const json = await response.json()
      setCompanies(json.companies || [])
    } catch (err) {
      console.error('[EmpresasB2B] Error fetching companies:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCompany = async (name, email) => {
    try {
      setCreating(true)
      const { data: { session } } = await db.auth.getSession()
      const response = await fetch(`${API}/api/admin/companies`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email })
      })
      const json = await response.json()
      if (response.ok) {
        setNewCompany(json.company)
        setShowCreateModal(false)
        setShowAdminModal(true)
      } else {
        alert('Error creando empresa: ' + (json.error || 'Unknown error'))
      }
    } catch (err) {
      console.error('[EmpresasB2B] Error creating company:', err)
      alert('Error creando empresa')
    } finally {
      setCreating(false)
    }
  }

  const handleAssignAdmin = async (nombre, apellido, email) => {
    try {
      setAssigningAdmin(true)
      const { data: { session } } = await db.auth.getSession()
      const response = await fetch(`${API}/api/admin/companies/${newCompany.id}/admins`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ nombre, apellido, email })
      })
      const json = await response.json()
      if (response.ok) {
        setShowAdminModal(false)
        setNewCompany(null)
        await fetchCompanies()
      } else {
        alert('Error asignando admin: ' + (json.error || 'Unknown error'))
      }
    } catch (err) {
      console.error('[EmpresasB2B] Error assigning admin:', err)
      alert('Error asignando admin')
    } finally {
      setAssigningAdmin(false)
    }
  }

  const handleToggleActive = async (id, isActive) => {
    try {
      const { data: { session } } = await db.auth.getSession()
      const response = await fetch(`${API}/api/admin/companies/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_active: !isActive })
      })
      if (response.ok) {
        await fetchCompanies()
      }
    } catch (err) {
      console.error('[EmpresasB2B] Error toggling company:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-400">Cargando empresas...</div>
      </div>
    )
  }

  const activeCount = companies.filter(c => c.is_active).length

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <KpiCard
          label="Empresas activas"
          value={activeCount}
          sub="Clientes B2B"
          icon={PI.Buildings}
          color="blue"
        />
        <KpiCard
          label="Total de empresas"
          value={companies.length}
          sub="Registradas"
          icon={PI.Briefcase}
          color="green"
        />
      </div>

      {/* Tabla de Empresas */}
      <div className="bg-[#111827] rounded-3xl border border-gray-800 shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Empresas</h3>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors"
          >
            <PI.Plus size={16} weight="bold" />
            Nueva Empresa
          </button>
        </div>
        {companies.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-400 text-sm">
            Sin empresas registradas
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-900/50 border-b border-gray-800">
              <tr>
                {['Empresa', 'Email', 'Estado', 'Creada', 'Acciones'].map(h => (
                  <th key={h} className="px-6 py-3 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {companies.map(c => (
                <tr key={c.id} className="hover:bg-gray-900/20 transition-colors">
                  <td className="px-6 py-4 font-semibold text-gray-100">{c.name}</td>
                  <td className="px-6 py-4 text-gray-400">{c.email}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${c.is_active ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'}`}>
                      {c.is_active ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-xs">{c.created_at ? new Date(c.created_at).toLocaleDateString('es-ES') : '—'}</td>
                  <td className="px-6 py-4 space-x-2">
                    <button
                      onClick={() => handleToggleActive(c.id, c.is_active)}
                      className="text-xs px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-white transition-colors"
                    >
                      {c.is_active ? 'Desactivar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Paso 1: Crear Empresa */}
      {showCreateModal && (
        <CreateCompanyModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateCompany}
          loading={creating}
        />
      )}

      {/* Modal Paso 2: Asignar Admin */}
      {showAdminModal && newCompany && (
        <AssignAdminModal
          company={newCompany}
          onClose={() => {
            setShowAdminModal(false)
            setNewCompany(null)
          }}
          onSubmit={handleAssignAdmin}
          loading={assigningAdmin}
        />
      )}
    </div>
  )
}

function CreateCompanyModal({ onClose, onSubmit, loading }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name || !email) {
      alert('Completa todos los campos')
      return
    }
    onSubmit(name, email)
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[70] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#111827] border border-gray-800 rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl animate-fade-in" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-white mb-1">Nueva Empresa B2B</h2>
        <p className="text-xs text-gray-400 mb-6">Crea una nueva empresa cliente</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">Nombre</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm"
              placeholder="Acme Corp"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm"
              placeholder="empresa@acme.com"
            />
          </div>

          <div className="pt-4 space-y-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
            >
              {loading ? 'Creando...' : 'Crear empresa →'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold py-2.5 rounded-xl transition-colors text-sm"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function AssignAdminModal({ company, onClose, onSubmit, loading }) {
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [email, setEmail] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!nombre || !email) {
      alert('Completa nombre y email')
      return
    }
    onSubmit(nombre, apellido, email)
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[70] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#111827] border border-gray-800 rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl animate-fade-in" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-white mb-1">Asignar Administrador</h2>
        <p className="text-xs text-gray-400 mb-4">Empresa: <span className="font-semibold text-green-400">{company.name}</span> ✅</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">Nombre</label>
            <input
              type="text"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm"
              placeholder="Juan"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">Apellido</label>
            <input
              type="text"
              value={apellido}
              onChange={e => setApellido(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm"
              placeholder="Pérez"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm"
              placeholder="juan@acme.com"
            />
          </div>

          <div className="pt-4 space-y-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-700 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
            >
              {loading ? 'Asignando...' : 'Asignar Admin'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold py-2.5 rounded-xl transition-colors text-sm"
            >
              Saltar (hacerlo después)
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function SistemaTab() {
  const [status, setStatus]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied]   = useState('')

  const fetchStatus = async () => {
    setLoading(true)
    try {
      const { data: { session } } = await db.auth.getSession()
      const res = await fetch(`${API}/api/admin/system-status`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      })
      const data = await res.json()
      setStatus(data)
    } catch (err) {
      console.error('Error fetching system status:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchStatus() }, [])

  const copy = (text, key) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(''), 2000)
  }

  const SQL_COLUMNS = `-- Agregar columnas necesarias
alter table public.profiles
  add column if not exists email_principal text,
  add column if not exists is_admin boolean default false,
  add column if not exists suspended boolean default false,
  add column if not exists plan text default 'free',
  add column if not exists features_enabled jsonb default '{}';`

  const SQL_PROMO = `-- Habilitar sistema de cupones
CREATE TABLE IF NOT EXISTS public.promo_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    discount_pct INTEGER DEFAULT 0,
    plan_to_grant TEXT,
    max_uses INTEGER DEFAULT 1,
    current_uses INTEGER DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`

  const getStatusColor = (s) => {
    if (s === 'active' || s === 'configured') return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    if (s === 'error') return 'text-red-400 bg-red-500/10 border-red-500/20'
    return 'text-gray-500 bg-gray-500/10 border-gray-500/20'
  }

  return (
    <div className="space-y-10 max-w-5xl">
       {/* Sección de Auditoría en Vivo */}
       <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-black text-white tracking-tight uppercase">Auditoría de Conexiones</h3>
              <p className="text-xs text-gray-500 font-medium">Estado en tiempo real de integraciones externas</p>
            </div>
            <button 
              onClick={fetchStatus}
              disabled={loading}
              className="p-3 rounded-2xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-all border border-gray-700 disabled:opacity-50"
            >
              <PI.ArrowClockwise size={20} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading && !status ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-900/50 rounded-3xl border border-gray-800 animate-pulse" />
              ))
            ) : status && Object.entries(status).map(([key, info]) => (
              <div key={key} className="bg-[#111827] rounded-3xl p-6 border border-gray-800 shadow-xl group hover:border-gray-700 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-2xl bg-gray-800 border border-gray-700">
                    {key === 'database' ? <PI.Database size={24} className="text-blue-400" weight="duotone" /> :
                     key === 'ai'       ? <PI.Robot size={24} className="text-purple-400" weight="duotone" /> :
                     key === 'email'    ? <PI.EnvelopeOpen size={24} className="text-amber-400" weight="duotone" /> :
                                          <PI.ShieldCheck size={24} className="text-emerald-400" weight="duotone" />}
                  </div>
                  <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg border ${getStatusColor(info.status)}`}>
                    {info.status}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white mb-1">{info.name}</h4>
                <p className="text-[10px] font-mono text-gray-500 truncate">{info.details || 'No details available'}</p>
              </div>
            ))}
          </div>
       </div>

       {/* Sección de Scripts (Manteniendo lo anterior) */}
       <div className="pt-6 border-t border-gray-800">
          <div className="mb-6">
            <h3 className="text-xl font-black text-white tracking-tight uppercase">Scripts de Mantenimiento</h3>
            <p className="text-xs text-gray-500 font-medium font-bold">Herramientas críticas para la integridad de la base de datos</p>
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            {[
              { key: 'cols',  title: 'Estructura Table Profiles', sql: SQL_COLUMNS },
              { key: 'promo', title: 'Infraestructura de Cupones/Códigos', sql: SQL_PROMO },
            ].map(({ key, title, sql }) => (
              <div key={key} className="bg-[#111827] rounded-3xl p-6 border border-gray-800 shadow-xl overflow-hidden group">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-white uppercase tracking-tight text-xs text-gray-400">{title}</h3>
                  <button onClick={() => copy(sql, key)}
                    className="text-[10px] font-black uppercase tracking-widest bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white px-4 py-2 rounded-xl transition-all">
                    {copied === key ? '✓ Copiado' : 'Copiar Script'}
                  </button>
                </div>
                <pre className="bg-gray-950 text-blue-400 text-[11px] rounded-2xl p-5 overflow-x-auto font-mono leading-relaxed border border-gray-800/50">
                  {sql}
                </pre>
              </div>
            ))}
          </div>
       </div>

       <div className="p-8 rounded-[2.5rem] bg-amber-500/5 border border-amber-500/10 flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 shrink-0">
             <PI.Warning size={24} weight="duotone" />
          </div>
          <div>
             <h4 className="font-bold text-amber-500 mb-1">Cuidado Crítico</h4>
             <p className="text-xs text-gray-700 leading-relaxed font-bold">Estas operaciones modifican la estructura vital de Supabase. No las ejecutes si no estás seguro de lo que haces. Para escalar a miles de usuarios, asegúrate de que todos los índices estén creados.</p>
          </div>
       </div>
    </div>
  )
}

// ─── Dashboard Sub-components ───────────────────────────────────────────

function SidebarItem({ id, label, icon: Icon, active, onClick }) {
  return (
    <button
      onClick={() => onClick(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group ${
        active 
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' 
          : 'text-gray-400 hover:bg-gray-800 hover:text-white'
      }`}
    >
      <Icon size={20} weight={active ? 'fill' : 'duotone'} className={active ? 'text-white' : 'text-gray-500 group-hover:text-blue-400'} />
      <span className="flex-1 text-left">{label}</span>
      {active && <PI.ArrowRight size={14} weight="bold" className="text-white/60" />}
    </button>
  )
}

const TABS = [
  { id: 'overview',      label: 'Escritorio',     icon: PI.Kanban },
  { id: 'users',         label: 'Usuarios',       icon: PI.UsersThree },
  { id: 'suscripciones', label: 'Suscripciones',  icon: PI.Coins },
  { id: 'codigos',       label: 'Códigos',        icon: PI.Tag },
  { id: 'empresas',      label: 'Empresas B2B',  icon: PI.Buildings },
  { id: 'waitlist',      label: 'Lista de Espera', icon: PI.ListStar },
  { id: 'marketing',     label: 'Marketing Hub',  icon: PI.TrendUp },
  { id: 'analytics',     label: 'Métricas',       icon: PI.ChartBar },
  { id: 'sistema',       label: 'Configuración',  icon: PI.UserCircle },
]

function Dashboard({ adminUser, onLogout }) {
  const [tab, setTab]         = useState('overview')
  const [users, setUsers]     = useState([])
  const [loading, setLoading] = useState(true)

  const [waitlistLeads, setWaitlistLeads] = useState([])
  const [landingViews, setLandingViews] = useState(0)
  const [events, setEvents] = useState([])
  const [config, setConfig] = useState([])

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    const { data, error } = await db.from('profiles').select('*').order('created_at', { ascending: false })
    if (!error && data) setUsers(data)

    // Waitlist: usar API backend con token de admin y paginación
    try {
      const { data: { session: wSession } } = await db.auth.getSession()
      const wRes = await fetch(`${API}/api/waitlist?page=0&limit=50`, {
        headers: { 'Authorization': `Bearer ${wSession?.access_token}` }
      })
      const wJson = await wRes.json()
      if (wJson.leads) setWaitlistLeads(wJson.leads)
    } catch (_) {}

    const { data: sData } = await db.from('landing_stats').select('views').eq('id', 1).single()
    if (sData) setLandingViews(sData.views)

    const { data: eData } = await db.from('landing_events').select('*').order('created_at', { ascending: false })
    if (eData) setEvents(eData)

    const { data: cData } = await db.from('landing_config').select('*')
    if (cData) setConfig(cData)
    
    setLoading(false)
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const stats = {
    totalUsers:    users.length,
    conOnboarding: users.filter(u => u.nombre1).length,
    admins:        users.filter(u => u.role === 'super_admin' || u.role === 'company_admin').length,
    totalUsage:    users.reduce((s, u) => s + (u.usage_count || 0), 0),
    planes: users.reduce((acc, u) => { const k = u.plan || 'free'; acc[k] = (acc[k] || 0) + 1; return acc }, {}),
    paises: users.reduce((acc, u) => { if (u.pais) { acc[u.pais] = (acc[u.pais] || 0) + 1 }; return acc }, {}),
  }

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-gray-100 flex overflow-hidden">
      
      {/* Sidebar */}
      <aside className="w-64 bg-[#111827] border-r border-gray-800 flex flex-col shrink-0">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-violet-700 flex items-center justify-center shadow-lg shadow-blue-900/40">
            <span className="text-white font-black text-xl">A</span>
          </div>
          <div>
            <h2 className="font-bold text-sm tracking-tight text-white">OPTIMA Admin</h2>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Control Center</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          {TABS.map(t => (
            <SidebarItem 
              key={t.id} 
              id={t.id} 
              label={t.label} 
              icon={t.icon} 
              active={tab === t.id} 
              onClick={setTab} 
            />
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <div className="bg-gray-800/50 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center shrink-0">
                <span className="text-blue-400 font-bold text-xs">{adminUser.email?.[0]?.toUpperCase()}</span>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">{adminUser.email}</p>
                <p className="text-[10px] text-blue-400 font-medium">Master Admin</p>
              </div>
            </div>
            <button 
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-gray-700/50 hover:bg-red-900/30 text-gray-300 hover:text-red-400 text-xs font-bold transition-all"
            >
              <PI.SignOut size={16} /> Cerrar Sesión
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-gray-800 flex items-center px-8 justify-between bg-[#111827]/50 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-white uppercase tracking-tight">
              {TABS.find(t => t.id === tab)?.label}
            </h1>
            <span className="text-gray-600 text-sm">/</span>
            <span className="text-gray-400 text-xs font-medium">Panel de Control</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <PI.MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input 
                type="text" 
                placeholder="Buscar en el sistema..." 
                className="bg-gray-800/50 border border-gray-700 rounded-xl pl-10 pr-4 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 w-64 placeholder:text-gray-600"
              />
            </div>
            <button 
              onClick={fetchUsers}
              className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-xl transition-all"
              title="Refrescar datos"
            >
              <PI.Lightning size={20} className={loading ? 'animate-spin text-blue-400' : ''} />
            </button>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto h-full">
            {loading && tab !== 'users' ? (
              <div className="h-full flex flex-col items-center justify-center gap-4 py-20 grayscale opacity-50">
                 <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                 <p className="text-sm font-medium tracking-widest uppercase">Inicializando Dashboard...</p>
              </div>
            ) : (
              <div className="fade-in">
                {tab === 'overview'  && <OverviewTab stats={stats} />}
                {tab === 'users'     && <UsersTab users={users} onRefresh={fetchUsers} />}
                {tab === 'waitlist'  && <WaitlistTab leads={waitlistLeads} views={landingViews} events={events} onRefresh={fetchUsers} />}
                {tab === 'marketing' && <MarketingTab config={config} onRefresh={fetchUsers} />}
                {tab === 'analytics' && <AnalyticsTab users={users} />}
                {tab === 'suscripciones'  && <SubscriptionsTab users={users} />}
                {tab === 'codigos'     && <CodigosTab />}
                {tab === 'empresas'    && <EmpresasB2BTab />}
                {tab === 'sistema'   && <SistemaTab />}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}

// ─── Marketing Hub Tab ───────────────────────────────────────────────────────

function MarketingTab({ config, onRefresh }) {
  const [generando, setGenerando] = useState(false)
  const [idea, setIdea] = useState('')
  const [tone, setTone] = useState('profesional')
  const [platform, setPlatform] = useState('linkedin')
  
  const [seoForm, setSeoForm] = useState({
    seo_title: config?.find(c => c.config_key === 'seo_title')?.config_value || '',
    seo_meta_description: config?.find(c => c.config_key === 'seo_meta_description')?.config_value || ''
  })
  const [savingSeo, setSavingSeo] = useState(false)

  const handleGenerarIdea = () => {
    setGenerando(true)
    // Simulación de IA (en el futuro conectar a Anthropic)
    setTimeout(() => {
      const ideas = {
        linkedin: {
          profesional: "🚀 ¿Sabías que el 75% de los CVs son descartados por filtros ATS antes de que un humano los vea?\n\nNo dejes tu carrera al azar. Con OPTIMA CV puedes analizar tu currículum contra cualquier vacante en tiempo real y obtener un formato Harvard que resalte tu impacto real.\n\n🔗 Pruébalo gratis hoy en optima.pro \n\n#Talento #DesarrolloProfesional #ATS #BusquedaDeEmpleo #OPTIMACV",
          agresivo: "⚠️ TU CV ES BASURA PARA LOS ATS... y tú ni lo sabes.\n\nDeja de enviar aplicaciones al vacío. El 90% de las empresas usan software para filtrarte. Si no hablas su idioma, no existes.\n\nUsa IA para ganarles en su propio juego. optima.pro te da la ventaja injusta.\n\n#CareerHack #ATS #Empleo #IA",
        },
        twitter: {
          profesional: "Tu CV no es malo, es invisible para los ATS. 🤖\n\nOptimiza tus palabras clave y vence al algoritmo en 30 segundos. Harvard Style Ready.\n\nGratis en: optima.pro #CareerTech #IA",
          agresivo: "Deja de mendigar empleo. Empieza a cazar ofertas ganándole a los ATS con IA. 🎯\n\noptima.pro — Entra, optimiza, consigue la entrevista. Punto.",
        }
      }
      setIdea(ideas[platform]?.[tone] || ideas.linkedin.profesional)
      setGenerando(false)
    }, 1500)
  }

  const handleUpdateSeo = async (key, val) => {
    setSavingSeo(true)
    const { supabase } = await import('../services/authService')
    const { data: { session } } = await supabase.auth.getSession()
    
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      const res = await fetch(`${API_URL}/api/admin/config`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ config_key: key, config_value: val })
      })
      if (res.ok) {
        onRefresh()
      }
    } catch (err) {
      console.error("Error updating SEO:", err)
    } finally {
      setSavingSeo(false)
    }
  }

  return (
    <div className="space-y-8 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white">Marketing Hub</h2>
          <p className="text-gray-400 text-sm mt-1">Crecimiento, análisis de calor e ideas de contenido al estilo Pomelli</p>
        </div>
        <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
          <PI.TrendUp size={24} weight="duotone" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Heatmaps Section */}
        <div className="bg-[#111827] rounded-3xl p-8 border border-gray-800 shadow-2xl flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-orange-500/10 text-orange-500">
              <PI.Fire size={24} weight="duotone" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">Mapas de Calor</h3>
              <p className="text-xs text-gray-500">Microsoft Clarity Integration</p>
            </div>
          </div>
          
          <p className="text-sm text-gray-400 mb-6 leading-relaxed flex-1">
            Tu landing page está siendo analizada. Para ver grabaciones de pantalla de usuarios, clics muertos (rage clicks) y mapas de navegación en vivo, accede directamente a tu panel de Clarity.
          </p>
          
          <a 
            href="https://clarity.microsoft.com/" 
            target="_blank" rel="noreferrer"
            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm transition-all shadow-xl shadow-orange-900/20"
          >
            Abrir Panel de Clarity <PI.ArrowSquareOut size={16} weight="bold" />
          </a>
        </div>

        {/* Enhanced Content Generator Section */}
        <div className="bg-[#111827] rounded-3xl p-8 border border-gray-800 shadow-2xl flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-500">
              <PI.MagicWand size={24} weight="duotone" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">Growth AI Copywriter</h3>
              <p className="text-xs text-gray-500">Genera posts virales personalizados</p>
            </div>
          </div>
          
          {!idea && (
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-[10px] font-black text-gray-600 uppercase mb-1.5">Plataforma</label>
                <select value={platform} onChange={e => setPlatform(e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white font-bold">
                  <option value="linkedin">LinkedIn</option>
                  <option value="twitter">Twitter / X</option>
                  <option value="instagram">Instagram</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-600 uppercase mb-1.5">Tono</label>
                <select value={tone} onChange={e => setTone(e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white font-bold">
                  <option value="profesional">Profesional</option>
                  <option value="agresivo">Directo / Agresivo</option>
                  <option value="amigable">Inspiracional</option>
                </select>
              </div>
            </div>
          )}

          {idea ? (
            <div className="flex-1 bg-gray-950 border border-gray-800 rounded-2xl p-5 relative group">
              <button 
                onClick={() => { navigator.clipboard.writeText(idea); alert("¡Copiado!") }} 
                className="absolute top-4 right-4 p-2 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-lg transition-colors"
              >
                <PI.Copy size={16} />
              </button>
              <pre className="text-sm text-gray-300 font-sans whitespace-pre-wrap leading-relaxed">{idea}</pre>
              <div className="mt-4 pt-4 border-t border-gray-800 flex justify-end">
                <button onClick={() => setIdea('')} className="text-xs text-gray-500 hover:text-gray-300">Generar otra variante</button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center text-center p-6 border-2 border-dashed border-gray-800 rounded-2xl">
              <PI.Lightbulb size={32} weight="duotone" className="text-gray-600 mb-4" />
              <button 
                onClick={handleGenerarIdea} disabled={generando}
                className="flex items-center gap-2 py-3 px-6 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-sm transition-all shadow-xl"
              >
                {generando ? <PI.CircleNotch size={18} className="animate-spin" /> : <PI.Sparkle size={18} weight="fill" />}
                {generando ? 'Analizando...' : 'Generar Variante'}
              </button>
            </div>
          )}
        </div>

        {/* SEO Manager Section */}
        <div className="bg-[#111827] rounded-3xl p-8 border border-gray-800 shadow-2xl lg:col-span-2">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-teal-500/10 text-teal-400">
                <PI.Globe size={24} weight="duotone" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">SEO & Meta Manager</h3>
                <p className="text-xs text-gray-500">Controla cómo te ven en Google y Redes Sociales</p>
              </div>
            </div>
            {savingSeo && <PI.CircleNotch size={20} className="animate-spin text-teal-500" />}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest">Page Title</label>
                <input 
                  type="text" 
                  value={seoForm.seo_title}
                  onChange={e => setSeoForm(f => ({ ...f, seo_title: e.target.value }))}
                  onBlur={() => handleUpdateSeo('seo_title', seoForm.seo_title)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-gray-600 uppercase tracking-widest">Meta Description</label>
                <textarea 
                  rows={4}
                  value={seoForm.seo_meta_description}
                  onChange={e => setSeoForm(f => ({ ...f, seo_meta_description: e.target.value }))}
                  onBlur={() => handleUpdateSeo('seo_meta_description', seoForm.seo_meta_description)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 resize-none"
                />
              </div>
            </div>

            <div className="bg-gray-950 rounded-2xl p-6 border border-gray-800 flex flex-col justify-center">
               <p className="text-[10px] font-black text-gray-700 uppercase mb-4 tracking-tighter">Vista previa en buscadores</p>
               <div className="space-y-1 max-w-[320px]">
                  <p className="text-blue-400 text-lg hover:underline cursor-pointer truncate">{seoForm.seo_title || 'Optima CV | Optimización IA'}</p>
                  <p className="text-emerald-700 text-xs truncate">https://optima.pro › cv-optimizer</p>
                  <p className="text-gray-500 text-xs line-clamp-2 leading-relaxed">
                    {seoForm.seo_meta_description || 'Analiza tu currículum contra cualquier vacante en tiempo real y vence a los filtros ATS...'}
                  </p>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Entry point ─────────────────────────────────────────────────────────────

export default function Admin() {
  const [adminUser, setAdminUser] = useState(null)
  const [checking, setChecking]   = useState(true)

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await db.auth.getSession()
      if (session?.user) {
        const { data } = await db.from('profiles').select('role').eq('id', session.user.id).single()
        if (['super_admin', 'company_admin'].includes(data?.role)) {
          setAdminUser(session.user)
        } else {
          await db.auth.signOut()
        }
      }
      setChecking(false)
    }
    check()
  }, [])

  const handleLogout = async () => {
    await db.auth.signOut()
    setAdminUser(null)
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Verificando sesión...</div>
      </div>
    )
  }

  if (!adminUser) return <AdminLogin onLogin={setAdminUser} />
  return <Dashboard adminUser={adminUser} onLogout={handleLogout} />
}
