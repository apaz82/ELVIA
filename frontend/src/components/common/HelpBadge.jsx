import React, { useState, useEffect, useRef } from 'react';
import * as Icons from '@phosphor-icons/react';
import { HELP_CONTENT } from '../../data/helpContent';

export default function HelpBadge({ id, className = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const badgeRef = useRef(null);

  const content = HELP_CONTENT[id];
  if (!content) return null;

  // Cerrar el popover al hacer clic fuera del componente
  useEffect(() => {
    function handleClickOutside(event) {
      if (badgeRef.current && !badgeRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Si el usuario presiona la tecla Escape, cerramos el popover
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Obtener dinámicamente el componente de icono de Phosphor
  const IconComponent = Icons[content.iconName] || Icons.Question;

  const toggleOpen = (e) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  return (
    <div className={`relative inline-flex items-center ${className}`} ref={badgeRef}>
      {/* Botón "?" Circular Elegante */}
      <button
        type="button"
        onClick={toggleOpen}
        aria-label="Ayuda contextual"
        aria-expanded={isOpen}
        className={`
          w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
          transition-all duration-200 shadow-sm border focus:outline-none focus:ring-2 focus:ring-primary/20
          ${isOpen 
            ? 'bg-primary text-white border-primary shadow' 
            : 'bg-white text-gray-400 hover:text-gray-600 border-gray-300/80 hover:border-gray-400/50 hover:bg-gray-50'
          }
        `}
      >
        <Icons.Question size={14} weight="bold" />
      </button>

      {/* Popover Flotante de Ayuda (Estilo Premium Apple Glassmorphism) */}
      {isOpen && (
        <div 
          className="
            absolute z-50 w-72 p-4 mt-2
            bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-100
            animate-fade-in-up transition-all duration-200
            left-1/2 -translate-x-1/2 top-full
            sm:left-auto sm:right-0 sm:translate-x-0
          "
          style={{
            animation: 'fadeInUp 0.2s ease-out forwards',
            minWidth: '280px'
          }}
        >
          {/* Cabecera del popover con icono de sección y botón de cerrar */}
          <div className="flex items-start justify-between gap-3 mb-2.5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <IconComponent size={18} weight="duotone" />
              </div>
              <h4 className="font-semibold text-gray-800 text-sm tracking-tight">
                {content.titulo}
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600 rounded-lg p-0.5 hover:bg-gray-100 transition-colors"
              aria-label="Cerrar ayuda"
            >
              <Icons.X size={14} weight="bold" />
            </button>
          </div>

          {/* Descripción en lenguaje claro */}
          <p className="text-xs text-gray-500 leading-relaxed font-normal antialiased">
            {content.descripcion}
          </p>

          {/* Flecha sutil en la parte superior (decorativa) */}
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 sm:left-auto sm:right-4 sm:translate-x-0 w-3 h-3 rotate-45 bg-white border-t border-l border-gray-100" />
        </div>
      )}

      {/* Estilo keyframes inyectado localmente si es necesario */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translate(var(--tw-translate-x, 0), 8px);
          }
          to {
            opacity: 1;
            transform: translate(var(--tw-translate-x, 0), 0);
          }
        }
      `}} />
    </div>
  );
}
