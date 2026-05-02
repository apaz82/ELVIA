import React, { useMemo } from 'react'
import * as PI from '@phosphor-icons/react'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, AreaChart, Area, PieChart, Pie
} from 'recharts'
import KpiCard from '../shared/KpiCard'
import SectionHeading from '../shared/SectionHeading'

const OverviewTab = ({ stats, theme, users = [] }) => {
  const isLight = theme === 'light';

  // Process data for charts
  const planData = useMemo(() => Object.entries(stats.planes || {}).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    usuarios: value,
    color: name === 'trimestral' ? '#f59e0b' : name === 'mensual' ? '#4f46e5' : name === 'semanal' ? '#10b981' : '#64748b'
  })), [stats.planes]);

  const countryData = useMemo(() => Object.entries(stats.paises || {}).map(([name, value]) => ({
    name,
    usuarios: value
  })).sort((a, b) => b.usuarios - a.usuarios).slice(0, 5), [stats.paises]);

  // Compute Growth Data from users array
  const growthData = useMemo(() => {
    if (!users.length) return [];
    
    // Group by month
    const months = {};
    users.forEach(u => {
      if (!u.created_at) return;
      const date = new Date(u.created_at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      months[key] = (months[key] || 0) + 1;
    });

    const sortedKeys = Object.keys(months).sort();
    let cumulative = 0;
    
    return sortedKeys.slice(-6).map(key => { // Last 6 months
      cumulative += months[key];
      const [year, month] = key.split('-');
      const monthNames = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
      return {
        name: `${monthNames[parseInt(month)-1]}`,
        nuevos: months[key],
        total: cumulative
      };
    });
  }, [users]);

  // Dynamic Theme Variables
  const cardBg = isLight ? 'bg-white' : 'bg-[#111827]';
  const cardBorder = isLight ? 'border-slate-200' : 'border-slate-800';
  const textTitle = isLight ? 'text-slate-800' : 'text-white';
  const textSub = isLight ? 'text-slate-500' : 'text-gray-500';
  const gridLine = isLight ? '#e2e8f0' : '#1e293b';
  const tooltipBg = isLight ? '#ffffff' : '#0B0F1A';
  const tooltipBorder = isLight ? '#e2e8f0' : '#334155';
  const tooltipText = isLight ? '#1e293b' : '#ffffff';

  return (
    <div className="space-y-12 animate-fade-in">
      <SectionHeading 
        title="Escritorio de Control B2C" 
        subtitle="Métricas generales de rendimiento y adopción"
        icon={PI.Kanban}
      />

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard 
          label="Usuarios totales"  
          value={stats.totalUsers}    
          sub="Registrados en plataforma"   
          icon={PI.UsersThree}    
          color="blue"   
        />
        <KpiCard 
          label="Perfiles Full"     
          value={stats.conOnboarding} 
          sub="Con onboarding completo" 
          icon={PI.CheckCircle} 
          color="green"  
        />
        <KpiCard 
          label="MRR Activo"   
          value={`$${planData.reduce((acc, p) => p.name !== 'Free' ? acc + (p.usuarios * 15) : acc, 0)}`}        
          sub="Estimado B2C (USD)" 
          icon={PI.CurrencyDollar} 
          color="emerald" 
        />
        <KpiCard 
          label="Impacto Total"     
          value={stats.totalUsage}    
          sub="CVs optimizados por IA" 
          icon={PI.Sparkle} 
          color="amber"  
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Gráfico de Crecimiento */}
        <div className={`lg:col-span-2 ${cardBg} rounded-[2.5rem] p-10 border ${cardBorder} shadow-2xl relative overflow-hidden group transition-colors duration-300`}>
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <PI.TrendUp size={120} weight="duotone" className="text-indigo-500" />
          </div>

          <div className="flex items-center justify-between mb-10 relative z-10">
            <div>
              <h3 className={`font-black ${textTitle} text-xl italic uppercase`}>Crecimiento de Usuarios B2C</h3>
              <p className={`text-[10px] ${textSub} mt-1 font-bold uppercase tracking-widest`}>Adquisición últimos 6 meses</p>
            </div>
            <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
              <PI.ChartLineUp size={24} weight="duotone" />
            </div>
          </div>
          
          <div className="h-[300px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridLine} vertical={false} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: isLight ? '#64748b' : '#94a3b8', fontSize: 10, fontWeight: 900 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: isLight ? '#64748b' : '#94a3b8', fontSize: 10, fontWeight: 900 }} 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: tooltipBg, 
                    border: `1px solid ${tooltipBorder}`, 
                    borderRadius: '16px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: tooltipText,
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
                  }}
                  itemStyle={{ color: '#4f46e5' }}
                />
                <Area type="monotone" dataKey="total" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" name="Usuarios Totales" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribución de Planes */}
        <div className={`${cardBg} rounded-[2.5rem] p-10 border ${cardBorder} shadow-2xl flex flex-col transition-colors duration-300`}>
          <div className="flex items-center gap-4 mb-10">
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <PI.Crown size={24} weight="duotone" />
            </div>
            <div>
              <h3 className={`font-black ${textTitle} text-lg italic uppercase`}>Suscripciones</h3>
              <p className={`text-[10px] ${textSub} font-bold uppercase tracking-widest`}>Distribución B2C</p>
            </div>
          </div>

          <div className="h-[200px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={planData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="usuarios"
                >
                  {planData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: tooltipBg, 
                    border: `1px solid ${tooltipBorder}`, 
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: tooltipText
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex-1 space-y-4 mt-6">
            {planData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className={`text-sm font-bold ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>{item.name}</span>
                </div>
                <span className={`text-sm font-black ${textTitle}`}>{item.usuarios}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default OverviewTab
