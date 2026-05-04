require('dotenv').config();
const { supabaseAdmin } = require('./src/lib/supabase');

async function checkProfilesSchema() {
  // Obtenemos un registro para ver las columnas
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .limit(1);
    
  if (error) {
    console.error('Error:', error.message);
  } else if (data && data.length > 0) {
    console.log('Columnas disponibles en la tabla "profiles":');
    console.log(Object.keys(data[0]).join(', '));
  } else {
    console.log('No hay perfiles para auditar.');
  }
}

checkProfilesSchema();
