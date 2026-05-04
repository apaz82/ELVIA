require('dotenv').config();
const { supabaseAdmin } = require('./src/lib/supabase');

async function checkVectors() {
  const { data, error, count } = await supabaseAdmin
    .from('elvia_knowledge')
    .select('*', { count: 'exact', head: true });
    
  if (error) {
    console.error('Error fetching vectors:', error.message);
  } else {
    console.log(`La base de datos vectorial tiene ${count} fragmentos guardados.`);
  }
}

checkVectors();
