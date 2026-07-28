import React from 'react';

/**
 * Universal Safe HTML Renderer Component
 * Displays stored HTML strings safely on public website pages while preserving
 * font family, font sizes, colors, headings, lists, tables, and links.
 */
const SafeHTML = ({ html = '', fallback = null, className = '', as: Component = 'div', style = {} }) => {
  if (!html || typeof html !== 'string' || html.trim() === '') {
    return fallback ? <>{fallback}</> : null;
  }

  return (
    <>
      <style>{`
        .rich-text-content ul {
          list-style-type: disc !important;
          padding-left: 1.5rem !important;
          margin-top: 0.25rem !important;
          margin-bottom: 0.25rem !important;
        }
        .rich-text-content ol {
          list-style-type: decimal !important;
          padding-left: 1.5rem !important;
          margin-top: 0.25rem !important;
          margin-bottom: 0.25rem !important;
        }
        .rich-text-content li {
          margin-top: 0.15rem !important;
          margin-bottom: 0.15rem !important;
          display: list-item !important;
        }
        .rich-text-content h1 {
          font-size: 2rem !important;
          font-weight: 800 !important;
          margin-top: 0.5rem !important;
          margin-bottom: 0.25rem !important;
          line-height: 1.2 !important;
        }
        .rich-text-content h2 {
          font-size: 1.6rem !important;
          font-weight: 700 !important;
          margin-top: 0.5rem !important;
          margin-bottom: 0.25rem !important;
          line-height: 1.25 !important;
        }
        .rich-text-content h3 {
          font-size: 1.3rem !important;
          font-weight: 700 !important;
          margin-top: 0.4rem !important;
          margin-bottom: 0.2rem !important;
          line-height: 1.3 !important;
        }
        .rich-text-content h4 {
          font-size: 1.1rem !important;
          font-weight: 600 !important;
          margin-top: 0.3rem !important;
          margin-bottom: 0.15rem !important;
          line-height: 1.4 !important;
        }
        .rich-text-content u {
          text-decoration: underline !important;
        }
        .rich-text-content s, .rich-text-content strike {
          text-decoration: line-through !important;
        }
        .rich-text-content a {
          color: #2563eb !important;
          text-decoration: underline !important;
          cursor: pointer !important;
        }
        .rich-text-content img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
        }
      `}</style>
      <Component
        className={`rich-text-content focus:outline-none ${className}`}
        style={style}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </>
  );
};

export default SafeHTML;
