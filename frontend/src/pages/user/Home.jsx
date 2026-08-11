import React, { useState, useEffect } from 'react';
import HeroSection from '../../components/user/HeroSection';
import ExclusiveOffers from '../../components/user/ExclusiveOffers';
import PropertyTypeFilter from '../../components/user/PropertyTypeFilter';
import PropertyFeed from '../../components/user/PropertyFeed';

const Home = () => {
    const [selectedType, setSelectedType] = useState('All');

    return (
        <main className="pb-16">
            <HeroSection />

            <div className="sticky top-[148px] md:top-16 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100/80 shadow-xs transition-all">
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
