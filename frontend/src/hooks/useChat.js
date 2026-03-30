import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../services/api';

export function useChat() {
  const location = useLocation();
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hola, soy **OPTIMA**, seré tu asistente y mentora en todo tu proceso de crecimiento profesional, puedes preguntarme por como usar una función de la app o sobre tu carrera.' }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async (e, quickText = null) => {
    if (e) e.preventDefault();
    const userMsg = quickText || inputVal.trim();
    if (!userMsg || loading) return;

    if (!quickText) setInputVal(''); // solo limpiar si no es quick action
    
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
        // Respuesta normal O rate limit con mensaje amigable
        setMessages(prev => [...prev, { role: 'assistant', content: res.reply }]);
      } else if (res.error) {
        // Errores de auth → pedir que recargue; otros → mensaje genérico
        console.error('[OPTIMA chat] backend error:', res.error);
        const esAuthError = res.error === 'Token inválido o expirado' || res.error === 'Token no proporcionado' || res.error === 'No autorizado';
        const msg = esAuthError
          ? 'Tu sesión ha expirado. Por favor, recarga la página e inicia sesión nuevamente.'
          : 'Lo siento, hubo un error al conectar con mis sistemas. Intenta de nuevo más tarde.';
        setMessages(prev => [...prev, { role: 'assistant', content: msg }]);
      }
    } catch (err) {
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
    sendMessage
  };
}
