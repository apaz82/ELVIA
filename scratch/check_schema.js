
const { supabaseAdmin } = require('./backend/src/lib/supabase');

async function checkSchema() {
  const { data, error } = await supabaseAdmin
    .from('waitlist_leads')
    .select('*')
    .limit(1);
  
  if (error) {
    console.error('Error fetching waitlist_leads:', error);
    return;
  }
  console.log('Columns in waitlist_leads:', Object.keys(data[0] || {}));
}

checkSchema();
