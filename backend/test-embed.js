require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testEmbed() {
  console.log('--- TEST EMBEDDINGS ---');
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
    const result = await model.embedContent('Prueba');
    console.log('Embeddings generados:', result.embedding.values.length, 'dimensiones.');
    console.log('--- ÉXITO ---');
  } catch (err) {
    console.error('Error Embeddings:', err.message);
  }
}

testEmbed();
