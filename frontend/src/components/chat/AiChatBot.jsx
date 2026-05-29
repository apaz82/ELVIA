import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Sparkle, X, PaperPlaneRight, Robot, User, CornersOut, CornersIn, Briefcase, MagnifyingGlass, Microphone, Star, LinkedinLogo, Notepad, Target } from '@phosphor-icons/react';
import { useChat } from '../../hooks/useChat';
import ReactMarkdown from 'react-markdown';

const TIPS_POR_RUTA = {
  '/cv-optimizer': [
    { titulo: 'Resumen con impacto', subtitulo: '¿Cómo describir mis logros con métricas?', mensaje: 'Cómo redactar el resumen de mi CV con logros y métricas concretas que impresionen', Icon: Star, bg: 'bg-amber-50', text: 'text-amber-500' },
    { titulo: 'Palabras clave ATS', subtitulo: 'Para pasar los filtros automáticos', mensaje: 'Qué son las palabras clave ATS y cómo incluirlas correctamente en mi CV', Icon: MagnifyingGlass, bg: 'bg-blue-50', text: 'text-blue-500' },
    { titulo: 'Formato ideal', subtitulo: '¿Qué diseño recomiendas para mi industria?', mensaje: 'Qué formato y estructura de CV es más efectivo para destacar en procesos de selección', Icon: Notepad, bg: 'bg-green-50', text: 'text-green-500' },
  ],
  '/cv-vs-job': [
    { titulo: 'Interpretar mi score', subtitulo: '¿Qué significa mi % de compatibilidad?', mensaje: 'Explícame qué significa mi porcentaje de compatibilidad con una vacante y cómo interpretarlo', Icon: Target, bg: 'bg-purple-50', text: 'text-purple-500' },
    { titulo: 'Mejorar el match', subtitulo: 'Estrategia para adaptar mi CV', mensaje: 'Dame estrategias concretas para mejorar mi compatibilidad con una vacante específica', Icon: MagnifyingGlass, bg: 'bg-blue-50', text: 'text-blue-500' },
    { titulo: 'Palabras clave críticas', subtitulo: 'Las que no debo omitir en mi CV', mensaje: 'Cuáles son las palabras clave más importantes que debo incluir en mi CV para mejorar mi match con vacantes', Icon: Star, bg: 'bg-amber-50', text: 'text-amber-500' },
  ],
  '/entrevista': [
    { titulo: 'Método STAR', subtitulo: 'Responde con ejemplos concretos', mensaje: 'Explícame el método STAR para responder preguntas de entrevista con ejemplos poderosos', Icon: Star, bg: 'bg-amber-50', text: 'text-amber-500' },
    { titulo: 'Preguntas difíciles', subtitulo: 'Debilidades, salario, despido...', mensaje: 'Cómo responder preguntas difíciles en entrevista como cuál es tu mayor debilidad o por qué dejaste tu trabajo', Icon: Microphone, bg: 'bg-blue-50', text: 'text-blue-500' },
    { titulo: 'Preguntas al entrevistador', subtitulo: '¿Qué debo preguntar al final?', mensaje: 'Qué preguntas inteligentes puedo hacerle al entrevistador al final de la entrevista para destacar', Icon: Robot, bg: 'bg-green-50', text: 'text-green-500' },
  ],
  '/linkedin-pro': [
    { titulo: 'Titular que atrae', subtitulo: '¿Cómo destacar en LinkedIn®?', mensaje: 'Dame tips para escribir un titular de LinkedIn que atraiga reclutadores y oportunidades', Icon: LinkedinLogo, bg: 'bg-blue-50', text: 'text-blue-600' },
    { titulo: 'Conectar con reclutadores', subtitulo: 'Networking efectivo sin ser invasivo', mensaje: 'Cómo conectar con reclutadores en LinkedIn de forma efectiva y profesional', Icon: Briefcase, bg: 'bg-purple-50', text: 'text-purple-500' },
    { titulo: 'Extracto que vende', subtitulo: 'Redacta tu "Acerca de" con impacto', mensaje: 'Cómo redactar el extracto de LinkedIn que cuente mi historia y atraiga las oportunidades que busco', Icon: Notepad, bg: 'bg-green-50', text: 'text-green-500' },
  ],
  '/pipeline': [
    { titulo: 'Avanzar en el proceso', subtitulo: 'Estrategias por etapa del pipeline', mensaje: 'Dame estrategias para avanzar en cada etapa de un proceso de selección', Icon: Briefcase, bg: 'bg-blue-50', text: 'text-blue-500' },
    { titulo: 'Negociar mi oferta', subtitulo: '¿Cómo defender mi valor salarial?', mensaje: 'Cómo negociar una oferta de trabajo y defender el salario que merezco con confianza', Icon: Star, bg: 'bg-amber-50', text: 'text-amber-500' },
    { titulo: 'Manejar el rechazo', subtitulo: '¿Qué hacer cuando no avanzas?', mensaje: 'Cómo manejar el rechazo en procesos de selección y mantener la motivación', Icon: Sparkle, bg: 'bg-green-50', text: 'text-green-500' },
  ],
  '/proyecto-laboral': [
    { titulo: 'Plan semanal efectivo', subtitulo: '¿Cómo organizar mi búsqueda?', mensaje: 'Ayúdame a crear un plan semanal efectivo para mi búsqueda de empleo', Icon: Target, bg: 'bg-teal-50', text: 'text-teal-500' },
    { titulo: '¿Por dónde empezar?', subtitulo: 'Pilares prioritarios para mi situación', mensaje: 'Por cuál pilar del proyecto laboral debería empezar y cómo organizarme para avanzar más rápido', Icon: Briefcase, bg: 'bg-blue-50', text: 'text-blue-500' },
    { titulo: 'Medir mi progreso', subtitulo: '¿Cómo sé si voy bien?', mensaje: 'Cómo medir el progreso de mi búsqueda de empleo y saber si mis acciones están dando resultados', Icon: Star, bg: 'bg-amber-50', text: 'text-amber-500' },
  ],
}

const TIPS_DEFAULT = [
  { titulo: 'Preguntas sobre la app', subtitulo: '¿Cómo optimizar mi CV o buscar vacantes?', mensaje: 'Preguntas sobre la app', Icon: Robot, bg: 'bg-blue-50', text: 'text-blue-500' },
  { titulo: 'Procesos de selección', subtitulo: 'Tips para entrevistas y LinkedIn', mensaje: 'Sobre procesos de selección', Icon: Sparkle, bg: 'bg-green-50', text: 'text-green-500' },
  { titulo: 'Frase motivadora', subtitulo: 'Una dosis de inspiración extra', mensaje: 'Quieres una frase motivadora', Icon: Sparkle, bg: 'bg-amber-50', text: 'text-amber-500' },
]

export default function AiChatBot() {
  const { user } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const { messages, inputVal, setInputVal, loading, sendMessage, mensajesUsuario, maxMensajes, limitAlcanzado } = useChat();
  const messagesEndRef = useRef(null);

  // Auto-abrir en Dashboard solo la primera vez que el usuario ve el dashboard (ever)
  useEffect(() => {
    if (location.pathname !== '/dashboard') return
    if (localStorage.getItem('elvia_bot_greeted')) return
    const timer = setTimeout(() => {
      setIsOpen(true)
      localStorage.setItem('elvia_bot_greeted', '1')
    }, 1400)
    return () => clearTimeout(timer)
  }, [])

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // No renderizar si no hay usuario autenticado (después de todos los hooks)
  if (!user) return null;
  
  // No renderizar el bot en las landings co-brandeadas B2B (/empresas/:slug o /universidades/:slug)
  const path = location.pathname.toLowerCase();
  const isLandingB2B = /^\/(empresas|universidades)\/[^/]+$/.test(path);
  if (isLandingB2B) return null;

  // No renderizar el bot de candidato en el Panel HR (es para otro publico).
  // HR-aware bot se construira en iteracion posterior con contexto de cohort.
  if (path.startsWith('/empresa-admin')) return null;

  return (
    <>
      {/* Botón Flotante FAB */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full bg-[#0A3D2A] text-white shadow-float hover:scale-105 transition-all duration-300 flex items-center justify-center overflow-hidden border-2 border-[#0A3D2A] ${isOpen ? 'opacity-0 pointer-events-none scale-75' : 'opacity-100 scale-100 delay-100'}`}
        aria-label="Abrir asistente IA"
      >
        <img src="/Avatar-Elvia-HD.webp" alt="ELVIA" className="w-full h-full object-cover rounded-full" />
        <span className="absolute top-0 right-0 w-3 h-3 bg-[#E8541A] rounded-full border-2 border-surface animate-pulse"></span>
      </button>

      {/* Ventana de Chat (Glassmorphism Modal) */}
      <div 
        className={`fixed z-50 transition-all duration-300 flex flex-col overflow-hidden bg-surface-container-lowest/95 backdrop-blur-xl border border-outline-variant/30 shadow-floatLg
          ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none origin-bottom-right scale-50'}
          ${isExpanded 
             ? 'inset-0 w-full h-[100dvh] sm:inset-4 sm:w-[calc(100vw-2rem)] sm:h-[calc(100dvh-2rem)] rounded-none sm:rounded-3xl' 
             : 'bottom-6 right-6 sm:bottom-8 sm:right-8 w-[calc(100vw-2rem)] sm:w-[360px] h-[520px] max-h-[85vh] rounded-3xl origin-bottom-right scale-100'
          }`}
      >
        {/* Header del Chat */}
        <div className="h-16 px-5 bg-gradient-to-r from-[#0A3D2A] to-primary flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#0A3D2A] overflow-hidden flex items-center justify-center shrink-0 border border-white/20">
              <img src="/Avatar-Elvia-HD.webp" alt="ELVIA" className="w-full h-full object-cover rounded-full" />
            </div>
            <div>
              <h3 className="text-white text-sm font-bold tracking-tight">ELVIA</h3>
              <p className="text-white/70 text-[10px] uppercase tracking-widest font-bold">Tu mentora 24X7</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-8 h-8 rounded-full hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              title={isExpanded ? "Minimizar" : "Expandir"}
            >
              {isExpanded ? <CornersIn size={16} weight="bold" /> : <CornersOut size={16} weight="bold" />}
            </button>
            <button 
              onClick={() => { setIsOpen(false); setIsExpanded(false); }}
              className="w-8 h-8 rounded-full hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              title="Cerrar"
            >
              <X size={16} weight="bold" />
            </button>
          </div>
        </div>

        {/* Área de mensajes */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-surface/50 relative scrollbar-thin scrollbar-thumb-outline-variant/50">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center overflow-hidden shrink-0 ${msg.role === 'user' ? 'bg-primary/20 text-primary' : 'bg-[#0A3D2A] shadow-sm border border-outline-variant/50'}`}>
                {msg.role === 'user' ? <User size={14} weight="bold" /> : <img src="/Avatar-Elvia-HD.webp" alt="O" className="w-full h-full object-cover rounded-full" />}
              </div>
              <div className={`p-3.5 rounded-2xl text-sm max-w-[85%] leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-primary text-white rounded-tr-sm shadow-sm' 
                  : 'bg-white border border-outline-variant/30 text-on-surface rounded-tl-sm shadow-sm'
                }`}
              >
                {msg.role === 'user' ? (
                  msg.content
                ) : (
                  <div className="chat-markdown-body">
                    <ReactMarkdown
                      components={{
                        p: ({node, ...props}) => <p className="mb-2 last:mb-0 text-[13px] sm:text-sm" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-3 space-y-1 text-[13px] sm:text-sm" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-3 space-y-1 text-[13px] sm:text-sm" {...props} />,
                        li: ({node, ...props}) => <li className="marker:text-primary/70" {...props} />,
                        h1: ({node, ...props}) => <h1 className="font-bold text-base sm:text-lg mb-2 mt-4 text-gray-900 leading-tight" {...props} />,
                        h2: ({node, ...props}) => <h2 className="font-bold text-[15px] sm:text-base mb-2 mt-4 text-gray-900 leading-tight" {...props} />,
                        h3: ({node, ...props}) => <h3 className="font-semibold text-sm sm:text-[15px] mb-1.5 mt-3 text-gray-800" {...props} />,
                        strong: ({node, ...props}) => <strong className="font-bold text-gray-900" {...props} />,
                        a: ({node, ...props}) => <a className="text-primary hover:text-primary-dark underline font-medium break-words" target="_blank" rel="noreferrer" {...props} />,
                        blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-primary/30 pl-3 italic text-gray-600 my-2" {...props} />
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Acciones Rápidas — contextuales según la ruta */}
          {messages.length === 1 && !loading && (
            <div className="flex flex-col gap-2.5 mt-2 ml-10 animate-fade-in">
              <p className="text-[11px] text-on-surface-variant font-semibold uppercase tracking-wider mb-0.5 opacity-70">
                Sugerencias para empezar:
              </p>
              {(TIPS_POR_RUTA[location.pathname] || TIPS_DEFAULT).map((tip, i) => {
                const Icon = tip.Icon
                return (
                  <button
                    key={i}
                    onClick={() => sendMessage(null, tip.mensaje)}
                    className="group flex items-center gap-3 bg-white border border-outline-variant/30 p-3 rounded-2xl text-[13px] text-left hover:border-primary hover:bg-primary/5 transition-all shadow-sm active:scale-95"
                  >
                    <div className={`w-8 h-8 rounded-full ${tip.bg} ${tip.text} flex items-center justify-center shrink-0 group-hover:brightness-95 transition-colors`}>
                      <Icon size={18} weight="duotone" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-800 leading-tight">{tip.titulo}</p>
                      <p className="text-[11px] text-gray-400">{tip.subtitulo}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {loading && (
            <div className="flex gap-3 flex-row">
              <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden shrink-0 bg-[#0A3D2A] shadow-sm border border-outline-variant/50">
                <img src="/Avatar-Elvia-HD.webp" alt="O" className="w-full h-full object-cover rounded-full" />
              </div>
              <div className="p-4 rounded-2xl bg-white border border-outline-variant/30 rounded-tl-sm flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} className="h-2"></div>
        </div>

        {/* Input Footer */}
        <div className="p-4 bg-white border-t border-outline-variant/30 shrink-0">
          <form 
            onSubmit={sendMessage}
            className="flex items-center gap-2 bg-surface-container-lowest border border-outline-variant/50 rounded-full pr-2 pl-4 py-1.5 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all"
          >
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Pregunta sobre RRHH, CVs..."
              className="flex-1 bg-transparent text-sm text-on-surface focus:outline-none py-2 placeholder-on-surface-variant/50"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!inputVal.trim() || loading}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-primary text-white disabled:opacity-50 disabled:bg-surface-container-high disabled:text-on-surface-variant transition-colors hover:brightness-110"
            >
              <PaperPlaneRight size={16} weight="fill" />
            </button>
          </form>
          <div className="flex items-center justify-between mt-2 px-1">
            <span className="text-[10px] text-on-surface-variant/50 font-medium">ELVIA AI</span>
            <span className={`text-[10px] font-semibold ${limitAlcanzado ? 'text-red-400' : mensajesUsuario >= maxMensajes * 0.8 ? 'text-amber-500' : 'text-on-surface-variant/40'}`}>
              {mensajesUsuario}/{maxMensajes} mensajes
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
