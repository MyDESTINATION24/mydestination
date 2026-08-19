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

      <div className="p-2.5 sm:p-4 flex items-center justify-between bg-white/50">
        <div>
          <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-semibold mb-0.5">
            Starting from
          </p>
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <p className="text-base sm:text-lg font-bold text-primary">
              {formatPrice(destination.startingPrice)}
            </p>
            {/* Shown only when the admin set a genuinely higher was-price. */}
            {Number(destination.originalStartingPrice) > Number(destination.startingPrice) ? (
              <>
                <span className="text-[11px] sm:text-sm font-semibold text-muted-foreground line-through">
                  {formatPrice(destination.originalStartingPrice)}
                </span>
                <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-black text-emerald-600">
                  {Math.round(((destination.originalStartingPrice - destination.startingPrice) / destination.originalStartingPrice) * 100)}% OFF
                </span>
              </>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-primary/5 px-2.5 py-1 rounded-full text-primary/80 text-[9px] sm:text-xs font-semibold">
          <Building2 className="w-3.5 h-3.5" />
          {destination.venueCount} Venues
        </div>
      </div>
    </Link>
  );
};

export default DestinationCard;
