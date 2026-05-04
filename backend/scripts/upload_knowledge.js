require('dotenv').config({ path: '../.env' });
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// 1. Inicializar Clientes
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Necesitamos rol de servicio para saltar RLS
if (!supabaseUrl || !supabaseKey) throw new Error('Faltan variables de Supabase en .env');

const supabase = createClient(supabaseUrl, supabaseKey);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const embedModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });

const DOCS_DIR = path.join(__dirname, '../knowledge_docs');

// Asegurar que exista la carpeta
if (!fs.existsSync(DOCS_DIR)) {
  fs.mkdirSync(DOCS_DIR);
}

/**
 * Función para dividir un texto grande en fragmentos manejables (chunks)
 * de aproximadamente ~1000 caracteres.
 */
function chunkText(text, maxChars = 1000) {
  const paragraphs = text.split(/\n\s*\n/);
  const chunks = [];
  let currentChunk = '';

  for (const p of paragraphs) {
    if ((currentChunk.length + p.length) > maxChars && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = '';
    }
    currentChunk += p + '\n\n';
  }
  if (currentChunk.trim().length > 0) chunks.push(currentChunk.trim());
  return chunks;
}

/**
 * Procesa todos los PDFs y TXTs de la carpeta knowledge_docs
 */
async function processDocuments() {
  console.log('Iniciando carga de documentos en Supabase (pgvector)...');
  
  const files = fs.readdirSync(DOCS_DIR);
  if (files.length === 0) {
    console.log(`⚠️ No hay archivos en ${DOCS_DIR}. Coloca tus PDFs o TXTs ahí y vuelve a correr el script.`);
    return;
  }

  for (const file of files) {
    const filePath = path.join(DOCS_DIR, file);
    let text = '';

    if (file.endsWith('.pdf')) {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      text = data.text;
    } else if (file.endsWith('.txt') || file.endsWith('.md')) {
      text = fs.readFileSync(filePath, 'utf-8');
    } else {
      console.log(`Saltando ${file} (formato no soportado)`);
      continue;
    }

    if (!text.trim()) continue;

    console.log(`\nProcesando: ${file}`);
    const chunks = chunkText(text, 1000);
    console.log(`- Generados ${chunks.length} fragmentos.`);

    let insertCount = 0;
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      try {
        // Generar Embedding con Gemini
        const result = await embedModel.embedContent(chunk);
        const embedding = result.embedding.values;

        // Guardar en Supabase
        const { error } = await supabase.from('elvia_knowledge').insert({
          content: chunk,
          metadata: { filename: file, chunk_index: i },
          embedding: embedding
        });

        if (error) {
          console.error(`Error guardando chunk ${i} de ${file}:`, error.message);
        } else {
          insertCount++;
        }
        
        // Pequeño delay para no saturar la API de Gemini
        await new Promise(res => setTimeout(res, 500));
      } catch (err) {
        console.error(`Error en API Gemini para chunk ${i}:`, err.message);
      }
    }
    console.log(`✅ Documento ${file} subido (${insertCount} fragmentos insertados).`);
  }

  console.log('\n🎉 ¡Proceso completado! La base de conocimientos de ELVIA está actualizada.');
}

processDocuments().catch(console.error);
