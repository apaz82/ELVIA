require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function list() {
  try {
    console.log('Listando todos los modelos disponibles para tu API Key...');
    // Para listar modelos se necesita usar el cliente directamente o una petición fetch
    // Pero probemos una cosa más simple: ¿La API Key está bien cargada?
    console.log('Key:', process.env.GEMINI_API_KEY.substring(0, 10) + '...');
    
    // Si nada funciona, puede que necesitemos usar el nombre con prefijo
    // Intentemos gemini-1.5-pro que es el más nuevo
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    const result = await model.generateContent('hi');
    console.log('Respuesta:', result.response.text());
  } catch (err) {
    console.error('Error:', err.message);
    console.log('\n--- POSIBLE SOLUCIÓN ---');
    console.log('Ve a https://aistudio.google.com/ y asegúrate de que tu API Key esté activa');
    console.log('y que no tenga restricciones de IP o de servicios.');
  }
}

list();
