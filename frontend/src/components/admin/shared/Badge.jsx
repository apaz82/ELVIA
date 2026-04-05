import React from 'react'

const Badge = ({ color = 'gray', children, className = '' }) => {
  const themes = {
    green:  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    red:    'bg-rose-500/10 text-rose-400 border-rose-500/20',
    amber:  'bg-amber-500/10 text-amber-400 border-amber-500/20',
    blue:   'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    gray:   'bg-slate-500/10 text-slate-400 border-slate-500/20',
    purple: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    cyan:   'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  }

  const theme = themes[color] || themes.gray

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${theme} ${className}`}>
      {children}
    </span>
  )
}

export default Badge
