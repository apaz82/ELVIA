// Genera un archivo Word (.docx) en formato Harvard a partir del texto del CV
const { Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle, UnderlineType, Header } = require('docx');

// Detectores de tipo de línea (mismo criterio que pdfService)
const esDivisor       = (l) => /^[─━—\-]{3,}/.test(l);
const esHeaderSeccion = (l) => l.length > 3 && /^[A-ZÁÉÍÓÚÜÑ\s]+$/.test(l) && !/^\s*[•\-]/.test(l);
const esBullet        = (l) => /^\s*[•\-]/.test(l);

const FUENTE = 'Times New Roman';

/**
 * @param {string} cvText - Texto completo del CV optimizado
 * @param {object} opciones - { watermark: boolean }
 * @returns {Promise<Buffer>} Buffer del archivo .docx generado
 */
const generarWord = async (cvText, opciones = {}) => {
  const parrafos = [];
  let primerasLineas = 0;

  for (const lineaRaw of cvText.split('\n')) {
    const linea = lineaRaw.trim();

    // Línea vacía → espacio
    if (!linea) {
      parrafos.push(new Paragraph({ spacing: { after: 80 } }));
      continue;
    }

    // Divisor ──── → borde inferior del párrafo
    if (esDivisor(linea)) {
      parrafos.push(new Paragraph({
        border: {
          bottom: { color: '888888', style: BorderStyle.SINGLE, size: 6, space: 4 },
        },
        spacing: { after: 120 },
      }));
      continue;
    }

    // Nombre (primera línea) — grande, negrita, centrado
    if (primerasLineas === 0) {
      parrafos.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
        children: [new TextRun({ text: linea, bold: true, size: 28, font: FUENTE })],
      }));
      primerasLineas++;
      continue;
    }

    // Contacto (segunda línea) — centrado, normal
    if (primerasLineas === 1) {
      parrafos.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 160 },
        children: [new TextRun({ text: linea, size: 20, font: FUENTE })],
      }));
      primerasLineas++;
      continue;
    }

    // Header de sección (ALL CAPS) — negrita, subrayado, espacio arriba
    if (esHeaderSeccion(linea)) {
      parrafos.push(new Paragraph({
        spacing: { before: 200, after: 80 },
        children: [new TextRun({
          text: linea,
          bold: true,
          size: 24,
          font: FUENTE,
          underline: { type: UnderlineType.SINGLE },
        })],
      }));
      continue;
    }

    // Bullet point — indentado con viñeta manual
    if (esBullet(linea)) {
      const textoLimpio = linea.replace(/^\s*[•\-]\s*/, '');
      parrafos.push(new Paragraph({
        indent: { left: 360, hanging: 220 },
        spacing: { after: 60 },
        children: [new TextRun({ text: `• ${textoLimpio}`, size: 22, font: FUENTE })],
      }));
      continue;
    }

    // Texto normal
    parrafos.push(new Paragraph({
      spacing: { after: 60 },
      children: [new TextRun({ text: linea, size: 22, font: FUENTE })],
    }));
  }

  // Header con marca de agua para plan gratuito
  const headerWatermark = opciones.watermark
    ? new Header({
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({
              text: 'Generado con OptimaCV — optimacv.com — Versión gratuita',
              size: 16,
              color: '999999',
              font: FUENTE,
            })],
          }),
        ],
      })
    : undefined;

  const sectionProps = {
    properties: {
      page: {
        margin: { top: 1080, bottom: 1080, left: 1260, right: 1260 },
      },
    },
    children: parrafos,
  };
  if (headerWatermark) sectionProps.headers = { default: headerWatermark };

  const documento = new Document({
    sections: [sectionProps],
  });

  return await Packer.toBuffer(documento);
};

module.exports = { generarWord };
