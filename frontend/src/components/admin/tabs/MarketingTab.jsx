import React, { useState } from 'react'
import * as PI from '@phosphor-icons/react'
import SectionHeading from '../shared/SectionHeading'
import { toast } from 'react-hot-toast'

const MarketingTab = ({ config, onRefresh }) => {
  const [generando, setGenerando] = useState(false)
  const [idea, setIdea] = useState('')
  const [tone, setTone] = useState('profesional')
  const [platform, setPlatform] = useState('linkedin')
  
  const [seoForm, setSeoForm] = useState({
    seo_title: config?.find(c => c.config_key === 'seo_title')?.config_value || '',
    seo_meta_description: config?.find(c => c.config_key === 'seo_meta_description')?.config_value || ''
  })
  const [savingSeo, setSavingSeo] = useState(false)

  const handleGenerarIdea = () => {
    setGenerando(true)
    setTimeout(() => {
      const ideas = {
        linkedin: {
          profesional: "🚀 ¿Sabías que el 75% de los CVs son descartados por filtros ATS antes de que un humano los vea?\n\nNo dejes tu carrera al azar. Con ELVIA puedes analizar tu currículum contra cualquier vacante en tiempo real y obtener un formato Harvard que resalte tu impacto real.\n\n🔗 Pruébalo gratis hoy en elvia.lat \n\n#Talento #DesarrolloProfesional #ATS #BusquedaDeEmpleo #ELVIA",
          agresivo: "⚠️ TU CV ES BASURA PARA LOS ATS... y tú ni lo sabes.\n\nDeja de enviar aplicaciones al vacío. El 90% de las empresas usan software para filtrarte. Si no hablas su idioma, no existes.\n\nUsa IA para ganarles en su propio juego. elvia.lat te da la ventaja injusta.\n\n#CareerHack #ATS #Empleo #IA",
        },
        twitter: {
          profesional: "Tu CV no es malo, es invisible para los ATS. 🤖\n\nOptimiza tus palabras clave y vence al algoritmo en 30 segundos. Harvard Style Ready.\n\nGratis en: elvia.lat #CareerTech #IA",
          agresivo: "Deja de mendigar empleo. Empieza a cazar ofertas ganándole a los ATS con IA. 🎯\n\nelvia.lat — Entra, optimiza, consigue la entrevista. Punto.",
        }
      }
      setIdea(ideas[platform]?.[tone] || ideas.linkedin.profesional)
      setGenerando(false)
      toast.success('Estrategia de crecimiento destilada')
    }, 1500)
  }

  const handleUpdateSeo = async (key, val) => {
    setSavingSeo(true)
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      const { supabase } = await import('../../../services/authService') 
      const { data: { session } } = await supabase.auth.getSession()
      
      const res = await fetch(`${API_URL}/api/admin/config`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ config_key: key, config_value: val })
      })
      if (res.ok) {
        toast.success(`Protocolo SEO actualizado: ${key}`)
        onRefresh()
      } else {
        toast.error('Error al actualizar protocolos SEO')
      }
    } catch (err) {
      console.error("Error updating SEO:", err)
      toast.error('Fallo en la conexión con el servidor')
    } finally {
      setSavingSeo(false)
    }
  }

  return (
    <div className="space-y-12 animate-fade-in max-w-6xl">
      <SectionHeading 
        title="Escalabilidad & Marketing" 
        subtitle="Herramientas de crecimiento y posicionamiento global de ELVIA"
        icon={PI.TrendUp}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        {/* Heatmaps Section */}
        <div className="bg-[#111827] rounded-[2.5rem] p-10 border border-slate-800 shadow-2xl flex flex-col relative group overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/5 blur-[80px] rounded-full group-hover:bg-orange-600/10 transition-all duration-1000" />
          
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 rounded-2xl bg-orange-500/10 text-orange-500 border border-orange-500/20">
              <PI.Fire size={24} weight="duotone" />
            </div>
            <div>
              <h3 className="font-black text-white text-lg uppercase italic tracking-tight">Mapas de Calor</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Clarity Engine Integration</p>
            </div>
          </div>
          
          <p className="text-xs text-slate-400 mb-8 leading-relaxed flex-1 font-medium">
            Visualiza el comportamiento de los aspirantes en tiempo real. Identifica cuellos de botella en la conversión y optimiza la interfaz basada en datos reales de navegación.
          </p>
          
          <a 
            href="https://clarity.microsoft.com/" 
            target="_blank" rel="noreferrer"
            className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white font-black text-[11px] uppercase tracking-widest transition-all shadow-xl shadow-orange-900/20 italic"
          >
            Sincronizar con Clarity <PI.ArrowSquareOut size={18} weight="bold" />
          </a>
        </div>

        {/* Growth AI Copywriter Section */}
        <div className="bg-[#111827] rounded-[2.5rem] p-10 border border-slate-800 shadow-2xl flex flex-col relative group overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/5 blur-[80px] rounded-full group-hover:bg-purple-600/10 transition-all duration-1000" />
          
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <PI.MagicWand size={24} weight="duotone" />
            </div>
            <div>
              <h3 className="font-black text-white text-lg uppercase italic tracking-tight">Growth AI Writing</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Generación de narrativa viral</p>
            </div>
          </div>
          
          {!idea ? (
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="space-y-2">
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest italic ml-1">Ecosistema</label>
                <select value={platform} onChange={e => setPlatform(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-[10px] text-white font-black uppercase tracking-widest">
                  <option value="linkedin">LinkedIn</option>
                  <option value="twitter">X / Twitter</option>
                  <option value="instagram">Instagram</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest italic ml-1">Frecuencia / Tono</label>
                <select value={tone} onChange={e => setTone(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-[10px] text-white font-black uppercase tracking-widest">
                  <option value="profesional">Profesional</option>
                  <option value="agresivo">Growth / Directo</option>
                  <option value="amigable">Inspiracional</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="flex-1 bg-slate-950/80 border border-slate-800 rounded-3xl p-6 relative group mb-8">
              <button 
                onClick={() => { navigator.clipboard.writeText(idea); alert("¡Copiado al portapapeles!") }} 
                className="absolute top-4 right-4 p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-all border border-slate-700 shadow-xl"
              >
                <PI.Copy size={16} weight="bold" />
              </button>
              <pre className="text-xs text-slate-300 font-sans whitespace-pre-wrap leading-relaxed italic">{idea}</pre>
              <div className="mt-6 pt-6 border-t border-slate-800 flex justify-end">
                <button onClick={() => setIdea('')} className="text-[9px] font-black text-slate-600 hover:text-indigo-400 uppercase tracking-widest transition-colors italic underline underline-offset-4">Iterar variante</button>
              </div>
            </div>
          )}

          {!idea && (
            <div className="flex-1 flex flex-col justify-center items-center text-center p-8 border-2 border-dashed border-slate-800 rounded-[2rem] group-hover:border-indigo-500/30 transition-all">
              <PI.Lightbulb size={32} weight="duotone" className="text-slate-700 mb-4 group-hover:text-indigo-400 transition-colors" />
              <button 
                onClick={handleGenerarIdea} disabled={generando}
                className="flex items-center gap-3 py-4 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black text-[11px] uppercase tracking-widest transition-all shadow-xl shadow-indigo-900/40 italic"
              >
                {generando ? <PI.CircleNotch size={18} className="animate-spin" /> : <PI.Sparkle size={18} weight="fill" />}
                {generando ? 'Destilando Estrategia...' : 'Activar IA Copywriter'}
              </button>
            </div>
          )}
        </div>

        {/* SEO Manager Section */}
        <div className="bg-[#111827] rounded-[2.5rem] p-10 border border-slate-800 shadow-2xl lg:col-span-2 relative group overflow-hidden">
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-teal-600/5 blur-[100px] rounded-full group-hover:bg-teal-600/10 transition-all duration-1000" />
          
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
                <PI.Globe size={24} weight="duotone" />
              </div>
              <div>
                <h3 className="font-black text-white text-lg uppercase italic tracking-tight">SEO & Meta Protocols</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Posicionamiento en motores de búsqueda</p>
              </div>
            </div>
            {savingSeo && <PI.CircleNotch size={20} className="animate-spin text-teal-500" />}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest italic ml-1">Título de Página (SEO)</label>
                <input 
                  type="text" 
                  value={seoForm.seo_title}
                  onChange={e => setSeoForm(f => ({ ...f, seo_title: e.target.value }))}
                  onBlur={() => handleUpdateSeo('seo_title', seoForm.seo_title)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-xs text-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 font-bold italic"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest italic ml-1">Meta Descripción Global</label>
                <textarea 
                  rows={4}
                  value={seoForm.seo_meta_description}
                  onChange={e => setSeoForm(f => ({ ...f, seo_meta_description: e.target.value }))}
                  onBlur={() => handleUpdateSeo('seo_meta_description', seoForm.seo_meta_description)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-xs text-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 resize-none font-medium italic shadow-inner"
                />
              </div>
            </div>

            <div className="bg-slate-950/80 rounded-[1.5rem] p-8 border border-slate-800 flex flex-col justify-center relative">
               <div className="absolute top-4 left-6 flex gap-1.5 opacity-30">
                  <div className="w-2 h-2 rounded-full bg-rose-500" />
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
               </div>
               <p className="text-[9px] font-black text-slate-700 uppercase mb-6 tracking-[0.2em] italic ml-1">Google Search Preview</p>
               <div className="space-y-2">
                  <p className="text-indigo-400 text-lg font-black hover:underline cursor-pointer truncate italic mb-1">{seoForm.seo_title || 'ELVIA | Optimización CV con IA'}</p>
                  <p className="text-emerald-700 text-[10px] font-bold tracking-tight uppercase truncate">https://elvia.lat › cv-optimizer</p>
                  <p className="text-slate-500 text-[11px] line-clamp-3 leading-relaxed mt-2 font-medium italic">
                    {seoForm.seo_meta_description || 'Analiza tu currículum contra cualquier vacante en tiempo real y vence a los filtros ATS con tecnología de vanguardia...'}
                  </p>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MarketingTab
