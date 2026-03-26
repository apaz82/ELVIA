import { ChartLineUp, Image } from '@phosphor-icons/react'

const INFOGRAFIAS_DATA = [
  { id: 1, img: '/info_ats.png', titulo: 'Cómo Vencer los Filtros ATS', tag: 'CV & Formato' },
  { id: 2, img: '/info_cv.png', titulo: 'Estructura Perfecta del CV', tag: 'CV & Formato' },
  { id: 3, img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=800&auto=format&fit=crop', titulo: 'Preparación Pre-Entrevista', tag: 'Entrevistas' },
  { id: 4, img: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=800&auto=format&fit=crop', titulo: 'Dominando el Método STAR', tag: 'Entrevistas' },
  { id: 5, img: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=800&auto=format&fit=crop', titulo: 'Negociación Salarial Pro', tag: 'Ofertas' },
  { id: 6, img: 'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=800&auto=format&fit=crop', titulo: '¿Aceptar la Contraoferta?', tag: 'Ofertas' },
  { id: 7, img: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop', titulo: 'Networking en LinkedIn', tag: 'Networking' },
  { id: 8, img: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=800&auto=format&fit=crop', titulo: 'Entrevistas Conductuales', tag: 'Entrevistas' },
  { id: 9, img: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=800&auto=format&fit=crop', titulo: 'El Mercado Laboral Oculto', tag: 'Networking' },
  { id: 10, img: 'https://images.unsplash.com/photo-1578574577315-3fbf0ee5ab06?q=80&w=800&auto=format&fit=crop', titulo: 'Seguimiento Post-Entrevista', tag: 'Estrategia' },
]

export default function Infografias() {
  return (
    <div className="min-h-screen bg-surface pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Header */}
        <div className="mb-14 text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-teal-400/10 text-teal-500 mb-5 border border-teal-400/20 shadow-sm">
            <ChartLineUp size={36} weight="duotone" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-on-surface mb-4 tracking-tight">Infografías de <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-500">Carrera</span></h1>
          <p className="text-on-surface-variant text-base md:text-lg">Explora conceptos complejos de reclutamiento, optimización de perfiles y procesos de selección a través de visualizaciones hiper-realistas.</p>
        </div>

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
          {INFOGRAFIAS_DATA.map((info) => (
            <div key={info.id} className="group flex flex-col bg-surface-container-lowest border border-outline-variant/30 rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl hover:border-amber-400/40 transition-all duration-300 transform hover:-translate-y-1">
              
              {/* Contenedor Imagen */}
              <div className="aspect-square sm:aspect-[4/3] overflow-hidden relative bg-surface-container">
                {info.img ? (
                  <img 
                    src={info.img} 
                    alt={info.titulo} 
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-outline-variant">
                    <Image size={48} weight="thin" />
                  </div>
                )}
                {/* Gradiente Overlay inferior */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>
              
              {/* Contenido inferior */}
              <div className="p-5 flex-1 flex flex-col justify-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-teal-600 mb-1.5 block">{info.tag}</span>
                <h3 className="text-base font-bold text-on-surface line-clamp-2 leading-snug">{info.titulo}</h3>
              </div>

            </div>
          ))}
        </div>
        
      </div>
    </div>
  )
}
