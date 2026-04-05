import React, { useState, useEffect } from 'react'
import * as PI from '@phosphor-icons/react'
import SectionHeading from '../../shared/SectionHeading'

const CompanySettingsTab = ({ company, onRefresh, db, API_URL }) => {
  const [formData, setFormData] = useState({ name: '', country: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (company) setFormData({ name: company.name, country: company.country || 'México' })
  }, [company])

  const handleUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data: { session } } = await db.auth.getSession()
      const res = await fetch(`${API_URL}/api/company/profile`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        alert('Perfil corporativo actualizado')
        onRefresh()
      } else {
        alert('Error al actualizar el perfil')
      }
    } catch (err) {
      console.error('[CompanySettings] Error:', err)
      alert('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  if (!company) return null

  return (
    <div className="max-w-3xl mx-auto py-12 animate-fade-in">
       <div className="bg-[#111827] rounded-[3rem] p-12 border border-slate-800 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 blur-[100px] rounded-full group-hover:bg-indigo-600/10 transition-all duration-1000" />
          
          <div className="flex items-center gap-6 mb-12">
             <div className="p-4 rounded-[1.5rem] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-xl">
                <PI.GearSix size={36} weight="duotone" className="group-hover:rotate-45 transition-transform duration-700" />
             </div>
             <div>
                <h2 className="text-2xl font-black text-white uppercase italic tracking-tight">Preferencias de Entidad</h2>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-1">Configuración técnica de cuenta corporativa</p>
             </div>
          </div>

          <form onSubmit={handleUpdate} className="space-y-8">
             <div className="space-y-3">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-1">Razón Social Registrada</label>
                <input
                   type="text"
                   value={formData.name}
                   onChange={e => setFormData({ ...formData, name: e.target.value })}
                   className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-black uppercase italic tracking-tight"
                />
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                   <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-1">Región / Domicilio Fiscal</label>
                   <select
                      value={formData.country}
                      onChange={e => setFormData({ ...formData, country: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-black uppercase italic italic-none"
                   >
                      <option>México</option>
                      <option>Estados Unidos</option>
                      <option>Colombia</option>
                      <option>Chile</option>
                      <option>Perú</option>
                      <option>España</option>
                   </select>
                </div>
                <div className="space-y-3">
                   <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-1">Identificador Slug (Inmutable)</label>
                   <div className="w-full bg-slate-900/50 border border-slate-800/50 rounded-2xl px-6 py-5 text-sm text-slate-600 font-black uppercase italic tracking-widest flex items-center gap-3">
                      <PI.Lock size={14} weight="bold" />
                      elvia.ai/{company.slug}
                   </div>
                </div>
             </div>

             <div className="pt-8">
                <button
                   type="submit"
                   disabled={loading}
                   className="w-full py-5 rounded-[1.5rem] bg-indigo-600 text-white text-[11px] font-black uppercase tracking-widest hover:bg-indigo-500 shadow-2xl shadow-indigo-900/40 disabled:opacity-50 transition-all flex items-center justify-center gap-4 italic active:scale-[0.98]"
                >
                   {loading ? <PI.ArrowClockwise className="animate-spin" /> : <PI.FloppyDiskBack size={20} weight="bold" />}
                   {loading ? 'Transmitiendo Cambios...' : 'Guardar Configuración'}
                </button>
             </div>
          </form>

          <div className="mt-12 p-8 bg-amber-500/5 border border-amber-500/10 rounded-[2rem] relative group/warning">
             <div className="flex gap-6">
                <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">
                  <PI.WarningCircle size={28} weight="duotone" className="group-hover/warning:animate-pulse" />
                </div>
                <div>
                   <h4 className="text-[11px] font-black text-amber-500 uppercase tracking-widest mb-2 italic">Zona Restringida</h4>
                   <p className="text-[10px] text-slate-500 leading-relaxed font-medium uppercase tracking-widest">Para solicitar la baja de la entidad corporativa o modificar el nivel de suscripción premium, contacte a su Gerente de Cuenta en <span className="text-white font-bold italic">ELVIA Partnerships</span>.</p>
                </div>
             </div>
          </div>
       </div>
    </div>
  )
}

export default CompanySettingsTab
