import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, User, ArrowRight } from 'lucide-react';
import axios from 'axios';
import { Loader2 } from 'lucide-react';
import WebsiteHeader from '../../components/ui/WebsiteHeader';
import WebsiteFooter from '../../components/ui/WebsiteFooter';
import SafeHTML from '../../components/common/SafeHTML';
import { API_BASE_URL } from '../../shared/api/runtimeConfig';

const ArticleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticleDetail = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/articles`);
        if (response.data.success) {
          const foundArticle = response.data.data.find(a => a._id === id);
          if (foundArticle) {
            setArticle(foundArticle);
            const others = response.data.data.filter(a => a._id !== id);
            setRelated(others.slice(0, 3));
          } else {
            console.error('Article not found');
          }
        }
      } catch (error) {
        console.error('Error fetching article details:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchArticleDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 font-['Inter',sans-serif]">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-800" />
        <p className="text-slate-655 font-medium">Loading article...</p>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center font-['Inter',sans-serif]">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Article Not Found</h2>
        <p className="text-slate-655 mb-8 max-w-md">The article you're looking for might have been moved or deleted.</p>
        <button 
          onClick={() => navigate('/articles')}
          className="px-6 py-3 bg-emerald-800 text-white font-bold rounded-2xl hover:bg-emerald-950 transition"
        >
          Back to Articles
        </button>
      </div>
    );
  }

  return (
    <>
      <main className="min-h-screen bg-slate-50 text-slate-900 pb-20 font-['Inter',sans-serif]">
        <WebsiteHeader />

      {/* Hero Section */}
      <div className="relative pt-24">
        <div className="max-w-7xl mx-auto px-4 md:px-12 pt-10 pb-6">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-50 border border-emerald-200 text-emerald-800 uppercase tracking-widest shadow-sm">
              FEATURED ARTICLE
            </span>
          </div>
          
          <SafeHTML html={article.title} as="h1" className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 mb-6 leading-snug" />

          <div className="flex items-center gap-4 text-xs text-slate-500 mb-8 border-b border-slate-200 pb-6">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                <User size={12} className="text-emerald-800" />
              </div>
              <span className="font-semibold text-slate-700">My DESTINATION Editorial</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={12} className="text-slate-400" />
              <span>{article.date}</span>
            </div>
          </div>
        </div>

        {/* Hero Image */}
        <div className="max-w-7xl mx-auto px-4 md:px-12">
          <div className="aspect-[21/9] md:rounded-2xl overflow-hidden border border-slate-200 shadow-md bg-slate-205">
            <img 
              src={article.image} 
              alt={article.title} 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-4 md:px-12 py-12">
        <div className="bg-white rounded-3xl p-6 md:p-10 border border-slate-200/60 shadow-xs mb-16">
          {/* Excerpt */}
          <SafeHTML html={article.excerpt} as="p" className="text-base md:text-lg font-medium text-slate-655 mb-8 leading-relaxed italic border-l-4 border-emerald-850 pl-4" />

          {/* Content Body */}
          <div className="prose prose-slate max-w-none">
            <SafeHTML html={article.content} className="text-slate-700 text-sm md:text-base leading-relaxed tracking-wide" />
          </div>
        </div>

        {/* Divider */}
        <div className="h-[1px] bg-slate-200 my-16" />

        {/* Related Reads Section */}
        {related.length > 0 && (
          <div className="mb-16">
            <h3 className="text-lg font-bold text-slate-800 mb-6 uppercase tracking-wider">
              Related Reads
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              {related.map((item, index) => (
                <motion.div 
                  key={item._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  onClick={() => navigate(`/articles/${item._id}`)}
                  className="group rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="h-40 overflow-hidden bg-slate-100">
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <div className="p-4">
                      <p className="text-[10px] text-slate-400 mb-1">{item.date}</p>
                      <h4 className="text-xs font-bold text-slate-800 line-clamp-2 leading-snug group-hover:text-emerald-850">
                        {item.title}
                      </h4>
                    </div>
                  </div>
                  <div className="px-4 pb-4">
                    <span className="text-[10px] font-bold text-emerald-800 group-hover:text-emerald-950 inline-flex items-center gap-1">
                      Read Article <ArrowRight size={12} />
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Call to action Banner */}
        <div className="bg-gradient-to-r from-emerald-855 via-emerald-900 to-slate-900 text-white rounded-3xl p-8 md:p-10 shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h4 className="text-lg md:text-xl font-bold mb-2">Ready to explore stays?</h4>
            <p className="text-xs text-emerald-50/80 max-w-xl leading-relaxed">
              Compare and book premium stays, budget hostels, and villas with direct rates and support on My DESTINATION.
            </p>
          </div>
          <button 
            onClick={() => navigate('/search')}
            className="px-6 py-3 bg-white text-emerald-900 font-bold rounded-2xl text-[10px] uppercase tracking-widest hover:bg-emerald-50 active:scale-95 transition shadow-md whitespace-nowrap"
          >
            Search Stays
          </button>
        </div>

      </div>
    </main>
    <WebsiteFooter />
    </>
  );
};

export default ArticleDetail;
