import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Heart, ArrowLeft, ArrowRight } from "lucide-react";
import { getFavourites } from "../data/weddingData";
import { weddingService } from "../../../services/weddingService";
import DestinationCard from "../components/DestinationCard";
import ScrollReveal from "../components/ScrollReveal";

const SavedDestinationsPage = () => {
  const [savedDestinations, setSavedDestinations] = useState([]);

  useEffect(() => {
    let active = true;
    const favs = getFavourites().map(String);

    if (favs.length === 0) { setSavedDestinations([]); return undefined; }

    weddingService.getDestinations()
      .then((all) => {
        if (!active) return;
        const list = Array.isArray(all) ? all : (all?.data || []);
        setSavedDestinations(list.filter((d) => favs.includes(String(d._id || d.id))));
      })
      .catch(() => { if (active) setSavedDestinations([]); });

    return () => { active = false; };
  }, []);

  return (
    <div className="min-h-screen bg-[#fafafb] pb-20 pt-8 md:pt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Header Section */}
        <div className="mb-6 md:mb-10 max-w-7xl mx-auto">
          <Link 
            to="/wedding" 
            className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors mb-4 md:mb-6 group"
          >
            <div className="p-2 rounded-full border border-slate-200 group-hover:border-primary transition-colors bg-white shadow-sm">
              <ArrowLeft className="w-4 h-4" />
            </div>
            Back to Home
          </Link>

          <ScrollReveal>
            <div className="flex flex-col gap-2">
              <h1 className="text-4xl md:text-5xl font-black text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
                Saved Destinations
              </h1>
              <p className="text-muted-foreground font-medium">
                Your curated list of dream wedding locations.
              </p>
            </div>
          </ScrollReveal>
        </div>

        {/* Content Section */}
        {savedDestinations.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8 max-w-7xl mx-auto">
            {savedDestinations.map((destination, i) => (
              <ScrollReveal key={destination._id || destination.id} delay={i * 100}>
                <DestinationCard destination={destination} />
              </ScrollReveal>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center bg-white rounded-[3rem] border border-dashed border-slate-200 max-w-4xl mx-auto">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-primary" />
            </div>
            <p className="text-xl text-foreground font-black mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
              No destinations saved yet
            </p>
            <p className="text-muted-foreground font-medium mb-6">
              Start exploring and save your favorite locations to plan your perfect day.
            </p>
            <Link 
              to="/wedding" 
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-white font-bold hover:shadow-lg transition-all"
            >
              Explore Destinations
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedDestinationsPage;
