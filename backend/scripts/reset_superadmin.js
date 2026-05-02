require('dotenv').config({ path: __dirname + '/../.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function resetPassword() {
  const email = 'Superadmin@elvia.lat';
  const newPassword = 'ElviaAdmin2026!';

  console.log(`Resetting password for: ${email}`);

  const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
  const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!existingUser) {
      console.log('User not found.');
      return;
  }

  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
    existingUser.id,
    { password: newPassword }
  );

  if (error) {
      console.error('Error updating password:', error.message);
  } else {
      console.log('Password successfully updated!');
      console.log(`New Password: ${newPassword}`);
  }
}

resetPassword();
