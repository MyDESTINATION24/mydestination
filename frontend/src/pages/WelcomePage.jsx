import React, { useEffect, useCallback, useState } from 'react';
import { useNavigate, useSearchParams, Navigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft } from 'lucide-react';

// Assets from the wedding module
import hotelImg from '../modules/wedding-integrated/assets/welcomePageHotelImage.jpg';
import weddingImg from '../modules/wedding-integrated/assets/welcomePageWeddingIamge.jpg';
import taxiImg from '../modules/wedding-integrated/assets/taxi_straight.png';

const slides = [
  {
    id: 1,
    title: "Luxurious Stays",
    subtitle: "Hotel Services",
    description: "Indulge in a premium stay at curated locations with world-class amenities.",
    image: hotelImg,
    path: "/home",
    theme: "from-blue-600/20 to-transparent",
    btnColor: "bg-sky-200 hover:bg-sky-300 text-sky-950"
  },
  {
    id: 2,
    title: "Destination Wedding",
    subtitle: "Wedding Dreams",
    description: "Craft your dream celebration with elegance and breathtaking views.",
    image: weddingImg,
    path: "/wedding",
    theme: "from-rose-600/20 to-transparent",
    btnColor: "bg-pink-100 hover:bg-pink-200 text-pink-950"
  },
  {
    id: 3,
    title: "Taxi Service",
    subtitle: "Taxi Service",
    description: "Travel in comfort with our elite fleet of premium vehicles.",
    image: taxiImg,
    path: "/taxi/user",
    theme: "from-amber-600/20 to-transparent",
    btnColor: "bg-yellow-100 hover:bg-yellow-200 text-yellow-950"
  }
];

const WelcomePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type');

  // Direct navigation based on type param — skip carousel entirely
  useEffect(() => {
    if (type === 'hotel') {
      navigate('/home', { replace: true });
    } else if (type === 'tour') {
      navigate('/taxi/user', { replace: true });
    } else if (type === 'wedding') {
      navigate('/wedding', { replace: true });
    }
  }, [type, navigate]);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  // Auto-advance carousel (only runs when no type redirect)
  useEffect(() => {
    if (type) return; // Don't auto-scroll if redirecting
    const timer = setInterval(() => {
      setSelectedIndex((prev) => (prev + 1) % slides.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [type]);

  const scrollTo = useCallback((index) => {
    setSelectedIndex(index);
  }, []);

  const scrollNext = useCallback(() => {
    setSelectedIndex((prev) => (prev + 1) % slides.length);
  }, []);

  const scrollPrev = useCallback(() => {
    setSelectedIndex((prev) => (prev - 1 + slides.length) % slides.length);
  }, []);

  // Touch handling
  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isSwipe = Math.abs(distance) > 50;
    if (isSwipe) {
      if (distance > 0) scrollNext();
      else scrollPrev();
    }
  };

  const handleExplore = (slide) => {
    const token = localStorage.getItem('token');
    // Prioritize the slide's own path
    let targetPath = slide.path;

    if (!targetPath) return; // For "Coming Soon" cases

    // Handle external links
    if (targetPath.startsWith('http')) {
      window.location.href = targetPath;
      return;
    }

    if (!token) {
      // User choice made, now redirect to login
      navigate('/login', { state: { from: { pathname: targetPath } } });
    } else {
      navigate(targetPath);
    }
  };

  return (
    <div 
      style={{ height: '100dvh' }} 
      className="fixed inset-0 w-full bg-[#1e1b1b] overflow-hidden font-['Inter',sans-serif] z-[9999]"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Carousel Container */}
      <div style={{ height: '100dvh' }} className="w-full overflow-hidden relative">
        {slides.map((slide, index) => (
          <div 
            key={slide.id} 
            style={{ 
              height: '100dvh',
              position: 'absolute',
              inset: 0,
              opacity: selectedIndex === index ? 1 : 0,
              transition: 'opacity 1s ease-in-out',
              pointerEvents: selectedIndex === index ? 'auto' : 'none',
            }} 
            className="relative w-full cursor-pointer"
            onClick={() => handleExplore(slide)}
          >
            {/* Background Image */}
            <div className="absolute inset-0 w-full h-full overflow-hidden">
              <img
                src={slide.image}
                alt={slide.title}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
                className={`transition-transform duration-[4000ms] ease-out ${selectedIndex === index ? 'scale-110' : 'scale-100'}`}
              />
            </div>

            {/* Enhanced Gradient Overlays */}
            <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10" />
            <div className={`absolute inset-0 bg-gradient-to-br ${slide.theme} opacity-40 mix-blend-overlay z-0`} />

            {/* Content Area - Bottom Anchored */}
            <div className="absolute bottom-4 left-0 right-0 p-8 md:p-12 z-20 flex flex-col items-start gap-3">
              <div className="overflow-hidden">
                <span className={`inline-block text-xs font-black tracking-[0.3em] uppercase text-white/70 py-1 transition-all duration-700 delay-300 transform ${selectedIndex === index ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}>
                  {slide.subtitle}
                </span>
              </div>
              
              <h1 className={`text-4xl md:text-6xl font-black text-white leading-none tracking-tighter mb-2 transition-all duration-1000 delay-500 transform ${selectedIndex === index ? 'translate-x-0 opacity-100' : '-translate-x-12 opacity-0'}`}>
                {slide.title}
              </h1>
              
              <p className={`text-sm md:text-lg text-white/80 max-w-[90%] md:max-w-md font-medium leading-relaxed mb-6 transition-all duration-1000 delay-700 transform ${selectedIndex === index ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
                {slide.description}
              </p>

              <button
                onClick={() => handleExplore(slide)}
                className={`group flex items-center gap-3 px-7 py-4 rounded-full font-black text-sm tracking-tight transition-all duration-300 delay-[900ms] transform ${slide.btnColor} ${selectedIndex === index ? 'scale-100 opacity-100 translate-y-0' : 'scale-90 opacity-0 translate-y-4'} ${slide.path === null ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={slide.path === null}
              >
                {slide.path === null ? 'Coming Soon' : 'Explore Now'}
                <div className="w-6 h-6 rounded-full bg-black/5 flex items-center justify-center transition-transform group-hover:translate-x-1">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Left Arrow - Navigate to Previous Slide */}
      <button
        onClick={scrollPrev}
        className="absolute left-6 top-1/2 -translate-y-1/2 z-40 w-11 h-11 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/25 hover:scale-110 transition-all duration-300"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {/* Right Arrow - Navigate to Next Slide */}
      <button
        onClick={scrollNext}
        className="absolute right-6 top-1/2 -translate-y-1/2 z-40 w-11 h-11 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/25 hover:scale-110 transition-all duration-300"
        aria-label="Next slide"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Dot Indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => scrollTo(index)}
            className={`rounded-full transition-all duration-300 ${
              selectedIndex === index
                ? 'w-8 h-2 bg-white'
                : 'w-2 h-2 bg-white/40 hover:bg-white/60'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default WelcomePage;
