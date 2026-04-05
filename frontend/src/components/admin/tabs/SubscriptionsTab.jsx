import React from 'react'
import * as PI from '@phosphor-icons/react'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie 
} from 'recharts'
import KpiCard from '../shared/KpiCard'
import SectionHeading from '../shared/SectionHeading'

const SubscriptionsTab = ({ users }) => {
  const agotados   = users.filter(u => (u.usage_count || 0) >= 2).length
  const conPlan    = users.filter(u => u.plan && u.plan !== 'free').length
  const conversion = users.length ? ((conPlan / users.length) * 100).toFixed(1) : 0

  const planStats = [
    { name: 'Semanal',   value: users.filter(u => u.plan === 'semanal').length,    color: '#10b981', price: 9 },
    { name: 'Mensual',   value: users.filter(u => u.plan === 'mensual').length,    color: '#3b82f6', price: 29 },
    { name: 'Trimestral', value: users.filter(u => u.plan === 'trimestral').length, color: '#f59e0b', price: 69 },
    { name: 'Gratuitos',  value: users.filter(u => !u.plan || u.plan === 'free').length, color: '#64748b', price: 0 },
  ]

  const totalRevenue = planStats.reduce((acc, p) => acc + (p.value * p.price), 0)

  return (
    <div className="space-y-10 animate-fade-in">
      <SectionHeading 
        title="Economía de ELVIA" 
        subtitle="Rendimiento del modelo de negocio y conversión premium"
        icon={PI.Coins}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <KpiCard 
          label="Candidatos Hot" 
          value={agotados} 
          sub="AGOTARON CRÉDITOS FREE" 
          icon={PI.Fire} 
          color="amber" 
        />
        <KpiCard 
          label="Tasa de Cierre" 
          value={`${conversion}%`} 
          sub="CONVERSIÓN FREE → PREMIUM" 
          icon={PI.Target} 
          color="green" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Gráfico Circular de Planes */}
        <div className="bg-[#111827] rounded-[2.5rem] p-10 border border-slate-800 shadow-2xl">
          <div className="flex items-center justify-between mb-10">
            <h3 className="font-black text-white text-lg italic uppercase">Distribución</h3>
            <PI.ChartPieSlice size={24} className="text-indigo-400/50" />
          </div>
          
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={planStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {planStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0B0F1A', border: '1px solid #334155', borderRadius: '16px', color: '#fff', fontSize: '10px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            {planStats.map((p) => (
              <div key={p.name} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{p.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Resumen Financiero y Proyección */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#111827] rounded-[2.5rem] p-10 border border-slate-800 shadow-2xl flex flex-col items-center justify-center text-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 blur-[80px] rounded-full group-hover:bg-indigo-600/20 transition-all duration-1000" />
            
            <PI.CurrencyDollar size={64} weight="duotone" className="text-emerald-400 mb-6" />
            <p className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.4em] mb-3">Valor Total de Cartera</p>
            <p className="text-6xl font-black text-white italic tracking-tighter">
              $ {totalRevenue.toLocaleString()} <span className="text-2xl text-slate-700">USD</span>
            </p>
            <p className="text-[10px] text-slate-500 mt-6 font-bold uppercase tracking-widest bg-slate-800/50 px-6 py-2 rounded-full border border-slate-700">
               Actualizado en tiempo real
            </p>
          </div>

          <div className="bg-[#111827] rounded-[2.5rem] p-10 border border-slate-800 shadow-2xl">
             <h3 className="font-black text-white text-sm uppercase tracking-[0.2em] mb-8 italic">Métricas de Retención</h3>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  { l: 'Churn rate', v: '4.2%', c: 'text-indigo-400' },
                  { l: 'LTV (estimado)', v: '$ 124', c: 'text-emerald-400' },
                  { l: 'ARPU', v: '$ 32', c: 'text-violet-400' },
                ].map(m => (
                  <div key={m.l} className="space-y-2">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{m.l}</p>
                    <p className={`text-2xl font-black ${m.c} italic`}>{m.v}</p>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SubscriptionsTab
