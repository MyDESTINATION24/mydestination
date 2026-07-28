import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

// Premium assets imported from the airways folder
import premiumHeliHero from '@/assets/airways/premium_heli_hero.png';
import kedarnathImg from '@/assets/airways/kedarnath.png';
import heliHeaderImg from '@/assets/airways/heli_header.png';

const slides = [
  {
    image: premiumHeliHero,
    title: 'Divine Chaar Dham Pilgrimage',
    tagline: 'Skip the queues, ascend to the heavens',
    description: 'Breathtaking elite helicopter journeys to Kedarnath, Badrinath, Gangotri, and Yamunotri.',
    accent: 'from-amber-500/20 to-orange-500/20',
    badge: 'Chaar Dham SpeciaL',
  },
  {
    image: kedarnathImg,
    title: 'Sacred Kedarnath Yatra',
    tagline: 'Reach the divine temple in minutes',
    description: 'Fast, secure, and serene sky transfers from Dehradun and Phata direct to the holy shrine.',
    accent: 'from-sky-500/20 to-indigo-500/20',
    badge: 'Popular Route',
  },
  {
    image: heliHeaderImg,
    title: 'Luxury Sky Charters',
    tagline: 'Premium aerial travel tailored for you',
    description: 'Certified pilots, state-of-the-art aircraft, and unparalleled safety for your comfort.',
    accent: 'from-cyan-500/20 to-teal-500/20',
    badge: 'Elite Fleet',
  },
];

const HelicopterFeaturedSection = () => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0); // -1 for left, 1 for right

  useEffect(() => {
    const timer = setInterval(() => {
      handleNext(true);
    }, 6000);
    return () => clearInterval(timer);
  }, [currentIndex]);

  const handleNext = (isAuto = false) => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  const handlePrev = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleDotClick = (index) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  const handleNavigate = () => {
    navigate('/taxi/user/airways');
  };

  // Variants for slide transitions
  const slideVariants = {
    enter: (dir) => ({
      x: dir > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir) => ({
      x: dir < 0 ? 300 : -300,
      opacity: 0,
    }),
  };

  const currentSlide = slides[currentIndex];

  return (
    <div>
      <div className="px-5 mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-[19px] font-black text-gray-900 tracking-tight">My Desination Airways</h2>
          <p className="mt-1 text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">
            Sacred Journeys & Elite Sky Charters
          </p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-amber-100/60 border border-amber-200 px-3 py-1 text-[9px] font-black uppercase tracking-[0.15em] text-amber-700 animate-pulse">
          <Sparkles size={11} className="text-amber-600" />
          Fly Elite
        </div>
      </div>

      <div 
        onClick={handleNavigate}
        className="group relative overflow-hidden border-y border-white/90 bg-white/70 shadow-[0_20px_40px_rgba(15,23,42,0.06)] hover:shadow-[0_24px_50px_-12px_rgba(15,23,42,0.15)] transition-all duration-500 cursor-pointer h-[320px] flex flex-col justify-between w-full"
      >
        {/* Background gradient animation */}
        <div className={`absolute inset-0 bg-gradient-to-br ${currentSlide.accent} opacity-40 transition-all duration-700 pointer-events-none`} />

        {/* Carousel Image container */}
        <div className="absolute inset-0 z-0">
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ x: { type: 'spring', stiffness: 300, damping: 30 }, opacity: { duration: 0.3 } }}
              className="absolute inset-0"
            >
              <img
                src={currentSlide.image}
                alt={currentSlide.title}
                className="w-full h-full object-cover select-none"
              />
              {/* Premium dark gradient overlay for legible text */}
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-700 via-slate-900/40 to-black/20" />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Top bar controls / badge */}
        <div className="relative z-10 p-5 flex items-center justify-between w-full pointer-events-none">
          <div className="rounded-full bg-white/15 backdrop-blur-md border border-white/20 px-3.5 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-white">
            {currentSlide.badge}
          </div>
          
          {/* Navigation Arrows (Stopping propagation to click banner) */}
          <div className="flex gap-2 pointer-events-auto">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/20 flex items-center justify-center text-white active:scale-90 transition-all"
            >
              <ChevronLeft size={16} strokeWidth={2.5} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/20 flex items-center justify-center text-white active:scale-90 transition-all"
            >
              <ChevronRight size={16} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Bottom textual description */}
        <div className="relative z-10 p-6 pt-0 w-full">
          <div className="space-y-1.5 max-w-[90%]">
            <p className="text-[10px] font-black text-amber-400 uppercase tracking-[0.25em] drop-shadow-md">
              {currentSlide.tagline}
            </p>
            <h3 className="text-[22px] font-['Outfit'] font-black leading-tight tracking-tight text-white drop-shadow-xl">
              {currentSlide.title}
            </h3>
            <p className="text-[11px] font-medium leading-relaxed text-white/80 line-clamp-2 drop-shadow-md">
              {currentSlide.description}
            </p>
          </div>

          {/* Action indicator row */}
          <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
            {/* Dots indicator */}
            <div className="flex gap-2 pointer-events-auto">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDotClick(idx);
                  }}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === currentIndex ? 'w-5 bg-amber-400' : 'w-1.5 bg-white/40 hover:bg-white/60'
                  }`}
                  aria-label={`Slide ${idx + 1}`}
                />
              ))}
            </div>

            {/* CTA action button */}
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-[11px] font-black uppercase tracking-widest text-slate-900 shadow-lg group-hover:bg-amber-400 group-hover:scale-105 transition-all duration-300">
              Book Sky Ride
              <ArrowRight size={13} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelicopterFeaturedSection;
