/**
 * Allowlist HTML sanitizer for CMS/admin-authored rich text (blogs, articles,
 * sections, destination descriptions, footer text, referral copy).
 *
 * That content is rendered with dangerouslySetInnerHTML on public pages while
 * login tokens live in localStorage, so a single script slipped into it -- by
 * a stolen admin login or a tampered commit -- could read every visitor's
 * session. Only formatting survives: known tags, a few attributes, http(s)/
 * mailto/tel links, images, and YouTube/Vimeo embeds. Scripts, event handlers,
 * javascript: URLs and CSS tricks are dropped.
 */

const ALLOWED_TAGS = new Set([
  'p', 'br', 'hr', 'div', 'span', 'section', 'article', 'blockquote', 'pre', 'code',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'del', 'ins', 'mark', 'small', 'sub', 'sup', 'font',
  'ul', 'ol', 'li', 'dl', 'dt', 'dd',
  'a', 'img', 'figure', 'figcaption', 'iframe',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col',
]);

// Removed together with everything inside them.
const DROP_WITH_CONTENT = new Set(['script', 'style', 'noscript', 'template', 'object', 'embed', 'applet', 'form', 'input', 'button', 'select', 'textarea', 'svg', 'math', 'link', 'meta', 'base', 'frame', 'frameset']);

const GLOBAL_ATTRS = new Set(['class', 'style', 'title', 'align', 'dir', 'lang']);
const TAG_ATTRS = {
  a: new Set(['href', 'target', 'rel']),
  img: new Set(['src', 'alt', 'width', 'height', 'loading']),
  iframe: new Set(['src', 'width', 'height', 'allow', 'allowfullscreen', 'frameborder', 'title']),
  font: new Set(['color', 'size', 'face']),
  td: new Set(['colspan', 'rowspan', 'width']),
  th: new Set(['colspan', 'rowspan', 'width', 'scope']),
  col: new Set(['span', 'width']),
  ol: new Set(['start', 'type']),
  table: new Set(['width', 'border', 'cellpadding', 'cellspacing']),
};

const SAFE_LINK = /^(https?:|mailto:|tel:|\/(?!\/)|#|\.{0,2}\/?[\w-])/i;
const SAFE_IMG = /^(https?:|\/(?!\/)|data:image\/(png|jpe?g|gif|webp|avif);base64,)/i;
const SAFE_EMBED = /^https:\/\/(www\.)?(youtube\.com|youtube-nocookie\.com|player\.vimeo\.com)\//i;

// Inline styles keep colours, fonts, sizes, alignment; anything that can
// load or execute (url(), expression(), behavior, -moz-binding) is removed.
const cleanStyle = (value) => String(value || '')
  .split(';')
  .map((rule) => rule.trim())
  .filter((rule) => rule && !/url\s*\(|expression\s*\(|javascript:|behavior\s*:|-moz-binding|@import|position\s*:\s*fixed/i.test(rule))
  .join('; ');

const cleanUrl = (value, pattern) => {
  // Browsers ignore whitespace/control characters inside a scheme
  // ("java\nscript:"), so judge the URL with them removed.
  const url = String(value || '').trim().replace(/[\u0000-\u001F\u007F\s]+/g, '');
  const scheme = url.match(/^([a-z][a-z0-9+.-]*):/i)?.[1]?.toLowerCase();
  if (scheme && !['http', 'https', 'mailto', 'tel', 'data'].includes(scheme)) return null;
  if (scheme === 'data' && !/^data:image\/(png|jpe?g|gif|webp|avif);base64,/i.test(url)) return null;
  return pattern.test(url) ? String(value).trim() : null;
};

const cleanNode = (node, doc) => {
  [...node.childNodes].forEach((child) => {
    if (child.nodeType === 8) { child.remove(); return; } // comments
    if (child.nodeType !== 1) return; // text stays
    const tag = child.tagName.toLowerCase();

    if (DROP_WITH_CONTENT.has(tag)) { child.remove(); return; }
    if (!ALLOWED_TAGS.has(tag)) {
      // Unknown wrapper: keep its (cleaned) contents, drop the element.
      cleanNode(child, doc);
      child.replaceWith(...child.childNodes);
      return;
    }

    [...child.attributes].forEach((attr) => {
      const name = attr.name.toLowerCase();
      const allowed = GLOBAL_ATTRS.has(name) || TAG_ATTRS[tag]?.has(name);
      if (!allowed || name.startsWith('on')) { child.removeAttribute(attr.name); return; }
      if (name === 'style') {
        const style = cleanStyle(attr.value);
        if (style) child.setAttribute('style', style); else child.removeAttribute('style');
      } else if (name === 'href') {
        const href = cleanUrl(attr.value, SAFE_LINK);
        if (href === null) child.removeAttribute('href');
      } else if (name === 'src') {
        const src = cleanUrl(attr.value, tag === 'iframe' ? SAFE_EMBED : SAFE_IMG);
        if (src === null) child.removeAttribute('src');
      }
    });

    if (tag === 'iframe' && !child.getAttribute('src')) { child.remove(); return; }
    if (tag === 'a' && child.getAttribute('target') === '_blank') child.setAttribute('rel', 'noopener noreferrer');
    cleanNode(child, doc);
  });
};

const cache = new Map();

export const sanitizeHtml = (html) => {
  if (!html || typeof html !== 'string') return '';
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    // No DOM: fall back to plain text rather than unsanitized markup.
    return html.replace(/<[^>]*>/g, '');
  }
  if (cache.has(html)) return cache.get(html);
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');
  cleanNode(doc.body, doc);
  const out = doc.body.innerHTML;
  if (cache.size > 300) cache.clear();
  cache.set(html, out);
  return out;
};

export default sanitizeHtml;
