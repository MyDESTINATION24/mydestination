import zlib from 'zlib';
import {
  FONT_WHITELIST,
  BRAND_COLOR_WHITELIST,
  RESPONSIVE_FONT_SIZE_MAP,
} from '../../../config/typographyConfig.js';

/**
 * Enterprise DOCX XML AST Parser (Zero-dependency & Pure Node.js resilient solution)
 * Reads word/document.xml from PK ZIP buffer, strips images & layout tags,
 * maps typography to design whitelist tokens, and generates structured JSON AST.
 */
export const processDocxToAstAndReport = async (buffer) => {
  const validationReport = {
    detectedHeadings: 0,
    detectedParagraphs: 0,
    imagesIgnored: 0,
    fontFallbacks: [],
    colorFallbacks: [],
    strippedElements: [],
  };

  // 1. Locate word/document.xml inside PK Zip Archive Buffer
  const xmlContent = extractDocumentXmlFromZip(buffer);
  if (!xmlContent) {
    throw new Error('Corrupt or invalid DOCX document: word/document.xml not found.');
  }

  // Count & track ignored images if present in XML (<w:drawing> or <v:shape>)
  const drawingMatches = xmlContent.match(/<w:drawing[\s\S]*?<\/w:drawing>/gi) || [];
  validationReport.imagesIgnored = drawingMatches.length;

  const jsonAst = [];

  // 2. Extract Paragraph Blocks (<w:p>...</w:p>)
  const paragraphRegex = /<w:p(?:\s[^>]*)?>([\s\S]*?)<\/w:p>/gi;
  let pMatch;

  while ((pMatch = paragraphRegex.exec(xmlContent)) !== null) {
    const pInner = pMatch[1];

    // Check style name for headings (<w:pStyle w:val="Heading1"/>)
    let nodeType = 'paragraph';
    let level = 0;
    const styleMatch = pInner.match(/<w:pStyle\s+w:val="([^"]+)"/i);
    if (styleMatch) {
      const styleVal = styleMatch[1].toLowerCase();
      if (styleVal.includes('heading')) {
        nodeType = 'heading';
        const lvlMatch = styleVal.match(/\d+/);
        level = lvlMatch ? parseInt(lvlMatch[0], 10) : 1;
        validationReport.detectedHeadings += 1;
      } else if (styleVal.includes('title')) {
        nodeType = 'heading';
        level = 1;
        validationReport.detectedHeadings += 1;
      }
    }

    if (nodeType === 'paragraph') {
      validationReport.detectedParagraphs += 1;
    }

    // Extract Text Runs (<w:r>...</w:r>)
    const textPieces = [];
    let isBold = false;
    let isItalic = false;
    let isUnderline = false;
    let colorHex = null;
    let fontName = null;
    let halfPtSize = null;
    let alignment = 'left';

    // Alignment check (<w:jc w:val="center"/>)
    const alignMatch = pInner.match(/<w:jc\s+w:val="([^"]+)"/i);
    if (alignMatch) {
      const alignVal = alignMatch[1].toLowerCase();
      if (['left', 'center', 'right', 'justify'].includes(alignVal)) {
        alignment = alignVal;
      }
    }

    const runRegex = /<w:r(?:\s[^>]*)?>([\s\S]*?)<\/w:r>/gi;
    let rMatch;
    while ((rMatch = runRegex.exec(pInner)) !== null) {
      const rInner = rMatch[1];

      // Format flags inside <w:rPr>
      if (/<w:b\/>|<w:b\s+w:val="(?:true|1)"/i.test(rInner)) isBold = true;
      if (/<w:i\/>|<w:i\s+w:val="(?:true|1)"/i.test(rInner)) isItalic = true;
      if (/<w:u\s+/i.test(rInner)) isUnderline = true;

      // Color (<w:color w:val="000000"/>)
      const cMatch = rInner.match(/<w:color\s+w:val="([^"]+)"/i);
      if (cMatch && cMatch[1] !== 'auto') colorHex = `#${cMatch[1].toLowerCase()}`;

      // Font Family (<w:rFonts w:ascii="Poppins"/>)
      const fMatch = rInner.match(/<w:rFonts\s+[^>]*w:ascii="([^"]+)"/i);
      if (fMatch) fontName = fMatch[1].toLowerCase();

      // Font Size (<w:sz w:val="48"/> -> half points, 48 = 24pt)
      const sMatch = rInner.match(/<w:sz\s+w:val="(\d+)"/i);
      if (sMatch) halfPtSize = parseInt(sMatch[1], 10);

      // Extract text content (<w:t>text</w:t>)
      const tRegex = /<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/gi;
      let tMatch;
      while ((tMatch = tRegex.exec(rInner)) !== null) {
        textPieces.push(tMatch[1]);
      }
    }

    const fullText = textPieces.join('').trim();
    if (!fullText) continue;

    // Font Family Whitelist Mapping
    let fontFamilyClass = FONT_WHITELIST['default'];
    if (fontName) {
      if (FONT_WHITELIST[fontName]) {
        fontFamilyClass = FONT_WHITELIST[fontName];
      } else {
        validationReport.fontFallbacks.push(`Mapped unapproved font '${fontName}' to '${fontFamilyClass}'`);
      }
    }

    // Responsive Size Token Mapping
    let fontSizeClass = RESPONSIVE_FONT_SIZE_MAP[RESPONSIVE_FONT_SIZE_MAP.length - 1].class;
    if (halfPtSize) {
      const ptValue = halfPtSize / 2;
      const rule = RESPONSIVE_FONT_SIZE_MAP.find((r) => ptValue >= r.minPt);
      if (rule) fontSizeClass = rule.class;
    } else if (nodeType === 'heading') {
      if (level === 1) fontSizeClass = RESPONSIVE_FONT_SIZE_MAP[0].class;
      else if (level === 2) fontSizeClass = RESPONSIVE_FONT_SIZE_MAP[1].class;
      else fontSizeClass = RESPONSIVE_FONT_SIZE_MAP[2].class;
    }

    // Brand Color Whitelist Mapping
    let colorClass = BRAND_COLOR_WHITELIST['default'];
    if (colorHex) {
      if (BRAND_COLOR_WHITELIST[colorHex]) {
        colorClass = BRAND_COLOR_WHITELIST[colorHex];
      } else {
        validationReport.colorFallbacks.push(`Mapped color '${colorHex}' to default brand color`);
      }
    }

    // Sanitize string output
    const cleanText = sanitizeString(fullText);

    jsonAst.push({
      nodeType,
      level,
      text: cleanText,
      typography: {
        fontFamilyClass,
        fontSizeClass,
        colorClass,
        isBold,
        isItalic,
        isUnderline,
        alignment,
      },
    });
  }

  return { jsonAst, validationReport };
};

/**
 * Extracts word/document.xml from PK Zip Buffer without third-party dependencies
 */
function extractDocumentXmlFromZip(buffer) {
  let offset = 0;
  while (offset < buffer.length - 30) {
    // Local File Header Signature: 50 4B 03 04
    if (
      buffer[offset] === 0x50 &&
      buffer[offset + 1] === 0x4b &&
      buffer[offset + 2] === 0x03 &&
      buffer[offset + 3] === 0x04
    ) {
      const compMethod = buffer.readUInt16LE(offset + 8);
      const compSize = buffer.readUInt32LE(offset + 18);
      const fileNameLen = buffer.readUInt16LE(offset + 26);
      const extraLen = buffer.readUInt16LE(offset + 28);

      const fileName = buffer.toString('utf8', offset + 30, offset + 30 + fileNameLen);
      const dataOffset = offset + 30 + fileNameLen + extraLen;

      if (fileName === 'word/document.xml') {
        const compressedData = buffer.slice(dataOffset, dataOffset + compSize);
        if (compMethod === 8) {
          // Deflate Compressed
          return zlib.inflateRawSync(compressedData).toString('utf8');
        } else if (compMethod === 0) {
          // Uncompressed
          return compressedData.toString('utf8');
        }
      }
      offset = dataOffset + compSize;
    } else {
      offset++;
    }
  }
  return null;
}

function sanitizeString(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
