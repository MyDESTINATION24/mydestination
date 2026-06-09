import { useParams, Link } from "react-router-dom";
import {
  MapPin,
  Calendar,
  IndianRupee,
  Building2,
  Users,
  Star,
  Heart,
  Loader2,
  Inbox
} from "lucide-react";
import ScrollReveal from "../components/ScrollReveal";
import PlannerCard from "../components/PlannerCard";
import {
  formatPrice,
} from "../data/weddingData";
import { weddingDestinationService, weddingVenueService, weddingVendorService } from "../../../services/apiService";
import { useState, useEffect } from "react";

const DestinationDetailPage = () => {
  const { id } = useParams();
  const [dest, setDest] = useState(null);
  const [favs, setFavs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImg, setSelectedImg] = useState(null);
  const [dynamicVenues, setDynamicVenues] = useState([]);
  const [planners, setPlanners] = useState([]);

  useEffect(() => {
    fetchDestinationData();
    // Initialize favs from localStorage if available
    const savedFavs = localStorage.getItem("wedding_fav_destinations");
    if (savedFavs) {
      try {
        setFavs(JSON.parse(savedFavs));
      } catch (e) {
        setFavs([]);
      }
    }
  }, [id]);

  const fetchDestinationData = async () => {
    try {
      setLoading(true);
      const [destData, venuesData, plannersData] = await Promise.all([
        weddingDestinationService.getById(id),
        weddingVenueService.getPublicVenues({ destinationId: id }),
        weddingVendorService.getPublicVendors({ destinationId: id, category: 'Planner' })
      ]);
      setDest(destData);
      setDynamicVenues(venuesData);
      setPlanners(plannersData);
    } catch (error) {
      console.error("Failed to fetch destination details", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground font-medium">Loading Destination Details...</p>
      </div>
    );
  }

  if (!dest) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2
            className="text-2xl font-bold mb-4"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Destination not found
          </h2>
          <Link
            to="/wedding/destinations"
            className="text-primary hover:underline"
          >
            Back to Destinations
          </Link>
        </div>
      </div>
    );
  }

  const isFav = favs.includes(dest._id);

  const toggleFav = () => {
    let newFavs;
    if (isFav) {
      newFavs = favs.filter(fid => fid !== dest._id);
    } else {
      newFavs = [...favs, dest._id];
    }
    setFavs(newFavs);
    localStorage.setItem("wedding_fav_destinations", JSON.stringify(newFavs));
  };

  return (
    <div>
      {/* Gallery Hero */}
      <section className="relative h-[45vh] md:h-[60vh] min-h-[300px] md:min-h-[400px] overflow-hidden">
        <img
          src={dest.image || 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=2070&auto=format&fit=crop'}
          alt={dest.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 to-transparent" />
        <div className="absolute bottom-8 left-0 right-0 px-4">
          <div className="max-w-6xl mx-auto flex items-end justify-between">
            <div>
              <h1
                className="text-4xl md:text-5xl font-bold text-background"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {dest.name}
              </h1>
              <div className="flex items-center gap-2 mt-2 text-background/80">
                <MapPin className="w-4 h-4" /> {dest.location}
              </div>
            </div>
            <button
              onClick={toggleFav}
              className="p-3 rounded-full bg-background/20 backdrop-blur-sm transition-all hover:bg-background/40"
            >
              <Heart
                className={`w-6 h-6 ${isFav ? "text-destructive fill-destructive" : "text-background"}`}
              />
            </button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-6 md:py-12 px-4 border-b border-border">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: IndianRupee, label: "Avg Cost", value: dest.avgCost || (dest.startingPrice ? `${formatPrice(dest.startingPrice)}+` : "Varies") },
            { icon: Calendar, label: "Best Season", value: dest.bestSeason || "Oct - Mar" },
            {
              icon: Building2,
              label: "Venues",
              value: `${dynamicVenues.length}+ Venues`,
            },
            { icon: Star, label: "Category", value: dest.category || "Heritage" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <stat.icon className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                {stat.label}
              </p>
              <p className="text-lg font-semibold mt-1">{stat.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Description */}
      <section className="pt-6 pb-6 md:py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal>
            <p className="text-sm md:text-lg leading-relaxed text-muted-foreground">
              {dest.description}
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Venues */}
      <section className="pt-6 pb-8 md:py-16 px-4 wedding-gradient-soft">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <h2
              className="text-2xl md:text-4xl font-bold mb-6 md:mb-10 text-center"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Recommended Venues
            </h2>
          </ScrollReveal>
          
          {dynamicVenues.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {dynamicVenues.map((venue, i) => (
                <ScrollReveal key={venue._id} delay={i * 100}>
                  <Link to={`/wedding/vendors/${venue._id}`} className="block h-full group">
                    <div className="p-6 rounded-2xl bg-card border border-border h-full transition-all duration-300 group-hover:wedding-shadow group-hover:-translate-y-1">
                      <h3
                        className="text-xl font-semibold"
                        style={{ fontFamily: "'Playfair Display', serif" }}
                      >
                        {venue.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {venue.type || 'Wedding Venue'}
                      </p>
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center gap-2 text-sm text-foreground/80">
                          <Users className="w-4 h-4 text-primary" /> Up to{" "}
                          {venue.capacity || '500'} guests
                        </div>
                        <div className="flex items-center gap-2 text-sm text-foreground/80">
                          <IndianRupee className="w-4 h-4 text-primary" />{" "}
                          {formatPrice(venue.pricePerDay || 0)}/day
                        </div>
                      </div>
                    </div>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white/50 rounded-2xl border border-dashed border-border">
              <Inbox className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">No venues found for this destination yet.</p>
            </div>
          )}
        </div>
      </section>

      {/* Planners for this destination */}
      <section className="pt-4 pb-16 md:py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <h2
              className="text-2xl md:text-4xl font-bold mb-6 md:mb-10 text-center"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Recommended Planners
            </h2>
          </ScrollReveal>
          
          {planners.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {planners.map((planner, i) => (
                <ScrollReveal key={planner._id} delay={i * 100}>
                  <PlannerCard planner={planner} />
                </ScrollReveal>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white/50 rounded-2xl border border-dashed border-border">
              <Inbox className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">No planners found for this destination yet.</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="pt-16 pb-40 md:pb-32 px-4 wedding-gradient -mb-24 md:-mb-16">
        <div className="max-w-3xl mx-auto text-center">
          <h2
            className="text-2xl md:text-4xl font-bold text-background mb-4"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Plan Your {dest.name} Wedding
          </h2>
          <Link
            to="/wedding/enquiry"
            className="inline-block mt-4 px-10 py-4 rounded-full text-base font-medium bg-background text-foreground transition-all duration-300 hover:shadow-xl hover:scale-105"
          >
            Start Enquiry
          </Link>
        </div>
      </section>

      {/* Lightbox */}
      {selectedImg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/80"
          onClick={() => setSelectedImg(null)}
        >
          <img
            src={selectedImg}
            alt=""
            className="max-w-[90vw] max-h-[90vh] rounded-2xl"
          />
        </div>
      )}
    </div>
  );
};

export default DestinationDetailPage;
