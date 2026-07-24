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
            <div className="py-2 pl-5">
                <div className="h-5 w-40 bg-gray-100 rounded animate-pulse mb-3"></div>
                <div className="flex gap-3 overflow-x-auto no-scrollbar">
                    {[1, 2].map(i => (
                        <div key={i} className="w-[calc(100vw-40px)] sm:w-[280px] md:w-[300px] flex-shrink-0 h-[96px] bg-gray-100 rounded-xl animate-pulse flex items-center justify-center">
                            <Loader2 className="text-gray-200 animate-spin" size={16} />
                        </div>
                    ))}
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
        <section className="py-2 mt-1 overflow-hidden">
            <h2 className="text-lg font-bold text-surface mb-2.5 flex items-center gap-2 pl-5">
                Exclusive offers for you
                <div className="bg-accent/10 px-1.5 py-0.5 rounded text-[9px] font-bold text-accent">NEW</div>
            </h2>

            {/* Horizontal auto-scroll container using website's fade logic */}
            <div className="relative w-[calc(100vw-40px)] sm:w-[280px] md:w-[300px] h-[96px] mx-5 rounded-xl overflow-hidden shadow-md shadow-gray-200/50">
                {offers.map((offer, index) => {
                    const isActive = currentSlide === index;
                    return (
                        <div
                            key={offer._id || offer.id}
                            onClick={() => handleOfferClick(offer)}
                            className={`absolute inset-0 w-full h-full cursor-pointer active:scale-95 transition-all duration-1000 ease-in-out ${
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
                            <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-transparent flex flex-col justify-center p-3.5 text-white items-start">
                                <span className="bg-accent text-[7.5px] font-black px-1 py-0.5 rounded tracking-widest uppercase mb-0.5">
                                    {offer.discountType === 'percentage' ? `${offer.discountValue}% OFF` : `₹${offer.discountValue} OFF`}
                                </span>
                                <h3 className="text-[13px] font-black leading-tight max-w-[85%] drop-shadow-md line-clamp-1">{offer.title}</h3>
                                <p className="text-[8px] font-semibold text-gray-300 mt-0.5 max-w-[80%] leading-normal drop-shadow-md line-clamp-1">{offer.subtitle}</p>

                                <div className="mt-1.5 flex items-center gap-2">
                                    <button className="px-2 py-0.5 bg-white text-black text-[8px] font-black rounded-md shadow-sm">
                                        {offer.btnText || "Copy Code"}
                                    </button>
                                    <span className="text-[7.5px] text-white/60 font-medium border-l border-white/20 pl-2">
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
