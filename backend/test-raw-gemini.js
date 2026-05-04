require('dotenv').config();

async function testRaw() {
  const apiKey = process.env.GEMINI_API_KEY;
  // Usamos el endpoint oficial de la v1beta
  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  console.log('Probando conexión RAW a Google AI Studio...');
  
  const body = {
    contents: [{
      parts: [{ text: 'Repite: "CONEXION EXITOSA"' }]
    }]
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (response.ok) {
      console.log('--- ¡ÉXITO TOTAL! ---');
      console.log('Respuesta:', data.candidates[0].content.parts[0].text);
    } else {
      console.error('--- ERROR DE GOOGLE ---');
      console.error('Status:', response.status);
      console.error('Mensaje:', JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error('Error de red:', err.message);
  }
}

testRaw();
