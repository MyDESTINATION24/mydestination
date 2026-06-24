import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import heroImg from "../assets/bgimage.png";

const HeroSection = () => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="relative h-[65vh] min-h-[500px] md:h-screen md:min-h-[700px] overflow-hidden">
      <div className="absolute inset-0">
        <img
          src={heroImg}
          alt="Luxury destination wedding"
          width={1920}
          height={1080}
          className="w-full h-full object-cover object-top"
        />

        <div className="absolute inset-0 bg-black/50" />
        
        {/* Dark bottom fade */}
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black via-black/40 to-transparent" />
      </div>

      <div className="relative h-full flex flex-col items-center justify-center text-center px-4">
        <p
          className={`text-[10px] md:text-base uppercase tracking-[0.3em] text-white/90 mb-4 transition-all duration-1000 select-none drop-shadow-md ${
            loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          Destination Weddings in India
        </p>
        <h1
          className={`text-2xl md:text-6xl lg:text-7xl font-bold text-white leading-tight max-w-4xl transition-all duration-1000 delay-200 drop-shadow-xl ${
            loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Your Dream Wedding, <span className="italic">Unforgettable</span>{" "}
          Destination
        </h1>
        <p
          className={`mt-4 md:mt-6 text-sm md:text-xl text-white/90 max-w-2xl transition-all duration-1000 delay-400 drop-shadow-md px-4 md:px-0 ${
            loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          From royal palaces to sun-kissed beaches - plan your perfect
          celebration at India's most stunning locations
        </p>
        <div
          className={`mt-8 md:mt-10 flex flex-col sm:flex-row gap-4 transition-all duration-1000 delay-500 ${
            loaded ? "opacity-100 scale-100" : "opacity-0 scale-90"
          }`}
        >
          <Link
            to="/wedding/destinations"
            className="px-8 py-3.5 md:py-4 rounded-full text-sm md:text-base font-medium wedding-gradient text-white transition-all duration-300 hover:shadow-xl hover:scale-105"
          >
            Explore Destinations
          </Link>
          <Link
            to="/wedding/enquiry"
            className="px-8 py-3.5 md:py-4 rounded-full text-sm md:text-base font-medium bg-white/20 backdrop-blur-sm text-white border border-white/30 transition-all duration-300 hover:bg-white/30 hover:scale-105"
          >
            Start Planning
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
