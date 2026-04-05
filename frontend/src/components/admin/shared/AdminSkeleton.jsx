import React from 'react'
import { motion } from 'framer-motion'

const AdminSkeleton = ({ type = 'table' }) => {
  const Pulse = ({ className }) => (
    <motion.div
      animate={{ opacity: [0.3, 0.6, 0.3] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      className={`bg-slate-800/50 rounded-xl ${className}`}
    />
  )

  if (type === 'table') {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="flex justify-between items-center mb-10">
          <div className="space-y-2">
            <Pulse className="w-48 h-8 rounded-2xl" />
            <Pulse className="w-64 h-3 rounded-lg" />
          </div>
          <Pulse className="w-32 h-10 rounded-2xl" />
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex gap-4 items-center p-6 bg-[#111827] border border-slate-800 rounded-3xl">
            <Pulse className="w-12 h-12 rounded-2xl" />
            <div className="flex-1 space-y-2">
              <Pulse className="w-1/3 h-4" />
              <Pulse className="w-1/4 h-3" />
            </div>
            <Pulse className="w-24 h-8" />
            <Pulse className="w-10 h-10 rounded-xl" />
          </div>
        ))}
      </div>
    )
  }

  if (type === 'kpis') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {[1, 2, 3, 4].map((i) => (
          <Pulse key={i} className="h-40 rounded-[2.5rem]" />
        ))}
      </div>
    )
  }

  return <Pulse className="w-full h-64 h- rounded-[2.5rem]" />
}

export default AdminSkeleton
