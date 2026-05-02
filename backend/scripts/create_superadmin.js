require('dotenv').config({ path: __dirname + '/../.env' });
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createSuperAdmin() {
  const email = 'Superadmin@elvia.lat';
  const nombre = 'Super Admin';
  const tempPassword = crypto.randomBytes(12).toString('hex') + 'A1!'; // Secure temp password

  console.log(`Creating superadmin: ${email}`);

  let userId;

  // Check if user already exists
  const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
  const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (existingUser) {
    console.log('User already registered in auth, skipping auth creation...');
    userId = existingUser.id;
  } else {
    // 1. Create user in auth
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { nombre }
    });

    if (authError) {
      console.error('Error creating user in auth:', authError.message);
      return;
    }
    userId = authUser.user.id;
  }

  if (!userId) {
      console.error('Could not find or create user ID.');
      return;
  }

  // 2. Add to administrators table
  const { data: adminData, error: adminError } = await supabaseAdmin
    .from('administrators')
    .upsert({
      id: userId,
      email: email,
      nombre: nombre,
      role: 'super_admin',
      is_active: true
    }, { onConflict: 'id' });

  if (adminError) {
    console.error('Error creating admin record:', adminError.message);
  } else {
    console.log('Successfully created/updated admin record!');
    console.log(`Email: ${email}`);
    console.log(`Temporary Password: ${tempPassword}`);
    console.log('SAVE THIS PASSWORD - it is only shown once.');
  }
}

createSuperAdmin();
