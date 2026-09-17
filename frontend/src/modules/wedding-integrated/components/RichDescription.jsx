import SafeHTML from "../../../components/common/SafeHTML";

const escapeHtml = (text) =>
  String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

// Descriptions saved before the rich editor existed are plain text whose line
// breaks the page ignored, so they rendered as one wall of text. Rebuild
// structure from the lines: short title-like lines become headings and
// "Label: text" lines get a bold label.
export const plainTextToHtml = (text) =>
  String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const labelled = line.match(/^([^:.!?]{2,45}):\s+(.+)$/);
      if (labelled) {
        return `<p><strong>${escapeHtml(labelled[1])}:</strong> ${escapeHtml(labelled[2])}</p>`;
      }
      if (line.length <= 60 && !/[.!?,;:]$/.test(line)) {
        return `<h3>${escapeHtml(line)}</h3>`;
      }
      return `<p>${escapeHtml(line)}</p>`;
    })
    .join("");

const looksLikeHtml = (value) => /<\/?(p|h[1-6]|ul|ol|li|strong|em|br|div|table|span|b|i|u)\b/i.test(value || "");

// Long-form destination text: readable typography for headings, paragraphs,
// lists and tables, whether it came from the editor, a Word import or old
// plain text.
const RichDescription = ({ value, className = "" }) => {
  if (!value || !String(value).trim()) return null;
  const html = looksLikeHtml(value) ? value : plainTextToHtml(value);

  return (
    <>
      <style>{`
        .wedding-rich-description { color: hsl(var(--muted-foreground)); overflow-wrap: anywhere; word-break: normal; }
        .wedding-rich-description > * + * { margin-top: 0.9em; }
        .wedding-rich-description p { line-height: 1.8; }
        .wedding-rich-description h1, .wedding-rich-description h2, .wedding-rich-description h3, .wedding-rich-description h4 {
          font-family: 'Playfair Display', serif; color: hsl(var(--foreground)); margin-top: 1.4em !important; margin-bottom: 0.3em !important;
        }
        .wedding-rich-description > :first-child { margin-top: 0 !important; }
        .wedding-rich-description strong { color: hsl(var(--foreground)); font-weight: 600; }
        .wedding-rich-description ul, .wedding-rich-description ol { padding-left: 1.4rem !important; }
        .wedding-rich-description li { line-height: 1.7; margin-top: 0.35em !important; }
        .wedding-rich-description li::marker { color: hsl(var(--primary)); }
        .wedding-rich-description table { width: 100%; border-collapse: collapse; font-size: 0.95em; display: block; overflow-x: auto; }
        .wedding-rich-description td, .wedding-rich-description th { border: 1px solid hsl(var(--border)); padding: 0.5rem 0.75rem; vertical-align: top; }
        .wedding-rich-description tr:first-child td { font-weight: 600; color: hsl(var(--foreground)); }
      `}</style>
      <SafeHTML html={html} className={`wedding-rich-description text-sm md:text-lg ${className}`} />
    </>
  );
};

export default RichDescription;
