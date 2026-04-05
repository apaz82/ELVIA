const pdf = require('pdf-parse');

/**
 * Extrae texto plano de un buffer de PDF
 * @param {Buffer} dataBuffer - El buffer del archivo PDF subido
 * @returns {Promise<string>} El texto extraído
 */
const extraerTextoPDF = async (dataBuffer) => {
  try {
    const data = await pdf(dataBuffer);
    return data.text;
  } catch (error) {
    console.error('[pdfParser] Error al extraer texto del PDF:', error.message);
    throw new Error('No se pudo procesar el archivo PDF. Asegúrate de que no esté protegido por contraseña.');
  }
};

module.exports = { extraerTextoPDF };
