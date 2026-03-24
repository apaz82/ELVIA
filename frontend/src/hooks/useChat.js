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
      
      if (res.error) {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Lo siento, hubo un error al conectar con mis sistemas. Intenta de nuevo más tarde.' }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: res.reply }]);
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
