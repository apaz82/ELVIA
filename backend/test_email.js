
require('dotenv').config();
const { sendWelcomeWaitlistEmail } = require('./src/services/resendService');

async function testEmail() {
  try {
    console.log('Sending test email to alejo.paz82@gmail.com...');
    const result = await sendWelcomeWaitlistEmail('alejo.paz82@gmail.com', 'Alejo', 'Sin empleo y en búsqueda activa');
    console.log('Email sent successfully:', result);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

testEmail();
