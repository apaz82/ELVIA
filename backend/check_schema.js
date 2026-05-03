
require('dotenv').config();
const { supabaseAdmin } = require('./src/lib/supabase');

async function checkSchema() {
  const { data, error } = await supabaseAdmin
    .from('waitlist_leads')
    .select('*')
    .limit(1);
  
  if (error) {
    console.error('Error fetching waitlist_leads:', error);
    return;
  }
  if (data && data.length > 0) {
    console.log('Columns in waitlist_leads:', Object.keys(data[0]));
  } else {
    console.log('No data in waitlist_leads to check columns.');
  }
}

checkSchema();
