
require('dotenv').config();
const { supabaseAdmin } = require('./src/lib/supabase');

async function checkLeads() {
  const { data, error } = await supabaseAdmin
    .from('waitlist_leads')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (error) {
    console.error('Error fetching leads:', error);
    return;
  }
  console.log('Last 5 leads:', data);
}

checkLeads();
