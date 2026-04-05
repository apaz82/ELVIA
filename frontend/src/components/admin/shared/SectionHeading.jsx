import React from 'react'

const SectionHeading = ({ title, subtitle, icon: Icon, children }) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
      <div className="flex items-center gap-5">
        {Icon && (
          <div className="p-4 rounded-[1.5rem] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shadow-xl shadow-indigo-900/10">
            <Icon size={28} weight="duotone" />
          </div>
        )}
        <div>
          <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic">{title}</h2>
          {subtitle && (
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em] mt-1">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      
      {children && (
        <div className="flex items-center gap-3">
          {children}
        </div>
      )}
    </div>
  )
}

export default SectionHeading
