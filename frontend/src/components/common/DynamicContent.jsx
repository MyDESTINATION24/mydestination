import React, { useEffect, useState } from 'react';

/**
 * Public Dynamic Content Placeholder Component
 * Fetches JSON AST by slug token and safely renders text nodes with normalized
 * Tailwind typography classes without breaking fixed React layouts or components.
 */
const DynamicContent = ({ slug, fallbackContent = null }) => {
  const [astData, setAstData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchContent = async () => {
      try {
        const response = await fetch(`/api/cms/docx/content/${slug}`);
        const result = await response.json();

        if (isMounted) {
          if (result.success && result.data?.ast) {
            setAstData(result.data.ast);
          } else {
            setError(true);
          }
        }
      } catch (err) {
        if (isMounted) setError(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (slug) {
      fetchContent();
    } else {
      setLoading(false);
      setError(true);
    }

    return () => {
      isMounted = false;
    };
  }, [slug]);

  if (loading) {
    return <div className="animate-pulse bg-slate-200 h-6 w-3/4 rounded my-2"></div>;
  }

  if (error || !astData || astData.length === 0) {
    return <>{fallbackContent}</>;
  }

  return (
    <div className="dynamic-content-wrapper space-y-4">
      {astData.map((node, index) => {
        const { nodeType, level, text, typography } = node;
        const classes = [
          typography.fontFamilyClass || 'font-inter',
          typography.fontSizeClass || 'text-base',
          typography.colorClass || 'text-slate-900',
          typography.isBold ? 'font-bold' : '',
          typography.isItalic ? 'italic' : '',
          typography.isUnderline ? 'underline' : '',
          typography.alignment ? `text-${typography.alignment}` : '',
        ].filter(Boolean).join(' ');

        if (nodeType === 'heading') {
          const Tag = `h${level || 1}`;
          return <Tag key={index} className={classes}>{text}</Tag>;
        }

        return <p key={index} className={classes}>{text}</p>;
      })}
    </div>
  );
};

export default DynamicContent;
