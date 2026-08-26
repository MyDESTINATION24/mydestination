import React, { useState, useEffect } from 'react';
import { MapPin, Star, IndianRupee, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { userService } from '../../services/apiService';
import toast from 'react-hot-toast';

const PropertyCard = ({ property, data, className = "", isSaved: initialIsSaved }) => {
  const navigate = useNavigate();
  const [isSaved, setIsSaved] = useState(initialIsSaved || false);
  const [saveLoading, setSaveLoading] = useState(false);

  // Sync with initialIsSaved if it changes
  useEffect(() => {
    if (initialIsSaved !== undefined) {
      setIsSaved(initialIsSaved);
    }
  }, [initialIsSaved]);

  const item = property || data;

  if (!item) return null;

  const {
    _id,
    name,
    address,
    images,
    propertyType,
    rating,
    startingPrice,
    details
  } = item;

  const handleToggleSave = async (e) => {
    e.stopPropagation(); // Don't navigate to details
    if (!localStorage.getItem('token')) {
      toast.error("Please login to save properties");
      return;
    }

    if (saveLoading) return;

    setSaveLoading(true);
    const newState = !isSaved;
    setIsSaved(newState); // Optimistic update

    try {
      await userService.toggleSavedHotel(_id || item.id);
      toast.success(newState ? "Added to wishlist" : "Removed from wishlist");
    } catch (error) {
      setIsSaved(!newState); // Revert
      toast.error("Failed to update wishlist");
    } finally {
      setSaveLoading(false);
    }
  };

  // Function to clean dirty URLs (handles backticks, spaces, quotes)
  const cleanImageUrl = (url) => {
    if (!url || typeof url !== 'string') return '';
    // Remove backticks, single quotes, double quotes, and surrounding whitespace
    return url.replace(/[`'"]/g, '').trim();
  };

  const displayName = name || item.propertyName || 'Untitled';

  const typeRaw = (propertyType || item.propertyType || '').toString();
  const normalizedType = typeRaw
    ? typeRaw.toLowerCase() === 'pg'
      ? 'PG'
      : typeRaw.charAt(0).toUpperCase() + typeRaw.slice(1).toLowerCase()
    : '';
  const typeForBadge = normalizedType || typeRaw;
  const typeLabel = typeForBadge ? typeForBadge.toString().toUpperCase() : '';

  // Improved Rating Logic
  const rawRating =
    item.avgRating !== undefined ? item.avgRating :
      item.rating !== undefined ? item.rating :
        rating;

  const reviewCount = item.totalReviews || item.reviews || 0;

  // Show rating if it has reviews and is > 0, otherwise show 'New'
  const displayRating = (reviewCount > 0 && Number(rawRating) > 0) ? Number(rawRating).toFixed(1) : 'New';

  // Improved Price Logic - Check more fields
  const rawPrice =
    startingPrice ??
    item.startingPrice ??
    item.minPrice ??
    item.min_price ??
    item.price ??
    item.costPerNight ??
    item.amount ??
    null;

  const displayPrice =
    typeof rawPrice === 'number' && rawPrice > 0 ? rawPrice : null;

  const originalPriceRaw = item.originalPrice ?? item.strikePrice ?? item.mrp;
  const displayOriginalPrice = typeof originalPriceRaw === 'number' && originalPriceRaw > displayPrice ? originalPriceRaw : null;

  const imageSrc =
    images?.cover ||
    cleanImageUrl(item.coverImage) ||
    cleanImageUrl(
      Array.isArray(item.propertyImages) ? item.propertyImages[0] : ''
    ) ||
    'https://via.placeholder.com/400x300?text=No+Image';

  const badgeTypeKey = normalizedType || typeRaw;

  const getTypeColor = (type) => {
    switch (type) {
      case 'Hotel': return 'bg-blue-100 text-blue-700';
      case 'Villa': return 'bg-green-100 text-green-700';
      case 'Resort': return 'bg-orange-100 text-orange-700';
      case 'Homestay': return 'bg-green-100 text-green-700';
      case 'Hostel': return 'bg-pink-100 text-pink-700';
      case 'PG': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const dynamicRadius = 'var(--card-radius, var(--hotel-card-radius, 16px))';

  return (
    <div
      onClick={() => navigate(`/hotel/${_id}`)}
      className={`group relative h-[240px] w-full bg-white shadow-xl cursor-pointer transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 p-2.5 ${className}`}
      style={{ borderRadius: dynamicRadius }}
    >
      {/* Top Section: Image Area */}
      <div 
        className="relative h-[66%] w-full bg-[#f0f4f0] overflow-hidden"
        style={{ borderRadius: `calc(${dynamicRadius} * 0.8)` }}
      >
        <img
          src={imageSrc}
          alt={displayName}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
          }}
        />

        {/* Price Tag (Top Right - Matcha Style) */}
        <div 
          className="absolute top-0 right-0 bg-white/95 backdrop-blur-sm px-3 py-1.5 shadow-sm z-10 flex flex-col items-end justify-center"
          style={{
            borderBottomLeftRadius: dynamicRadius,
            borderTopRightRadius: `calc(${dynamicRadius} * 0.8)`
          }}
        >
          {displayOriginalPrice && (
            <div className="flex items-center gap-1 leading-none mb-0.5">
              <span className="text-[10px] font-bold text-gray-400 line-through">
                ₹{displayOriginalPrice.toLocaleString('en-IN')}
              </span>
              <span className="text-[8px] font-black text-emerald-700 bg-emerald-100/70 px-1 py-0.5 rounded leading-none">
                {Math.round(((displayOriginalPrice - displayPrice) / displayOriginalPrice) * 100)}% OFF
              </span>
            </div>
          )}
          <span className="text-xl font-black text-[#1a261a] leading-none">
            <span className="mr-0.5">₹</span>
            {displayPrice ? displayPrice.toLocaleString('en-IN') : '-'}
          </span>
        </div>

        {/* Heart Icon (Top Left) */}
        <button
          onClick={handleToggleSave}
          className="absolute top-3 left-3 w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 z-10"
        >
          <Heart size={14} className={`${isSaved ? 'fill-surface text-surface' : 'text-surface'}`} />
        </button>

        {/* Small Banner Strip (Matcha Style) */}
        <div 
          className="absolute bottom-0 left-0 right-0 text-slate-900 text-[8px] font-black py-1.5 text-center tracking-wide uppercase"
          style={{ background: 'var(--color-theme-gradient, var(--color-surface, #FFD000))' }}
        >
          {item.suitability === 'Both' ? 'Free WiFi • Couple Friendly' : (item.suitability || 'Premium Experience')}
        </div>
      </div>

      {/* Bottom Section: Details */}
      <div className="px-3 pt-1.5 flex flex-col gap-1.5 h-[34%]">
        {/* Title & Action Line */}
        <div className="flex justify-between items-baseline">
          <h3 className="text-lg font-black text-[#1a261a] truncate flex-1 pr-2 leading-tight">
            {displayName}
          </h3>
          <button className="text-[10px] font-bold text-[#1a261a]/60 underline underline-offset-2 flex items-center gap-0.5 whitespace-nowrap">
            Book Now
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 17l10-10M17 17V7H7" />
            </svg>
          </button>
        </div>

        {/* Tags (At the very bottom - Matcha Style) */}
        <div className="flex gap-1.5 overflow-x-hidden">
          <span className="bg-[var(--color-surface)]/15 text-slate-900 text-[8px] font-black px-3 py-1.5 rounded-lg whitespace-nowrap uppercase tracking-tighter border border-[var(--color-surface)]/20">
            {address?.city || 'Indore'}
          </span>
          <span className="bg-[var(--color-surface)]/15 text-slate-900 text-[8px] font-black px-3 py-1.5 rounded-lg whitespace-nowrap uppercase tracking-tighter border border-[var(--color-surface)]/20">
            {displayRating} ★ Rating
          </span>
          <span className="bg-[var(--color-surface)]/15 text-slate-900 text-[8px] font-black px-3 py-1.5 rounded-lg whitespace-nowrap uppercase tracking-tighter border border-[var(--color-surface)]/20">
            {item.details?.rooms || 1} Room
          </span>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;
