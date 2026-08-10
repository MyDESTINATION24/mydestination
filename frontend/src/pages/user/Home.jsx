import React, { useState, useEffect } from 'react';
import HeroSection from '../../components/user/HeroSection';
import ExclusiveOffers from '../../components/user/ExclusiveOffers';
import PropertyTypeFilter from '../../components/user/PropertyTypeFilter';
import PropertyFeed from '../../components/user/PropertyFeed';

const Home = () => {
    const [selectedType, setSelectedType] = useState('All');
    const [isSticky, setIsSticky] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsSticky(window.scrollY > 300);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <main className="pb-16">
            <HeroSection />

            <div className={`z-30 transition-all                 ${isSticky ? 'fixed top-0 left-0 right-0 p-3 bg-transparent backdrop-blur-xl shadow-md border-b border-surface/5' : 'relative'}
`}>
                <PropertyTypeFilter
                    className="bg-white/80 backdrop-blur-sm"
                    selectedType={selectedType}
                    onSelectType={setSelectedType}
                />
            </div>

            <ExclusiveOffers />

            <div className="mt-2 max-w-7xl mx-auto">
                <PropertyFeed selectedType={selectedType} />
            </div>
        </main>
    );
};

export default Home;
