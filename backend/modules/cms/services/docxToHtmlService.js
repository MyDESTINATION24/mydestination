import zlib from 'zlib';

/**
 * Converts a Word .docx file into clean, safe HTML for rich-text fields.
 *
 * Keeps what matters for readable long-form content -- headings, paragraphs,
 * bullet and numbered lists, bold/italic/underline, line breaks, links' text
 * and simple tables -- and drops everything else (fonts, colours, images,
 * styles). All text is HTML-escaped; no attribute from the document reaches
 * the output, so the result is safe to render.
 */

// ---------- zip ----------

// Reads entries via the central directory, which also works when a writer
// streamed the file and left sizes out of the local headers.
const readZipEntries = (buffer) => {
  const EOCD_SIG = 0x06054b50;
  let eocd = -1;
  for (let i = buffer.length - 22; i >= Math.max(0, buffer.length - 65557); i -= 1) {
    if (buffer.readUInt32LE(i) === EOCD_SIG) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('This is not a valid .docx file.');

  const count = buffer.readUInt16LE(eocd + 10);
  let offset = buffer.readUInt32LE(eocd + 16);
  const entries = new Map();

  for (let n = 0; n < count; n += 1) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) break;
    const method = buffer.readUInt16LE(offset + 10);
    const compSize = buffer.readUInt32LE(offset + 20);
    const nameLen = buffer.readUInt16LE(offset + 28);
    const extraLen = buffer.readUInt16LE(offset + 30);
    const commentLen = buffer.readUInt16LE(offset + 32);
    const localOffset = buffer.readUInt32LE(offset + 42);
    const name = buffer.toString('utf8', offset + 46, offset + 46 + nameLen);
    entries.set(name, { method, compSize, localOffset });
    offset += 46 + nameLen + extraLen + commentLen;
  }

  const read = (name) => {
    const entry = entries.get(name);
    if (!entry) return null;
    const lo = entry.localOffset;
    if (buffer.readUInt32LE(lo) !== 0x04034b50) return null;
    const dataStart = lo + 30 + buffer.readUInt16LE(lo + 26) + buffer.readUInt16LE(lo + 28);
    const data = buffer.subarray(dataStart, dataStart + entry.compSize);
    if (entry.method === 0) return data.toString('utf8');
    if (entry.method === 8) return zlib.inflateRawSync(data).toString('utf8');
    return null;
  };

  return { read };
};

// ---------- xml helpers ----------

const escapeHtml = (text) => String(text)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const decodeXml = (text) => String(text)
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"')
  .replace(/&apos;/g, "'")
  .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
  .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
  .replace(/&amp;/g, '&');

const isOn = (rPr, tag) => {
  const match = rPr.match(new RegExp(`<w:${tag}(?:\\s+w:val="([^"]*)")?\\s*/>`));
  if (!match) return false;
  return !match[1] || !['0', 'false', 'none'].includes(match[1].toLowerCase());
};

// numId -> whether level 0 is a numbered (vs bulleted) list
const readNumberingFormats = (numberingXml) => {
  const formats = new Map();
  if (!numberingXml) return formats;
  const abstractFormats = new Map();
  for (const m of numberingXml.matchAll(/<w:abstractNum\b[^>]*w:abstractNumId="(\d+)"[^>]*>([\s\S]*?)<\/w:abstractNum>/g)) {
    const levels = new Map();
    for (const lvl of m[2].matchAll(/<w:lvl\b[^>]*w:ilvl="(\d+)"[^>]*>([\s\S]*?)<\/w:lvl>/g)) {
      const fmt = lvl[2].match(/<w:numFmt\s+w:val="([^"]+)"/);
      levels.set(Number(lvl[1]), fmt ? fmt[1] : 'bullet');
    }
    abstractFormats.set(m[1], levels);
  }
  for (const m of numberingXml.matchAll(/<w:num\b[^>]*w:numId="(\d+)"[^>]*>([\s\S]*?)<\/w:num>/g)) {
    const abs = m[2].match(/<w:abstractNumId\s+w:val="(\d+)"/);
    if (abs) formats.set(m[1], abstractFormats.get(abs[1]) || new Map());
  }
  return formats;
};

// ---------- conversion ----------

const runsToHtml = (paragraphXml) => {
  let html = '';
  // Runs, including those inside hyperlinks and smart tags.
  for (const run of paragraphXml.matchAll(/<w:r\b[^>]*>([\s\S]*?)<\/w:r>/g)) {
    const inner = run[1];
    const rPr = (inner.match(/<w:rPr>([\s\S]*?)<\/w:rPr>/) || [])[1] || '';
    let text = '';
    for (const piece of inner.matchAll(/<w:(t|tab|br|cr)\b[^>]*?(?:\/>|>([\s\S]*?)<\/w:t>)/g)) {
      if (piece[1] === 't') text += escapeHtml(decodeXml(piece[2] || ''));
      else if (piece[1] === 'tab') text += ' ';
      else text += '<br>';
    }
    if (!text) continue;
    if (isOn(rPr, 'u') && !/<w:u\s+w:val="none"/.test(rPr)) text = `<u>${text}</u>`;
    if (isOn(rPr, 'i')) text = `<em>${text}</em>`;
    if (isOn(rPr, 'b')) text = `<strong>${text}</strong>`;
    html += text;
  }
  // Merge adjacent identical tags produced by run splitting.
  return html.replace(/<\/(strong|em|u)><\1>/g, '');
};

const headingLevelFor = (pPr) => {
  const style = (pPr.match(/<w:pStyle\s+w:val="([^"]+)"/) || [])[1] || '';
  const lower = style.toLowerCase();
  if (lower === 'title') return 1;
  if (lower === 'subtitle') return 3;
  const heading = lower.match(/^heading\s*(\d)$/) || lower.match(/^(\d)$/);
  if (heading) return Math.min(Math.max(Number(heading[1]), 1), 4);
  const outline = pPr.match(/<w:outlineLvl\s+w:val="(\d)"/);
  if (outline) return Math.min(Number(outline[1]) + 1, 4);
  return 0;
};

export const convertDocxToHtml = (buffer) => {
  const zip = readZipEntries(buffer);
  const documentXml = zip.read('word/document.xml');
  if (!documentXml) throw new Error('This is not a valid Word document.');
  const numberFormats = readNumberingFormats(zip.read('word/numbering.xml'));

  const body = (documentXml.match(/<w:body>([\s\S]*)<\/w:body>/) || [])[1] || documentXml;
  const out = [];
  let openList = null; // 'ul' | 'ol'
  const stats = { headings: 0, paragraphs: 0, listItems: 0, tables: 0, imagesSkipped: 0 };

  const closeList = () => {
    if (openList) { out.push(`</${openList}>`); openList = null; }
  };

  // Walk top-level paragraphs and tables in order.
  const blockRegex = /<w:tbl>[\s\S]*?<\/w:tbl>|<w:p\b[^>]*\/>|<w:p\b[^>]*>[\s\S]*?<\/w:p>/g;
  for (const block of body.matchAll(blockRegex)) {
    const xml = block[0];
    stats.imagesSkipped += (xml.match(/<w:drawing\b|<w:pict\b/g) || []).length;

    if (xml.startsWith('<w:tbl')) {
      closeList();
      const rows = [...xml.matchAll(/<w:tr\b[^>]*>([\s\S]*?)<\/w:tr>/g)].map((row) =>
        [...row[1].matchAll(/<w:tc\b[^>]*>([\s\S]*?)<\/w:tc>/g)].map((cell) =>
          [...cell[1].matchAll(/<w:p\b[^>]*>([\s\S]*?)<\/w:p>/g)].map((p) => runsToHtml(p[1])).filter(Boolean).join('<br>')
        )
      ).filter((cells) => cells.some(Boolean));
      if (rows.length) {
        stats.tables += 1;
        out.push(`<table><tbody>${rows.map((cells) => `<tr>${cells.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`);
      }
      continue;
    }

    const pPr = (xml.match(/<w:pPr>([\s\S]*?)<\/w:pPr>/) || [])[1] || '';
    const content = runsToHtml(xml).replace(/^(<br>)+|(<br>)+$/g, '').trim();
    if (!content || !content.replace(/<[^>]+>/g, '').trim()) {
      closeList();
      continue;
    }

    const numId = (pPr.match(/<w:numId\s+w:val="(\d+)"/) || [])[1];
    const ilvl = Number((pPr.match(/<w:ilvl\s+w:val="(\d+)"/) || [])[1] || 0);
    const isList = numId && numId !== '0';
    if (isList) {
      const fmt = numberFormats.get(numId)?.get(ilvl) || 'bullet';
      const tag = fmt === 'bullet' || fmt === 'none' ? 'ul' : 'ol';
      if (openList !== tag) { closeList(); out.push(`<${tag}>`); openList = tag; }
      out.push(`<li>${content}</li>`);
      stats.listItems += 1;
      continue;
    }

    closeList();
    const level = headingLevelFor(pPr);
    if (level) {
      // Heading text is plain; the heading tag carries the weight.
      const plain = content.replace(/<\/?(strong|em|u)>/g, '');
      out.push(`<h${level + 1 > 4 ? 4 : level + 1}>${plain}</h${level + 1 > 4 ? 4 : level + 1}>`);
      stats.headings += 1;
    } else {
      out.push(`<p>${content}</p>`);
      stats.paragraphs += 1;
    }
  }
  closeList();

  return { html: out.join('\n'), stats };
};
