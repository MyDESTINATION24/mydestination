import React, { useState } from 'react';
import HeroSection from '../../components/user/HeroSection';
import ExclusiveOffers from '../../components/user/ExclusiveOffers';
import PropertyTypeFilter from '../../components/user/PropertyTypeFilter';
import PropertyFeed from '../../components/user/PropertyFeed';
import { useServiceShellActive } from '../../components/services/MobileServiceShell';

const Home = () => {
    // Phones: the shared service tabs (rendered in App.jsx) replace the hotel
    // header, with the same menu, wallet, notifications and search.
    const shellActive = useServiceShellActive();
    const [selectedType, setSelectedType] = useState('All');

    return (
        <main className="pb-16">
            <HeroSection shellMode={shellActive} />

            <div className={`sticky ${shellActive ? 'top-0' : 'top-[148px]'} md:top-16 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100/80 shadow-xs transition-all`}>
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
