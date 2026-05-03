import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const MAX_MENSAJES_FREE = 20;
const MAX_MENSAJES_PRO  = 50;

const MENSAJE_DASHBOARD = `¡Hola! Soy **ELVIA**, tu mentora de carrera 24/7. 👋

Estás en tu **Dashboard** — tu centro de control.

Este es el mejor momento para tomarte un respiro y dedicar el tiempo que necesitas para llenar tu **Gerente de Búsqueda**. Ahí construyes tu estrategia completa: perfil, recursos, semana de búsqueda y propuesta de valor. Cuanto antes lo completes, antes se desbloquean todas las herramientas.

¿En qué te puedo ayudar hoy?`;

const MENSAJE_GENERAL = `Hola, soy **ELVIA**, tu asistente y mentora en todo tu proceso de crecimiento profesional. Puedes preguntarme cómo usar cualquier función de la app o pedirme consejos sobre tu carrera.`;

export function useChat() {
  const location = useLocation();
  const { isPaidPlan } = useAuth();

  const MAX_MENSAJES_SESION = isPaidPlan ? MAX_MENSAJES_PRO : MAX_MENSAJES_FREE;

  const mensajeInicial = location.pathname === '/dashboard' ? MENSAJE_DASHBOARD : MENSAJE_GENERAL;

  const [messages, setMessages] = useState([
    { role: 'assistant', content: mensajeInicial }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(false);

  const mensajesUsuario = messages.filter(m => m.role === 'user').length;
  const limitAlcanzado = mensajesUsuario >= MAX_MENSAJES_SESION;

  const sendMessage = async (e, quickText = null) => {
    if (e) e.preventDefault();
    const userMsg = quickText || inputVal.trim();
    if (!userMsg || loading) return;

    if (limitAlcanzado) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Has alcanzado el límite de ${MAX_MENSAJES_SESION} mensajes por sesión. Recarga la página para iniciar una nueva conversación.`
      }]);
      return;
    }

    if (!quickText) setInputVal('');

    const newMessages = [...messages, { role: 'user', content: userMsg }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const currentContext = `El usuario se encuentra en la URL: ${location.pathname}`;
      const payload = {
        message: userMsg,
        history: messages.slice(1),
        context: currentContext
      };

      const res = await api.post('/api/chat', payload);

      if (res.reply) {
        setMessages(prev => [...prev, { role: 'assistant', content: res.reply }]);
      } else if (res.error) {
        const esAuthError = res.error === 'Token inválido o expirado' || res.error === 'Token no proporcionado' || res.error === 'No autorizado';
        const msg = esAuthError
          ? 'Tu sesión ha expirado. Por favor, recarga la página e inicia sesión nuevamente.'
          : 'Lo siento, hubo un error al conectar con mis sistemas. Intenta de nuevo más tarde.';
        setMessages(prev => [...prev, { role: 'assistant', content: msg }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error de red. Asegúrate de tener conexión.' }]);
    } finally {
      setLoading(false);
    }
  };

  return {
    messages,
    inputVal,
    setInputVal,
    loading,
    sendMessage,
    mensajesUsuario,
    maxMensajes: MAX_MENSAJES_SESION,
    limitAlcanzado,
  };
}
