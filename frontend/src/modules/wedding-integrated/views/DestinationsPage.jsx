import { useState, useEffect } from "react";
import { Search, Loader2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import DestinationCard from "../components/DestinationCard";
import ScrollReveal from "../components/ScrollReveal";
import { weddingDestinationService } from "../../../services/apiService";
import heroImg from "../assets/wedding-hero.jpg";

const DestinationsPage = () => {
  const [active, setActive] = useState("All");
  const [search, setSearch] = useState("");
  const [searchParams] = useSearchParams();
  const budgetParam = searchParams.get("budget");
  const [destinations, setDestinations] = useState([]);
  const [categories, setCategories] = useState(["All"]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const destData = await weddingDestinationService.getAll();
      
      // Extract unique categories from the destinations data
      const uniqueCats = Array.from(new Set(destData.map(d => d.category).filter(Boolean)));
      
      setDestinations(destData);
      setCategories(["All", ...uniqueCats]);
    } catch (error) {
      console.error("Failed to fetch destinations", error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = destinations.filter((d) => {
    const matchCat = active === "All" || d.category === active;
    const matchSearch =
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      (d.location && d.location.toLowerCase().includes(search.toLowerCase()));
    
    let matchBudget = true;
    if (budgetParam === "Intimate") matchBudget = d.startingPrice <= 1500000;
    else if (budgetParam === "Classic") matchBudget = d.startingPrice > 1500000 && d.startingPrice <= 4000000;
    else if (budgetParam === "Grand") matchBudget = d.startingPrice > 4000000 && d.startingPrice <= 10000000;
    else if (budgetParam === "Royal") matchBudget = d.startingPrice > 10000000;

    return matchCat && matchSearch && matchBudget;
  });

  return (
    <div>
      {/* Hero Banner */}
      <section className="relative py-10 md:py-32 px-4 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={heroImg} 
            alt="Destinations Background" 
            className="w-full h-full object-cover" 
          />
          {/* Very light theme overlay */}
          <div className="absolute inset-0 wedding-gradient opacity-20 mix-blend-multiply" />
          
          {/* Subtle white fades from all sides */}
          <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-white opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-transparent to-white opacity-30" />
        </div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1
            className="text-4xl md:text-5xl font-bold text-background mb-6"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Explore Destinations
          </h1>
          <div className="relative max-w-lg mx-auto px-4 md:px-0">
            <Search className="absolute left-8 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search destinations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 md:pl-12 pr-4 py-3 md:py-4 rounded-full bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 wedding-shadow"
            />
          </div>
        </div>
      </section>

      {/* Filters + Grid */}
      <section className="py-4 md:py-8 px-3 md:px-4 min-h-[400px]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-nowrap overflow-x-auto md:flex-wrap md:justify-center gap-2 md:gap-3 mb-5 pb-2 md:pb-0 px-2 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActive(cat)}
                className={`flex-none px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                  active === cat
                    ? "wedding-gradient text-background shadow-md"
                    : "bg-muted text-muted-foreground hover:bg-primary/10"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="text-muted-foreground font-medium">Loading Destinations...</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {filtered.map((dest, i) => (
                  <ScrollReveal key={dest._id} delay={i * 80}>
                    <DestinationCard destination={dest} />
                  </ScrollReveal>
                ))}
              </div>

              {filtered.length === 0 && (
                <div className="text-center py-20 text-muted-foreground">
                  <p className="text-lg">
                    No destinations found matching your search.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default DestinationsPage;
