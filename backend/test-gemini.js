require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function test() {
  console.log('--- DIAGNÓSTICO GEMINI ---');
  console.log('API KEY detectada:', process.env.GEMINI_API_KEY ? 'SÍ (empieza con ' + process.env.GEMINI_API_KEY.substring(0, 5) + '...)' : 'NO');
  
  if (!process.env.GEMINI_API_KEY) {
    console.error('ERROR: No hay GEMINI_API_KEY en el .env');
    return;
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  try {
    console.log('Enviando mensaje de prueba a Google...');
    const result = await model.generateContent('Hola, responde solo "OK" si recibes esto.');
    console.log('RESPUESTA DE GOOGLE:', result.response.text());
    console.log('--- PRUEBA EXITOSA ---');
  } catch (err) {
    console.error('--- ERROR EN LA API DE GOOGLE ---');
    console.error('Mensaje:', err.message);
    if (err.status) console.error('Status:', err.status);
    if (err.response) console.error('Detalle:', JSON.stringify(err.response, null, 2));
  }
}

test();
