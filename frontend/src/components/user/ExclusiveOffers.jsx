import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { offerService } from '../../services/apiService';
import toast from 'react-hot-toast';

const ExclusiveOffers = () => {
    const navigate = useNavigate();
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        const fetchOffers = async () => {
            try {
                setLoading(true);
                const data = await offerService.getActive();
                setOffers(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error("Fetch Offers Error:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchOffers();
    }, []);

    useEffect(() => {
        if (offers.length <= 1) return;
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % offers.length);
        }, 8000);
        return () => clearInterval(timer);
    }, [offers.length]);

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-5 py-2">
                <div className="h-5 w-40 bg-gray-100 rounded animate-pulse mb-3"></div>
                <div className="w-full h-[100px] sm:h-[130px] md:h-[160px] bg-gray-100 rounded-xl animate-pulse flex items-center justify-center">
                    <Loader2 className="text-gray-200 animate-spin" size={24} />
                </div>
            </div>
        );
    }

    if (error || (offers.length === 0 && !loading)) {
        return null; // Don't show section if no offers or error
    }

    const handleOfferClick = (offer) => {
        navigator.clipboard.writeText(offer.code);
        toast.success(`Code ${offer.code} copied!`);
        navigate('/listings');
    };

    return (
        <section className="max-w-7xl mx-auto px-5 py-2 mt-1 overflow-hidden">
            <h2 className="text-lg md:text-xl font-bold text-surface mb-2.5 flex items-center gap-2">
                Exclusive offers for you
                <div className="bg-accent/10 px-1.5 py-0.5 rounded text-[9px] md:text-xs font-bold text-accent">NEW</div>
            </h2>

            {/* Horizontal auto-scroll container using website's fade logic */}
            <div 
              className="relative w-full h-[135px] sm:h-[155px] md:h-[175px] overflow-hidden shadow-md shadow-gray-200/50 transition-all duration-300"
              style={{ borderRadius: 'var(--banner-radius, var(--card-radius, 16px))' }}
            >
                {offers.map((offer, index) => {
                    const isActive = currentSlide === index;
                    return (
                        <div
                            key={offer._id || offer.id}
                            onClick={() => handleOfferClick(offer)}
                            className={`absolute inset-0 w-full h-full cursor-pointer active:scale-[0.99] transition-all duration-1000 ease-in-out ${
                                isActive ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
                            }`}
                        >
                            {/* Background Image */}
                            <img
                                src={offer.image}
                                alt={offer.title}
                                className="absolute inset-0 w-full h-full object-cover"
                            />

                            {/* Dark Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent flex flex-col justify-center px-4 py-3 sm:px-6 sm:py-4 md:px-8 md:py-5 text-white items-start">
                                <span className="bg-accent text-[9px] sm:text-[10px] md:text-xs font-bold px-2 py-0.5 rounded tracking-wider uppercase mb-1 shadow-sm">
                                    {offer.discountType === 'percentage' ? `${offer.discountValue}% OFF` : `₹${offer.discountValue} OFF`}
                                </span>
                                <h3 className="text-base sm:text-lg md:text-xl font-extrabold leading-snug max-w-[90%] sm:max-w-[70%] drop-shadow-md truncate py-0.5">
                                    {offer.title}
                                </h3>
                                {offer.subtitle && (
                                    <p className="text-[11px] sm:text-xs md:text-sm font-medium text-gray-200 max-w-[85%] sm:max-w-[60%] leading-snug drop-shadow-md truncate pb-0.5">
                                        {offer.subtitle}
                                    </p>
                                )}

                                <div className="mt-2 sm:mt-2.5 flex items-center gap-2.5 sm:gap-3">
                                    <button className="px-3 py-1 bg-white text-black text-[10px] sm:text-xs font-bold rounded-md shadow-sm hover:bg-gray-100 transition-colors">
                                        {offer.btnText || "Book now"}
                                    </button>
                                    <span className="text-[10px] sm:text-xs text-white/80 font-medium border-l border-white/30 pl-2.5 sm:pl-3">
                                        Code: <span className="text-white font-bold">{offer.code}</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
};

export default ExclusiveOffers;
