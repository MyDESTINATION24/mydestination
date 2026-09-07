import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Star, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '../../services/apiService';

const formatDate = (value) => {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
};

const ReviewsPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) { setLoading(false); return; }
        let active = true;

        api.get(`/reviews/${id}`)
            .then((res) => {
                if (!active) return;
                setReviews(Array.isArray(res?.data) ? res.data : []);
            })
            .catch(() => { if (active) setReviews([]); })
            .finally(() => { if (active) setLoading(false); });

        return () => { active = false; };
    }, [id]);

    const average = reviews.length
        ? (reviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / reviews.length)
        : 0;

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white p-4 sticky top-0 z-20 shadow-sm flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition">
                    <ArrowLeft size={20} className="text-surface" />
                </button>
                <h1 className="text-lg font-bold text-surface">Ratings & Reviews</h1>
            </div>

            {reviews.length > 0 && (
                <div className="p-5 pb-0">
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-6">
                        <div className="flex flex-col items-center justify-center w-20 h-20 bg-surface/5 rounded-2xl border border-surface/10">
                            <span className="text-3xl font-black text-surface leading-none">{average.toFixed(1)}</span>
                            <div className="flex items-center gap-1 mt-1">
                                <Star size={10} fill="currentColor" className="text-surface" />
                                <span className="text-[10px] font-bold text-surface">
                                    {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="p-5 space-y-4 pb-20">
                {loading ? (
                    <p className="text-sm text-gray-400 text-center py-10">Loading reviews…</p>
                ) : reviews.length === 0 ? (
                    <div className="py-16 text-center bg-white rounded-2xl border border-dashed border-gray-200">
                        <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
                            <Star size={24} className="text-gray-300" />
                        </div>
                        <p className="font-bold text-surface mb-1">No reviews yet</p>
                        <p className="text-xs text-gray-400">Be the first to share your experience.</p>
                    </div>
                ) : (
                    <>
                        <h3 className="font-bold text-surface text-base">User Reviews</h3>
                        {reviews.map((review, idx) => (
                            <motion.div
                                key={review._id || idx}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: Math.min(idx, 5) * 0.1 }}
                                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                                        <User size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm text-surface">{review.userId?.name || 'Guest'}</h4>
                                        <p className="text-[10px] text-gray-400">{formatDate(review.createdAt)}</p>
                                    </div>
                                    <div className="ml-auto bg-green-50 px-2 py-1 rounded text-xs font-bold text-green-700 flex items-center gap-1">
                                        {review.rating} <Star size={10} fill="currentColor" />
                                    </div>
                                </div>
                                {review.comment && (
                                    <p className="text-xs text-gray-600 leading-relaxed">{review.comment}</p>
                                )}
                            </motion.div>
                        ))}
                    </>
                )}
            </div>
        </div>
    );
};

export default ReviewsPage;
