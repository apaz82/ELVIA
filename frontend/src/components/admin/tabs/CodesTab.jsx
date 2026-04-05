import React, { useState, useEffect } from 'react'
import * as PI from '@phosphor-icons/react'
import KpiCard from '../shared/KpiCard'
import SectionHeading from '../shared/SectionHeading'
import Badge from '../shared/Badge'
import { toast } from 'react-hot-toast'

function generarCodigo() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let r = ''
  for (let i = 0; i < 8; i++) r += chars[Math.floor(Math.random() * chars.length)]
  return r
}

const CodesTab = ({ db, fmtDate }) => {
  const [codigos, setCodigos]         = useState([])
  const [redenidos, setRedimidos]     = useState([])
  const [loadingC, setLoadingC]       = useState(true)
  const [showForm, setShowForm]       = useState(false)
  const [saving, setSaving]           = useState(false)
  const [form, setForm] = useState({
    code:      generarCodigo(),
    plan:      'mensual',
    max_uses:  1,
    expires_at: '',
    notes:     '',
  })

  const PLAN_THEMES = {
    semanal:    'emerald',
    mensual:    'blue',
    trimestral: 'amber',
  }

  const fetchAll = async () => {
    setLoadingC(true)
    const [codsRes, redsRes] = await Promise.all([
      db.from('access_codes').select('*, code_redemptions(count)').order('created_at', { ascending: false }),
      db.from('code_redemptions')
        .select('*, access_codes(code, plan), profiles(email_principal)')
        .order('redeemed_at', { ascending: false })
        .limit(30),
    ])
    if (codsRes.data) setCodigos(codsRes.data)
    if (redsRes.data) setRedimidos(redsRes.data)
    setLoadingC(false)
  }

  useEffect(() => { fetchAll() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.code.trim()) { 
      toast.error('Especifica un código de acceso')
      return 
    }
    setSaving(true)
    const payload = {
      code:      form.code.trim().toUpperCase(),
      plan:      form.plan,
      max_uses:  Math.max(1, parseInt(form.max_uses) || 1),
      expires_at: form.expires_at || null,
      notes:     form.notes || null,
    }
    const { error } = await db.from('access_codes').insert(payload)
    if (error) {
      toast.error(error.code === '23505' ? 'Este código ya está en uso' : error.message)
    } else {
      toast.success(`Llave Maestra [${payload.code}] activada`)
      setShowForm(false)
      setForm({ code: generarCodigo(), plan: 'mensual', max_uses: 1, expires_at: '', notes: '' })
      fetchAll()
    }
    setSaving(false)
  }

  const handleDeactivate = async (id, code) => {
    try {
      const { error } = await db.from('access_codes').update({ is_active: false }).eq('id', id)
      if (error) throw error
      toast.success(`Código ${code} revocado`)
      fetchAll()
    } catch (err) {
      toast.error('No se pudo revocar el código')
    }
  }

  const porPlan = redenidos.reduce((acc, r) => {
    const p = r.access_codes?.plan || 'N/A'
    acc[p] = (acc[p] || 0) + 1
    return acc
  }, {})

  return (
    <div className="space-y-10 animate-fade-in max-w-6xl">
      <SectionHeading 
        title="Llaves Maestras" 
        subtitle="Generación y canje de códigos de acceso premium"
        icon={PI.Tag}
      >
        <button
          onClick={() => setShowForm(v => !v)}
          className="px-8 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-3 transition-all shadow-xl shadow-indigo-900/20"
        >
          <PI.Plus size={16} weight="bold" /> Nuevo Código
        </button>
      </SectionHeading>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KpiCard label="Códigos activos"  value={codigos.filter(c => c.is_active).length}  icon={PI.Tag}         color="blue"   />
        <KpiCard label="Canjeados"        value={redenidos.length}                          icon={PI.CheckCircle} color="green"  />
        <KpiCard label="Planes canjeados" value={Object.keys(porPlan).length}             icon={PI.Coins}       color="amber"  sub="Total por tipo" />
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-[#111827] rounded-[2.5rem] p-10 border border-indigo-500/20 shadow-2xl space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 blur-[80px] rounded-full" />
          <h4 className="text-sm font-black text-white uppercase tracking-widest italic mb-2">Configurar nuevo acceso</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-1">Código Promocional</label>
              <div className="flex gap-3">
                <input
                  value={form.code}
                  onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                  maxLength={20}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-mono tracking-widest uppercase italic"
                />
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, code: generarCodigo() }))}
                  className="p-4 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-2xl transition-all border border-slate-700"
                >
                  <PI.ArrowClockwise size={20} weight="bold" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-1">Plan Destino</label>
              <select
                value={form.plan}
                onChange={e => setForm(f => ({ ...f, plan: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-[11px] font-black uppercase text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 tracking-widest"
              >
                <option value="semanal">Semanal (7 días)</option>
                <option value="mensual">Mensual (30 días)</option>
                <option value="trimestral">Trimestral (90 días)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-1">Límite de Redenciones</label>
              <input
                type="number" min="1" max="9999"
                value={form.max_uses}
                onChange={e => setForm(f => ({ ...f, max_uses: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-black italic"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-1">Vencimiento (Opcional)</label>
              <input
                type="date"
                value={form.expires_at}
                onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-black italic color-scheme-dark"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-1">Notas Internas</label>
            <input
              type="text"
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="EJ: CAMPAÑA LINKEDIN MARZO 2026"
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-[10px] font-black uppercase tracking-widest text-white placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 italic"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button type="button" onClick={() => setShowForm(false)}
              className="flex-1 py-4 rounded-2xl border border-slate-800 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 hover:text-white transition-all italic">
              Abortar Misión
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-4 rounded-2xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 shadow-xl shadow-indigo-900/40 disabled:opacity-50 transition-all flex items-center justify-center gap-3 italic">
              {saving ? <PI.ArrowClockwise size={16} className="animate-spin" /> : <PI.Plus size={16} weight="bold" />}
              {saving ? 'Procesando...' : 'Activar Código'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-[#111827] rounded-[2.5rem] border border-slate-800 overflow-hidden shadow-2xl">
        <table className="w-full text-left">
          <thead className="bg-slate-900/50 border-b border-slate-800">
            <tr>
              {['Código / Token', 'Plan Destino', 'Redenciones', 'Vencimiento', 'Estado', 'Notas', 'Gestión'].map(h => (
                <th key={h} className="px-8 py-5 text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {codigos.map(c => (
              <tr key={c.id} className="hover:bg-slate-800/40 transition-colors group">
                <td className="px-8 py-6">
                  <span className="font-mono font-black text-white tracking-[0.2em] text-sm italic">{c.code}</span>
                </td>
                <td className="px-8 py-6">
                  <Badge color={PLAN_THEMES[c.plan] || 'gray'}>{c.plan}</Badge>
                </td>
                <td className="px-8 py-6">
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                       <span className="text-white">{c.uses_count}</span>
                       <span className="text-slate-600">LÍM: {c.max_uses}</span>
                    </div>
                    <div className="h-1.5 w-16 bg-slate-800 rounded-full overflow-hidden">
                       <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${(c.uses_count / c.max_uses) * 100}%` }} />
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6 text-[10px] text-slate-400 font-black uppercase tracking-widest italic">
                  {c.expires_at ? fmtDate(c.expires_at) : 'INFRECUENTE'}
                </td>
                <td className="px-8 py-6">
                  <div className={`flex items-center gap-1.5 ${c.is_active ? 'text-emerald-400' : 'text-slate-600'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${c.is_active ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                    <span className="text-[10px] font-black uppercase tracking-widest italic">{c.is_active ? 'Operativo' : 'Revocado'}</span>
                  </div>
                </td>
                <td className="px-8 py-6 text-[10px] text-slate-500 font-black uppercase tracking-widest italic max-w-[140px] truncate">{c.notes || '—'}</td>
                <td className="px-8 py-6">
                  {c.is_active && (
                    <button
                      onClick={() => handleDeactivate(c.id)}
                      className="text-[10px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-400 transition-colors border border-rose-500/20 hover:border-rose-500/50 px-3 py-1.5 rounded-xl bg-rose-500/5"
                    >
                      Baja
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default CodesTab
