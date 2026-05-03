import React, { useState } from 'react'
import * as PI from '@phosphor-icons/react'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, AreaChart, Area 
} from 'recharts'
import KpiCard from '../shared/KpiCard'
import SectionHeading from '../shared/SectionHeading'
import { toast } from 'react-hot-toast'

const WaitlistTab = ({ leads, views, events, onRefresh, fmtDate }) => {
  const [search, setSearch] = useState('')

  const conversionRate = views > 0 ? ((leads.length / views) * 100).toFixed(1) : 0
  const simCount = events?.filter(e => e.event_name === 'simulation_completed').length || 0

  // Datos para Recharts: Actividad últimos 7 días
  const hoy = new Date()
  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(hoy); d.setDate(hoy.getDate() - (6 - i))
    const key = d.toISOString().slice(0, 10)
    const count = leads.filter(l => l.created_at?.slice(0, 10) === key).length
    return { 
      name: d.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric' }), 
      count 
    }
  })

  // Breakdown por situación
  const SITUACION_LABEL = {
    'Estoy desempleada/o': 'Desempleada/o',
    'Empleada/o pero buscando alternativas': 'Buscando alternativas',
    'Quiero optimizar mi perfil para futuro': 'Optimizar perfil',
  }
  const statusData = Object.entries(
    leads.reduce((acc, l) => {
      const k = SITUACION_LABEL[l.situacion] || l.situacion || 'No especificada'
      acc[k] = (acc[k] || 0) + 1
      return acc
    }, {})
  ).map(([name, value]) => ({ name, value }))

  const filtered = leads.filter(l =>
    !search || [l.nombre, l.apellido, l.email, l.pais].join(' ').toLowerCase().includes(search.toLowerCase())
  )

  const exportCSV = () => {
    try {
      const header = 'Nombre,Apellido,Email,País,Teléfono,Situación,Origen,Código Referido,Referido Por,Fecha\n'
      const rows = leads.map(l =>
        [l.nombre, l.apellido, l.email, l.pais, l.telefono, l.situacion, l.origen || '', l.referral_code || '', l.referred_by || '', fmtDate(l.created_at)].join(',')
      ).join('\n')
      const blob = new Blob([header + rows], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = 'ELVIA_waitlist_leads.csv'; a.click()
      URL.revokeObjectURL(url)
      toast.success('Base de datos exportada (CSV)')
    } catch (err) {
      toast.error('Error al generar el archivo de exportación')
    }
  }

  return (
    <div className="space-y-10 animate-fade-in">
      <SectionHeading 
        title="Auditoría de Leads" 
        subtitle="Conversión de la lista de espera y embudo de registro"
        icon={PI.ListStar}
      >
        <button onClick={exportCSV} className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white bg-slate-800/10 hover:bg-slate-800 px-6 py-3 rounded-2xl border border-slate-800 transition-all shadow-xl">
          <PI.DownloadSimple size={16} weight="bold" /> Exportar CSV
        </button>
        <button onClick={onRefresh} className="p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl shadow-xl shadow-indigo-900/20 transition-all active:scale-95">
          <PI.ArrowClockwise size={20} weight="bold" />
        </button>
      </SectionHeading>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard label="Total Leads" value={leads.length} icon={PI.UsersThree} color="blue" />
        <KpiCard label="Visitas Landing" value={views} icon={PI.Eye} color="purple" />
        <KpiCard label="Conversión" value={`${conversionRate}%`} sub="Visitas → Leads" icon={PI.Target} color="green" />
        <KpiCard label="Simulaciones" value={simCount} icon={PI.Robot} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Gráfico de Actividad Semanal */}
        <div className="lg:col-span-2 bg-[#111827] rounded-[2.5rem] p-10 border border-slate-800 shadow-2xl">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="font-black text-white text-lg italic uppercase">Actividad de Registro</h3>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Nuevos prospectos (últimos 7 días)</p>
            </div>
            <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <PI.ChartLine size={24} weight="duotone" />
            </div>
          </div>
          
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 9, fontWeight: 900 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 9, fontWeight: 900 }} />
                <Tooltip 
                   contentStyle={{ backgroundColor: '#0B0F1A', border: '1px solid #334155', borderRadius: '16px', color: '#fff', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="count" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Breakdown Situación */}
        <div className="bg-[#111827] rounded-[2.5rem] p-10 border border-slate-800 shadow-2xl">
          <div className="flex items-center gap-4 mb-10">
             <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <PI.ShieldCheck size={24} weight="duotone" />
             </div>
             <div>
                <h3 className="font-black text-white text-lg italic uppercase">Situación Laboral</h3>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Segmentación de audiencia</p>
             </div>
          </div>

          <div className="space-y-6">
            {statusData.map((item) => (
              <div key={item.name} className="space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                  <span className="text-slate-400 italic truncate max-w-[150px]">{item.name}</span>
                  <span className="text-white">{item.value}</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-600 rounded-full"
                    style={{ width: `${(item.value / leads.length) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
          {/* Top Referrers */}
        <div className="bg-[#111827] rounded-[2.5rem] p-10 border border-slate-800 shadow-2xl">
          <div className="flex items-center gap-4 mb-10">
             <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <PI.ShareNetwork size={24} weight="duotone" />
             </div>
             <div>
                <h3 className="font-black text-white text-lg italic uppercase">Top Embajadores</h3>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Usuarios con más referidos</p>
             </div>
          </div>

          <div className="space-y-4">
            {Object.entries(
              leads.reduce((acc, l) => {
                if (l.referred_by) {
                  acc[l.referred_by] = (acc[l.referred_by] || 0) + 1
                }
                return acc
              }, {})
            ).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([code, count], idx) => {
              const referrer = leads.find(l => l.referral_code === code)
              const name = referrer ? `${referrer.nombre} ${referrer.apellido}` : code
              return (
                <div key={code} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                  <div className="flex items-center gap-3">
                    <span className="text-amber-400 font-black italic">#{idx + 1}</span>
                    <div>
                      <p className="text-xs font-bold text-white uppercase">{name}</p>
                      <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Código: {code}</p>
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-lg text-xs font-black">
                    {count}
                  </div>
                </div>
              )
            })}
            
            {leads.filter(l => l.referred_by).length === 0 && (
              <p className="text-xs text-slate-500 italic text-center py-4">Aún no hay referidos registrados.</p>
            )}
          </div>
        </div>
      </div>
      </div>

      {/* Tabla de Leads */}
      <div className="bg-[#111827] rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden mt-8">
        <div className="px-10 py-6 border-b border-slate-800 flex items-center gap-4">
          <PI.MagnifyingGlass size={18} className="text-slate-500 shrink-0" />
          <input
            type="text"
            placeholder="BUSCAR POR NOMBRE, EMAIL O PAÍS..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-[10px] font-black uppercase tracking-widest text-white focus:outline-none placeholder:text-slate-700"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-900/50 border-b border-slate-800">
              <tr className="text-[9px] uppercase font-black tracking-[0.3em] text-slate-500">
                <th className="px-8 py-5">Candidato</th>
                <th className="px-8 py-5">Situación & Origen</th>
                <th className="px-8 py-5">Geografía / Contacto</th>
                <th className="px-8 py-5 text-right">Referidos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filtered.map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-800/40 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 group-hover:scale-105 duration-500">
                        <span className="text-emerald-400 font-black text-sm italic">{lead.nombre?.[0]?.toUpperCase()}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white uppercase italic tracking-tight">{lead.nombre} {lead.apellido}</p>
                        <p className="text-[10px] text-indigo-500 font-black uppercase tracking-widest">{lead.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 block w-max mb-2">
                      {SITUACION_LABEL[lead.situacion] || lead.situacion || '—'}
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl bg-indigo-900/30 border border-indigo-500/30 text-indigo-400 block w-max">
                      {lead.origen || 'No especificado'}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-[10px] font-black text-white uppercase tracking-widest italic">{lead.pais || '—'}</p>
                    <p className="text-[9px] text-slate-600 font-black tracking-widest mt-1">{lead.telefono || '—'}</p>
                  </td>
                  <td className="px-8 py-6 text-right">
                    {lead.referred_by ? (
                      <p className="text-[9px] text-amber-500 font-black uppercase tracking-widest mb-1">
                        Ref: {lead.referred_by}
                      </p>
                    ) : null}
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">
                       {fmtDate(lead.created_at)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default WaitlistTab
