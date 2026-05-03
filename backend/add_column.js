
require('dotenv').config();
const { supabaseAdmin } = require('./src/lib/supabase');

async function addColumn() {
  const { data, error } = await supabaseAdmin.rpc('run_sql', {
    sql: 'ALTER TABLE waitlist_leads ADD COLUMN IF NOT EXISTS ciudad TEXT;'
  });
  
  if (error) {
    console.error('Error adding column:', error);
    // If run_sql is not available, we can't do it this way.
  } else {
    console.log('Column ciudad added (or already existed).');
  }
}

addColumn();
