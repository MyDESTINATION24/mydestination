import React, { useState, useEffect, useRef } from 'react';
import HeroSection from '../../components/user/HeroSection';
import ExclusiveOffers from '../../components/user/ExclusiveOffers';
import PropertyTypeFilter from '../../components/user/PropertyTypeFilter';
import PropertyFeed from '../../components/user/PropertyFeed';

// The category row (All / Hotel / Villa ...) slides away while the guest
// scrolls down through the listings, giving the cards more room, and comes
// back as soon as they scroll up.
const useHideOnScrollDown = () => {
    const [hidden, setHidden] = useState(false);
    const lastY = useRef(0);
    useEffect(() => {
        lastY.current = window.scrollY;
        const onScroll = () => {
            const y = window.scrollY;
            const delta = y - lastY.current;
            if (Math.abs(delta) < 8) return; // ignore jitter
            setHidden(delta > 0 && y > 200);
            lastY.current = y;
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);
    return hidden;
};

const Home = () => {
    const [selectedType, setSelectedType] = useState('All');
    const hideFilters = useHideOnScrollDown();

    return (
        <main className="pb-16">
            <HeroSection />

            <div
                className={`sticky top-[calc(148px+var(--app-top,0px))] md:top-16 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100/80 shadow-xs transition-all duration-300 ${hideFilters ? 'max-md:-translate-y-full max-md:opacity-0 max-md:pointer-events-none' : ''}`}
            >
                <div className="max-w-7xl mx-auto">
                    <PropertyTypeFilter
                        selectedType={selectedType}
                        onSelectType={setSelectedType}
                    />
                </div>
            </div>

            <ExclusiveOffers />

            <div className="mt-2 max-w-7xl mx-auto">
                <PropertyFeed selectedType={selectedType} />
            </div>
        </main>
    );
};

export default Home;
