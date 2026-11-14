import React, { useState, useEffect } from "react";
import { Search, Loader2 } from "lucide-react";
import PlannerCard from "../components/PlannerCard";
import ScrollReveal from "../components/ScrollReveal";
import bgImg from "../assets/bgimage.webp";
import { weddingVendorService } from "../../../services/apiService";

const PlannersPage = () => {
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("All");
  const [planners, setPlanners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlanners();
  }, []);

  const fetchPlanners = async () => {
    try {
      setLoading(true);
      const data = await weddingVendorService.getPublicVendors({ category: "Planning & Decor" });
      setPlanners(data || []);
    } catch (err) {
      console.error("Failed to fetch planners:", err);
    } finally {
      setLoading(false);
    }
  };

  const allCities = [...new Set(planners.flatMap((p) => p.cities || [p.city]))].filter(Boolean).sort();

  const filtered = planners.filter((p) => {
    const matchCity = cityFilter === "All" || (p.cities && p.cities.includes(cityFilter)) || p.city === cityFilter;
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.company || "").toLowerCase().includes(search.toLowerCase());
    return matchCity && matchSearch;
  });

  return (
    <div>
      <section className="relative py-16 md:py-32 px-4 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img src={bgImg} alt="Planners Background" className="w-full h-full object-cover" />
          <div className="absolute inset-0 wedding-gradient opacity-75 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-white opacity-20" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1
            className="text-4xl md:text-5xl font-bold text-background mb-6"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Wedding Planners
          </h1>
          <div className="relative max-w-lg mx-auto px-4 md:px-0">
            <Search className="absolute left-8 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search planners..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 md:pl-12 pr-4 py-3 md:py-4 rounded-full bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 wedding-shadow"
            />
          </div>
        </div>
      </section>

      <section className="pt-8 pb-16 px-4 md:pt-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-nowrap overflow-x-auto md:flex-wrap md:justify-center gap-2 md:gap-3 mb-8 md:mb-12 pb-4 md:pb-0 px-2 scrollbar-none">
            <button
              onClick={() => setCityFilter("All")}
              className={`flex-none px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${cityFilter === "All"
                  ? "wedding-gradient text-background shadow-md"
                  : "bg-muted text-muted-foreground hover:bg-primary/10"
                }`}
            >
              All Cities
            </button>
            {allCities.map((city) => (
              <button
                key={city}
                onClick={() => setCityFilter(city)}
                className={`flex-none px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${cityFilter === city
                    ? "wedding-gradient text-background shadow-md"
                    : "bg-muted text-muted-foreground hover:bg-primary/10"
                  }`}
              >
                {city}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="text-muted-foreground font-medium">Finding the best planners for you...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filtered.map((planner, i) => (
                <ScrollReveal key={planner._id || planner.id} delay={i * 80}>
                  <PlannerCard planner={planner} />
                </ScrollReveal>
              ))}
            </div>
          )}

          {filtered.length === 0 && (
            <div className="text-center py-20 text-muted-foreground">
              <p className="text-lg">No planners found.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default PlannersPage;
