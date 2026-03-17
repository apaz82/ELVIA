// Extrae texto plano de archivos CV (PDF o Word)
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

/**
 * @param {Buffer} buffer   - Contenido del archivo en memoria (viene de Multer)
 * @param {string} mimetype - Tipo MIME del archivo
 * @returns {Promise<string>} Texto extraído del CV
 */
const parseCV = async (buffer, mimetype) => {
  if (mimetype === 'application/pdf') {
    const data = await pdfParse(buffer);
    return data.text;
  }

  if (
    mimetype === 'application/msword' ||
    mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  throw new Error(`Formato no soportado: ${mimetype}`);
};

module.exports = { parseCV };
