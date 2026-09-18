import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock, Image as ImageIcon } from 'lucide-react';
import SafeHTML from '../common/SafeHTML';
import { sectionPath } from '../../services/contentSections';
import CardRow from './CardRow';

// The homepage block for a CMS-created section. The landing page and the CMS
// preview both render this, so what the admin previews is what visitors get.

export const SectionCard = ({ section, item, onClick }) => (
  <div
    onClick={onClick}
    className={`bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col h-full text-left ${onClick ? 'cursor-pointer' : ''}`}
  >
    <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
      {item.image ? (
        <img src={item.image} alt="" loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-400">
          <ImageIcon size={28} />
          <span className="text-[11px] font-semibold">Card image</span>
        </div>
      )}
      {item.badge ? (
        <span className="absolute top-3 left-3 bg-[#065f46] text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-md">{item.badge}</span>
      ) : null}
    </div>
    <div className="p-6 flex flex-col flex-grow">
      <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
        <span className="font-semibold text-[#065f46] uppercase tracking-wider">{item.category || section.navLabel}</span>
        {item.readTime ? <span className="flex items-center gap-1"><Clock size={12} /> {item.readTime}</span> : null}
      </div>
      {item.title ? (
        <SafeHTML html={item.title} as="h3" className="text-base md:text-lg font-bold text-slate-900 mb-2 line-clamp-2 leading-snug group-hover:text-[#065f46] transition-colors" />
      ) : (
        <h3 className="text-base md:text-lg font-bold text-slate-300 mb-2">Card title</h3>
      )}
      <SafeHTML html={item.excerpt} as="p" className="text-xs text-slate-500 line-clamp-3 leading-relaxed mb-4 flex-grow" />
      <div className="flex items-center gap-1.5 text-xs font-bold text-[#065f46] group-hover:translate-x-1 transition-transform">
        <span>Read More</span>
        <ArrowRight size={14} />
      </div>
    </div>
  </div>
);

const SectionBlock = ({ section, items, onItemClick, preview = false, className = '' }) => {
  const buttonLabel = section.buttonText || `Explore All ${section.navLabel || ''}`.trim();
  const buttonClass = 'inline-flex items-center gap-2 bg-[#065f46] text-white px-6 py-3 rounded-full text-xs font-bold tracking-widest uppercase hover:bg-green-700 transition shadow-md';

  return (
    <section
      id={preview ? undefined : `section-${section.slug}`}
      className={`py-16 md:py-24 border-t border-slate-200 ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          {section.subtitle ? (
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#065f46] mb-2">{section.subtitle}</p>
          ) : null}
          <h2 className="text-3xl md:text-5xl font-black font-serif text-slate-900 tracking-tight uppercase">
            {section.title || section.navLabel || 'Section title'}
          </h2>
          {section.description ? (
            <p className="text-sm text-slate-600 mt-3">{section.description}</p>
          ) : null}
        </div>

        <CardRow count={items.length}>
          {items.map((item, index) => (
            <SectionCard
              key={item._id || `preview-${index}`}
              section={section}
              item={item}
              onClick={onItemClick ? () => onItemClick(item) : undefined}
            />
          ))}
        </CardRow>

        <div className="text-center mt-10">
          {preview ? (
            <span className={buttonClass}>
              <span>{buttonLabel}</span>
              <ArrowRight size={14} />
            </span>
          ) : (
            <Link to={sectionPath(section)} className={buttonClass}>
              <span>{buttonLabel}</span>
              <ArrowRight size={14} />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
};

export default SectionBlock;
