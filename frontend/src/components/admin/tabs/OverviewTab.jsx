import React from 'react'
import * as PI from '@phosphor-icons/react'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, AreaChart, Area, PieChart, Pie
} from 'recharts'
import KpiCard from '../shared/KpiCard'
import SectionHeading from '../shared/SectionHeading'

const OverviewTab = ({ stats }) => {
  // Datos formateados para Recharts
  const planData = Object.entries(stats.planes || {}).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    usuarios: value,
    color: name === 'trimestral' ? '#f59e0b' : name === 'mensual' ? '#4f46e5' : name === 'semanal' ? '#10b981' : '#64748b'
  }))

  const countryData = Object.entries(stats.paises || {}).map(([name, value]) => ({
    name,
    usuarios: value
  })).sort((a, b) => b.usuarios - a.usuarios).slice(0, 5)

  return (
    <div className="space-y-12 animate-fade-in">
      <SectionHeading 
        title="Escritorio de Control" 
        subtitle="Métricas generales de rendimiento y adopción"
        icon={PI.Kanban}
      />

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard 
          label="Usuarios totales"  
          value={stats.totalUsers}    
          sub="Registrados"   
          icon={PI.UsersThree}    
          color="blue"   
        />
        <KpiCard 
          label="Perfiles Full"     
          value={stats.conOnboarding} 
          sub="Con onboarding" 
          icon={PI.CheckCircle} 
          color="green"  
        />
        <KpiCard 
          label="Administradores"   
          value={stats.admins}        
          sub="Accesos nivel 1" 
          icon={PI.UserCircle} 
          color="purple" 
        />
        <KpiCard 
          label="Impacto Total"     
          value={stats.totalUsage}    
          sub="CVs optimizados" 
          icon={PI.ChartBar} 
          color="amber"  
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Gráfico de Distribución de Planes */}
        <div className="lg:col-span-2 bg-[#111827] rounded-[2.5rem] p-10 border border-slate-800 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <PI.TrendUp size={120} weight="duotone" className="text-indigo-500" />
          </div>

          <div className="flex items-center justify-between mb-10 relative z-10">
            <div>
              <h3 className="font-black text-white text-xl italic uppercase">Distribución de Suscripciones</h3>
              <p className="text-[10px] text-gray-500 mt-1 font-bold uppercase tracking-widest">Ingresos proyectados por nivel</p>
            </div>
            <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <PI.Coins size={24} weight="duotone" />
            </div>
          </div>
          
          <div className="h-[300px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={planData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 10, fontWeight: 900 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 10, fontWeight: 900 }} 
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(79, 70, 229, 0.05)' }}
                  contentStyle={{ 
                    backgroundColor: '#0B0F1A', 
                    border: '1px solid #334155', 
                    borderRadius: '16px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: '#fff'
                  }}
                  itemStyle={{ color: '#818cf8' }}
                />
                <Bar dataKey="usuarios" radius={[8, 8, 0, 0]} barSize={40}>
                  {planData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Países */}
        <div className="bg-[#111827] rounded-[2.5rem] p-10 border border-slate-800 shadow-2xl flex flex-col">
          <div className="flex items-center gap-4 mb-10">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <PI.GlobeSimple size={24} weight="duotone" />
            </div>
            <div>
              <h3 className="font-black text-white text-lg italic uppercase">Top Mercados</h3>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Presencia geográfica</p>
            </div>
          </div>

          <div className="flex-1 space-y-6">
            {countryData.map((item, idx) => (
              <div key={item.name} className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-slate-700 group-hover:text-indigo-500 transition-colors">0{idx + 1}</span>
                  <span className="text-sm font-bold text-slate-300 uppercase italic tracking-tight">{item.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-600 rounded-full" 
                      style={{ width: `${(item.usuarios / stats.totalUsers) * 100}%` }} 
                    />
                  </div>
                  <span className="text-xs font-black text-white w-8 text-right">{item.usuarios}</span>
                </div>
              </div>
            ))}
            {countryData.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center opacity-20 italic">
                <PI.MapPinSimpleArea size={48} className="mb-2" />
                <p className="text-[10px] font-black uppercase">Sin datos de geolocalización</p>
              </div>
            )}
          </div>

          <div className="mt-10 pt-8 border-t border-slate-800/50">
             <button className="w-full py-3 rounded-2xl bg-slate-800/50 hover:bg-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-all border border-slate-800">
                Ver Mapa Completo
             </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OverviewTab
