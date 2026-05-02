require('dotenv').config({ path: __dirname + '/../.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAdmin() {
  const email = 'Superadmin@elvia.lat';
  
  const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
  const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!existingUser) {
      console.log('User not found in Auth.');
      return;
  }
  
  console.log(`Auth ID: ${existingUser.id}`);

  const { data, error } = await supabaseAdmin
    .from('administrators')
    .select('*')
    .eq('id', existingUser.id);

  if (error) {
      console.error('Error querying administrators:', error.message);
  } else {
      console.log('Admin record:', data);
  }
}

checkAdmin();
