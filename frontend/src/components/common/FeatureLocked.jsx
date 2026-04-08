// FeatureLocked.jsx — Premium UI for Gated Platform Tools
import { useNavigate } from 'react-router-dom'
import { Lock, ArrowRight, Kanban, CheckCircle, Info } from '@phosphor-icons/react'
import { useAuth as useGlobalAuth } from '../../context/AuthContext'

/**
 * @param {object} props
 * @param {string} props.titulo      - Title of the locked feature
 * @param {string} props.descripcion - Description of the feature to motivate the user
 * @param {ReactNode} props.icono    - Icon representing the feature
 */
export default function FeatureLocked({ titulo, descripcion, icono }) {
  const navigate = useNavigate()
  const { progresoLaboral } = useGlobalAuth()

  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] px-6 py-12 animate-fade-in relative overflow-hidden">
      
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-30">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px]" />
        <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-teal-400/5 rounded-full blur-[80px]" />
      </div>

      <div className="relative z-10 max-w-2xl w-full bg-white/70 backdrop-blur-xl border border-gray-200/50 rounded-[2.5rem] p-10 md:p-14 text-center shadow-2xl shadow-gray-200/40">
        
        {/* Lock Animation Container */}
        <div className="relative inline-flex items-center justify-center mb-10">
          <div className="w-24 h-24 rounded-3xl bg-gray-50 flex items-center justify-center text-gray-300 ring-1 ring-gray-100">
            {icono || <Lock size={44} weight="light" />}
          </div>
          <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-gray-900 rounded-2xl flex items-center justify-center shadow-xl ring-4 ring-white animate-bounce-subtle">
            <Lock size={18} weight="fill" className="text-white" />
          </div>
        </div>

        {/* Header */}
        <div className="space-y-3 mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-black uppercase tracking-widest border border-amber-100">
            <Lock size={12} weight="bold" />
            Acceso en Progreso
          </div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight leading-tight">
            Desbloquea el {titulo || 'Módulo'} <br className="hidden md:block" />
            <span className="text-primary">llevando tu proyecto al 100%</span>
          </h2>
          <p className="text-gray-500 text-lg leading-relaxed max-w-md mx-auto">
            {descripcion || 'Estamos configurando tu ecosistema de carrera para que sea de alto impacto. Completa tu Gerente de Búsqueda para activar esta herramienta.'}
          </p>
        </div>

        {/* Progress Tracker (Visual) */}
        <div className="bg-gray-50 border border-gray-200/60 rounded-3xl p-6 mb-10 text-left">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Kanban size={18} weight="duotone" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">Gerente de Búsqueda</p>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Estatus actual</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-primary tracking-tighter">{progresoLaboral}%</span>
            </div>
          </div>
          <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(232,84,26,0.3)]"
              style={{ width: `${progresoLaboral}%` }}
            />
          </div>
          <div className="flex items-center gap-2 mt-4 text-xs text-gray-400 font-medium">
            <Info size={14} className="text-gray-300" />
            Meta: 100% para activar el ecosistema Premium completo.
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col gap-4">
          <button
            onClick={() => navigate('/proyecto-laboral')}
            className="group w-full py-4.5 bg-gray-900 text-white font-black text-base rounded-[1.25rem] hover:bg-gray-800 transition-all shadow-xl shadow-gray-900/10 flex items-center justify-center gap-3 active:scale-[0.98]"
          >
            <CheckCircle size={20} weight="bold" className="text-primary" />
            Completar mi Gerente de Búsqueda
            <ArrowRight size={18} weight="bold" className="group-hover:translate-x-1 transition-transform" />
          </button>
          
          <button
            onClick={() => navigate('/dashboard')}
            className="text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors py-2 flex items-center justify-center gap-2"
          >
            Regresar al Dashboard
          </button>
        </div>

      </div>

      <style>{`
        @keyframes fade-in { 0% { opacity: 0; transform: translateY(10px) } 100% { opacity: 1; transform: translateY(0) } }
        .animate-fade-in { animation: fade-in 0.6s cubic-bezier(.22,1,.36,1) forwards; }
        .animate-bounce-subtle { animation: bounce-subtle 3s infinite ease-in-out; }
        @keyframes bounce-subtle { 0%, 100% { transform: translateY(0); opacity: 1 } 50% { transform: translateY(-3px); opacity: 0.9 } }
      `}</style>
    </div>
  )
}
