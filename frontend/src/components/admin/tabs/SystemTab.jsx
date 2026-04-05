import React, { useState, useEffect } from 'react'
import * as PI from '@phosphor-icons/react'
import SectionHeading from '../shared/SectionHeading'
import { toast } from 'react-hot-toast'

const SystemTab = ({ db, API_URL }) => {
  const [status, setStatus]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied]   = useState(null)

  const fetchStatus = async () => {
    setLoading(true)
    try {
      const { data: { session } } = await db.auth.getSession()
      const res = await fetch(`${API_URL}/api/admin/system-status`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      })
      const data = await res.json()
      setStatus(data)
    } catch (err) {
      console.error('Error fetching system status:', err)
      toast.error('Fallo en la comunicación con el núcleo del sistema')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchStatus() }, [])

  const copy = (text, key) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    toast.success('Script SQL copiado al portapapeles', { id: `copy-${key}` })
    setTimeout(() => setCopied(null), 3000)
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
    if (s === 'error') return 'text-rose-400 bg-rose-500/10 border-rose-500/20'
    return 'text-slate-500 bg-slate-500/10 border-slate-500/20'
  }

  return (
    <div className="space-y-12 animate-fade-in max-w-6xl">
       {/* Sección de Auditoría en Vivo */}
       <div className="space-y-8">
          <SectionHeading 
            title="Núcleo del Sistema" 
            subtitle="Estado operativo y salud de las integraciones"
            icon={PI.Cpu}
          >
            <button 
              onClick={fetchStatus}
              disabled={loading}
              className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all shadow-xl disabled:opacity-50"
            >
              <PI.ArrowClockwise size={20} weight="bold" className={loading ? 'animate-spin' : ''} />
            </button>
          </SectionHeading>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {loading && !status ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="h-40 bg-slate-900/50 rounded-[2rem] border border-slate-800 animate-pulse" />
              ))
            ) : status && Object.entries(status).map(([key, info]) => (
              <div key={key} className="bg-[#111827] rounded-[2rem] p-8 border border-slate-800 shadow-2xl group hover:border-indigo-500/30 transition-all">
                <div className="flex items-center justify-between mb-6">
                  <div className="p-3 rounded-2xl bg-slate-800/50 border border-slate-700/50 text-slate-400 group-hover:text-indigo-400 transition-colors">
                    {key === 'database' ? <PI.Database size={24} weight="duotone" /> :
                     key === 'ai'       ? <PI.Robot size={24} weight="duotone" /> :
                     key === 'email'    ? <PI.EnvelopeOpen size={24} weight="duotone" /> :
                                          <PI.ShieldCheck size={24} weight="duotone" />}
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${getStatusColor(info.status)}`}>
                    {info.status}
                  </span>
                </div>
                <h4 className="text-sm font-black text-white italic uppercase tracking-tight mb-2">{info.name}</h4>
                <p className="text-[10px] font-black text-slate-500 truncate uppercase tracking-widest leading-relaxed">{info.details || 'Verificado'}</p>
              </div>
            ))}
          </div>
       </div>

       {/* Scripts de Mantenimiento */}
       <div className="space-y-8 pt-10 border-t border-slate-800">
          <div className="flex items-center gap-4">
             <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <PI.TerminalWindow size={24} weight="duotone" />
             </div>
             <div>
                <h3 className="text-xl font-black text-white uppercase italic tracking-tight">Scripts de Emergencia</h3>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Protocolos de mantenimiento estructural</p>
             </div>
          </div>
          
          <div className="grid grid-cols-1 gap-8">
            {[
              { key: 'cols',  title: 'Migración: Perfiles Base', sql: SQL_COLUMNS },
              { key: 'promo', title: 'Infraestructura: Cupones Globales', sql: SQL_PROMO },
            ].map(({ key, title, sql }) => (
              <div key={key} className="bg-[#111827] rounded-[2.5rem] p-10 border border-slate-800 shadow-2xl overflow-hidden group">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="font-black text-indigo-400 uppercase tracking-widest text-[10px] italic">{title}</h3>
                  <button onClick={() => copy(sql, key)}
                    className="text-[9px] font-black uppercase tracking-widest bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white px-6 py-3 rounded-2xl transition-all border border-slate-700 shadow-xl">
                    {copied === key ? 'Copiado al portapapeles' : 'Copiar Script SQL'}
                  </button>
                </div>
                <div className="relative group">
                  <pre className="bg-slate-950/80 text-indigo-300 text-xs rounded-2xl p-8 overflow-x-auto font-mono leading-relaxed border border-slate-800 group-hover:border-indigo-500/30 transition-all custom-scrollbar">
                    {sql}
                  </pre>
                </div>
              </div>
            ))}
          </div>
       </div>

       <div className="p-10 rounded-[3rem] bg-rose-500/5 border border-rose-500/10 flex items-start gap-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 blur-[100px] rounded-full" />
          <div className="p-4 rounded-[1.5rem] bg-rose-500/10 text-rose-500 shrink-0 border border-rose-500/20 shadow-xl">
             <PI.Skull size={32} weight="duotone" className="group-hover:rotate-12 transition-transform" />
          </div>
          <div className="relative z-10">
             <h4 className="font-black text-rose-500 mb-2 uppercase italic tracking-widest">Protocolo de Seguridad Máxima</h4>
             <p className="text-xs text-slate-400 leading-relaxed font-medium">
               Las operaciones listadas anteriormente modifican la estructura vital de <span className="text-white font-bold italic">ELVIA Ecosystem</span>. 
               Cualquier ejecución fallida puede resultar en una pérdida parcial o total de datos históricos. 
               Asegúrese de realizar pruebas en el <span className="text-indigo-400 font-bold">Staging Environment</span> antes de cualquier aplicación en producción.
             </p>
          </div>
       </div>
    </div>
  )
}

export default SystemTab
