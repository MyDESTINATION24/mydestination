import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Search, ChevronRight, Loader2, Inbox } from "lucide-react";
import { weddingVendorService } from "../../../services/apiService";
import { weddingService } from "../../../services/weddingService";
import VendorCard from "../components/VendorCard";
import VendorHubPage from "./VendorHubPage";
import ScrollReveal from "../components/ScrollReveal";

const VendorListingPage = () => {
  const [searchParams] = useSearchParams();
  const categoryParam = searchParams.get("category");
  const cityParam = searchParams.get("city");

  if (!categoryParam) {
    return <VendorHubPage />;
  }

  return <ListingView category={categoryParam} cityFromUrl={cityParam} />;
};

const ListingView = ({ category: categoryFromProps, cityFromUrl }) => {
  const category = useMemo(() => {
    const raw = categoryFromProps?.trim();
    if (raw === 'Planning') return 'Planning & Decor';
    if (raw === 'Music') return 'Music & Dance';
    if (raw === 'Invites') return 'Invites & Gifts';
    return raw;
  }, [categoryFromProps]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState(cityFromUrl || null);
  const [vendors, setVendors] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchVendors();
  }, [category, selectedCity]);

  const fetchInitialData = async () => {
    try {
      const dests = await weddingService.getDestinations();
      if (Array.isArray(dests)) {
        setDestinations(dests);
      }
    } catch (error) {
      console.error("Failed to fetch destinations", error);
    }
  };

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const filters = { category };
      if (selectedCity) filters.city = selectedCity;
      
      const data = await weddingVendorService.getPublicVendors(filters);
      setVendors(data);
    } catch (error) {
      console.error("Failed to fetch vendors", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredVendors = useMemo(() => {
    return vendors.filter((v) => {
      const matchSearch =
        v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.location?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSearch;
    });
  }, [vendors, searchQuery]);

  const resetAll = () => {
    setSearchQuery("");
    setSelectedCity(null);
  };

  const displayCities = useMemo(() => {
    const defaultCityImages = {
      Udaipur: "https://images.unsplash.com/photo-1605649487212-47bdab064df7?q=80&w=200&auto=format&fit=crop",
      Goa: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=200&auto=format&fit=crop",
      Jaipur: "https://images.unsplash.com/photo-1477587458883-47145ed94245?q=80&w=200&auto=format&fit=crop",
      Shimla: "https://images.unsplash.com/photo-1597075687490-8f673c6c17f6?q=80&w=200&auto=format&fit=crop",
      Kerala: "https://images.unsplash.com/photo-1593693397690-362cb9666fc2?q=80&w=200&auto=format&fit=crop"
    };

    if (destinations.length > 0) {
      return destinations.map(d => {
        const cityName = d.name.trim();
        const fallback = defaultCityImages[cityName] || "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=200&auto=format&fit=crop";
        return {
          name: d.name,
          image: d.image || fallback
        };
      });
    }
    return [];
  }, [destinations]);

  return (
    <div className="bg-[#FFF5F6] min-h-screen">
      {/* Header Section */}
      <section className="bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-[12px] text-slate-500 mb-6">
            <Link to="/wedding" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link to="/wedding/vendors" className="hover:text-primary transition-colors">Vendors</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-500">{category}</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-1">
                Wedding {category}
              </h1>
              <p className="text-[13px] text-slate-600">
                Showing <span className="font-bold text-slate-800">{filteredVendors.length} results</span> {selectedCity ? `in ${selectedCity}` : 'globally'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative w-full sm:w-[320px]">
                <input
                  type="text"
                  placeholder={`Search ${category}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 text-[14px] bg-white focus:outline-none focus:border-primary w-full shadow-sm"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* City Circles */}
      <div className="bg-white border-b border-slate-100 py-4">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex gap-4 overflow-x-auto no-scrollbar pb-2">
          {displayCities.map((city) => (
            <button
              key={city.name}
              onClick={() => setSelectedCity(selectedCity === city.name ? null : city.name)}
              className="flex flex-col items-center gap-1.5 shrink-0 group"
            >
              <div className={`w-14 h-14 rounded-full overflow-hidden border-2 transition-all duration-300 ${selectedCity === city.name ? "border-primary shadow-md" : "border-transparent group-hover:border-primary/50"}`}>
                <img src={city.image} alt={city.name} className="w-full h-full object-cover" />
              </div>
              <span className={`text-[11px] font-bold text-center leading-tight whitespace-nowrap transition-colors ${selectedCity === city.name ? "text-primary" : "text-slate-500 group-hover:text-primary"}`}>
                {city.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-slate-500 font-medium">Fetching Vendors...</p>
          </div>
        ) : filteredVendors.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
            {filteredVendors.map((vendor, i) => (
              <ScrollReveal key={vendor._id} delay={i * 40}>
                <VendorCard vendor={vendor} />
              </ScrollReveal>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-16 text-center shadow-sm border border-slate-100 max-w-3xl mx-auto mt-10">
            <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-800 mb-2">No vendors found</h3>
            <p className="text-slate-500 max-w-xs mx-auto text-sm leading-relaxed mb-6">
              We couldn't find any {category} matching your criteria.
            </p>
            <button
              onClick={resetAll}
              className="px-8 py-3 bg-primary text-white font-bold rounded-full text-sm hover:shadow-lg transition-all"
            >
              Clear Filters
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default VendorListingPage;
