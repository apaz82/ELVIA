import { UsersThree, EnvelopeSimple, ArrowRight, ShieldCheck, Star } from '@phosphor-icons/react'

export default function Expertos() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-surface overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20 relative">
        
        {/* Glow Effects Background */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-96 h-96 bg-primary/20 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/3 w-96 h-96 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Texto / Copy */}
          <div className="space-y-8 z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest border border-primary/20">
              <UsersThree weight="duotone" size={16} />
              <span>Red de Mentores Top</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-on-surface leading-[1.1] tracking-tight">
              Lleva tu carrera al siguiente nivel con <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-teal-500 to-emerald-400">Expertos Reales</span>
            </h1>
            
            <p className="text-lg md:text-xl text-on-surface-variant leading-relaxed max-w-xl">
              Si necesitas apoyo de último minuto para una entrevista, recomendaciones de alto nivel, o practicar una sesión técnica y conductual con un mentor experto de la industria, estás en el lugar correcto.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button onClick={() => window.location.href='mailto:expertos@optimacv.com'} className="bg-primary text-white hover:bg-primary/90 flex items-center justify-center gap-3 group px-8 py-4 rounded-xl font-bold shadow-lg shadow-primary/30 transition-all hover:scale-[1.02]">
                <EnvelopeSimple size={22} weight="bold" />
                Contactar a un Mentor
                <ArrowRight size={18} weight="bold" className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
            
            <div className="flex items-center gap-8 pt-8 mt-4 border-t border-outline-variant/30">
              <div className="flex items-center gap-2.5">
                <ShieldCheck size={28} weight="duotone" className="text-primary" />
                <span className="text-sm font-semibold text-on-surface-variant leading-tight">Top 1% de<br/>la industria</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Star size={28} weight="duotone" className="text-amber-500" />
                <span className="text-sm font-semibold text-on-surface-variant leading-tight">Calificación<br/>4.9 de 5.0</span>
              </div>
            </div>
          </div>
          
          {/* Hero Image */}
          <div className="relative z-10 w-full max-w-lg mx-auto lg:max-w-none">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/30 to-emerald-400/30 blur-2xl rounded-[3rem] -z-10 transform rotate-3 scale-105 transition-transform duration-500"></div>
            <div className="rounded-[2.5rem] overflow-hidden border border-outline-variant/30 shadow-2xl relative group bg-surface-container-lowest">
              <img 
                src="/mentor_hero.png" 
                alt="AI Mentor Guiding Candidate" 
                className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-700 aspect-[4/5] md:aspect-square lg:aspect-[4/5]"
              />
              
              {/* Glass overlay subtle */}
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none"></div>
              
              <div className="absolute bottom-6 left-6 right-6">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-2xl flex items-center gap-4 hover:bg-white/20 transition-colors shadow-xl">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center shrink-0 shadow-lg">
                    <UsersThree size={28} className="text-white" weight="duotone" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-base">Sesiones 1-a-1 Exclusivas</h3>
                    <p className="text-white/80 text-sm mt-0.5 font-medium">Feedback directo, honesto y accionable.</p>
                  </div>
                </div>
              </div>
              
            </div>
          </div>
          
        </div>
      </div>
    </div>
  )
}
