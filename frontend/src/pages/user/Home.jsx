import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Wallet, Bell } from 'lucide-react';
import HeroSection from '../../components/user/HeroSection';
import ExclusiveOffers from '../../components/user/ExclusiveOffers';
import PropertyTypeFilter from '../../components/user/PropertyTypeFilter';
import PropertyFeed from '../../components/user/PropertyFeed';
import MobileMenu from '../../components/ui/MobileMenu';
import MobileServiceShell from '../../components/services/MobileServiceShell';
import useIsMobile from '../../hooks/useIsMobile';

const Home = () => {
    const navigate = useNavigate();
    const isMobile = useIsMobile();
    const [selectedType, setSelectedType] = useState('All');
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <main className="pb-16">
            {/* Phones: shared service tabs replace the hotel header (same menu,
                wallet, notifications and search, now in the tabs section). */}
            <MobileServiceShell
                serviceKey="hotel"
                profilePath="/profile"
                actions={[
                    { icon: Menu, label: 'Menu', onClick: () => setMenuOpen(true) },
                    { icon: Wallet, label: 'My Wallet', onClick: () => navigate('/wallet') },
                    { icon: Bell, label: 'Notifications', onClick: () => navigate('/notifications'), dot: true },
                ]}
                search={{ placeholder: 'Search hotels, resorts, cities…', onClick: () => navigate('/search') }}
            />
            {isMobile ? <MobileMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} /> : null}

            <HeroSection shellMode={isMobile} />

            <div className={`sticky ${isMobile ? 'top-0' : 'top-[148px]'} md:top-16 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100/80 shadow-xs transition-all`}>
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
