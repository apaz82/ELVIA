// Genera un PDF en formato Harvard a partir del texto del CV
const { PDFDocument, StandardFonts, rgb, PageSizes } = require('pdf-lib');

const MARGENES = { sup: 65, inf: 65, izq: 72, der: 72 };
const LINE_HEIGHT = 15;

// Detectores de tipo de línea
const esDivisor   = (l) => /^[─━—\-]{3,}/.test(l);
const esHeaderSeccion = (l) => l.length > 3 && /^[A-ZÁÉÍÓÚÜÑ\s]+$/.test(l) && !/^\s*[•\-]/.test(l);
const esBullet    = (l) => /^\s*[•\-]/.test(l);

// Reemplaza caracteres Unicode no soportados por Times Roman (Latin-1 only)
const sanitizar = (texto) => texto
  .replace(/[\u201C\u201D\u201E]/g, '"')   // comillas tipográficas dobles
  .replace(/[\u2018\u2019\u201A]/g, "'")   // comillas tipográficas simples
  .replace(/[\u2014\u2013\u2012]/g, '-')   // em dash, en dash
  .replace(/\u2026/g, '...')               // elipsis
  .replace(/\u2022/g, '-')                 // bullet •
  .replace(/\u2010/g, '-')                 // guion unicode
  .replace(/[^\x00-\xFF]/g, '?');          // cualquier otro no-Latin-1

/**
 * @param {string} cvText - Texto completo del CV optimizado
 * @returns {Promise<Buffer>} Buffer del PDF generado
 */
const generarPDF = async (cvText) => {
  const doc = await PDFDocument.create();
  const fRegular = await doc.embedFont(StandardFonts.TimesRoman);
  const fBold    = await doc.embedFont(StandardFonts.TimesRomanBold);

  let page = doc.addPage(PageSizes.Letter);
  const { width, height } = page.getSize();
  const anchoUtil = width - MARGENES.izq - MARGENES.der;
  let y = height - MARGENES.sup;
  let primerasLineas = 0;

  // Agrega nueva página y resetea Y
  const nuevaPagina = () => {
    page = doc.addPage(PageSizes.Letter);
    y = height - MARGENES.sup;
  };

  // Renderiza texto con word-wrap y saltos de página automáticos
  const renderTexto = (texto, font, size, xBase = MARGENES.izq, centrado = false) => {
    const ancho = anchoUtil - (xBase - MARGENES.izq);
    const palabras = sanitizar(texto).split(' ');
    let linea = '';

    const imprimirLinea = (str) => {
      if (y < MARGENES.inf + size + 4) nuevaPagina();
      const x = centrado
        ? (width - font.widthOfTextAtSize(str, size)) / 2
        : xBase;
      page.drawText(str, { x, y, font, size, color: rgb(0, 0, 0) });
      y -= (size + 4);
    };

    for (const palabra of palabras) {
      const test = linea ? `${linea} ${palabra}` : palabra;
      if (font.widthOfTextAtSize(test, size) > ancho && linea) {
        imprimirLinea(linea);
        linea = palabra;
      } else {
        linea = test;
      }
    }
    if (linea) imprimirLinea(linea);
  };

  for (const lineaRaw of cvText.split('\n')) {
    const linea = lineaRaw.trim();

    // Línea vacía → espacio entre párrafos
    if (!linea) {
      y -= 5;
      continue;
    }

    // Divisor ────
    if (esDivisor(linea)) {
      if (y < MARGENES.inf + 12) nuevaPagina();
      page.drawLine({
        start: { x: MARGENES.izq,           y: y + 3 },
        end:   { x: width - MARGENES.der,   y: y + 3 },
        thickness: 0.6,
        color: rgb(0.35, 0.35, 0.35),
      });
      y -= 10;
      continue;
    }

    // Nombre (primera línea) — grande y centrado
    if (primerasLineas === 0) {
      renderTexto(linea, fBold, 16, MARGENES.izq, true);
      primerasLineas++;
      continue;
    }

    // Datos de contacto (segunda línea) — centrado solo si es línea corta tipo contacto
    if (primerasLineas === 1) {
      const esContacto = linea.includes('|') || linea.includes('@') || linea.length < 100;
      renderTexto(linea, fRegular, 10, MARGENES.izq, esContacto);
      y -= 4;
      primerasLineas++;
      continue;
    }

    // Header de sección (ALL CAPS)
    if (esHeaderSeccion(linea)) {
      y -= 4;
      renderTexto(linea, fBold, 11);
      continue;
    }

    // Bullet point — indentado 16px
    if (esBullet(linea)) {
      const textoLimpio = linea.replace(/^\s*[•\-]\s*/, '');
      renderTexto(`• ${textoLimpio}`, fRegular, 10, MARGENES.izq + 16);
      continue;
    }

    // Texto normal
    renderTexto(linea, fRegular, 10);
  }

  return Buffer.from(await doc.save());
};

module.exports = { generarPDF };
