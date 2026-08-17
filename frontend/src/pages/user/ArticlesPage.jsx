import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Navigate } from 'react-router-dom';
import { ArrowRight, Calendar } from 'lucide-react';
import axios from 'axios';
import { isWebView } from '../../utils/deviceDetect';
import WebsiteHeader from '../../components/ui/WebsiteHeader';
import WebsiteFooter from '../../components/ui/WebsiteFooter';
import SafeHTML from '../../components/common/SafeHTML';
import { API_BASE_URL } from '../../shared/api/runtimeConfig';

const ArticlesPage = () => {
  const navigate = useNavigate();
  const [articles, setArticles] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchArticles = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/articles`);
        if (response.data.success) {
          setArticles(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching articles:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchArticles();
  }, []);

  // In WebView / Flutter wrapper, articles should not be visible at all
  if (isWebView()) {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      <main className="min-h-screen bg-slate-50 pt-20 pb-20 font-sans">
        <WebsiteHeader />

      {loading ? (
        <section className="max-w-6xl mx-auto px-4 md:px-6 py-20 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-800 border-t-transparent mx-auto" />
          <p className="text-slate-500 mt-4">Loading articles...</p>
        </section>
      ) : articles.length === 0 ? (
        <section className="max-w-md mx-auto px-4 text-center py-20">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">No articles available</h2>
          <p className="text-slate-500">We are currently preparing fresh guides and insights. Please check back later!</p>
        </section>
      ) : (
        <>
          {/* Hero Section */}
          <section className="max-w-7xl mx-auto px-4 md:px-12">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold tracking-[0.2em] uppercase text-emerald-800 mb-1">
                My DESTINATION Hub // ARTICLES
              </p>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 mb-2">
                Insights, guides &amp; expert travel articles.
              </h1>
              <p className="text-sm md:text-base text-slate-600 mb-4 leading-relaxed">
                Expert articles and field notes written by our seasoned team and travel partners to help you discover new destinations and travel smarter.
              </p>
              <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm text-slate-500">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-250 text-emerald-800 font-semibold">
                  <Calendar size={14} />
                  Fresh guides uploaded weekly
                </span>
                <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700">
                  100% verified advice.
                </span>
              </div>
            </div>
          </section>

          {/* Articles Cards Grid */}
          <section className="max-w-7xl mx-auto px-4 md:px-12 mt-6 md:mt-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight">
                Latest Articles
              </h2>
            </div>

            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
              {articles.map((article, index) => (
                <motion.article
                  key={article._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  onClick={() => navigate(`/articles/${article._id}`)}
                  className="group rounded-3xl border border-slate-200/80 bg-white overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="relative h-40 overflow-hidden">
                      <img
                        src={article.image}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-4">
                      <p className="text-[11px] text-emerald-800 mb-2 font-bold flex items-center gap-1.5">
                        <Calendar size={12} /> {article.date || 'June 2026'}
                      </p>
                      <SafeHTML html={article.title} as="h3" className="text-base md:text-lg font-bold text-slate-800 mb-2 line-clamp-2 leading-snug" />
                      <SafeHTML html={article.excerpt} as="p" className="text-sm text-slate-500 line-clamp-3 leading-relaxed" />
                    </div>
                  </div>
                  
                  <div className="px-4 pb-4 pt-1">
                    <div className="h-[1px] bg-slate-100 mb-3" />
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium text-slate-400">
                        Editorial post
                      </span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); navigate(`/articles/${article._id}`); }}
                        className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 hover:text-emerald-950"
                      >
                        Read Article
                        <ArrowRight
                          size={14}
                          className="group-hover:translate-x-0.5 transition-transform"
                        />
                      </button>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          </section>
        </>
      )}
    </main>
    <WebsiteFooter />
    </>
  );
};

export default ArticlesPage;
