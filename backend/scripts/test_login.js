require('dotenv').config({ path: __dirname + '/../.env' });
const { createClient } = require('@supabase/supabase-js');

const db = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY // Use anon key like the frontend
);

async function testLogin() {
  console.log('Logging in...');
  const { data, error } = await db.auth.signInWithPassword({
    email: 'Superadmin@elvia.lat',
    password: 'ElviaAdmin2026!'
  });

  if (error) {
    console.error('Login error:', error.message);
    return;
  }

  console.log('Logged in. Querying administrators table...');
  const { data: adminData, error: adminErr } = await db
    .from('administrators')
    .select('*')
    .eq('id', data.user.id)
    .single();

  if (adminErr) {
    console.error('Query error:', adminErr);
  } else {
    console.log('Query success:', adminData);
  }
}

testLogin();
