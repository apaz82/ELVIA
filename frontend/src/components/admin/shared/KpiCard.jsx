import React from 'react'

const KpiCard = ({ label, value, sub, icon: Icon, color = 'blue' }) => {
  const themes = {
    blue:   'text-indigo-400 bg-indigo-500/10 border-indigo-500/20 shadow-indigo-900/10',
    green:  'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 shadow-emerald-900/10',
    amber:  'text-amber-400 bg-amber-500/10 border-amber-500/20 shadow-amber-900/10',
    purple: 'text-violet-400 bg-violet-500/10 border-violet-500/20 shadow-violet-900/10',
    rose:   'text-rose-400 bg-rose-500/10 border-rose-500/20 shadow-rose-900/10',
    cyan:   'text-cyan-400 bg-cyan-500/10 border-cyan-500/20 shadow-cyan-900/10',
  }

  const theme = themes[color] || themes.blue
  const colorBase = theme.split(' ')[0]
  const accentCls = theme.split(' ').slice(1, 3).join(' ')

  return (
    <div className="bg-[#111827] rounded-3xl p-6 border border-gray-800 shadow-xl transition-all hover:border-gray-700 group hover:-translate-y-1 duration-300">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">
          {label}
        </p>
        {Icon && (
          <div className={`p-2.5 rounded-2xl border ${accentCls} group-hover:scale-110 transition-transform duration-500`}>
            <Icon size={18} weight="duotone" className={colorBase} />
          </div>
        )}
      </div>
      
      <div className="flex items-baseline gap-2">
        <p className="text-3xl font-black text-white tracking-tighter italic">
          {value}
        </p>
      </div>

      {sub && (
        <div className="mt-4 flex items-center gap-2">
          <div className={`h-1.5 w-1.5 rounded-full ${colorBase.replace('text-', 'bg-')}`} />
          <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest italic">{sub}</p>
        </div>
      )}
    </div>
  )
}

export default KpiCard
