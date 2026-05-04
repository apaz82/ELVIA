const { supabaseAdmin } = require('../lib/supabase');

/**
 * Busca en Supabase usando búsqueda de texto (Fallback robusto sin Gemini)
 */
const searchKnowledgeBase = async (query) => {
  console.log('[RAG] Buscando en base de conocimientos para:', query.substring(0, 50));
  
  try {
    // Intentamos una búsqueda por palabras clave en la columna 'content'
    // Dividimos la query en palabras para una búsqueda más amplia
    const words = query.split(' ').filter(w => w.length > 3).join(' | ');

    const { data, error } = await supabaseAdmin
      .from('elvia_knowledge')
      .select('content')
      .textSearch('content', words || query, {
        type: 'websearch',
        config: 'spanish'
      })
      .limit(5);

    if (error) {
      console.error('[RAG] Error en búsqueda de texto:', error.message);
      // Fallback a un ILIKE simple si falla el textSearch
      const { data: fallbackData } = await supabaseAdmin
        .from('elvia_knowledge')
        .select('content')
        .ilike('content', `%${query.split(' ')[0]}%`)
        .limit(3);
      
      return fallbackData ? fallbackData.map(d => d.content).join('\n\n---\n\n') : '';
    }

    if (!data || data.length === 0) {
      console.log('[RAG] No se encontraron resultados por texto.');
      return '';
    }

    console.log(`[RAG] Éxito: ${data.length} fragmentos encontrados.`);
    return data.map(doc => doc.content).join('\n\n---\n\n');
  } catch (error) {
    console.error('[RAG] Error crítico:', error.message);
    return '';
  }
};

module.exports = { searchKnowledgeBase };
