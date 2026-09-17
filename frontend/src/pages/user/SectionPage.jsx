import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { ArrowRight, Calendar } from 'lucide-react';
import axios from 'axios';
import { isWebView } from '../../utils/deviceDetect';
import WebsiteHeader from '../../components/ui/WebsiteHeader';
import WebsiteFooter from '../../components/ui/WebsiteFooter';
import SafeHTML from '../../components/common/SafeHTML';
import { API_BASE_URL } from '../../shared/api/runtimeConfig';

// Listing page for a section created in CMS Admin -> Homepage Sections.
const SectionPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [section, setSection] = React.useState(null);
  const [items, setItems] = React.useState([]);
  const [status, setStatus] = React.useState('loading');

  React.useEffect(() => {
    let alive = true;
    setStatus('loading');
    axios.get(`${API_BASE_URL}/content-sections/${encodeURIComponent(slug)}`)
      .then((res) => {
        if (!alive) return;
        const data = res.data?.data;
        if (!data?.section) { setStatus('missing'); return; }
        setSection(data.section);
        setItems(data.items || []);
        setStatus('ready');
      })
      .catch(() => alive && setStatus('missing'));
    return () => { alive = false; };
  }, [slug]);

  if (isWebView()) {
    return <Navigate to="/" replace />;
  }

  // Blogs and Articles keep their own pages.
  if (section && section.kind !== 'custom') {
    return <Navigate to={`/${section.slug}`} replace />;
  }

  return (
    <>
      <main className="min-h-screen bg-slate-50 pt-20 pb-20 font-sans">
        <WebsiteHeader />

        {status === 'loading' ? (
          <section className="max-w-6xl mx-auto px-4 md:px-6 py-20 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-800 border-t-transparent mx-auto" />
          </section>
        ) : status === 'missing' ? (
          <section className="max-w-md mx-auto px-4 text-center py-20">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Page not found</h2>
            <p className="text-slate-500 mb-6">This section may have been moved or removed.</p>
            <button onClick={() => navigate('/')} className="px-6 py-3 bg-emerald-800 text-white font-bold rounded-2xl hover:bg-emerald-950 transition">
              Back to Home
            </button>
          </section>
        ) : (
          <>
            <section className="max-w-7xl mx-auto px-4 md:px-12">
              <div className="max-w-3xl">
                {section.subtitle ? (
                  <p className="text-xs font-semibold tracking-[0.2em] uppercase text-emerald-800 mb-1">{section.subtitle}</p>
                ) : null}
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 mb-2">
                  {section.title || section.navLabel}
                </h1>
                {section.description ? (
                  <p className="text-sm md:text-base text-slate-600 mb-4 leading-relaxed">{section.description}</p>
                ) : null}
              </div>
            </section>

            <section className="max-w-7xl mx-auto px-4 md:px-12 mt-6 md:mt-8">
              {items.length === 0 ? (
                <p className="text-center text-slate-500 py-16">Nothing here yet. Please check back soon!</p>
              ) : (
                <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {items.map((item, index) => (
                    <motion.article
                      key={item._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: Math.min(index, 8) * 0.08 }}
                      onClick={() => navigate(`/sections/${section.slug}/${item._id}`)}
                      className="group rounded-3xl border border-slate-200/80 bg-white overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between"
                    >
                      <div>
                        <div className="relative h-40 overflow-hidden bg-slate-100">
                          <img src={item.image} alt="" loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          {item.badge ? (
                            <span className="absolute top-3 left-3 bg-[#065f46] text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-md">{item.badge}</span>
                          ) : null}
                        </div>
                        <div className="p-4">
                          <p className="text-[11px] text-emerald-800 mb-2 font-bold flex items-center gap-1.5">
                            <Calendar size={12} /> {item.category || item.date}
                          </p>
                          <SafeHTML html={item.title} as="h3" className="text-base md:text-lg font-bold text-slate-800 mb-2 line-clamp-2 leading-snug" />
                          <SafeHTML html={item.excerpt} as="p" className="text-sm text-slate-500 line-clamp-3 leading-relaxed" />
                        </div>
                      </div>
                      <div className="px-4 pb-4 pt-1">
                        <div className="h-[1px] bg-slate-100 mb-3" />
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 group-hover:text-emerald-950">
                          Read More <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </div>
                    </motion.article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
      <WebsiteFooter />
    </>
  );
};

export default SectionPage;
