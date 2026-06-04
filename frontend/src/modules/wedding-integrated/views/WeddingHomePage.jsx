import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  Eye,
  Calendar,
  Heart,
  Compass,
  Camera,
  Utensils,
  Music,
  ChevronRight,
} from "lucide-react";
import HeroSection from "../components/HeroSection";
import DestinationCard from "../components/DestinationCard";
import TestimonialSlider from "../components/TestimonialSlider";
import ScrollReveal from "../components/ScrollReveal";
import { weddingService } from "../../../services/weddingService";
import { weddingVendorService } from "../../../services/apiService";
import PlannerCard from "../components/PlannerCard";
import { budgetBuckets } from "../data/weddingData";
import StackedCarousel from "../components/StackedCarousel";
import TestimonialForm from "../components/TestimonialForm";

const steps = [
  {
    icon: Compass,
    title: "Discover",
    desc: "Browse stunning destinations across India",
    image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=1000&auto=format&fit=crop",
  },
  { 
    icon: Eye, 
    title: "Visit", 
    desc: "Tour venues virtually or in person",
    image: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=1000&auto=format&fit=crop",
  },
  { 
    icon: Calendar, 
    title: "Book", 
    desc: "Reserve your dream date and venue",
    image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1000&auto=format&fit=crop",
  },
  {
    icon: Heart,
    title: "Celebrate",
    desc: "Let us handle the rest - you just enjoy",
    image: "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1000&auto=format&fit=crop",
  },
];

const whyUs = [
  {
    icon: MapPin,
    title: "50+ Venues",
    desc: "Curated venues across 6 destinations",
  },
  {
    icon: Camera,
    title: "Top Photographers",
    desc: "Award-winning wedding photographers",
  },
  {
    icon: Utensils,
    title: "Gourmet Catering",
    desc: "Multi-cuisine menus for every palate",
  },
  {
    icon: Music,
    title: "Entertainment",
    desc: "Live bands, DJs, and cultural performances",
  },
];

const WeddingHomePage = () => {
  const [allDestinations, setAllDestinations] = useState([]);
  const [realWeddings, setRealWeddings] = useState([]);
  const [topPlanners, setTopPlanners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlannersLoading, setIsPlannersLoading] = useState(true);
  const [showTestimonialForm, setShowTestimonialForm] = useState(false);

  useEffect(() => {
    const fetchDestinations = async () => {
      try {
        const data = await weddingService.getDestinations();
        setAllDestinations(data || []);
      } catch (error) {
        console.error("Failed to fetch destinations:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchRealWeddings = async () => {
      try {
        const data = await weddingService.getRealWeddings();
        setRealWeddings(data || []);
      } catch (error) {
        console.error("Failed to fetch real weddings:", error);
      }
    };

    const fetchPlanners = async () => {
      try {
        setIsPlannersLoading(true);
        const data = await weddingVendorService.getPublicVendors({ category: 'Planner' });
        setTopPlanners(data.slice(0, 3) || []);
      } catch (error) {
        console.error("Failed to fetch planners:", error);
      } finally {
        setIsPlannersLoading(false);
      }
    };

    fetchDestinations();
    fetchRealWeddings();
    fetchPlanners();
  }, []);
  return (
    <div className="overflow-x-hidden">
      <HeroSection />

      {/* How It Works */}
      <section className="pt-8 pb-2 md:pb-4 md:pt-8 px-4">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-6 md:mb-16">
              <p className="text-sm uppercase tracking-[0.2em] text-primary mb-3">
                Simple Process
              </p>
              <h2
                className="text-3xl md:text-5xl font-bold"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                How It Works
              </h2>
            </div>
          </ScrollReveal>

          <div className="mt-8 md:mt-12 pb-4">
            <StackedCarousel items={steps} />
          </div>
        </div>
      </section>

      {/* Popular Destinations */}
      <section className="pt-2 pb-4 md:pb-6 px-4 wedding-gradient-soft">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-3 sm:mb-12">
              <p className="text-sm uppercase tracking-[0.2em] text-primary mb-3">
                Dream Locations
              </p>
              <h2
                className="text-3xl md:text-5xl font-bold"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Popular Destinations
              </h2>
            </div>
          </ScrollReveal>

          <div className="relative group/scroll">
            <div className="flex gap-6 overflow-x-auto overflow-y-hidden pb-6 snap-x snap-mandatory no-scrollbar scroll-smooth">
              {allDestinations.slice(0, 5).map((dest, i) => (
                <ScrollReveal
                  key={dest._id || dest.id}
                  delay={i * 100}
                  className="min-w-[240px] sm:min-w-[280px] snap-start"
                >
                  <DestinationCard destination={dest} />
                </ScrollReveal>
              ))}
              
              {/* Mobile Scroll Indicator Arrow */}
              <div className="flex sm:hidden items-center justify-center min-w-[60px] pr-4">
                <div className="w-10 h-10 rounded-full bg-white/80 border border-primary/20 flex items-center justify-center text-primary shadow-sm animate-pulse">
                  <ChevronRight className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-2">
            <Link
              to="/wedding/destinations"
              className="inline-block px-8 py-3 rounded-full text-sm font-medium border-2 border-primary text-primary transition-all duration-300 hover:bg-primary hover:text-primary-foreground hover:scale-105"
            >
              View All Destinations
            </Link>
          </div>
        </div>
      </section>

      {/* Recommended Planners */}
      {topPlanners.length > 0 && (
        <section className="py-12 md:py-20 px-4 bg-white">
          <div className="max-w-7xl mx-auto">
            <ScrollReveal>
              <div className="text-center mb-10 md:mb-16">
                <p className="text-sm uppercase tracking-[0.2em] text-primary mb-3">
                  Expert Guidance
                </p>
                <h2
                  className="text-3xl md:text-5xl font-bold"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  Recommended Planners
                </h2>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {topPlanners.map((planner, i) => (
                <ScrollReveal key={planner._id || planner.id} delay={i * 100}>
                  <PlannerCard planner={planner} />
                </ScrollReveal>
              ))}
            </div>

            <div className="text-center mt-12">
              <Link
                to="/wedding/planners"
                className="inline-block px-8 py-3 rounded-full text-sm font-medium bg-primary text-white transition-all duration-300 hover:shadow-xl hover:scale-105"
              >
                Find More Planners
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Why Choose Us */}
      <section className="pt-0 pb-6 px-4">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-10">
              <p className="text-sm uppercase tracking-[0.2em] text-primary mb-3">
                Our Promise
              </p>
              <h2
                className="text-3xl md:text-5xl font-bold"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Why Choose Us
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
            {whyUs.map((item, i) => (
              <ScrollReveal key={item.title} delay={i * 100}>
                <div className="h-full text-center p-4 sm:p-6 rounded-[1.75rem] bg-white/60 backdrop-blur-md border border-pink-100/50 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_50px_-12px_rgba(157,49,61,0.15)] hover:bg-white group">
                  <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-2xl bg-primary/5 flex items-center justify-center mx-auto mb-3 transition-all duration-500 group-hover:scale-110 group-hover:bg-primary/10">
                    <item.icon className="w-5 h-5 sm:w-7 sm:h-7 text-primary" />
                  </div>
                  <h3
                    className="text-sm sm:text-lg font-bold mb-1.5"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    {item.title}
                  </h3>
                  <p className="text-[10px] sm:text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Real Weddings Gallery */}
      <section className="pt-4 pb-6 px-4 wedding-gradient-soft">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-10">
              <p className="text-sm uppercase tracking-[0.2em] text-primary mb-3">
                Inspiration
              </p>
              <h2
                className="text-3xl md:text-5xl font-bold"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Real Weddings
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 sm:gap-6">
            {realWeddings.slice(0, 6).map((wedding, i) => (
              <ScrollReveal key={wedding._id || wedding.id} delay={i * 80}>
                <Link
                  to={`/wedding/real-weddings/gallery/${wedding._id || wedding.id}`}
                  className="group relative block aspect-[3/2] rounded-[1.25rem] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500"
                >
                  <img
                    src={wedding.coverImage || "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=600&auto=format&fit=crop"}
                    alt={wedding.coupleName}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  {/* Overlay Gradient - Hidden by default, shown on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-80 transition-opacity duration-500" />
                  
                  {/* Text - Hidden by default, shown on hover */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                    <span className="px-3 py-1 bg-primary text-white rounded-full text-[9px] font-bold uppercase tracking-widest leading-none mb-2 inline-block">
                      {wedding.locationName || wedding.destination?.name || "Destination Wedding"}
                    </span>
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
                      {wedding.coupleName}
                    </h3>
                    <div className="h-0.5 w-8 bg-primary mt-1" />
                  </div>
                </Link>
              </ScrollReveal>
            ))}
            {realWeddings.length === 0 && (
              <div className="col-span-full py-16 text-center bg-white/60 backdrop-blur-md rounded-[1.25rem] border border-pink-100/50">
                <p className="text-slate-400 text-sm italic font-serif">No real wedding stories uploaded yet by the admin.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="pt-4 pb-8 px-4">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-8">
              <p className="text-sm uppercase tracking-[0.2em] text-primary mb-3">
                Love Stories
              </p>
              <h2
                className="text-3xl md:text-5xl font-bold"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                What Couples Say
              </h2>
            </div>
          </ScrollReveal>
          <ScrollReveal>
            <TestimonialSlider />
          </ScrollReveal>
          
          <div className="text-center mt-10">
            <button
              onClick={() => setShowTestimonialForm(true)}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-sm font-black bg-primary/5 text-primary border border-primary/20 transition-all duration-300 hover:bg-primary hover:text-white hover:shadow-lg hover:-translate-y-1"
            >
              Share Your Wedding Story
            </button>
          </div>
          
          <TestimonialForm 
            isOpen={showTestimonialForm} 
            onClose={() => setShowTestimonialForm(false)} 
          />
        </div>
      </section>

      {/* Budget Buckets */}
      <section className="pt-4 pb-16 px-4 wedding-gradient-soft">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-10">
              <p className="text-sm uppercase tracking-[0.2em] text-primary mb-3">
                For Every Budget
              </p>
              <h2
                className="text-3xl md:text-5xl font-bold"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Find Your Perfect Range
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {budgetBuckets.map((b, i) => (
              <ScrollReveal key={b.label} delay={i * 100}>
                <Link
                  to={`/wedding/destinations?budget=${b.label}`}
                  className="block h-full p-4 sm:p-6 rounded-[1.75rem] bg-white/60 backdrop-blur-md border border-pink-100/50 text-center transition-all duration-500 hover:shadow-[0_20px_50px_-12px_rgba(157,49,61,0.15)] hover:-translate-y-2 hover:bg-white hover:border-primary/20 cursor-pointer group"
                >
                  <h3
                    className="text-base sm:text-xl font-bold transition-colors duration-300 group-hover:text-primary"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    {b.label}
                  </h3>
                  <p className="text-lg sm:text-2xl font-bold text-primary mt-1.5 sm:mt-2">
                    {b.range}
                  </p>
                  <p className="text-[10px] sm:text-sm text-muted-foreground mt-2 sm:mt-3 leading-relaxed">
                    {b.description}
                  </p>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Strip */}
      <section className="py-12 px-4 wedding-gradient">
        <div className="max-w-3xl mx-auto text-center">
          <h2
            className="text-3xl md:text-4xl font-bold text-background mb-4"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Ready to Begin Your Journey?
          </h2>
          <p className="text-background/80 mb-8 text-lg">
            Let us help you create the wedding of your dreams
          </p>
          <Link
            to="/wedding/enquiry"
            className="inline-block px-10 py-4 rounded-full text-base font-medium bg-background text-foreground transition-all duration-300 hover:shadow-xl hover:scale-105"
          >
            Start Planning Now
          </Link>
        </div>
      </section>
    </div>
  );
};

export default WeddingHomePage;
