import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, ArrowRight, Loader2 } from 'lucide-react';
import axios from 'axios';
import WebsiteHeader from '../../components/ui/WebsiteHeader';
import WebsiteFooter from '../../components/ui/WebsiteFooter';
import SafeHTML from '../../components/common/SafeHTML';
import { API_BASE_URL } from '../../shared/api/runtimeConfig';

// Detail page for a card in a CMS-created section.
const SectionItemDetail = () => {
  const { slug, id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    axios.get(`${API_BASE_URL}/content-sections/${encodeURIComponent(slug)}/items/${encodeURIComponent(id)}`)
      .then((res) => { if (alive) setData(res.data?.data || null); })
      .catch(() => { if (alive) setData(null); })
      .finally(() => { if (alive) setLoading(false); });
    window.scrollTo(0, 0);
    return () => { alive = false; };
  }, [slug, id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-800" />
      </div>
    );
  }

  if (!data?.item) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Not Found</h2>
        <p className="text-slate-500 mb-8 max-w-md">This page might have been moved or deleted.</p>
        <button onClick={() => navigate(`/sections/${slug}`)} className="px-6 py-3 bg-emerald-800 text-white font-bold rounded-2xl hover:bg-emerald-950 transition">
          Back
        </button>
      </div>
    );
  }

  const { section, item, related = [] } = data;

  return (
    <>
      <main className="min-h-screen bg-slate-50 text-slate-900 pb-20">
        <WebsiteHeader />

        <div className="relative pt-24">
          <div className="max-w-7xl mx-auto px-4 md:px-12 pt-10 pb-6">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <button
                onClick={() => navigate(`/sections/${section.slug}`)}
                className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-50 border border-emerald-200 text-emerald-800 uppercase tracking-widest shadow-sm"
              >
                {section.navLabel}
              </button>
              {item.category ? (
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{item.category}</span>
              ) : null}
            </div>
            <SafeHTML html={item.title} as="h1" className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 mb-6 leading-snug" />
            <div className="flex items-center gap-4 text-xs text-slate-500 mb-8 border-b border-slate-200 pb-6">
              <span className="flex items-center gap-2"><Calendar size={12} className="text-slate-400" />{item.date}</span>
              {item.readTime ? <span>{item.readTime}</span> : null}
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 md:px-12">
            <div className="aspect-[21/9] md:rounded-2xl overflow-hidden border border-slate-200 shadow-md bg-slate-100">
              <img src={item.image} alt="" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-12 py-12">
          <div className="bg-white rounded-3xl p-6 md:p-10 border border-slate-200/60 mb-16">
            {item.excerpt ? (
              <SafeHTML html={item.excerpt} as="p" className="text-base md:text-lg font-medium text-slate-600 mb-8 leading-relaxed italic border-l-4 border-emerald-800 pl-4" />
            ) : null}
            <div className="prose prose-slate max-w-none">
              <SafeHTML html={item.content} className="text-slate-700 text-sm md:text-base leading-relaxed tracking-wide" />
            </div>
          </div>

          {related.length > 0 ? (
            <div className="mb-16">
              <h3 className="text-lg font-bold text-slate-800 mb-6 uppercase tracking-wider">More from {section.navLabel}</h3>
              <div className="grid md:grid-cols-3 gap-6">
                {related.map((other, index) => (
                  <motion.div
                    key={other._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    onClick={() => navigate(`/sections/${section.slug}/${other._id}`)}
                    className="group rounded-2xl border border-slate-200 bg-white overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
                  >
                    <div className="h-40 overflow-hidden bg-slate-100">
                      <img src={other.image} alt="" loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <div className="p-4">
                      <SafeHTML html={other.title} as="h4" className="text-sm font-bold text-slate-800 line-clamp-2 leading-snug mb-2" />
                      <span className="text-[10px] font-bold text-emerald-800 inline-flex items-center gap-1">
                        Read More <ArrowRight size={12} />
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </main>
      <WebsiteFooter />
    </>
  );
};

export default SectionItemDetail;
