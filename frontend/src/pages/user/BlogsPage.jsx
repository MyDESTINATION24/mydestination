import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Navigate } from 'react-router-dom';
import { Clock, ArrowRight } from 'lucide-react';
import axios from 'axios';
import { isWebView } from '../../utils/deviceDetect';
import WebsiteHeader from '../../components/ui/WebsiteHeader';
import WebsiteFooter from '../../components/ui/WebsiteFooter';
import SafeHTML from '../../components/common/SafeHTML';
import { API_BASE_URL } from '../../shared/api/runtimeConfig';

const DEFAULT_BLOGS = [
  {
    _id: 'default-1',
    title: 'Escape the City: 7 Hidden Hill Stations Near You',
    category: 'Travel Guides',
    readTime: '6 min read',
    badge: 'TRENDING',
    image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80',
    excerpt: 'Weekend escapes that are closer than you think — curated hill stations, handpicked stays, and routes that actually work.',
    content: 'If the city heat and noise are getting to you, it is time for a mountain getaway. We have mapped out 7 lesser-known hill stations that offer tranquil weather, stunning views, and minimal tourist crowds.',
    date: 'March 2026'
  },
  {
    _id: 'default-2',
    title: 'Couple-Friendly Stays: What To Check Before You Book',
    category: 'Stay Tips',
    readTime: '4 min read',
    badge: "EDITOR'S PICK",
    image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=80',
    excerpt: 'From ID policies to neighbourhood vibes — a simple checklist to make sure your next couple stay is calm, safe and drama-free.',
    content: 'Booking stays as a couple requires checking a few basic items beforehand. Learn about local ID rules, policy terms for unmarried couples, and security features.',
    date: 'March 2026'
  },
  {
    _id: 'default-3',
    title: 'How To Get Real Discounts (Beyond Flash Sales)',
    category: 'Smart Booking',
    readTime: '5 min read',
    badge: 'SAVE MORE',
    image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80',
    excerpt: 'Learn how wallet credits, off-peak dates and flexible policies can actually beat random promo codes.',
    content: 'Promo codes look attractive on banners, but loyalty perks, off-season booking adjustments, direct owner negotiations, and wallet cashbacks are where the real savings hide.',
    date: 'February 2026'
  }
];

const BlogsPage = () => {
  const navigate = useNavigate();
  const [blogs, setBlogs] = React.useState(DEFAULT_BLOGS);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/blogs`);
        if (response.data.success && Array.isArray(response.data.data) && response.data.data.length > 0) {
          setBlogs(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching blogs:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  // In WebView / Flutter wrapper, blogs should not be visible at all
  if (isWebView()) {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      <main className="min-h-screen bg-slate-50 pt-28 pb-20 font-sans">
        <WebsiteHeader />

      {loading ? (
        <section className="max-w-6xl mx-auto px-4 md:px-6 py-20 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-800 border-t-transparent mx-auto" />
          <p className="text-slate-500 mt-4">Loading stories...</p>
        </section>
      ) : blogs.length === 0 ? (
        <section className="max-w-md mx-auto px-4 text-center py-20">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">No blogs available</h2>
          <p className="text-slate-500">We are currently preparing travel stories and staying hacks. Please check back later!</p>
        </section>
      ) : (
        <>
          {/* Hero Section */}
          <section className="max-w-7xl mx-auto px-4 md:px-12">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold tracking-[0.2em] uppercase text-emerald-800 mb-3">
                My DESTINATION Hub // STORIES &amp; BLOGS
              </p>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 mb-4">
                Travel stories, stay tips &amp; real booking hacks.
              </h1>
              <p className="text-sm md:text-base text-slate-600 mb-6 leading-relaxed">
                Curated bytes from frequent travellers, hosts and our own support team — so you can spend
                less time researching and more time actually travelling.
              </p>
              <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm text-slate-500">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-250 text-emerald-800 font-semibold">
                  <Clock size={14} />
                  New posts every week
                </span>
                <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700">
                  No clickbait. Only useful stuff.
                </span>
              </div>
            </div>
          </section>

          {/* Blog Cards Grid */}
          <section className="max-w-7xl mx-auto px-4 md:px-12 mt-10 md:mt-14">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight">
                Latest from the hub
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {blogs.map((blog, index) => (
                <motion.article
                  key={blog._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  onClick={() => navigate(`/blogs/${blog._id}`)}
                  className="group rounded-3xl border border-slate-200/80 bg-white overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={blog.image}
                        alt={blog.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                        {blog.badge && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-[0.14em] bg-emerald-800 text-white shadow-md">
                            {blog.badge}
                          </span>
                        )}
                        {blog.category && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-[0.14em] bg-white text-slate-800 border border-slate-200">
                            {blog.category}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="p-5">
                      <p className="text-[11px] text-slate-400 mb-1">{blog.date || 'March 2026'}</p>
                      <SafeHTML html={blog.title} as="h3" className="text-base md:text-lg font-bold text-slate-800 mb-2 line-clamp-2 leading-snug" />
                      <SafeHTML html={blog.excerpt} as="p" className="text-sm text-slate-500 line-clamp-3 leading-relaxed" />
                    </div>
                  </div>
                  
                  <div className="px-5 pb-5 pt-1">
                    <div className="h-[1px] bg-slate-100 mb-3" />
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
                        <Clock size={13} />
                        {blog.readTime || '5 min read'}
                      </span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); navigate(`/blogs/${blog._id}`); }}
                        className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 hover:text-emerald-950"
                      >
                        Read story
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

export default BlogsPage;
