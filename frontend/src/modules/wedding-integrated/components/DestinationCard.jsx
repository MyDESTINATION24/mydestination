import { Link } from "react-router-dom";
import { MapPin, Building2 } from "lucide-react";
import { formatPrice } from "../data/weddingData";

const DestinationCard = ({ destination }) => {
  return (
    <Link
      to={`/wedding/destinations/${destination._id || destination.id}`}
      className="group block w-full rounded-xl overflow-hidden bg-white/40 backdrop-blur-md border border-pink-100/30 transition-all duration-500 hover:shadow-[0_20px_60px_-15px_rgba(157,49,61,0.2)] hover:bg-white"
    >
      <div className="relative overflow-hidden" style={{ height: '170px' }}>
        <img
          src={destination.image || 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=2070&auto=format&fit=crop'}
          alt={destination.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />

        <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
          <span className="px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider bg-white/90 text-primary backdrop-blur-md shadow-sm">
            {destination.category}
          </span>
        </div>

        <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 text-white">
          <div className="flex items-center gap-1.5 text-[9px] sm:text-xs font-medium uppercase tracking-widest opacity-90 mb-0.5 sm:mb-1">
            <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
            {destination.location}
          </div>
          <h3
            className="text-lg sm:text-2xl font-bold leading-tight"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {destination.name}
          </h3>
        </div>
      </div>

      <div className="p-2.5 sm:p-4 flex items-center justify-between bg-white/70">
        <div>
          <p className="text-[8px] sm:text-[9px] text-muted-foreground uppercase tracking-widest font-bold mb-0.5">
            Starting from
          </p>
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <p className="text-base sm:text-lg font-black text-[#EAA221]">
              {formatPrice(destination.startingPrice)}
            </p>
            {Number(destination.originalStartingPrice) > Number(destination.startingPrice) && (
              <>
                <span className="text-[10px] sm:text-xs font-bold text-gray-400 line-through">
                  {formatPrice(destination.originalStartingPrice)}
                </span>
                <span className="rounded bg-emerald-100/80 px-1 py-0.5 text-[8px] font-black text-emerald-800 leading-none">
                  {Math.round(((destination.originalStartingPrice - destination.startingPrice) / destination.originalStartingPrice) * 100)}% OFF
                </span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 bg-[#EAA221]/15 text-[#9A6700] border border-[#EAA221]/30 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[8px] sm:text-xs font-bold shrink-0">
          <Building2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#EAA221]" />
          {destination.venueCount || destination.venues?.length || 0} Venues
        </div>
      </div>
    </Link>
  );
};

export default DestinationCard;
